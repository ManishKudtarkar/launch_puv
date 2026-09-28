"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { useAuthStore } from "@/store/auth-store";
import { api, type Event as ApiEvent } from "@/lib/api-client";
import type { Community, Club } from "@/types";
import { formatDate } from "@/lib/utils";
import { CalendarPlus, ClipboardList, QrCode, ShieldCheck, ArrowRight, Users2, Building2 } from "lucide-react";

export default function StudentDashboard() {
  const user = useDemoStore((s) => s.user);
  const authUser = useAuthStore((s) => s.user);
  const registrations = useDemoStore((s) => s.registrations);
  const tickets = useDemoStore((s) => s.tickets);
  const certificates = useDemoStore((s) => s.certificates);
  const notifications = useDemoStore((s) => s.notifications);
  const isEventAdmin = authUser?.role === "EVENT_ADMIN" || user?.backendRole === "EVENT_ADMIN" || user?.role === "admin";

  const [realRegs, setRealRegs] = useState<{ id: string; eventTitle: string; registeredAt: string; status: string }[]>([]);
  const [volunteerEvents, setVolunteerEvents] = useState<ApiEvent[]>([]);

  // Communities & Clubs — memberships + follows
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Communities & Clubs where user is HEAD
  const [leadCommunities, setLeadCommunities] = useState<Community[]>([]);
  const [leadClubs, setLeadClubs] = useState<Club[]>([]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;

    // Fetch events list once, then batch-fetch registrations with a concurrency
    // limit of 5 to avoid flooding the backend with N parallel requests.
    api.events.list().then(async (eventsList) => {
      const results: { id: string; eventTitle: string; registeredAt: string; status: string }[] = [];
      const CONCURRENCY = 5;
      for (let i = 0; i < eventsList.length; i += CONCURRENCY) {
        const batch = eventsList.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
          batch.map(async (ev) => {
            try {
              const reg = await api.events.registrations.me(ev.id);
              if (reg) {
                results.push({
                  id: reg.id,
                  eventTitle: ev.title,
                  registeredAt: (reg as any).createdAt || (reg as any).registeredAt || new Date().toISOString(),
                  status: (reg as any).status || "ACTIVE",
                });
              }
            } catch {
              // not registered for this event — expected
            }
          })
        );
      }
      if (active) setRealRegs(results);
    }).catch(() => {});

    return () => { active = false; };
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    api.volunteers.myEvents()
      .then((evs) => setVolunteerEvents(evs))
      .catch(() => {});
  }, [authUser]);

  // Fetch communities and clubs the user is a member of or follows
  useEffect(() => {
    if (!authUser) return;
    let active = true;
    setLoadingOrgs(true);

    Promise.allSettled([
      api.communities.list(),
      api.clubs.list(),
      api.updates.myAssignments(),
    ]).then(([commRes, clubRes, assignRes]) => {
      if (!active) return;

      // Member community/club IDs from assignments
      const memberCommIds = new Set<string>();
      const memberClubIds = new Set<string>();
      if (assignRes.status === "fulfilled") {
        (assignRes.value.communities || []).forEach((c) => memberCommIds.add(c.id));
        (assignRes.value.clubs || []).forEach((c) => memberClubIds.add(c.id));
      }

      // Communities: following OR member
      if (commRes.status === "fulfilled") {
        const filtered = commRes.value.filter(
          (c) => c.isFollowing || memberCommIds.has(c.id)
        );
        setMyCommunities(filtered);
        // Communities where user is HEAD
        const leadComms = commRes.value.filter(
          (c) => c.headId && authUser && c.headId === authUser.id
        );
        setLeadCommunities(leadComms);
      }

      // Clubs: following OR member
      if (clubRes.status === "fulfilled") {
        const filtered = clubRes.value.filter(
          (c) => (c as any).isFollowing || memberClubIds.has(c.id)
        );
        setMyClubs(filtered);
        // Clubs where user is HEAD
        const leadClubList = clubRes.value.filter(
          (c) => (c as any).headId && authUser && (c as any).headId === authUser.id
        );
        setLeadClubs(leadClubList);
      }
    }).catch(() => {}).finally(() => {
      if (active) setLoadingOrgs(false);
    });

    return () => { active = false; };
  }, [authUser]);

  const activeRegs = registrations.filter((r) => r.status !== "cancelled");
  const displayRegs = realRegs.length > 0 ? realRegs : activeRegs;
  const regCount = realRegs.length > 0 ? realRegs.length : activeRegs.length;
  const unread = notifications.filter((n) => !n.read).length;

  const stats = [
    { label: "Registrations", value: regCount, icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: "Active Tickets", value: tickets.filter((t) => t.status === "active").length, icon: <><path d="M2 12h5l2-7 4 14 2-7h5" /></> },
    { label: "Certificates", value: certificates.length, icon: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></> },
    { label: "Unread", value: unread, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
  ];

  const hasOrgs = myCommunities.length > 0 || myClubs.length > 0;

  return (
    <div>
      {/* Hero area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center mb-10">
        {/* Left — Welcome */}
        <div className="lg:pl-[12%]">
          <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
            <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
            Student Portal
          </p>
          <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Welcome back,
            <br />
            {authUser?.fullName?.split(" ")[0] || user?.name?.split(" ")[0]}
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
              {" "}.
            </span>
          </h1>
          <p className="mt-3 text-[0.9rem] text-[var(--col-secondary)] leading-[1.7] max-w-[400px] font-[family-name:var(--font-ui)]">
            Here&apos;s your campus activity overview. Browse events, check your registrations, and stay updated.
          </p>
        </div>

        {/* Right — 2x2 stat grid + browse button */}
        <div className="lg:pr-[12%]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {stats.map((stat) => (
              <Squircle
                key={stat.label}
                cornerRadius={28}
                cornerSmoothing={1}
                className="p-5 pb-4 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px]"
                style={{
                  background: "hsl(0 0% 96% / 0.42)",
                  backdropFilter: "blur(24px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
                }}
              >
                <p className="text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  {stat.label}
                </p>
                <div className="flex items-end justify-between mt-auto pt-1">
                  <p className="text-[1.9rem] font-semibold leading-none tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                    {stat.value}
                  </p>
                  <div className="w-10 h-10 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] stroke-[var(--accent)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                      {stat.icon}
                    </svg>
                  </div>
                </div>
              </Squircle>
            ))}
          </div>

          {/* Browse Events button */}
          <div className="mt-4">
            <Squircle
              cornerRadius={18}
              cornerSmoothing={1}
              className="group w-full inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-6 pr-[5px] py-[5px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
              asChild
            >
              <Link href="/explore-events">
                Browse all events
                <Squircle
                  cornerRadius={14}
                  cornerSmoothing={1}
                  className="w-[38px] h-[38px] border border-white/70 flex items-center justify-center flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="w-[12px] h-[12px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Squircle>
              </Link>
            </Squircle>
          </div>
        </div>
      </div>

      {/* Event Admin card */}
      {isEventAdmin && (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="mb-6 p-5"
          style={{
            background: "hsl(25 65% 45% / 0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid hsl(25 65% 45% / 0.2)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">Event Admin Access</p>
              <h2 className="mt-1 text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Create and manage your events</h2>
              <p className="mt-1 text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Your event-admin tools are available from this same dashboard.</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full gap-2">
              <Link href="/admin/events" className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--line)] bg-[hsl(0_0%_100%_/_0.5)] px-4 py-2.5 text-[0.74rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-ui)]">
                <ClipboardList className="w-3.5 h-3.5 text-[var(--accent)]" /> My Events
              </Link>
              <Link href="/admin/events/create" className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--col-primary)] px-4 py-2.5 text-[0.74rem] font-medium text-[var(--bg)] font-[family-name:var(--font-ui)]">
                <CalendarPlus className="w-3.5 h-3.5" /> Create Event
              </Link>
            </div>
          </div>
        </Squircle>
      )}

      {/* Volunteer Banner */}
      {volunteerEvents.length > 0 && (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="mb-6 p-5"
          style={{
            background: "hsl(142 50% 45% / 0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid hsl(142 50% 45% / 0.2)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(142 50% 45% / 0.12)" }}>
                <ShieldCheck className="w-[18px] h-[18px] text-emerald-600" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.16em] text-emerald-600 font-[family-name:var(--font-mono)]">Volunteer Access</p>
                <h2 className="mt-0.5 text-[0.96rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  You are an assigned Volunteer
                  {volunteerEvents.length === 1 ? ` for ${volunteerEvents[0].title}` : ` for ${volunteerEvents.length} events`}
                </h2>
                <p className="mt-1 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Use the scanner to verify attendee QR passes at the entrance.</p>
              </div>
            </div>
            <Link href="/student/volunteer" className="inline-flex items-center gap-2 rounded-[12px] bg-emerald-600 px-5 py-2.5 text-[0.76rem] font-semibold text-white hover:bg-emerald-700 transition-colors flex-shrink-0 font-[family-name:var(--font-display)] shadow-sm">
              <QrCode className="w-4 h-4" />
              Open Scanner
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {volunteerEvents.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {volunteerEvents.map((ev) => (
                <span key={ev.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-medium font-[family-name:var(--font-ui)] text-emerald-700" style={{ background: "hsl(142 50% 45% / 0.1)", border: "1px solid hsl(142 50% 45% / 0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {ev.title}
                </span>
              ))}
            </div>
          )}
        </Squircle>
      )}

      {/* Community Lead card */}
      {leadCommunities.length > 0 && (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="mb-6 p-5"
          style={{
            background: "hsl(25 65% 45% / 0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid hsl(25 65% 45% / 0.2)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "hsl(25 65% 45% / 0.12)" }}
              >
                <Building2 className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                  Community Lead
                </p>
                <h2 className="mt-0.5 text-[0.96rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  {leadCommunities.length === 1
                    ? `You are the Head of ${leadCommunities[0].name}`
                    : `You lead ${leadCommunities.length} communities`}
                </h2>
                <p className="mt-1 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  Manage members, updates, and settings for your community.
                </p>
              </div>
            </div>
            <Link
              href="/student/my-communities"
              className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--col-primary)] px-5 py-2.5 text-[0.76rem] font-semibold text-[var(--bg)] hover:opacity-85 transition-opacity flex-shrink-0 font-[family-name:var(--font-display)] shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Manage
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {leadCommunities.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {leadCommunities.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-medium font-[family-name:var(--font-ui)] text-[var(--accent)]"
                  style={{ background: "hsl(25 65% 45% / 0.1)", border: "1px solid hsl(25 65% 45% / 0.2)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </Squircle>
      )}

      {/* Club Lead card */}
      {leadClubs.length > 0 && (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="mb-6 p-5"
          style={{
            background: "hsl(220 50% 55% / 0.07)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid hsl(220 50% 55% / 0.2)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "hsl(220 50% 55% / 0.12)" }}
              >
                <Users2 className="w-[18px] h-[18px] text-[hsl(220_50%_50%)]" strokeWidth={1.8} />
              </div>
              <div>
                <p
                  className="text-[0.62rem] uppercase tracking-[0.16em] font-[family-name:var(--font-mono)]"
                  style={{ color: "hsl(220 50% 50%)" }}
                >
                  Club Lead
                </p>
                <h2 className="mt-0.5 text-[0.96rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  {leadClubs.length === 1
                    ? `You are the Head of ${leadClubs[0].name}`
                    : `You lead ${leadClubs.length} clubs`}
                </h2>
                <p className="mt-1 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  Manage members, updates, and settings for your club.
                </p>
              </div>
            </div>
            <Link
              href="/student/my-communities"
              className="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-[0.76rem] font-semibold text-white hover:opacity-85 transition-opacity flex-shrink-0 font-[family-name:var(--font-display)] shadow-sm"
              style={{ background: "hsl(220 50% 50%)" }}
            >
              <Users2 className="w-4 h-4" />
              Manage
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {leadClubs.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {leadClubs.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-medium font-[family-name:var(--font-ui)]"
                  style={{
                    color: "hsl(220 50% 45%)",
                    background: "hsl(220 50% 55% / 0.1)",
                    border: "1px solid hsl(220 50% 55% / 0.2)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(220 50% 50%)" }} />
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </Squircle>
      )}

      {/* Content grid — Recent Registrations + Communities & Clubs */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Recent Registrations ── */}
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="p-6"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Recent Registrations</h2>
            <Squircle
              cornerRadius={12}
              cornerSmoothing={1}
              className="group inline-flex items-center gap-[8px] text-[0.72rem] font-medium pl-4 pr-[4px] py-[4px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-all duration-300 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ background: "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              asChild
            >
              <Link href="/student/registrations">
                See all
                <Squircle cornerRadius={8} cornerSmoothing={1} className="w-[24px] h-[24px] border border-[var(--col-primary)] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Squircle>
              </Link>
            </Squircle>
          </div>

          <div className="space-y-2">
            {displayRegs.slice(0, 4).map((reg) => (
              <Squircle
                key={reg.id}
                cornerRadius={18}
                cornerSmoothing={1}
                className="p-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "hsl(0 0% 100% / 0.5)",
                  boxShadow: "0 1px 6px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--accent)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{reg.eventTitle}</p>
                    <p className="mt-0.5 text-[0.7rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{formatDate(reg.registeredAt)}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-[8px] text-[0.58rem] uppercase tracking-[0.1em] font-medium flex-shrink-0 font-[family-name:var(--font-mono)]"
                    style={{
                      background: reg.status === "ACTIVE" || reg.status === "registered" ? "hsl(25 65% 45% / 0.12)" : "hsl(0 0% 90% / 0.6)",
                      color: reg.status === "ACTIVE" || reg.status === "registered" ? "var(--accent)" : "var(--col-secondary)",
                    }}
                  >
                    {reg.status === "ACTIVE" ? "Active" : reg.status}
                  </span>
                </div>
              </Squircle>
            ))}
            {displayRegs.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No registrations yet.</p>
                <Link href="/explore-events" className="mt-3 inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-[var(--accent)] hover:underline font-[family-name:var(--font-ui)]">
                  Explore events →
                </Link>
              </div>
            )}
          </div>
        </Squircle>

        {/* ── My Communities & Clubs ── */}
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="p-6"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Communities & Clubs</h2>
            <Squircle
              cornerRadius={12}
              cornerSmoothing={1}
              className="group inline-flex items-center gap-[8px] text-[0.72rem] font-medium pl-4 pr-[4px] py-[4px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-all duration-300 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ background: "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              asChild
            >
              <Link href="/student/communities">
                See all
                <Squircle cornerRadius={8} cornerSmoothing={1} className="w-[24px] h-[24px] border border-[var(--col-primary)] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Squircle>
              </Link>
            </Squircle>
          </div>

          {loadingOrgs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[60px] rounded-[18px] bg-[hsl(0_0%_100%_/_0.4)] animate-pulse" />
              ))}
            </div>
          ) : !hasOrgs ? (
            <div className="py-10 text-center">
              <div className="w-11 h-11 rounded-full bg-[hsl(25_65%_45%_/_0.08)] flex items-center justify-center mx-auto mb-3">
                <Users2 className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.5} />
              </div>
              <p className="text-[0.84rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">No communities yet</p>
              <p className="mt-1 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Follow or join a community or club to see it here.</p>
              <Link href="/student/communities" className="mt-3 inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-[var(--accent)] hover:underline font-[family-name:var(--font-ui)]">
                Explore communities →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Community rows */}
              {myCommunities.slice(0, 2).map((c) => (
                <Link key={c.id} href={`/student/communities`}>
                  <Squircle
                    cornerRadius={18}
                    cornerSmoothing={1}
                    className="p-4 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3"
                    style={{
                      background: "hsl(0 0% 100% / 0.5)",
                      boxShadow: "0 1px 6px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                    }}
                  >
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[hsl(25_65%_45%_/_0.12)] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{c.name}</p>
                      <p className="mt-0.5 text-[0.68rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                        {c.isFollowing ? "Following" : "Member"} · {c.clubCount ?? 0} clubs
                      </p>
                    </div>
                    <span className="text-[0.58rem] uppercase tracking-[0.1em] font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-full" style={{ background: "hsl(25 65% 45% / 0.1)", color: "var(--accent)" }}>
                      Community
                    </span>
                  </Squircle>
                </Link>
              ))}

              {/* Club rows */}
              {myClubs.slice(0, 2).map((c) => (
                <Link key={c.id} href={`/student/communities`}>
                  <Squircle
                    cornerRadius={18}
                    cornerSmoothing={1}
                    className="p-4 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3"
                    style={{
                      background: "hsl(0 0% 100% / 0.5)",
                      boxShadow: "0 1px 6px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                    }}
                  >
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[hsl(200_65%_45%_/_0.12)] flex items-center justify-center flex-shrink-0">
                        <Users2 className="w-4 h-4 text-[hsl(200_65%_45%)]" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{c.name}</p>
                      <p className="mt-0.5 text-[0.68rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                        {(c as any).isFollowing ? "Following" : "Member"}{c.community ? ` · ${c.community.name}` : ""}
                      </p>
                    </div>
                    <span className="text-[0.58rem] uppercase tracking-[0.1em] font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-full" style={{ background: "hsl(200 65% 45% / 0.1)", color: "hsl(200 65% 40%)" }}>
                      Club
                    </span>
                  </Squircle>
                </Link>
              ))}

              {/* Show more hint if capped */}
              {(myCommunities.length + myClubs.length) > 4 && (
                <Link href="/student/communities" className="block text-center text-[0.72rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)] pt-1 transition-colors">
                  +{(myCommunities.length + myClubs.length) - 4} more · View all →
                </Link>
              )}
            </div>
          )}
        </Squircle>
      </div>
    </div>
  );
}
