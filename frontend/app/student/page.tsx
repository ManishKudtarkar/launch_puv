"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { CalendarPlus, ClipboardList } from "lucide-react";

export default function StudentDashboard() {
  const user = useDemoStore((s) => s.user);
  const authUser = useAuthStore((s) => s.user);
  const registrations = useDemoStore((s) => s.registrations);
  const tickets = useDemoStore((s) => s.tickets);
  const certificates = useDemoStore((s) => s.certificates);
  const notifications = useDemoStore((s) => s.notifications);
  const events = useDemoStore((s) => s.events);
  const isEventAdmin = authUser?.role === "EVENT_ADMIN" || user?.backendRole === "EVENT_ADMIN" || user?.role === "admin";

  const [realRegs, setRealRegs] = useState<{ id: string; eventTitle: string; registeredAt: string; status: string }[]>([]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;

    api.events.list().then(async (eventsList) => {
      const results: { id: string; eventTitle: string; registeredAt: string; status: string }[] = [];
      await Promise.allSettled(
        eventsList.map(async (ev) => {
          try {
            const reg = await api.events.registrations.me(ev.id);
            if (reg) {
              results.push({
                id: reg.id,
                eventTitle: ev.title,
                registeredAt: (reg as any).createdAt || (reg as any).registeredAt || new Date().toISOString(),
                status: (reg as any).status || "registered",
              });
            }
          } catch {
            // not registered for this event
          }
        })
      );
      if (active) setRealRegs(results);
    }).catch(() => {});

    return () => { active = false; };
  }, [authUser]);

  const activeRegs = registrations.filter((r) => r.status !== "cancelled");
  const displayRegs = realRegs.length > 0 ? realRegs : activeRegs;
  const regCount = realRegs.length > 0 ? realRegs.length : activeRegs.length;
  const unread = notifications.filter((n) => !n.read).length;
  const upcoming = events.filter((e) => e.status === "published").slice(0, 3);

  const stats = [
    { label: "Registrations", value: regCount, icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: "Active Tickets", value: tickets.filter((t) => t.status === "active").length, icon: <><path d="M2 12h5l2-7 4 14 2-7h5" /></> },
    { label: "Certificates", value: certificates.length, icon: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></> },
    { label: "Unread", value: unread, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
  ];

  return (
    <div>
      {/* Hero area — welcome text left, stat cards right */}
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
            {user?.name?.split(" ")[0]}
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
          <div className="grid grid-cols-2 gap-2.5 mt-2">
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
                {/* Label */}
                <p className="text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  {stat.label}
                </p>

                {/* Bottom row — big number + icon with ring */}
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
              <Link href="/student/events">
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
            <div className="flex gap-2">
              <Link href="/student/events" className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--line)] bg-[hsl(0_0%_100%_/_0.5)] px-4 py-2.5 text-[0.74rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-ui)]"><ClipboardList className="w-3.5 h-3.5 text-[var(--accent)]" /> My Events</Link>
              <Link href="/student/events/create" className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--col-primary)] px-4 py-2.5 text-[0.74rem] font-medium text-[var(--bg)] font-[family-name:var(--font-ui)]"><CalendarPlus className="w-3.5 h-3.5" /> Create Event</Link>
            </div>
          </div>
        </Squircle>
      )}

      {/* Content grid — events + registrations */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Upcoming Events ── */}
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
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Upcoming Events
            </h2>
            <Squircle
              cornerRadius={12}
              cornerSmoothing={1}
              className="group inline-flex items-center gap-[8px] text-[0.72rem] font-medium pl-4 pr-[4px] py-[4px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-all duration-300 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ background: "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              asChild
            >
              <Link href="/student/events">
                See all
                <Squircle cornerRadius={8} cornerSmoothing={1} className="w-[24px] h-[24px] border border-[var(--col-primary)] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Squircle>
              </Link>
            </Squircle>
          </div>

          {/* Event rows */}
          <div className="space-y-2">
            {upcoming.map((event) => (
              <Squircle
                key={event.id}
                cornerRadius={18}
                cornerSmoothing={1}
                className="p-4 transition-all duration-300 hover:-translate-y-0.5 group/item"
                style={{
                  background: "hsl(0 0% 100% / 0.5)",
                  boxShadow: "0 1px 6px hsl(0 0% 0% / 0.03), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Date squircle */}
                  <Squircle
                    cornerRadius={12}
                    cornerSmoothing={1}
                    className="w-11 h-11 flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--accent), hsl(25 55% 38%))" }}
                  >
                    <span className="text-[0.5rem] font-bold leading-none text-[var(--bg)] font-[family-name:var(--font-mono)]">
                      {new Date(event.startDate).toLocaleDateString("en", { month: "short" }).toUpperCase()}
                    </span>
                    <span className="text-[0.95rem] font-bold leading-none mt-0.5 text-[var(--bg)] font-[family-name:var(--font-mono)]">
                      {new Date(event.startDate).getDate()}
                    </span>
                  </Squircle>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                      {event.venue} · {event.registered}/{event.capacity}
                    </p>
                  </div>

                  {/* Arrow ring */}
                  <div className="w-8 h-8 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] stroke-[var(--accent)] fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover/item:rotate-0" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Squircle>
            ))}
          </div>
        </Squircle>

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
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Recent Registrations
            </h2>
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

          {/* Registration rows */}
          <div className="space-y-2">
            {displayRegs.slice(0, 3).map((reg) => (
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
                  {/* Icon ring */}
                  <div className="w-11 h-11 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] stroke-[var(--accent)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                      {reg.eventTitle}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                      {formatDate(reg.registeredAt)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <Squircle
                    cornerRadius={8}
                    cornerSmoothing={1}
                    className="px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.1em] font-medium flex-shrink-0 font-[family-name:var(--font-mono)]"
                    style={{
                      background: reg.status === "registered" ? "var(--accent)" : "hsl(0 0% 90% / 0.6)",
                      color: reg.status === "registered" ? "white" : "var(--col-secondary)",
                    }}
                  >
                    {reg.status}
                  </Squircle>
                </div>
              </Squircle>
            ))}
            {displayRegs.length === 0 && (
              <p className="py-6 text-center text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                No registrations yet.
              </p>
            )}
          </div>
        </Squircle>
      </div>
    </div>
  );
}
