"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center w-full max-w-full overflow-x-hidden">
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Link href="/" className="fixed top-6 left-6 md:left-12 flex items-center gap-[7px] z-[201]">
        <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0" />
        <div className="text-[1.1rem] leading-none">
          <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
          <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 py-20">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Password Reset
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
          Forgot Password
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>

        {sent ? (
          <div className="mt-6 p-5 rounded-2xl bg-[hsl(142_50%_45%_/_0.08)] border border-[hsl(142_50%_45%_/_0.2)]">
            <p className="text-[0.86rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] leading-relaxed">
              If an active account exists for this email, a password-reset link has been sent.
            </p>
            <Link href="/login" className="mt-4 inline-block text-[0.8rem] text-[var(--accent)] font-medium font-[family-name:var(--font-ui)]">
              Back to Login →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] mb-8 font-[family-name:var(--font-ui)]">
              Enter your university email and we&apos;ll send a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--col-secondary)] font-[family-name:var(--font-mono)]">
                  Email
                </label>
                <Squircle cornerRadius={12} cornerSmoothing={1} className="w-full">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@paruluniversity.ac.in"
                    className="w-full h-11 px-4 text-[0.85rem] bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:border-[var(--accent)]"
                    style={{ borderRadius: "inherit" }}
                  />
                </Squircle>
              </div>

              {error && <p className="text-[0.78rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}

              <Squircle
                cornerRadius={18}
                cornerSmoothing={1}
                className="group w-full inline-flex items-center justify-center gap-[10px] text-[0.82rem] font-medium tracking-[0.04em] px-5 py-[12px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
                asChild
              >
                <button type="submit">{loading ? "Sending..." : "Send Reset Link"}</button>
              </Squircle>
            </form>

            <p className="mt-6 text-center text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-dark)] font-medium transition-colors duration-200">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
