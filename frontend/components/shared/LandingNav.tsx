"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { useDemoStore } from "@/store/demo-store";
import { X, Menu, LayoutDashboard, LogOut, User } from "lucide-react";

const NAV_LINKS = [
  { label: "Explore Events", href: "/explore-events" },
  { label: "Departments", href: "/student/communities" },
  { label: "Clubs", href: "/student/communities" },
  { label: "About", href: "#about" },
];

export default function LandingNav() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const authLogout = useAuthStore((s) => s.logout);
  const demoLogout = useDemoStore((s) => s.logout);

  const isLoggedIn = initialized && !!user && !!accessToken;
  const uiRole = user ? backendRoleToUiRole(user) : "student";
  const dashboardHref = "/student";
  const roleLabel =
    uiRole === "super_admin" ? "Super Admin" :
      uiRole === "admin" ? "Event Admin" :
        uiRole === "platform_admin" ? "Platform Admin" : "Student";

  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-[200] w-full max-w-full overflow-x-hidden border-b border-[hsl(25_18%_75%_/_0.42)] bg-[hsl(35_20%_96%_/_0.78)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-[7px] flex-shrink-0">
            <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)] shadow-[0_1px_4px_var(--shadow-lg)]" />
            <span className="text-[1.1rem] leading-none">
              <span className="font-extrabold tracking-[-0.02em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>

          {/* Center — plain links, no pill container */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[0.82rem] font-medium text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)] whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right — CTAs / profile */}
          <div className="flex items-center gap-3">

            {/* Logged-in: profile avatar + dropdown */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--col-primary)] shadow-sm transition-all hover:scale-105 cursor-pointer"
                  aria-label="Open profile menu"
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
                      onClick={async () => {
                        await authLogout();
                        demoLogout();
                        setProfileOpen(false);
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[0.78rem] font-medium text-[var(--col-secondary)] hover:bg-[var(--surface)] hover:text-[var(--danger)] cursor-pointer font-[family-name:var(--font-ui)]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out: Login + Register pills */
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex rounded-full border border-[hsl(0_0%_85%_/_0.6)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--col-primary)] hover:bg-[var(--surface)] font-[family-name:var(--font-display)] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-flex rounded-full bg-[var(--col-primary)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--bg)] hover:opacity-90 font-[family-name:var(--font-display)] transition-opacity shadow-md"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-[10px] text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.06)] transition-all duration-200 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[300] bg-[hsl(0_0%_10%_/_0.35)] backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile slide-over panel ──────────────────────────────────────── */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[310] w-[280px] max-w-[85vw] flex flex-col md:hidden transition-transform duration-300"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          background: "hsl(35 20% 96% / 0.96)",
          backdropFilter: "blur(32px) saturate(1.6)",
          WebkitBackdropFilter: "blur(32px) saturate(1.6)",
          borderLeft: "1px solid hsl(25 18% 75% / 0.4)",
          boxShadow: "-4px 0 32px hsl(0 0% 0% / 0.1)",
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

        {/* Drawer nav links */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center px-4 py-3 rounded-[12px] text-[0.86rem] font-medium text-[var(--col-secondary)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_100%_/_0.6)] transition-all duration-200 font-[family-name:var(--font-ui)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Drawer CTAs */}
        <div className="px-4 pb-8 pt-3 space-y-2.5 border-t border-[hsl(25_18%_75%_/_0.35)] flex-shrink-0">
          {isLoggedIn ? (
            <Link
              href={dashboardHref}
              onClick={() => setDrawerOpen(false)}
              className="w-full inline-flex items-center justify-center text-[0.82rem] font-semibold py-[11px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] hover:opacity-85 active:scale-[0.97] transition-all duration-200 font-[family-name:var(--font-display)]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="w-full inline-flex items-center justify-center text-[0.82rem] font-semibold py-[11px] rounded-full border border-[hsl(0_0%_78%_/_0.6)] bg-[hsl(0_0%_100%_/_0.5)] text-[var(--col-primary)] hover:bg-[hsl(0_0%_96%_/_0.85)] active:scale-[0.97] transition-all duration-200 font-[family-name:var(--font-display)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setDrawerOpen(false)}
                className="w-full inline-flex items-center justify-center text-[0.82rem] font-semibold py-[11px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] hover:opacity-85 active:scale-[0.97] transition-all duration-200 font-[family-name:var(--font-display)] shadow-md"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
