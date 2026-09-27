"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { ANALYTICS, ALL_USERS, ORGANIZATIONS } from "@/constants/mock-data";
import {
  Users,
  CalendarDays,
  Building2,
  ShieldCheck,
  TrendingUp,
  Target,
  BarChart3,
  Settings,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function PlatformAdminDashboard() {
  const events = useDemoStore((s) => s.events);
  const pending = events.filter((e) => e.status === "pending_approval");
  const admins = ALL_USERS.filter((u) => u.role === "admin");
  const activeOrgs = ORGANIZATIONS.filter((o) => o.status === "active");
  const totalRegs = events.reduce((s, e) => s + e.registered, 0);
  const totalCap = events.reduce((s, e) => s + e.capacity, 0);
  const fillRate = totalCap ? Math.round((totalRegs / totalCap) * 100) : 0;

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const stats = [
    { label: "Total Users", value: ANALYTICS.totalUsers.toLocaleString(), icon: Users, color: "var(--info)" },
    { label: "Total Events", value: ANALYTICS.totalEvents, icon: CalendarDays, color: "var(--accent)" },
    { label: "Active Orgs", value: activeOrgs.length, icon: Building2, color: "var(--positive)" },
    { label: "Pending", value: pending.length, icon: ShieldCheck, color: "var(--warning)" },
  ];

  const stats2 = [
    { label: "Registrations", value: ANALYTICS.totalRegistrations.toLocaleString(), icon: TrendingUp, color: "var(--info)" },
    { label: "Attendance", value: `${ANALYTICS.attendanceRate}%`, icon: Target, color: "var(--accent)" },
    { label: "Fill Rate", value: `${fillRate}%`, icon: BarChart3, color: "var(--positive)" },
    { label: "Platform", value: "Online", icon: CheckCircle2, color: "var(--positive)" },
  ];

  const quickActions = [
    { label: "Manage Roles", href: "/platform-admin/roles", icon: ShieldCheck },
    { label: "Manage Users", href: "/platform-admin/users", icon: Users },
    { label: "Organizations", href: "/platform-admin/organizations", icon: Building2 },
    { label: "View Analytics", href: "/platform-admin/analytics", icon: BarChart3 },
    { label: "System Settings", href: "/platform-admin/settings", icon: Settings },
  ];

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Platform Admin
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Complete platform oversight and control.
        </p>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Squircle key={stat.label} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: stat.color }}>
                  <Icon className="w-[15px] h-[15px]" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[1.8rem] font-semibold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                {stat.value}
              </p>
              <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5 uppercase tracking-[0.1em]">
                {stat.label}
              </p>
            </Squircle>
          );
        })}
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats2.map((stat) => {
          const Icon = stat.icon;
          return (
            <Squircle key={stat.label} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: stat.color }}>
                  <Icon className="w-[15px] h-[15px]" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[1.8rem] font-semibold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                {stat.value}
              </p>
              <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5 uppercase tracking-[0.1em]">
                {stat.label}
              </p>
            </Squircle>
          );
        })}
      </div>

      {/* Three-column bottom */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Approvals */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Pending Event Approvals
          </h2>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-[var(--positive)] mx-auto mb-2 opacity-50" strokeWidth={1} />
              <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pending.map((event) => {
                const initials = event.organization.split(" ").map((w) => w[0]).join("").slice(0, 2);
                return (
                  <div key={event.id} className="flex items-center gap-3 pb-3.5" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
                    <Squircle
                      cornerRadius={10}
                      cornerSmoothing={1}
                      className="w-9 h-9 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--warning), var(--accent))" }}
                    >
                      {initials}
                    </Squircle>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                      <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{event.organization}</p>
                    </div>
                    <Link
                      href="/platform-admin/events"
                      className="text-[0.66rem] text-[var(--accent)] font-medium font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Squircle>

        {/* Recent Admins */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Recent Admins
          </h2>
          <div className="space-y-3.5">
            {admins.map((u) => {
              const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              return (
                <div key={u.id} className="flex items-center gap-3 pb-3.5" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
                  <Squircle
                    cornerRadius={10}
                    cornerSmoothing={1}
                    className="w-9 h-9 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--role-admin), hsl(270 40% 45%))" }}
                  >
                    {initials}
                  </Squircle>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{u.name}</p>
                    <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] truncate">{u.email}</p>
                  </div>
                  <Squircle
                    cornerRadius={6}
                    cornerSmoothing={1}
                    className="px-2 py-[2px] text-[0.5rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] flex-shrink-0"
                    style={{ background: "var(--role-admin)15", color: "var(--role-admin)" }}
                  >
                    Admin
                  </Squircle>
                </div>
              );
            })}
          </div>
        </Squircle>

        {/* Quick Actions */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Quick Actions
          </h2>
          <div className="space-y-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-[10px] transition-all duration-200 hover:bg-[hsl(0_0%_100%_/_0.3)] group"
                  style={{ borderRadius: "12px" }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(0 0% 100% / 0.5)" }}>
                    <Icon className="w-[12px] h-[12px] text-[var(--col-dim)]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-ui)] flex-1">{action.label}</span>
                  <ArrowRight className="w-[12px] h-[12px] text-[var(--col-dim)] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        </Squircle>
      </div>
    </div>
  );
}
