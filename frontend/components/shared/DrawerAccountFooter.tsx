"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

type DrawerAccountFooterProps = {
  name: string;
  email?: string | null;
  roleLabel: string;
  dashboardHref: string;
  onLogout: () => void;
  /** Called when a footer link is tapped (e.g. to close the drawer). */
  onNavigate?: () => void;
  /** CSS gradient for the initials avatar; defaults to the theme primary → accent. */
  avatarGradient?: string;
};

/**
 * Pinned bottom block for mobile drawers: user summary, a Dashboard button that
 * routes to the user's own role dashboard, and a Logout button.
 * Shared by the public navbar drawer and every dashboard drawer so they match.
 */
export default function DrawerAccountFooter({
  name,
  email,
  roleLabel,
  dashboardHref,
  onLogout,
  onNavigate,
  avatarGradient = "linear-gradient(135deg, var(--col-primary), var(--accent))",
}: DrawerAccountFooterProps) {
  const initials =
    (name || "U")
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="mt-auto px-4 pt-5 pb-6 border-t border-[hsl(25_18%_75%_/_0.35)] flex-shrink-0">
      {/* User summary */}
      <div className="flex items-center gap-3 p-2.5 mb-3 rounded-[14px] bg-[hsl(0_0%_100%_/_0.6)] border border-[hsl(25_18%_75%_/_0.3)] min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[0.68rem] font-bold flex-shrink-0 font-[family-name:var(--font-display)]"
          style={{ background: avatarGradient }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.8rem] font-semibold text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">
            {name || "User"}
          </p>
          {email && (
            <p className="text-[0.64rem] text-[var(--col-dim)] truncate font-[family-name:var(--font-mono)]">{email}</p>
          )}
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[0.58rem] font-medium bg-[var(--accent)] text-white">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Dashboard */}
      <Link
        href={dashboardHref}
        onClick={onNavigate}
        className="w-full h-11 mb-2 rounded-xl bg-[var(--col-primary)] text-[var(--bg)] text-[0.82rem] font-semibold flex items-center justify-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all font-[family-name:var(--font-display)]"
      >
        <LayoutDashboard className="w-4 h-4" /> Dashboard
      </Link>

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full h-11 rounded-xl bg-[var(--danger-bg)] text-[var(--danger)] text-[0.82rem] font-semibold flex items-center justify-center gap-2 hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer font-[family-name:var(--font-display)]"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
}
