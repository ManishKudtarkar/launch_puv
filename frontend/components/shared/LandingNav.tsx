"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { useDemoStore } from "@/store/demo-store";
import { getDashboardHref } from "@/lib/role-home";
import DrawerAccountFooter from "@/components/shared/DrawerAccountFooter";
import { X, Menu, LayoutDashboard, LogOut, User } from "lucide-react";

const NAV_LINKS = [
  { label: "Explore Events", href: "/explore-events" },
  { label: "Communities", href: "/student/communities" },
  { label: "Clubs", href: "/student/communities?filter=clubs" },
  { label: "About", href: "/#about" },
];

const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin: "Event Admin",
  platform_admin: "Platform Admin",
  student: "Student",
} as const;

/**
 * Shared public navbar (landing + explore events).
 * Desktop (lg+): inline links + profile dropdown / Login & Register.
 * Mobile & tablet (< lg): hamburger only; a left drawer holds the links on top
 * and a pinned footer with the user summary, Dashboard and Logout.
 */
export default function LandingNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const authLogout = useAuthStore((s) => s.logout);
  const demoLogout = useDemoStore((s) => s.logout);

  const isLoggedIn = initialized && !!user && !!accessToken;
  const uiRole = user ? backendRoleToUiRole(user) : "student";
  const dashboardHref = getDashboardHref(user); // the logged-in user's own dashboard
  const roleLabel = ROLE_LABEL[uiRole] ?? "Student";

  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path !== "/" && !path.startsWith("/#") && pathname === path && !href.includes("?");
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    setProfileOpen(false);
    await authLogout();
    demoLogout();
    window.location.href = "/login";
  };

  // Drawer: close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-[500] w-full max-w-full border-b border-[hsl(25_18%_75%_/_0.42)] bg-[hsl(35_20%_96%_/_0.78)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-[7px] flex-shrink-0">
            <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)] shadow-[0_1px_4px_var(--shadow-lg)]" />
            <span className="text-[1.1rem] leading-none">
              <span className="font-extrabold tracking-[-0.02em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>

          {/* Center links — desktop only */}
          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-[0.82rem] font-medium transition-colors duration-200 font-[family-name:var(--font-ui)] whitespace-nowrap ${isActive(item.href) ? "text-[var(--col-primary)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)]"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right — desktop profile / auth CTAs + mobile hamburger */}
          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--col-primary)] shadow-sm transition-all hover:scale-105 cursor-pointer"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                >
                  <User className="h-4 w-4" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-52 rounded-[20px] border border-[hsl(25_18%_75%_/_0.55)] bg-[hsl(35_20%_97%_/_0.98)] p-2.5 shadow-2xl backdrop-blur-xl z-[400]">
                    <div className="px-3 py-2 border-b border-[hsl(25_18%_75%_/_0.3)] mb-1">
                      <p className="text-[0.78rem] font-semibold text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">
                        {user.fullName || "User"}
                      </p>
                      <p className="text-[0.66rem] text-[var(--col-dim)] truncate font-[family-name:var(--font-mono)]">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium bg-[var(--accent)] text-white">
                        {roleLabel}
                      </span>
                    </div>

                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-[0.78rem] font-medium text-[var(--col-secondary)] hover:bg-[var(--surface)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[0.78rem] font-medium text-[var(--col-secondary)] hover:bg-[var(--surface)] hover:text-[var(--danger)] cursor-pointer font-[family-name:var(--font-ui)]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden lg:inline-flex rounded-full border border-[hsl(0_0%_85%_/_0.6)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--col-primary)] hover:bg-[var(--surface)] font-[family-name:var(--font-display)] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden lg:inline-flex rounded-full bg-[var(--col-primary)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--bg)] hover:opacity-90 font-[family-name:var(--font-display)] transition-opacity shadow-md"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile & tablet menu trigger (same on every public page) */}
            <button
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] text-[var(--col-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={drawerOpen}
              aria-controls="public-mobile-drawer"
            >
              {drawerOpen ? <X className="w-5 h-5" strokeWidth={1.8} /> : <Menu className="w-5 h-5" strokeWidth={1.8} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer backdrop (tap outside to close) ───────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[510] bg-[hsl(0_0%_10%_/_0.35)] backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile slide-over drawer (from the left) ─────────────────────── */}
      <div
        id="public-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!drawerOpen}
        className="fixed top-0 left-0 bottom-0 z-[520] h-full w-[80vw] max-w-[300px] flex flex-col overflow-x-hidden lg:hidden"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          visibility: drawerOpen ? "visible" : "hidden",
          transition: "transform 0.3s ease, visibility 0.3s",
          background: "hsl(35 20% 96% / 0.96)",
          backdropFilter: "blur(32px) saturate(1.6)",
          WebkitBackdropFilter: "blur(32px) saturate(1.6)",
          borderRight: "1px solid hsl(25 18% 75% / 0.4)",
          boxShadow: "4px 0 32px hsl(0 0% 0% / 0.1)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[hsl(25_18%_75%_/_0.35)] flex-shrink-0">
          <Link href="/" className="flex items-center gap-[7px]" onClick={() => setDrawerOpen(false)}>
            <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
            <span className="text-[1.1rem] leading-none">
              <span className="font-extrabold tracking-[-0.02em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-all duration-200 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Body: links on top, footer pinned to the bottom */}
        <div className="flex-1 min-h-0 flex flex-col justify-between">
          {/* Top — navigation links */}
          <nav className="px-4 py-5 space-y-1 overflow-y-auto">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex items-center px-4 py-3 rounded-[12px] text-[0.86rem] font-medium transition-all duration-200 font-[family-name:var(--font-ui)] ${isActive(item.href) ? "bg-[var(--col-primary)] text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_100%_/_0.6)]"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Bottom — pinned footer (shared with every dashboard drawer) */}
          {isLoggedIn && user ? (
            <DrawerAccountFooter
              name={user.fullName || "User"}
              email={user.email}
              roleLabel={roleLabel}
              dashboardHref={dashboardHref}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          ) : (
            <div className="mt-auto px-4 pt-5 pb-6 border-t border-[hsl(25_18%_75%_/_0.35)] flex-shrink-0">
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="w-full h-11 mb-2 rounded-xl border border-[hsl(0_0%_78%_/_0.6)] bg-[hsl(0_0%_100%_/_0.5)] text-[var(--col-primary)] text-[0.82rem] font-semibold flex items-center justify-center hover:bg-[hsl(0_0%_96%_/_0.85)] active:scale-[0.98] transition-all font-[family-name:var(--font-display)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setDrawerOpen(false)}
                className="w-full h-11 rounded-xl bg-[var(--col-primary)] text-[var(--bg)] text-[0.82rem] font-semibold flex items-center justify-center hover:opacity-85 active:scale-[0.98] transition-all shadow-md font-[family-name:var(--font-display)]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
