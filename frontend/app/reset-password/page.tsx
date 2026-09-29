"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api-client";

const MIN_PASSWORD_LENGTH = 8; // matches backend ResetPasswordDto @MinLength(8)
const TOKEN_PATTERN = /^[a-fA-F0-9]{64}$/;

const labelClass =
  "block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--col-secondary)] font-[family-name:var(--font-mono)]";
const inputClass =
  "w-full h-11 pl-4 pr-11 text-[0.85rem] bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:border-[var(--accent)]";

function PageShell({ children }: { children: React.ReactNode }) {
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
          Reset Password
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-[var(--accent)] font-bold">*</span>
      </label>
      <Squircle cornerRadius={12} cornerSmoothing={1} className="relative w-full">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          style={{ borderRadius: "inherit" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </Squircle>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Auto-redirect to login 2s after a successful reset.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => router.push("/login"), 2000);
    return () => clearTimeout(id);
  }, [done, router]);

  const linkIsValid = TOKEN_PATTERN.test(token) && email.length > 0;

  if (!linkIsValid) {
    return (
      <div
        role="alert"
        className="mt-6 p-5 rounded-2xl bg-[hsl(0_60%_50%_/_0.08)] border border-[hsl(0_60%_50%_/_0.2)]"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[0.86rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Invalid reset link
            </p>
            <p className="mt-1 text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-relaxed">
              This password reset link is missing information or is malformed. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="mt-3 inline-block text-[0.8rem] text-[var(--accent)] font-medium font-[family-name:var(--font-ui)]"
            >
              Request a new link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div
        role="status"
        className="mt-6 p-5 rounded-2xl bg-[hsl(142_50%_45%_/_0.08)] border border-[hsl(142_50%_45%_/_0.2)]"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[hsl(142_50%_38%)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[0.86rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              Password reset successful!
            </p>
            <p className="mt-1 text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              Redirecting to login...
            </p>
            <Link href="/login" className="mt-3 inline-block text-[0.8rem] text-[var(--accent)] font-medium font-[family-name:var(--font-ui)]">
              Go to Login now →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ token, email, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] mb-8 font-[family-name:var(--font-ui)] break-words">
        Choose a new password for <span className="font-semibold text-[var(--col-primary)]">{email}</span>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordField
          id="new-password"
          label="New Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter new password"
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm New Password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
          Use at least {MIN_PASSWORD_LENGTH} characters.
        </p>

        {error && (
          <p role="alert" className="text-[0.78rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">
            {error}
            {/invalid or expired/i.test(error) && (
              <>
                {" "}
                <Link href="/forgot-password" className="underline font-medium">
                  Request a new link
                </Link>
              </>
            )}
          </p>
        )}

        <Squircle
          cornerRadius={18}
          cornerSmoothing={1}
          className="group w-full inline-flex items-center justify-center gap-[10px] text-[0.82rem] font-medium tracking-[0.04em] px-5 py-[12px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
          style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
          asChild
        >
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </Squircle>
      </form>

      <p className="mt-6 text-center text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
        <Link href="/login" className="text-[var(--accent)] hover:text-[var(--accent-dark)] font-medium transition-colors duration-200">
          Back to Login
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <PageShell>
      <Suspense fallback={<p className="mt-6 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </PageShell>
  );
}
