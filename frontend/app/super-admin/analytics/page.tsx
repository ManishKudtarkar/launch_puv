"use client";

import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { ANALYTICS, ALL_USERS, ORGANIZATIONS } from "@/constants/mock-data";
import {
  Users,
  CalendarDays,
  TrendingUp,
  Building2,
  Target,
  GraduationCap,
  Shield,
} from "lucide-react";

export default function SuperAdminAnalyticsPage() {
  const events = useDemoStore((s) => s.events);
  const totalRegs = events.reduce((sum, e) => sum + e.registered, 0);
  const totalCap = events.reduce((sum, e) => sum + e.capacity, 0);
  const avgFill = totalCap ? Math.round((totalRegs / totalCap) * 100) : 0;
  const sorted = [...events].sort((a, b) => b.registered - a.registered);
  const maxReg = sorted[0]?.registered || 1;

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const monthData = ANALYTICS.monthlyRegistrations;
  const monthMax = Math.max(...monthData);

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const stats = [
    { label: "Total Users", value: ANALYTICS.totalUsers.toLocaleString(), icon: Users, color: "var(--info)" },
    { label: "Total Events", value: ANALYTICS.totalEvents, icon: CalendarDays, color: "var(--accent)" },
    { label: "Registrations", value: ANALYTICS.totalRegistrations.toLocaleString(), icon: TrendingUp, color: "var(--positive)" },
    { label: "Attendance Rate", value: `${ANALYTICS.attendanceRate}%`, icon: Target, color: "var(--warning)" },
  ];

  // SVG line chart
  const chartW = 100;
  const chartH = 100;
  const padY = 8;
  const points = monthData.map((val, i) => {
    const x = (i / (monthData.length - 1)) * chartW;
    const y = chartH - padY - ((val / monthMax) * (chartH - padY * 2));
    return { x, y, val };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  // Category breakdown
  const categories = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const catTotal = catEntries.reduce((s, [, v]) => s + v, 0);

  // Status donut
  const statuses = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});
  const statusEntries = Object.entries(statuses);
  const statusColors: Record<string, string> = {
    published: "var(--col-primary)",
    pending_approval: "#FBBF24",
    completed: "#999999",
    cancelled: "#F87171",
    draft: "#D1D5DB",
  };
  const statusLabels: Record<string, string> = {
    published: "Published",
    pending_approval: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    draft: "Draft",
  };

  // User role breakdown
  const roleCounts = ALL_USERS.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const roleColors: Record<string, { color: string; icon: typeof Users }> = {
    student: { color: "hsl(200 70% 50%)", icon: GraduationCap },
    admin: { color: "hsl(270 50% 55%)", icon: Shield },
    super_admin: { color: "var(--accent)", icon: Shield },
    platform_admin: { color: "hsl(0 60% 55%)", icon: Shield },
  };
  const roleLabels: Record<string, string> = {
    student: "Students",
    admin: "Admins",
    super_admin: "Super Admins",
    platform_admin: "Platform Admins",
  };

  // Org stats
  const activeOrgs = ORGANIZATIONS.filter((o) => o.status === "active");

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Analytics
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Platform-wide metrics and insights.
        </p>
      </div>

      {/* Stats row */}
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

      {/* Two-column charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Monthly Registrations — line chart */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-6">
            Monthly Registrations
          </h2>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH + 16}`} className="w-full" preserveAspectRatio="none" style={{ height: "180px" }}>
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = chartH - padY - frac * (chartH - padY * 2);
                return <line key={frac} x1={0} y1={y} x2={chartW} y2={y} stroke="hsl(0 0% 80% / 0.25)" strokeWidth="0.3" />;
              })}
              <path d={areaPath} fill="url(#saAreaGrad)" />
              <path d={linePath} fill="none" stroke="var(--col-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--bg)" stroke="var(--col-primary)" strokeWidth="1.5" />
              ))}
              {points.map((p, i) => (
                <text key={`l-${i}`} x={p.x} y={chartH + 12} textAnchor="middle" fontSize="4" fill="var(--col-dim)" fontFamily="var(--font-mono)">
                  {monthLabels[i]}
                </text>
              ))}
              <defs>
                <linearGradient id="saAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--col-primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--col-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Low: {Math.min(...monthData)}</span>
              <span className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Peak: {monthMax}</span>
            </div>
          </div>
        </Squircle>

        {/* Event Status — donut chart */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-6">
            Event Status
          </h2>
          <div className="flex items-center gap-8">
            <div className="relative w-[130px] h-[130px] flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return statusEntries.map(([status, count]) => {
                    const pct = (count / events.length) * 100;
                    const dash = (pct / 100) * 100;
                    const el = (
                      <circle key={status} cx="18" cy="18" r="15.5" fill="none"
                        stroke={statusColors[status] || "#D1D5DB"} strokeWidth="4"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset} strokeLinecap="round" />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[1.3rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] leading-none">
                  {events.length}
                </p>
                <p className="text-[0.5rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em] mt-0.5">
                  Events
                </p>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: statusColors[status] || "#D1D5DB" }} />
                  <span className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] flex-1">
                    {statusLabels[status] || status}
                  </span>
                  <span className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Squircle>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Top events */}
        <div className="space-y-6">
          <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
              Top Events by Registrations
            </h2>
            <div className="space-y-4">
              {sorted.slice(0, 5).map((event, i) => {
                const pct = Math.round((event.registered / maxReg) * 100);
                const fillPct = Math.round((event.registered / event.capacity) * 100);
                return (
                  <div key={event.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate flex-1 mr-3">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[0.72rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                          {event.registered}
                        </span>
                        <span className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">/ {event.capacity}</span>
                      </div>
                    </div>
                    <div className="h-[6px] rounded-full bg-[hsl(0_0%_85%_/_0.3)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? "var(--col-primary)" : fillPct >= 90 ? "var(--accent)" : `hsl(0 0% ${35 + i * 10}%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Squircle>

          {/* Organizations performance */}
          <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
              Organization Activity
            </h2>
            <div className="space-y-3.5">
              {ORGANIZATIONS.sort((a, b) => b.events - a.events).map((org) => {
                const maxEvents = Math.max(...ORGANIZATIONS.map((o) => o.events));
                const initials = org.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
                return (
                  <div key={org.id} className="flex items-center gap-3">
                    <Squircle
                      cornerRadius={8}
                      cornerSmoothing={1}
                      className="w-7 h-7 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 40%))" }}
                    >
                      {initials}
                    </Squircle>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.76rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-ui)] truncate">{org.name}</span>
                        <span className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] flex-shrink-0 ml-2">
                          {org.events} events &middot; {org.members} members
                        </span>
                      </div>
                      <div className="h-[3px] rounded-full bg-[hsl(0_0%_85%_/_0.3)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(org.events / maxEvents) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Squircle>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* User role breakdown */}
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
              Users by Role
            </h2>
            <div className="space-y-3">
              {Object.entries(roleCounts).map(([role, count]) => {
                const rc = roleColors[role] || { color: "var(--col-dim)", icon: Users };
                const RoleIcon = rc.icon;
                return (
                  <div key={role} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${rc.color}15` }}>
                      <RoleIcon className="w-[12px] h-[12px]" style={{ color: rc.color }} strokeWidth={1.5} />
                    </div>
                    <span className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] flex-1">
                      {roleLabels[role] || role}
                    </span>
                    <span className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Squircle>

          {/* Category breakdown */}
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
              By Category
            </h2>
            <div className="space-y-3">
              {catEntries.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <Squircle
                    cornerRadius={6}
                    cornerSmoothing={1}
                    className="px-2 py-[3px] text-[0.54rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] text-[var(--col-dim)] flex-shrink-0"
                    style={{ background: "hsl(0 0% 90% / 0.5)" }}
                  >
                    {cat}
                  </Squircle>
                  <div className="flex-1 h-[3px] rounded-full bg-[hsl(0_0%_85%_/_0.3)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--col-primary)]" style={{ width: `${(count / catTotal) * 100}%` }} />
                  </div>
                  <span className="text-[0.72rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums w-5 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </Squircle>

          {/* Capacity overview */}
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
              Capacity Overview
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative w-[80px] h-[80px] flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(0 0% 85% / 0.3)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none"
                    stroke={avgFill >= 80 ? "var(--accent)" : "var(--col-primary)"}
                    strokeWidth="3.5"
                    strokeDasharray={`${(avgFill / 100) * 97.4} 97.4`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">{avgFill}%</p>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Filled</span>
                  <span className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{totalRegs.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Total Capacity</span>
                  <span className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{totalCap.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Available</span>
                  <span className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{(totalCap - totalRegs).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Squircle>
        </div>
      </div>
    </div>
  );
}
