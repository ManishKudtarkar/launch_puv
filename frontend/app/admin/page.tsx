"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useEffect, useState } from "react";
import { api, getApiErrorMessage, type Event } from "@/lib/api-client";
import { useDemoStore } from "@/store/demo-store";
import { CalendarDays, CheckCircle2, Clock, Users, Plus, ArrowUpRight, BarChart3, Eye } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PUBLISHED: { bg: "hsl(142 50% 45% / 0.1)", text: "hsl(142 50% 35%)", label: "Published" },
  PENDING_APPROVAL: { bg: "hsl(45 90% 50% / 0.1)", text: "hsl(45 80% 35%)", label: "Pending" },
  APPROVED: { bg: "hsl(200 70% 50% / 0.1)", text: "hsl(200 60% 35%)", label: "Approved" },
  CHANGES_REQUESTED: { bg: "hsl(270 60% 65% / 0.1)", text: "hsl(270 50% 45%)", label: "Changes" },
  COMPLETED: { bg: "hsl(0 0% 60% / 0.1)", text: "var(--col-dim)", label: "Completed" },
  REJECTED: { bg: "hsl(0 60% 50% / 0.1)", text: "hsl(0 60% 45%)", label: "Rejected" },
  DRAFT: { bg: "hsl(0 0% 85% / 0.3)", text: "var(--col-secondary)", label: "Draft" },
};

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

export default function AdminDashboard() {
  const user = useDemoStore((s) => s.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.mine()
      .then(setEvents)
      .catch((e) => console.error(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const published = events.filter((e) => e.status === "PUBLISHED");
  const pending = events.filter((e) => e.status === "PENDING_APPROVAL");
  const totalRegs = events.reduce((sum, e) => sum + (e.registered ?? 0), 0);
  const avgFill = events.length
    ? Math.round(events.reduce((sum, e) => sum + ((e.registered ?? 0) / (e.capacity ?? 1)) * 100, 0) / events.length)
    : 0;

  const stats = [
    { label: "Total Events", value: events.length, icon: CalendarDays, color: "var(--accent)" },
    { label: "Published", value: published.length, icon: CheckCircle2, color: "var(--positive)" },
    { label: "Pending Approval", value: pending.length, icon: Clock, color: "var(--warning)" },
    { label: "Total Registrations", value: totalRegs, icon: Users, color: "var(--info)" },
  ];

  return (
    <div>
      {/* ── Event Admin Workspace Banner ─────────────────────────────────── */}
      <div
        className="mb-7 rounded-[20px] px-6 py-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(120deg, hsl(25 65% 45% / 0.10) 0%, hsl(25 55% 38% / 0.06) 100%)",
          border: "1px solid hsl(25 65% 45% / 0.22)",
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.55)",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
            boxShadow: "0 3px 12px hsl(25 65% 45% / 0.30)",
          }}
        >
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--accent)] font-[family-name:var(--font-mono)] font-bold mb-0.5">
            Event Admin Workspace
          </p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.4]">
            Event Management, Registration Analytics &amp; Attendance Control
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">Welcome back</p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          {user?.name || "Admin"}<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Manage your events, registrations, and attendance.</p>
      </div>

      {loading && <p className="mb-6 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading...</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Squircle key={stat.label} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: stat.color }}>
                  <Icon className="w-[15px] h-[15px]" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[1.8rem] font-semibold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{stat.value}</p>
              <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5 uppercase tracking-[0.1em]">{stat.label}</p>
            </Squircle>
          );
        })}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_320px] items-start">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Recent Events</h2>
            <Link href="/admin/events" className="text-[0.72rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)] transition-colors duration-200">View all</Link>
          </div>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const sc = statusColors[event.status as string] || statusColors.DRAFT;
              const fillPct = event.capacity ? Math.round(((event.registered ?? 0) / event.capacity) * 100) : 0;
              return (
                <Squircle key={event.id} cornerRadius={22} cornerSmoothing={1} className="p-5 group cursor-pointer transition-all duration-300 hover:-translate-y-[2px]" style={glassStyle}>
                  <Link href={`/admin/events/${event.id}`} className="block">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Squircle cornerRadius={6} cornerSmoothing={1} className="px-2 py-0.5 text-[0.54rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)]" style={{ background: sc.bg, color: sc.text }}>{sc.label}</Squircle>
                        </div>
                        <p className="text-[0.88rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                        <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-1">
                          {new Date(event.eventDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          {event.venue ? ` · ${event.venue}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="relative w-11 h-11">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(0 0% 85% / 0.4)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={fillPct >= 90 ? "var(--accent)" : "var(--col-primary)"} strokeWidth="3" strokeDasharray={`${(fillPct / 100) * 97.4} 97.4`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[0.52rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">{fillPct}%</span>
                        </div>
                        <p className="text-[0.52rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1">{event.registered ?? 0}/{event.capacity ?? 0}</p>
                      </div>
                    </div>
                  </Link>
                </Squircle>
              );
            })}
            {events.length === 0 && !loading && (
              <Squircle cornerRadius={22} cornerSmoothing={1} className="p-10 text-center" style={glassStyle}>
                <p className="text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No events yet. Create your first event.</p>
              </Squircle>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: "Create New Event", href: "/admin/events/create", icon: Plus, primary: true },
                { label: "Manage Events", href: "/admin/events", icon: Eye },
                { label: "View Analytics", href: "/admin/analytics", icon: BarChart3 },
              ].map((action, i) => (
                <Link key={action.href} href={action.href}>
                  <Squircle cornerRadius={16} cornerSmoothing={1}
                    className={`group w-full inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] transition-all duration-300 font-[family-name:var(--font-display)] cursor-pointer ${action.primary ? "bg-[var(--col-primary)] text-[var(--bg)] hover:opacity-80" : "text-[var(--col-secondary)] hover:bg-[hsl(0_0%_96%_/_0.8)]"} ${i > 0 ? "mt-2" : ""}`}
                    style={action.primary ? { boxShadow: "0 2px 16px var(--shadow-lg)" } : { background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
                    {action.label}
                    <Squircle cornerRadius={12} cornerSmoothing={1} className={`w-[34px] h-[34px] border flex items-center justify-center flex-shrink-0 ${action.primary ? "border-white/70" : "border-[var(--col-primary)]"}`}>
                      <action.icon className={`w-[13px] h-[13px] ${action.primary ? "" : "text-[var(--col-primary)]"}`} strokeWidth={action.primary ? 2 : 1.5} />
                    </Squircle>
                  </Squircle>
                </Link>
              ))}
            </div>
          </Squircle>

          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">At a Glance</h3>
            <div className="space-y-3.5">
              {[
                { label: "Avg. Fill Rate", value: `${avgFill}%` },
                { label: "Active Events", value: published.length },
                { label: "Awaiting Approval", value: pending.length, warn: pending.length > 0 },
                { label: "Total Capacity", value: events.reduce((s, e) => s + (e.capacity ?? 0), 0) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{row.label}</span>
                  <span className="text-[0.84rem] font-semibold font-[family-name:var(--font-mono)] tabular-nums" style={{ color: row.warn ? "var(--warning)" : "var(--col-primary)" }}>{row.value}</span>
                </div>
              ))}
              <div className="h-[3px] rounded-full bg-[hsl(0_0%_85%_/_0.4)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${avgFill}%`, background: avgFill >= 80 ? "var(--accent)" : "var(--col-primary)" }} />
              </div>
            </div>
          </Squircle>

          {pending.length > 0 && (
            <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.2)" }}>
              <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--warning)] font-[family-name:var(--font-mono)] mb-3">Pending Approval</h3>
              {pending.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--warning)] flex-shrink-0" />
                  <p className="text-[0.78rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] flex-1 truncate">{evt.title}</p>
                  <Link href={`/admin/events/${evt.id}`}><ArrowUpRight className="w-3.5 h-3.5 text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors" /></Link>
                </div>
              ))}
            </Squircle>
          )}
        </div>
      </div>
    </div>
  );
}
