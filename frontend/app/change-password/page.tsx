"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.auth.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess("Password changed successfully. Please login again.");
      await logout();
      router.replace("/login");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Link href="/" className="fixed top-6 left-6 md:left-12 flex items-center gap-[7px] z-[201]">
        <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0 shadow-[0_1px_4px_var(--shadow-lg)]" />
        <div className="text-[1.1rem] leading-none">
          <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
          <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-[440px] mx-auto px-6 py-20">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Account Security
        </p>

        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
          Change Password
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>

        <p className="text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] mb-8 font-[family-name:var(--font-ui)]">
          {user?.email
            ? `Hello ${user.fullName || user.email}. Please set a new password to continue.`
            : "Please update your password to continue."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Current Password
            </label>
            <Squircle cornerRadius={12} cornerSmoothing={1} className="w-full">
              <input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-11 px-4 text-[0.85rem] bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]"
                style={{ borderRadius: "inherit" }}
              />
            </Squircle>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              New Password
            </label>
            <Squircle cornerRadius={12} cornerSmoothing={1} className="w-full">
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full h-11 px-4 text-[0.85rem] bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]"
                style={{ borderRadius: "inherit" }}
              />
            </Squircle>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Confirm New Password
            </label>
            <Squircle cornerRadius={12} cornerSmoothing={1} className="w-full">
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 px-4 text-[0.85rem] bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]"
                style={{ borderRadius: "inherit" }}
              />
            </Squircle>
          </div>

          {error && (
            <p className="text-[0.78rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>
          )}

          {success && (
            <p className="text-[0.78rem] text-[var(--success)] font-[family-name:var(--font-ui)]">{success}</p>
          )}

          <Squircle
            cornerRadius={18}
            cornerSmoothing={1}
            className="group w-full inline-flex items-center justify-center gap-[10px] text-[0.82rem] font-medium tracking-[0.04em] px-5 py-[12px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
            style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
            asChild
          >
            <button type="submit" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </Squircle>
        </form>

        <p className="mt-6 text-center text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-dark)] font-medium transition-colors duration-200">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
