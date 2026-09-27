"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useEffect, useState } from "react";
import { api, getApiErrorMessage, type Event, type ApiUser } from "@/lib/api-client";
import { useDemoStore } from "@/store/demo-store";
import { Users, CalendarDays, ShieldCheck, CheckCircle2, Bell, BarChart3, Building2 } from "lucide-react";

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

export default function SuperAdminDashboard() {
  const user = useDemoStore((s) => s.user);
  const [pending, setPending] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.events.pending(),
      api.events.list(),
      api.users.list(),
    ])
      .then(([p, all, u]) => { setPending(p); setAllEvents(all); setUsers(u); })
      .catch((e) => console.error(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const published = allEvents.filter((e) => e.status === "PUBLISHED");
  const completed = allEvents.filter((e) => e.status === "COMPLETED");

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "var(--info)" },
    { label: "Published Events", value: published.length, icon: CalendarDays, color: "var(--accent)" },
    { label: "Pending Approvals", value: pending.length, icon: ShieldCheck, color: "var(--warning)" },
    { label: "Completed Events", value: completed.length, icon: CheckCircle2, color: "var(--positive)" },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">Platform Overview</p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          {user?.name || "Super Admin"}<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          {users.length} registered users &middot; {allEvents.length} total events
        </p>
      </div>

      {loading && <p className="mb-6 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading...</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Pending Approvals</h2>
              <Link href="/super-admin/events" className="text-[0.72rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)] transition-colors duration-200">View all</Link>
            </div>
            {pending.length === 0 && !loading ? (
              <Squircle cornerRadius={22} cornerSmoothing={1} className="p-10 text-center" style={glassStyle}>
                <CheckCircle2 className="w-8 h-8 text-[var(--positive)] mx-auto mb-2 opacity-50" strokeWidth={1} />
                <p className="text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">All clear — no pending approvals.</p>
              </Squircle>
            ) : (
              <div className="space-y-3">
                {pending.map((event) => (
                  <Squircle key={event.id} cornerRadius={22} cornerSmoothing={1} className="p-5 transition-all duration-300 hover:-translate-y-[2px]" style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.15)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.88rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                        <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1">
                          {new Date(event.eventDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          {event.venue ? ` · ${event.venue}` : ""}
                        </p>
                      </div>
                      <Link href="/super-admin/events">
                        <div className="w-8 h-8 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer">
                          <ShieldCheck className="w-[13px] h-[13px]" strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                  </Squircle>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Published Events</h2>
            <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
              {allEvents.slice(0, 5).map((event, i) => {
                const sc = statusColors[event.status as string] || statusColors.DRAFT;
                return (
                  <div key={event.id} className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
                    style={i < Math.min(4, allEvents.length - 1) ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}}>
                    <Squircle cornerRadius={10} cornerSmoothing={1} className="w-9 h-9 flex items-center justify-center text-white text-[0.48rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}>
                      {event.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </Squircle>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                      <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{new Date(event.eventDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <Squircle cornerRadius={6} cornerSmoothing={1} className="px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>{sc.label}</Squircle>
                  </div>
                );
              })}
              {allEvents.length === 0 && !loading && <p className="px-5 py-8 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No published events.</p>}
            </Squircle>
          </section>
        </div>

        <div className="space-y-4">
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: "Review Events", href: "/super-admin/events", icon: ShieldCheck, primary: true },
                { label: "Manage Users", href: "/super-admin/users", icon: Users },
                { label: "Organizations", href: "/super-admin/organizations", icon: Building2 },
                { label: "Notifications", href: "/super-admin/notifications", icon: Bell },
                { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
              ].map((action, i) => (
                <Link key={action.href} href={action.href}>
                  <Squircle cornerRadius={16} cornerSmoothing={1}
                    className={`group w-full inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] transition-all duration-300 font-[family-name:var(--font-display)] cursor-pointer ${action.primary ? "bg-[var(--col-primary)] text-[var(--bg)] hover:opacity-80" : "text-[var(--col-secondary)] hover:bg-[hsl(0_0%_96%_/_0.8)]"} ${i > 0 ? "mt-2" : ""}`}
                    style={action.primary ? { boxShadow: "0 2px 16px var(--shadow-lg)" } : { background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
                    {action.label}
                    <Squircle cornerRadius={12} cornerSmoothing={1} className={`w-[34px] h-[34px] border flex items-center justify-center flex-shrink-0 ${action.primary ? "border-white/70" : "border-[var(--col-primary)]"}`}>
                      <action.icon className={`w-[13px] h-[13px] ${action.primary ? "" : "text-[var(--col-primary)]"}`} strokeWidth={1.5} />
                    </Squircle>
                  </Squircle>
                </Link>
              ))}
            </div>
          </Squircle>

          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Platform Health</h3>
            <div className="space-y-3.5">
              {[
                { label: "Published Events", value: published.length },
                { label: "Completed Events", value: completed.length },
                { label: "Pending Approvals", value: pending.length, warn: pending.length > 0 },
                { label: "Total Users", value: users.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{row.label}</span>
                  <span className="text-[0.84rem] font-semibold font-[family-name:var(--font-mono)] tabular-nums" style={{ color: row.warn ? "var(--warning)" : "var(--col-primary)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Squircle>
        </div>
      </div>
    </div>
  );
}
