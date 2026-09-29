"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Event as ApiEvent } from "@/lib/api-client";
import type { Club } from "@/types";
import { getEventExpiryTime, isEventExpired } from "@/lib/event-status";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { getDashboardHref, ROLE_DASHBOARD_LABEL } from "@/lib/role-home";

type HeroSectionProps = {
  events: ApiEvent[];
  clubs: Club[];
  loading: boolean;
};

// Theme-derived tints (no hardcoded colours — everything mixes existing CSS vars).
const accentTint = (pct: number) => `color-mix(in srgb, var(--accent) ${pct}%, transparent)`;

const cardClass =
  "flex flex-col justify-between gap-3 p-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] backdrop-blur-md shadow-[0_2px_16px_var(--shadow)] hover:border-[var(--accent)] transition-all duration-300 text-left min-w-0 h-full";
const tagClass =
  "text-[10px] font-bold tracking-wider uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)]";
const titleClass =
  "text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-snug truncate";
const metaClass =
  "text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate";

function eventUrlFor(event: ApiEvent) {
  if (event.slug && event.slug.trim()) return `/events/${event.slug}`;
  return `/events/${event.id}`;
}

function startOf(event: ApiEvent): number {
  return new Date(event.startTime || event.eventDate).getTime();
}

function isSameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

function formatWhen(event: ApiEvent, now: number) {
  const start = startOf(event);
  if (isNaN(start)) return "Date TBA";
  const hasTime = Boolean(event.startTime);
  const time = new Date(start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (isSameDay(start, now)) return hasTime ? `Today · ${time}` : "Today";
  const date = new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return hasTime ? `${date} · ${time}` : date;
}

function SpotlightSkeleton() {
  return (
    <div className="h-28 w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-5 animate-pulse" aria-hidden="true">
      <div className="h-2.5 w-24 rounded bg-[var(--line-soft)] mb-4" />
      <div className="h-4 w-3/4 rounded bg-[var(--line-soft)] mb-3" />
      <div className="h-3 w-1/2 rounded bg-[var(--line-soft)]" />
    </div>
  );
}

function EventCard({ tag, event, now }: { tag: string; event: ApiEvent; now: number }) {
  return (
    <Link href={eventUrlFor(event)} className={cardClass}>
      <span className={tagClass}>{tag}</span>
      <p className={titleClass}>{event.title}</p>
      <p className={metaClass}>
        {formatWhen(event, now)}
        {event.venue ? <> &nbsp;|&nbsp; {String(event.venue)}</> : null}
      </p>
    </Link>
  );
}

function EmptyCard({ tag, title, cta, href }: { tag: string; title: string; cta: string; href: string }) {
  return (
    <Link href={href} className={cardClass}>
      <span className={tagClass}>{tag}</span>
      <p className="text-[0.9rem] font-semibold text-[var(--col-secondary)] font-[family-name:var(--font-display)]">{title}</p>
      <p className="text-[0.76rem] font-medium text-[var(--accent)] font-[family-name:var(--font-ui)]">{cta} →</p>
    </Link>
  );
}

export default function HeroSection({ events, clubs, loading }: HeroSectionProps) {
  // Captured once per mount; avoids calling Date.now() during render.
  const [now] = useState(() => Date.now());
  const authUser = useAuthStore((s) => s.user);

  const { todayCount, featured, upNext, upNextIsToday, topClub } = useMemo(() => {
    const open = events
      .filter((e) => (e.status || "PUBLISHED").toUpperCase() === "PUBLISHED" && !isEventExpired(e, now))
      .sort((a, b) => startOf(a) - startOf(b));

    // "Today" = starts today, or has already started but not yet ended.
    const today = open.filter((e) => {
      const start = startOf(e);
      const end = getEventExpiryTime(e) ?? start;
      return isSameDay(start, now) || (start <= now && end >= now);
    });

    // Featured = most-registered open event (falls back to soonest).
    const featuredEvent =
      [...open].sort((a, b) => (Number(b.registered) || 0) - (Number(a.registered) || 0))[0] ?? null;

    // Second card prefers a different event happening today, else the next one up.
    const others = open.filter((e) => e.id !== featuredEvent?.id);
    const todayOther = today.find((e) => e.id !== featuredEvent?.id) ?? null;
    const next = todayOther ?? others[0] ?? null;

    const club =
      [...clubs].sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))[0] ?? null;

    return {
      todayCount: today.length,
      featured: featuredEvent,
      upNext: next,
      upNextIsToday: Boolean(todayOther),
      topClub: club,
    };
  }, [events, clubs, now]);

  const badgeText =
    todayCount > 0
      ? `LIVE: ${todayCount} Active Campus Event${todayCount === 1 ? "" : "s"} Today`
      : featured
        ? "LIVE: Registrations Open for Upcoming Events"
        : "LIVE: Campus Platform Online";

  return (
    <section className="section-transparent w-full max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-6xl mx-auto text-center pt-12 pb-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center"
      >
        {/* Live status pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[var(--accent)] font-semibold text-xs sm:text-sm backdrop-blur-sm mb-6 shadow-sm font-[family-name:var(--font-ui)] max-w-full"
          style={{ background: accentTint(10), border: `1px solid ${accentTint(20)}` }}
        >
          {loading ? (
            <span className="inline-block h-3 w-44 rounded bg-[var(--line-soft)] animate-pulse" aria-label="Loading live status" />
          ) : (
            <span className="truncate">{badgeText}</span>
          )}
        </div>

        {/* Heading + subtitle */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
          PUVerse Campus Platform
        </h1>
        <p className="text-lg sm:text-2xl lg:text-3xl font-semibold text-[var(--col-secondary)] mb-4 font-[family-name:var(--font-display)]">
          The Central Hub for Events, Clubs &amp; Communities
        </p>

        {/* Body */}
        <p className="max-w-2xl mx-auto text-[var(--col-secondary)] text-sm sm:text-base leading-relaxed mb-8 font-[family-name:var(--font-ui)]">
          Discover upcoming hackathons, join student clubs, and scan instant QR entry passes.
        </p>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-14">
          <Link
            href="/explore-events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--col-primary)] text-[var(--bg)] font-semibold text-sm shadow-[0_2px_12px_var(--shadow-lg)] hover:opacity-90 active:scale-[0.98] transition-all font-[family-name:var(--font-display)]"
          >
            Explore Events
          </Link>
          <Link
            href={authUser ? getDashboardHref(authUser) : "/student"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--surface)] text-[var(--col-primary)] font-semibold text-sm border border-[var(--line)] hover:bg-[var(--surface-hover)] active:scale-[0.98] transition-all font-[family-name:var(--font-display)]"
          >
            {authUser ? ROLE_DASHBOARD_LABEL[backendRoleToUiRole(authUser)] : "Student Dashboard"}
          </Link>
        </div>

        {/* 3-column spotlight deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full max-w-5xl mx-auto mt-2">
          {loading ? (
            <>
              <SpotlightSkeleton />
              <SpotlightSkeleton />
              <SpotlightSkeleton />
            </>
          ) : (
            <>
              {featured ? (
                <EventCard tag="Featured Spotlight" event={featured} now={now} />
              ) : (
                <EmptyCard tag="Featured Spotlight" title="No events published yet" cta="Browse events" href="/explore-events" />
              )}

              {upNext ? (
                <EventCard tag={upNextIsToday ? "Upcoming Today" : "Up Next"} event={upNext} now={now} />
              ) : (
                <EmptyCard tag="Upcoming Today" title="Nothing scheduled today" cta="See what's coming" href="/explore-events" />
              )}

              {topClub ? (
                <Link href={`/student/clubs/${topClub.slug}`} className={cardClass}>
                  <span className={tagClass}>Top Active Club</span>
                  <p className={titleClass}>{topClub.name}</p>
                  <p className={metaClass}>
                    {topClub.followerCount || 0} follower{topClub.followerCount === 1 ? "" : "s"}
                    {topClub.eventCount ? <> &nbsp;|&nbsp; {topClub.eventCount} event{topClub.eventCount === 1 ? "" : "s"}</> : null}
                  </p>
                </Link>
              ) : (
                <EmptyCard tag="Top Active Club" title="No clubs yet" cta="Explore communities" href="/student/communities" />
              )}
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
