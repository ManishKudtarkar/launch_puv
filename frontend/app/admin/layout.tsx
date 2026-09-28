"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { useAuthStore } from "@/store/auth-store";
import { AuthGuard } from "@/components/shared/auth-guard";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarPlus,
  BarChart3,
  Building2,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "My Events", href: "/admin/events", icon: CalendarDays },
  { label: "Create Event", href: "/admin/events/create", icon: CalendarPlus },
  { label: "Departments & Clubs", href: "/admin/organizations", icon: Building2 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 68;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const demoUser = useDemoStore((s) => s.user);
  const authUser = useAuthStore((s) => s.user);
  const demoLogout = useDemoStore((s) => s.logout);
  const authLogout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const user = {
    name: authUser?.fullName || demoUser?.name || "Admin",
    email: authUser?.email || demoUser?.email || "",
  };

  const handleLogout = async () => {
    await authLogout();
    demoLogout();
    window.location.href = "/login";
  };

  return (
    <AuthGuard allowedRoles={["admin", "super_admin", "platform_admin"]}>
      <div className="min-h-screen relative">
      {/* Blob background */}
      <div className="blob-container">
        <div className="blob" style={{
          top: "-5%", left: "-5%", width: "55vw", height: "55vw",
          background: "radial-gradient(circle, hsl(25 65% 45% / 0.55) 0%, transparent 70%)",
          animation: "blob-float 25s ease-in-out infinite alternate",
        }} />
        <div className="blob" style={{
          top: "30%", right: "-10%", width: "50vw", height: "50vw",
          background: "radial-gradient(circle, hsl(25 60% 40% / 0.45) 0%, transparent 70%)",
          animation: "blob-float 30s ease-in-out infinite alternate-reverse",
        }} />
        <div className="blob" style={{
          bottom: "-10%", left: "15%", width: "50vw", height: "50vw",
          background: "radial-gradient(circle, hsl(25 65% 42% / 0.50) 0%, transparent 70%)",
          animation: "blob-float 22s ease-in-out infinite alternate-reverse",
        }} />
        <div className="blob" style={{
          top: "6%", right: "4%", width: "28vw", height: "28vw",
          background: "radial-gradient(circle, hsl(25 75% 52% / 0.65) 0%, hsl(25 65% 45% / 0.30) 50%, transparent 75%)",
          animation: "blob-float 18s ease-in-out infinite alternate",
        }} />
        <div className="blob" style={{
          top: "18%", right: "-2%", width: "22vw", height: "22vw",
          background: "radial-gradient(circle, hsl(30 60% 55% / 0.45) 0%, transparent 70%)",
          animation: "blob-float 24s ease-in-out infinite alternate-reverse",
        }} />
      </div>

      {/* ─── Mobile top bar ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[200] h-14 flex items-center justify-between px-4 border-b border-[hsl(0_0%_85%_/_0.4)]"
        style={{ background: "hsl(0 0% 96% / 0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <Link href="/" className="flex items-center gap-[7px]">
          <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
          <span className="text-[1.05rem] leading-none">
            <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
            <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
          </span>
        </Link>
        <button onClick={() => setMobileDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.06)] transition-all cursor-pointer"
          aria-label="Open navigation">
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>
      </div>

      {/* ─── Mobile drawer backdrop ─── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[250] bg-[hsl(0_0%_10%_/_0.35)] backdrop-blur-sm"
          onClick={() => setMobileDrawerOpen(false)} />
      )}

      {/* ─── Mobile slide-over drawer ─── */}
      <div className="md:hidden fixed top-0 left-0 bottom-0 z-[260] w-[272px] max-w-[85vw] flex flex-col transition-transform duration-300"
        style={{
          transform: mobileDrawerOpen ? "translateX(0)" : "translateX(-100%)",
          background: "hsl(0 0% 96% / 0.96)",
          backdropFilter: "blur(40px) saturate(1.5)",
          WebkitBackdropFilter: "blur(40px) saturate(1.5)",
          borderRight: "1px solid hsl(0 0% 85% / 0.5)",
          boxShadow: "4px 0 32px hsl(0 0% 0% / 0.1)",
        }}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(0_0%_85%_/_0.4)] flex-shrink-0">
          <Link href="/" className="flex items-center gap-[7px]" onClick={() => setMobileDrawerOpen(false)}>
            <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
            <span className="text-[1.05rem] leading-none">
              <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>
          <button onClick={() => setMobileDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-all cursor-pointer"
            aria-label="Close menu">
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        {/* Back to Dashboard */}
        <div className="px-3 pt-3 pb-1">
          <Link href="/student" onClick={() => setMobileDrawerOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-[0.74rem] font-medium transition-all duration-200 font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(25 65% 45% / 0.10)", border: "1px solid hsl(25 65% 45% / 0.25)", color: "var(--accent-light)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Main Dashboard
          </Link>
        </div>
        <div className="mx-3 my-2 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 80% / 0.4), transparent)" }} />
        {/* Drawer nav */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-[13px] transition-all duration-200 font-[family-name:var(--font-ui)] ${isActive ? "bg-[var(--col-primary)] text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_100%_/_0.6)]"}`}>
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-[9px]"
                  style={{ background: isActive ? "hsl(0 0% 100% / 0.15)" : "hsl(0 0% 0% / 0.04)" }}>
                  <Icon className="w-[14px] h-[14px]" strokeWidth={1.8} />
                </div>
                <span className="text-[0.82rem] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* Drawer user + logout */}
        <div className="px-3 py-4 border-t border-[hsl(0_0%_85%_/_0.4)] flex-shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-[13px] bg-[hsl(0_0%_100%_/_0.6)]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.58rem] font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--role-admin), var(--accent))" }}>
              {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.74rem] font-medium text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">{user?.name}</p>
              <p className="text-[0.58rem] text-[var(--col-dim)] truncate font-[family-name:var(--font-mono)]">Event Admin</p>
            </div>
            <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors cursor-pointer rounded-[8px]" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Sidebar (desktop only) ─── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[200] flex-col overflow-hidden"
        style={{
          width: `${sidebarWidth}px`,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "hsl(0 0% 100% / 0.12)",
          backdropFilter: "blur(50px) saturate(1.6)",
          WebkitBackdropFilter: "blur(50px) saturate(1.6)",
          borderRight: "1px solid hsl(0 0% 100% / 0.35)",
          boxShadow: "4px 0 40px hsl(0 0% 20% / 0.06), inset -1px 0 0 hsl(0 0% 100% / 0.15)",
        }}
      >
        {/* Logo + Toggle row */}
        <div className="flex items-center px-4 pt-5 pb-3" style={{ gap: collapsed ? 0 : 8 }}>
          <Link
            href="/"
            className="flex items-center gap-[8px] flex-1 min-w-0 overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 200,
              pointerEvents: collapsed ? "none" : "auto",
              transition: "opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="w-[8px] h-[8px] rounded-full bg-[var(--accent)] flex-shrink-0 shadow-[0_1px_4px_var(--shadow-lg)]" />
            <div className="text-[1.15rem] leading-none whitespace-nowrap">
              <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </div>
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-all duration-200 hover:bg-[hsl(0_0%_0%_/_0.06)] cursor-pointer"
            style={{ borderRadius: 10, marginLeft: collapsed ? "auto" : undefined }}
          >
            {collapsed
              ? <PanelLeftOpen className="w-[16px] h-[16px]" strokeWidth={1.8} />
              : <PanelLeftClose className="w-[16px] h-[16px]" strokeWidth={1.8} />}
          </button>
        </div>
        {/* Portal label */}
        <div
          className="overflow-hidden"
          style={{ maxHeight: collapsed ? 0 : 28, opacity: collapsed ? 0 : 1, transition: "max-height 0.25s ease, opacity 0.2s ease" }}
        >
          <p className="px-7 pb-3 text-[0.58rem] tracking-[0.2em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] whitespace-nowrap">
            Admin Portal
          </p>
        </div>

        {/* Back to Main Dashboard */}
        <div className="px-2 pt-2 pb-1">
          <Link
            href="/student"
            className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-[0.74rem] font-medium transition-all duration-200 font-[family-name:var(--font-ui)] group"
            style={{
              background: "hsl(25 65% 45% / 0.10)",
              border: "1px solid hsl(25 65% 45% / 0.25)",
              color: "var(--accent-light)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span
              className="whitespace-nowrap overflow-hidden transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1, maxWidth: collapsed ? 0 : 160 }}
            >
              Main Dashboard
            </span>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 80% / 0.4), transparent)" }} />

        {/* Nav items */}
        <nav className="flex-1 px-2 py-5 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const isExactDashboard = item.href === "/admin" && pathname === "/admin";
            const isActive = isExactDashboard || active;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 px-2.5 py-[10px] transition-all duration-300 font-[family-name:var(--font-ui)] cursor-pointer relative ${
                  isActive ? "text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)]"
                }`}
                style={{
                  borderRadius: "14px",
                  ...(isActive
                    ? { background: "var(--col-primary)", boxShadow: "0 4px 20px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.08)" }
                    : { background: "transparent" }),
                  justifyContent: collapsed ? "center" : undefined,
                }}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? "" : "group-hover:scale-110"}`}
                  style={{ borderRadius: "10px", ...(isActive ? { background: "hsl(0 0% 100% / 0.15)" } : { background: "hsl(0 0% 0% / 0.03)" }) }}
                >
                  <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />
                </div>
                <span
                  className="text-[0.78rem] font-medium whitespace-nowrap overflow-hidden"
                  style={{
                    flex: collapsed ? "0 0 0" : "1",
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 160,
                    transition: "opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), flex 0.3s ease",
                  }}
                >{item.label}</span>
                {isActive && !collapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        <div className="px-2 py-3.5 flex-shrink-0 z-10 border-t border-[var(--line-soft)] bg-[hsl(0_0%_96%_/_0.94)] backdrop-blur-xl overflow-hidden">
          <div
            className="flex items-center gap-3 p-2.5 transition-all duration-300 rounded-[14px] bg-[hsl(0_0%_100%_/_0.75)] border border-[var(--line-soft)] shadow-sm"
            style={{ justifyContent: collapsed ? "center" : undefined }}
          >
            <Squircle
              cornerRadius={11}
              cornerSmoothing={1}
              className="w-9 h-9 flex items-center justify-center text-white text-[0.6rem] font-semibold font-[family-name:var(--font-display)] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--role-admin), var(--accent))" }}
              title={collapsed ? user.name : undefined}
            >
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </Squircle>
            <div
              className="min-w-0 overflow-hidden"
              style={{
                flex: collapsed ? "0 0 0" : "1",
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 140,
                transition: "opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), flex 0.3s ease",
              }}
            >
              <p className="text-[0.76rem] font-medium text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">
                {user?.name}
              </p>
              <p className="text-[0.6rem] text-[var(--col-dim)] truncate font-[family-name:var(--font-mono)]">
                Event Admin
              </p>
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="w-8 h-8 flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-all duration-300 hover:bg-[hsl(0_0%_0%_/_0.05)] flex-shrink-0 cursor-pointer"
                style={{ borderRadius: "10px" }}
                title="Logout"
              >
                <LogOut className="w-[14px] h-[14px]" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content — no margin on mobile, sidebar offset on md+ */}
      <main
        className="relative z-[3] min-h-screen pt-14 md:pt-8 pb-20 px-4 sm:px-6 lg:px-8 min-w-0 max-w-full overflow-x-hidden"
        style={{ marginLeft: "0px", width: "100%" }}
        ref={(el) => {
          if (!el) return;
          const apply = () => {
            if (window.innerWidth >= 768) {
              el.style.marginLeft = `${sidebarWidth}px`;
              el.style.width = `calc(100% - ${sidebarWidth}px)`;
            } else {
              el.style.marginLeft = "0px";
              el.style.width = "100%";
            }
          };
          apply();
        }}
      >
        <div className="max-w-[1200px] mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
