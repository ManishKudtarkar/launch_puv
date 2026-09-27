"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BlobBackground } from "@/components/shared/blob-background";
import { useTheme } from "@/providers/theme-provider";
import { useDemoStore } from "@/store/demo-store";
import { ROLE_LABELS } from "@/constants/navigation";
import type { NavItem } from "@/types";
import {
  LogOut, Menu, X, Sun, Moon,
  LayoutDashboard, CalendarDays, Users, BarChart3, Settings, Bell, Building2, Shield, User,
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Events: CalendarDays,
  "My Events": CalendarDays,
  "Create Event": CalendarDays,
  Users: Users,
  People: Users,
  Analytics: BarChart3,
  Settings: Settings,
  Notifications: Bell,
  Organizations: Building2,
  Roles: Shield,
};

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
}

export function DashboardShell({ children, navItems, roleLabel }: DashboardShellProps) {
  const pathname = usePathname();
  const user = useDemoStore((s) => s.user);
  const logout = useDemoStore((s) => s.logout);
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleColor = getRoleColor(user?.role);

  return (
    <div className="relative flex min-h-screen">
      <BlobBackground variant="dashboard" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(6,9,16,0.55)] backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform lg:static lg:translate-x-0",
          "bg-[var(--bg-card)] border-r border-[var(--border-card)] backdrop-blur-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--hairline)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-8 rounded-sm"
              style={{ background: roleColor }}
            />
            <div>
              <Link href="/" className="font-bold tracking-tight text-[var(--ink-1)] font-[family-name:var(--font-display)]">
                PUVerse
              </Link>
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--ink-3)] font-[family-name:var(--font-mono)]">
                {roleLabel}
              </p>
            </div>
          </div>
          <button className="lg:hidden text-[var(--ink-3)]" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[var(--hairline)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="pv-avatar-sq w-9 h-9 rounded-[35%] flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)` }}
            >
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-1)] truncate">{user?.name}</p>
              <p className="text-xs text-[var(--ink-3)] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = ICON_MAP[item.label] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--accent-glow)] text-[var(--ink-1)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--ink-1)]",
                )}
              >
                <div
                  className={cn(
                    "pv-icon-box w-8 h-8 rounded-[11px] flex items-center justify-center border transition-colors",
                    active
                      ? "border-[var(--accent-500)] text-[var(--accent-400)] bg-[rgba(41,141,255,0.14)]"
                      : "border-[var(--border-card)] text-[var(--ink-3)] bg-[var(--bg-card)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--hairline)] p-3 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] text-sm text-[var(--ink-2)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--ink-1)] transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-[2] flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-[var(--hairline)] bg-[var(--bg-card)] backdrop-blur-2xl">
          <button onClick={() => setSidebarOpen(true)} className="text-[var(--ink-2)]">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-[var(--ink-1)] font-[family-name:var(--font-display)]">PUVerse</span>
          <div className="flex items-center gap-2">
            <RoleBadge role={user?.role} />
            <Link
              href={getProfileRoute(user?.role)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-card)] text-[var(--ink-2)] hover:text-[var(--ink-1)] hover:bg-[var(--bg-card-hover)] transition-colors"
              aria-label="Open profile"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  const color = getRoleColor(role);
  return (
    <span
      className="px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] rounded-[var(--r-full)] font-medium"
      style={{
        background: `${color}22`,
        color: color,
      }}
    >
      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
    </span>
  );
}

function getProfileRoute(role?: string) {
  switch (role) {
    case "super_admin":
      return "/super-admin/settings";
    case "platform_admin":
      return "/platform-admin/settings";
    case "admin":
      // Event Admins enter via /student; /admin is accessed through the dashboard card
      return "/student";
    default:
      return "/student/profile";
  }
}

function getRoleColor(role?: string): string {
  switch (role) {
    case "student": return "var(--role-student)";
    case "admin": return "var(--role-admin)";
    case "super_admin": return "var(--role-super)";
    case "platform_admin": return "var(--role-platform)";
    default: return "var(--accent-500)";
  }
}
