"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { useAuthStore } from "@/store/auth-store";
import { AuthGuard } from "@/components/shared/auth-guard";
import { getDashboardHref } from "@/lib/role-home";
import DrawerAccountFooter from "@/components/shared/DrawerAccountFooter";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  BarChart3,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { label: "Users", href: "/super-admin/users", icon: Users },
  { label: "Communities & Clubs", href: "/super-admin/organizations", icon: Building2 },
  { label: "Event Approvals", href: "/super-admin/events", icon: ShieldCheck },
  { label: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
];

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 68;

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const demoUser = useDemoStore((s) => s.user);
  const authUser = useAuthStore((s) => s.user);
  const demoLogout = useDemoStore((s) => s.logout);
  const authLogout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  // Same active rule for desktop sidebar and mobile drawer.
  const isNavActive = (href: string) =>
    href === "/super-admin" ? pathname === "/super-admin" : pathname === href || pathname.startsWith(`${href}/`);

  // Close the drawer with Escape, and lock background scroll while it's open.
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileDrawerOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileDrawerOpen]);

  const user = {
    name: authUser?.fullName || demoUser?.name || "Super Admin",
    email: authUser?.email || demoUser?.email || "",
  };

  const handleLogout = async () => {
    await authLogout();
    demoLogout();
    window.location.href = "/login";
  };

  return (
    <AuthGuard allowedRoles={["super_admin", "platform_admin"]}>
      <div className="min-h-screen relative w-full max-w-full overflow-x-hidden">
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

        {/* ─── Mobile top bar (below md) ─── */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-[200] h-14 flex items-center justify-between px-4 border-b border-[hsl(0_0%_85%_/_0.4)]"
          style={{ background: "hsl(0 0% 96% / 0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <Link href="/" className="flex items-center gap-[7px]">
            <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
            <span className="text-[1.05rem] leading-none">
              <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.06)] transition-all cursor-pointer"
            aria-label="Open navigation"
            aria-expanded={mobileDrawerOpen}
            aria-controls="super-admin-mobile-drawer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* ─── Mobile drawer backdrop (tap outside to close) ─── */}
        {mobileDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-[250] bg-[hsl(0_0%_10%_/_0.35)] backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
        )}

        {/* ─── Mobile slide-over drawer — slides in from the LEFT ─── */}
        <div
          id="super-admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Super Admin navigation"
          aria-hidden={!mobileDrawerOpen}
          className="md:hidden fixed top-0 left-0 bottom-0 z-[260] w-[272px] max-w-[85vw] flex flex-col transition-transform duration-300"
          style={{
            transform: mobileDrawerOpen ? "translateX(0)" : "translateX(-100%)",
            visibility: mobileDrawerOpen ? "visible" : "hidden",
            transition: "transform 0.3s ease, visibility 0.3s",
            background: "hsl(0 0% 96% / 0.96)",
            backdropFilter: "blur(40px) saturate(1.5)",
            WebkitBackdropFilter: "blur(40px) saturate(1.5)",
            borderRight: "1px solid hsl(0 0% 85% / 0.5)",
            boxShadow: "4px 0 32px hsl(0 0% 0% / 0.1)",
          }}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(0_0%_85%_/_0.4)] flex-shrink-0">
            <Link href="/" className="flex items-center gap-[7px]" onClick={() => setMobileDrawerOpen(false)}>
              <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
              <span className="text-[1.05rem] leading-none">
                <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
                <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-all cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>

          <p className="px-6 pt-4 pb-1 text-[0.58rem] tracking-[0.2em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
            Super Admin
          </p>

          {/* Drawer nav — each link closes the drawer */}
          <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[13px] transition-all duration-200 font-[family-name:var(--font-ui)] ${isActive ? "bg-[var(--col-primary)] text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_100%_/_0.6)]"}`}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-[9px]" style={{ background: isActive ? "hsl(0 0% 100% / 0.15)" : "hsl(0 0% 0% / 0.04)" }}>
                    <Icon className="w-[14px] h-[14px]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[0.82rem] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer footer — pinned: user summary, Dashboard, Logout */}
          <DrawerAccountFooter
            name={user.name}
            email={user.email}
            roleLabel={String(authUser?.role || "").toUpperCase() === "PLATFORM_ADMIN" ? "Platform Admin" : "Super Admin"}
            dashboardHref={getDashboardHref(authUser)}
            onLogout={handleLogout}
            onNavigate={() => setMobileDrawerOpen(false)}
            avatarGradient="linear-gradient(135deg, var(--role-super), var(--accent))"
          />
        </div>

        {/* ─── Sidebar (desktop, md+) ─── */}
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
              Super Admin
            </p>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 80% / 0.4), transparent)" }} />

          {/* Nav items */}
          <nav className="flex-1 px-2 py-5 space-y-0.5 overflow-y-auto overflow-x-hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 px-2.5 py-[10px] transition-all duration-300 font-[family-name:var(--font-ui)] cursor-pointer relative ${isActive ? "text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)]"
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

          {/* Divider */}
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 80% / 0.4), transparent)" }} />

          {/* User card */}
          <div className="px-2 py-5 overflow-hidden">
            <div
              className="flex items-center gap-3 p-3 transition-all duration-300"
              style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.08)", justifyContent: collapsed ? "center" : undefined }}
            >
              <Squircle
                cornerRadius={11}
                cornerSmoothing={1}
                className="w-9 h-9 flex items-center justify-center text-white text-[0.6rem] font-semibold font-[family-name:var(--font-display)] flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--role-super), var(--accent))" }}
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
                  Super Admin
                </p>
              </div>
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-all duration-300 hover:bg-[hsl(0_0%_0%_/_0.05)] flex-shrink-0"
                  style={{ borderRadius: "10px" }}
                >
                  <LogOut className="w-[14px] h-[14px]" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main content — full width under the mobile top bar; offset by the sidebar on md+.
            Pure CSS (no JS resize logic) so rotating / resizing always stays correct. */}
        <main
          className="relative z-[3] min-h-screen pt-[72px] md:pt-8 pb-12 px-4 sm:px-6 md:px-8 min-w-0 max-w-full overflow-x-hidden md:ml-[var(--sb)] md:w-[calc(100%-var(--sb))]"
          style={{
            ["--sb" as string]: `${sidebarWidth}px`,
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          } as React.CSSProperties}
        >
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
