"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { useState, useEffect } from "react";
import type { UserType } from "@/types";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { ROLE_HOME } from "@/constants/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userType, setUserType] = useState<UserType>("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialized && authUser && accessToken) {
      const uiRole = backendRoleToUiRole(authUser);
      router.replace(ROLE_HOME[uiRole] || "/student");
    }
  }, [initialized, authUser, accessToken, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await useAuthStore.getState().register({
        fullName: String(form.get("fullName") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        userType,
      });
      setShowSuccess(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Blob background */}
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-6 left-6 md:left-12 flex items-center gap-[7px] z-[201]"
      >
        <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0 shadow-[0_1px_4px_var(--shadow-lg)]" />
        <div className="text-[1.1rem] leading-none">
          <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">
            PU
          </span>
          <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">
            verse
          </span>
        </div>
      </Link>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto px-6 md:px-12 py-20">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Get started
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
          Register
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
        <p className="text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] mb-8 font-[family-name:var(--font-ui)]">
          Create your PUVerse account to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Full Name
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className="w-full flex items-center bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] pr-[5px] py-[5px] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]">
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue="New Student"
                required
                className="flex-1 h-10 px-4 text-[0.85rem] bg-transparent text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none"
              />
              <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--col-secondary)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Squircle>
            </Squircle>
          </div>

          {error && <p className="text-[0.78rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Email
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className="w-full flex items-center bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] pr-[5px] py-[5px] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]">
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="new@pu.ac.in"
                required
                className="flex-1 h-10 px-4 text-[0.85rem] bg-transparent text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none"
              />
              <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--col-secondary)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </Squircle>
            </Squircle>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              Password
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className="w-full flex items-center bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] pr-[5px] py-[5px] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]">
              <input
                id="password"
                name="password"
                type="password"
                defaultValue="demo1234"
                minLength={8}
                required
                className="flex-1 h-10 px-4 text-[0.85rem] bg-transparent text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none"
              />
              <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--col-secondary)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </Squircle>
            </Squircle>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="userType" className="block text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">User Type</label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className="w-full bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)]">
              <select id="userType" name="userType" value={userType} onChange={(e) => setUserType(e.target.value as UserType)} className="w-full h-11 px-4 text-[0.85rem] bg-transparent text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none appearance-none cursor-pointer" style={{ borderRadius: "inherit" }}>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
              </select>
            </Squircle>
          </div>

          {/* Submit button */}
          <Squircle
            cornerRadius={22}
            cornerSmoothing={1}
            className="group w-full inline-flex items-center justify-between text-[0.92rem] font-medium tracking-[0.04em] pl-7 pr-[6px] py-[6px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
            style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
            asChild
          >
            <button type="submit">
              {loading ? "Creating account..." : "Create Account"}
              <Squircle
                cornerRadius={18}
                cornerSmoothing={1}
                className="w-[46px] h-[46px] border border-white/70 flex items-center justify-center flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Squircle>
            </button>
          </Squircle>
        </form>

        <p className="mt-6 text-center text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-dark)] font-medium transition-colors duration-200">
            Login
          </Link>
        </p>
      </div>

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in"
            onClick={() => setShowSuccess(false)}
          />
          <Squircle
            cornerRadius={20}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-sm p-8 animate-scale-in"
            style={{
              background: "hsl(0 0% 96% / 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 var(--glow)",
            }}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--positive-bg)] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[var(--positive)] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-[1.1rem] font-semibold text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
                Registration Successful
              </h2>
              <p className="text-[0.84rem] text-[var(--col-secondary)] mb-6 font-[family-name:var(--font-ui)]">
                Your account has been created. Please login to continue exploring PUVerse.
              </p>
              <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className="group w-full inline-flex items-center justify-center gap-[10px] text-[0.8rem] font-medium tracking-[0.04em] px-5 py-[11px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
                asChild
              >
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    router.push("/login");
                  }}
                >
                  Go to Login
                  <Squircle
                    cornerRadius={10}
                    cornerSmoothing={1}
                    className="w-[26px] h-[26px] border border-white/70 flex items-center justify-center flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Squircle>
                </button>
              </Squircle>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
