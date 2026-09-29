"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Squircle } from "@squircle-js/react";
import LandingNav from "@/components/shared/LandingNav";
import ScrollReveal from "@/components/shared/ScrollReveal";
import { api, type Event as ApiEvent } from "@/lib/api-client";
import type { Club, Community } from "@/types";

function formatCount(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
    return `${n}`;
}

function eventUrlFor(event: ApiEvent) {
    if (event.slug && event.slug.trim()) return `/events/${event.slug}`;
    if (event.id) return `/events/${event.id}`;
    const title = (event.title || "event").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `/events/${title}`;
}

function formatEventDate(dateString?: string) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const platformFeatures = [
    { title: "Campus network", detail: "Connect clubs, students, faculty, and campus teams in one shared university space." },
    { title: "Student access", detail: "Give learners one simple place to discover programs, communities, and opportunities." },
    { title: "Engagement records", detail: "Track participation, approvals, and campus activity through a clean digital workflow." },
];

const campusPrograms = [
    "Campus",
    "Clubs",
    "Access",
    "Programs",
];

export default function LandingPage() {
    // Auth state is consumed inside LandingNav; page only needs user for personalisation
    const [nextEvent, setNextEvent] = useState<ApiEvent | null>(null);
    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    useEffect(() => {
        let active = true;

        Promise.allSettled([
            api.events.list(),
            api.clubs.list(),
            api.communities.list(),
        ]).then(([eventsRes, clubsRes, communitiesRes]) => {
            if (!active) return;

            // ── Events ──────────────────────────────────────────────
            if (eventsRes.status === "fulfilled") {
                const allEvents = eventsRes.value;
                setEvents(allEvents);
                const now = new Date().getTime();
                const upcoming = allEvents
                    .filter((e) => {
                        const status = (e.status || "").toUpperCase();
                        const isPublished = status === "PUBLISHED" || !status;
                        const evtTime = new Date(e.eventDate).getTime();
                        return isPublished && (isNaN(evtTime) || evtTime >= now - 86400000);
                    })
                    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
                setNextEvent(upcoming.length > 0 ? upcoming[0] : (allEvents.length > 0 ? allEvents[0] : null));
            } else {
                setNextEvent(null);
            }

            // ── Clubs & Communities (active only) ───────────────────
            if (clubsRes.status === "fulfilled") {
                setClubs(clubsRes.value.filter((c) => c.status !== "INACTIVE"));
            }
            if (communitiesRes.status === "fulfilled") {
                setCommunities(communitiesRes.value.filter((c) => c.status !== "INACTIVE"));
            }

            setLoadingEvent(false);
            setLoadingFeatured(false);
        });

        return () => {
            active = false;
        };
    }, []);

    const seatsLeft = nextEvent && typeof nextEvent.capacity === "number"
        ? Math.max(0, nextEvent.capacity - (nextEvent.registered || 0))
        : null;

    // ── Live campus metrics computed from real API data ─────────────────
    const totalRegistrations = events.reduce((sum, e) => sum + (typeof e.registered === "number" ? e.registered : 0), 0);
    const liveMetrics = [
        { value: formatCount(clubs.length), label: "Active Clubs", live: false },
        { value: formatCount(totalRegistrations), label: "Registrations", live: true },
        { value: formatCount(events.length), label: "Campus Events", live: false },
        { value: formatCount(communities.length), label: "Communities", live: true },
    ];

    // Top featured clubs & communities by follower count
    const featuredClubs = [...clubs].sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0)).slice(0, 3);
    const featuredCommunities = [...communities].sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0)).slice(0, 3);
    const hasFeatured = featuredClubs.length > 0 || featuredCommunities.length > 0;

    return (
        <div className="min-h-screen relative">
            <div className="blob-container">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            <LandingNav />

            <main className="relative w-full max-w-full">
                {/* Hero Section */}
                <section className="section-transparent py-10 lg:py-16 w-full max-w-full">
                    <div className="max-w-[1280px] mx-auto px-6 md:px-12 w-full">

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">

                            {/* B. Left — Hero copy + actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.08 }}
                                className="max-w-[620px]"
                            >
                                {/* Eyebrow label */}
                                <div className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-6 font-[family-name:var(--font-mono)]">
                                    <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
                                    Unite. Participate.Lead.
                                </div>

                                {/* Headline */}
                                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-6">
                                    PUVerse Campus Platform
                                    <br className="hidden sm:block" />
                                    <span className="block text-[0.6em] font-semibold tracking-[-0.01em] text-[var(--col-secondary)] mt-2 leading-snug font-[family-name:var(--font-display)]">
                                        The Single Hub for All Campus Events,
                                        <br className="hidden sm:block" /> Clubs &amp; Student Communities.
                                    </span>
                                </h1>

                                {/* Subtext */}
                                <p className="text-[0.96rem] leading-[1.8] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-8 max-w-[520px]">
                                    The official university ecosystem for event discovery, instant QR passes, club chapters, and student forums.
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-9">
                                    <Link
                                        href="/explore-events"
                                        className="inline-flex items-center justify-center gap-2 text-[0.82rem] font-semibold px-6 py-[11px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-200 hover:opacity-85 active:scale-95 font-[family-name:var(--font-display)]"
                                        style={{ boxShadow: "0 2px 12px var(--shadow-lg)" }}
                                    >
                                        Explore Events
                                    </Link>
                                    <Link
                                        href="/student"
                                        className="inline-flex items-center justify-center gap-2 text-[0.82rem] font-semibold px-6 py-[11px] rounded-full border border-[hsl(0_0%_78%_/_0.6)] bg-[hsl(0_0%_96%_/_0.55)] text-[var(--col-primary)] transition-all duration-200 hover:bg-[hsl(0_0%_96%_/_0.85)] active:scale-95 font-[family-name:var(--font-display)]"
                                    >
                                        Login to Dashboard
                                    </Link>
                                </div>

                                {/* Tag pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[480px]">
                                    {campusPrograms.map((item) => (
                                        <div key={item} className="rounded-full border border-[hsl(0_0%_85%_/_0.5)] px-4 py-2 text-center bg-[hsl(0_0%_96%_/_0.3)]">
                                            <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* C. Right — Floating Ticket Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.18 }}
                                className="hidden lg:flex flex-col gap-4"
                            >
                                {/* Hero image card */}
                                <Squircle
                                    cornerRadius={28}
                                    cornerSmoothing={1}
                                    className="relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(244,238,230,0.40))",
                                        backdropFilter: "blur(20px)",
                                        WebkitBackdropFilter: "blur(20px)",
                                        boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 var(--glow)",
                                        minHeight: "300px",
                                    }}
                                >
                                    <img
                                        src="https://tse4.mm.bing.net/th/id/OIP.ORp0RbGGta73Rv0pF8cmdgHaC6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
                                        alt="PUVerse campus community"
                                        className="h-full w-full object-cover absolute inset-0"
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,20,0.05),rgba(18,18,20,0.65))]" />
                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-mono)] mb-1">
                                            PUVerse Network
                                        </p>
                                        <p className="text-[1.3rem] font-bold text-white font-[family-name:var(--font-display)] leading-tight">
                                            Campus life, connected.
                                        </p>
                                    </div>
                                </Squircle>

                                {/* Event Ticket Card */}
                                {loadingEvent ? (
                                    <Squircle
                                        cornerRadius={22}
                                        cornerSmoothing={1}
                                        className="p-5 min-h-[160px] flex items-center justify-center text-xs text-[var(--col-secondary)]"
                                        style={{
                                            background: "hsl(0 0% 96% / 0.72)",
                                            backdropFilter: "blur(24px) saturate(1.4)",
                                            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                                            border: "1px solid hsl(25 65% 45% / 0.22)",
                                            boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 var(--glow)",
                                        }}
                                    >
                                        Loading next event...
                                    </Squircle>
                                ) : nextEvent ? (
                                    <Squircle
                                        cornerRadius={22}
                                        cornerSmoothing={1}
                                        className="p-5"
                                        style={{
                                            background: "hsl(0 0% 96% / 0.72)",
                                            backdropFilter: "blur(24px) saturate(1.4)",
                                            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                                            border: "1px solid hsl(25 65% 45% / 0.22)",
                                            boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 var(--glow)",
                                        }}
                                    >
                                        {/* Ticket header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                                                Next Big Event
                                            </span>
                                            <span
                                                className="inline-flex items-center gap-1 text-[0.58rem] font-semibold px-2.5 py-1 rounded-full font-[family-name:var(--font-mono)]"
                                                style={{ background: "hsl(142 50% 45% / 0.1)", color: "hsl(142 50% 35%)", border: "1px solid hsl(142 50% 45% / 0.2)" }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(142_50%_45%)]" />
                                                Open
                                            </span>
                                        </div>

                                        {/* Event name */}
                                        <p className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-snug mb-3">
                                            {nextEvent.title}
                                        </p>

                                        {/* Meta row */}
                                        <div className="flex flex-col gap-1.5 mb-4">
                                            {nextEvent.eventDate && (
                                                <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                                    {formatEventDate(nextEvent.eventDate)}
                                                </span>
                                            )}
                                            {nextEvent.venue && (
                                                <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                                    {nextEvent.venue}
                                                </span>
                                            )}
                                            {seatsLeft !== null && (
                                                <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                                    {seatsLeft} Seats Left
                                                </span>
                                            )}
                                        </div>

                                        {/* Dashed separator */}
                                        <div
                                            className="h-px mb-4"
                                            style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(0 0% 75% / 0.5) 0px, hsl(0 0% 75% / 0.5) 5px, transparent 5px, transparent 10px)" }}
                                        />

                                        {/* CTA */}
                                        <Link
                                            href={eventUrlFor(nextEvent)}
                                            className="w-full inline-flex items-center justify-center gap-2 text-[0.76rem] font-semibold py-2.5 rounded-[12px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-200 hover:opacity-85 active:scale-95 font-[family-name:var(--font-display)]"
                                        >
                                            Register Now →
                                        </Link>
                                    </Squircle>
                                ) : (
                                    /* Empty space when no event data exists */
                                    <div className="min-h-[100px]" />
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Metrics & Impact Bar */}
                <motion.section
                    id="metrics"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 w-full max-w-full overflow-x-hidden border-t border-b border-[hsl(0_0%_85%_/_0.45)] bg-[hsl(0_0%_96%_/_0.38)] backdrop-blur-sm"
                >
                    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
                            {liveMetrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className={[
                                        "flex flex-col items-center justify-center text-center px-6 py-7",
                                        "rounded-[22px] md:rounded-none",
                                        "border border-[hsl(0_0%_85%_/_0.5)] md:border-0",
                                        "md:border-r md:border-[hsl(0_0%_85%_/_0.45)] last:border-r-0",
                                        "bg-[hsl(0_0%_96%_/_0.42)] md:bg-transparent",
                                        "hover:-translate-y-0.5 transition-transform duration-200",
                                    ].join(" ")}
                                >
                                    {/* Value */}
                                    {loadingFeatured ? (
                                        <span className="mb-2 h-8 sm:h-10 w-16 rounded-md bg-[hsl(0_0%_80%_/_0.35)] animate-pulse" />
                                    ) : (
                                        <span className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums leading-none mb-2">
                                            {metric.value}
                                        </span>
                                    )}

                                    {/* Label + live indicator */}
                                    <span className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-snug text-center">
                                        {metric.live && (
                                            <span className="relative flex-shrink-0 w-2 h-2">
                                                {/* Pulsing ring */}
                                                <span className="absolute inset-0 rounded-full bg-[hsl(142_50%_45%_/_0.35)] animate-ping" />
                                                <span className="relative block w-2 h-2 rounded-full bg-[hsl(142_50%_42%)]" />
                                            </span>
                                        )}
                                        {metric.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Section: Featured Clubs & Communities (live data) */}
                {(loadingFeatured || hasFeatured) && (
                    <section id="featured" className="relative z-10 w-full max-w-full overflow-x-hidden py-14 border-t border-[hsl(0_0%_85%_/_0.45)]">
                        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
                            <ScrollReveal>
                                <div className="mb-9">
                                    <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
                                        Featured on campus
                                    </p>
                                    <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                                        Clubs &amp; communities to explore.
                                    </h2>
                                </div>
                            </ScrollReveal>

                            {loadingFeatured ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.42)] p-6">
                                            <div className="h-11 w-11 rounded-full bg-[hsl(0_0%_80%_/_0.35)] animate-pulse mb-4" />
                                            <div className="h-4 w-2/3 rounded bg-[hsl(0_0%_80%_/_0.35)] animate-pulse mb-3" />
                                            <div className="h-3 w-1/2 rounded bg-[hsl(0_0%_80%_/_0.3)] animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {featuredCommunities.map((c, i) => (
                                        <ScrollReveal key={`community-${c.id}`} delay={i * 0.08}>
                                            <Link
                                                href={`/student/communities/${c.slug}`}
                                                className="block h-full rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.42)] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--col-primary)] text-[var(--bg)] text-[0.82rem] font-bold font-[family-name:var(--font-display)]">
                                                        {c.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                    <span className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                                                        Community
                                                    </span>
                                                </div>
                                                <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1 truncate">
                                                    {c.name}
                                                </h3>
                                                {c.shortDescription && (
                                                    <p className="text-[0.8rem] leading-[1.6] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] line-clamp-2 mb-4">
                                                        {c.shortDescription}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                                                    <span>{formatCount(c.followerCount || 0)} followers</span>
                                                    <span>{c.clubCount || 0} clubs</span>
                                                    <span>{c.eventCount || 0} events</span>
                                                </div>
                                            </Link>
                                        </ScrollReveal>
                                    ))}
                                    {featuredClubs.map((c, i) => (
                                        <ScrollReveal key={`club-${c.id}`} delay={(featuredCommunities.length + i) * 0.08}>
                                            <Link
                                                href={`/student/clubs/${c.slug}`}
                                                className="block h-full rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.42)] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[0.82rem] font-bold font-[family-name:var(--font-display)]">
                                                        {c.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                    <span className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                                                        Club
                                                    </span>
                                                </div>
                                                <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1 truncate">
                                                    {c.name}
                                                </h3>
                                                {c.shortDescription && (
                                                    <p className="text-[0.8rem] leading-[1.6] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] line-clamp-2 mb-4">
                                                        {c.shortDescription}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                                                    <span>{formatCount(c.followerCount || 0)} followers</span>
                                                    <span>{c.eventCount || 0} events</span>
                                                    {c.community?.name && <span className="truncate max-w-[120px]">{c.community.name}</span>}
                                                </div>
                                            </Link>
                                        </ScrollReveal>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <section id="platform" className="relative z-10 py-14 border-t border-[hsl(0_0%_85%_/_0.45)]">
                    <div className="max-w-[1280px] mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {platformFeatures.map((feature, index) => (
                                <ScrollReveal key={feature.title} delay={index * 0.08}>
                                    <div className="h-full rounded-[28px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.42)] p-7 backdrop-blur-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <span className="w-9 h-9 rounded-full border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-[family-name:var(--font-display)]">
                                                0{index + 1}
                                            </span>
                                            <span className="w-14 h-px bg-[var(--accent)]" />
                                        </div>
                                        <h3 className="text-[1.2rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-[0.84rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                            {feature.detail}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="relative z-10 py-14">
                    <div className="max-w-[1280px] mx-auto px-6 md:px-12">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                            <div>
                                <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
                                    How PUVerse works
                                </p>
                                <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                                    One digital campus rhythm.
                                </h2>
                            </div>
                            <Link href="/register" className="text-[0.78rem] font-medium px-[22px] py-[10px] rounded-full border border-[hsl(0_0%_85%_/_0.55)] text-[var(--col-primary)] hover:bg-[hsl(0_0%_96%_/_0.8)] transition-all duration-300 font-[family-name:var(--font-display)]">
                                Join PUVerse
                            </Link>
                        </div>

                        <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                ["01", "Create a community", "Campus groups publish opportunities and maintain a shared university presence."],
                                ["02", "Open access", "Students discover programs, activities, and resources through one connected platform."],
                                ["03", "Manage engagement", "Faculty and administrators coordinate records, participation, and communication."],
                            ].map(([step, title, text], index) => (
                                <ScrollReveal key={step} delay={index * 0.08}>
                                    <div className="h-full rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.25)] p-7">
                                        <div className="flex items-center gap-3 mb-5">
                                            <span className="text-[0.72rem] font-bold tracking-[0.22em] text-[var(--accent)] font-[family-name:var(--font-mono)]">{step}</span>
                                            <span className="w-12 h-px bg-[var(--line)]" />
                                        </div>
                                        <h3 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-3">
                                            {title}
                                        </h3>
                                        <p className="text-[0.84rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                            {text}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                <footer id="about" className="relative z-10 border-t border-[hsl(0_0%_85%_/_0.45)] bg-[hsl(0_0%_96%_/_0.45)]">
                    <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                            <div>
                                <Link href="/" className="flex items-center gap-[7px]">
                                    <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0 shadow-[0_1px_4px_var(--shadow-lg)]" />
                                    <div className="text-[1.1rem] leading-none">
                                        <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">
                                            PU
                                        </span>
                                        <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">
                                            verse
                                        </span>
                                    </div>
                                </Link>
                                <p className="mt-4 text-[0.82rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                                    A university engagement platform built to connect people, programs, and campus life.
                                </p>
                            </div>
                            <div>
                                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
                                    Platform
                                </p>
                                <ul className="space-y-3 text-[0.82rem] text-[var(--col-secondary)]">
                                    <li><Link href="#platform">Campus</Link></li>
                                    <li><Link href="#how-it-works">Programs</Link></li>
                                    <li><Link href="#about">Access</Link></li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
                                    University
                                </p>
                                <ul className="space-y-3 text-[0.82rem] text-[var(--col-secondary)]">
                                    <li><Link href="#about">About PUVerse</Link></li>
                                    <li><Link href="#contact">Contact</Link></li>
                                    <li><Link href="/login">Login</Link></li>
                                </ul>
                            </div>
                            <div id="contact">
                                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
                                    Connect
                                </p>
                                <div className="flex items-center gap-3">
                                    <a href="mailto:hello@puverse.edu" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)]">
                                        hello@puverse.edu
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 pt-6 border-t border-[hsl(0_0%_85%_/_0.45)] flex flex-col sm:flex-row justify-between gap-4 text-[0.76rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
                            <span>© 2026 PUVerse. All rights reserved.</span>
                            <span>Privacy · Terms · Campus Access</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
