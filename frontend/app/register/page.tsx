"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Squircle } from "@squircle-js/react";
import { useState, useEffect } from "react";
import type { UserType } from "@/types";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { ROLE_HOME } from "@/constants/navigation";
import { ChevronDown, Eye, EyeOff, GraduationCap, User2 } from "lucide-react";

// ── shared input chrome ───────────────────────────────────────────────────────
const fieldShell =
  "w-full flex items-center bg-[hsl(0_0%_96%_/_0.55)] border border-[hsl(0_0%_85%_/_0.5)] pr-[5px] py-[5px] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_hsl(25_65%_45%_/_0.1)]";
const inputBase =
  "flex-1 min-w-0 h-10 px-4 text-[0.85rem] bg-transparent text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none";
const labelClass =
  "block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--col-secondary)] font-[family-name:var(--font-mono)]";
const MIN_PW = 8;

type StudentMode = "regular" | "fresher";

function PwField({
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
        {label} <span className="text-[var(--accent)]">*</span>
      </label>
      <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={MIN_PW}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
        />
        <Squircle
          cornerRadius={14}
          cornerSmoothing={1}
          className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex-shrink-0"
          asChild
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="flex items-center justify-center text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors cursor-pointer"
          >
            {visible
              ? <EyeOff className="w-[15px] h-[15px]" strokeWidth={1.6} />
              : <Eye className="w-[15px] h-[15px]" strokeWidth={1.6} />}
          </button>
        </Squircle>
      </Squircle>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);

  const [mode, setMode] = useState<StudentMode>("regular");
  const [userType, setUserType] = useState<UserType>("STUDENT");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (initialized && authUser && accessToken) {
      const uiRole = backendRoleToUiRole(authUser);
      router.replace(ROLE_HOME[uiRole] || "/student");
    }
  }, [initialized, authUser, accessToken, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PW) {
      setError(`Password must be at least ${MIN_PW} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const department = String(form.get("department") || "").trim() || undefined;

    const payload =
      mode === "regular"
        ? {
          fullName,
          email,
          password,
          userType,
          department,
          enrollmentNumber: String(form.get("enrollmentNumber") || "").trim(),
        }
        : {
          fullName,
          email,
          password,
          userType,
          department,
          ugNumber: String(form.get("ugNumber") || "").trim(),
        };

    setLoading(true);
    try {
      await useAuthStore.getState().register(payload);
      setShowSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center w-full max-w-full overflow-x-hidden">
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
        <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0" />
        <div className="text-[1.1rem] leading-none">
          <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">PU</span>
          <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-[480px] mx-auto px-6 md:px-12 py-20">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Get started
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] mb-2 font-[family-name:var(--font-display)]">
          Register
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] mb-6 font-[family-name:var(--font-ui)]">
          Create your PUVerse account to explore events, clubs and communities.
        </p>

        {/* ── Segmented switcher ─────────────────────────────────────────── */}
        <div
          className="flex gap-1 p-1 rounded-[18px] mb-7"
          style={{
            background: "hsl(0 0% 96% / 0.55)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
          }}
          role="tablist"
          aria-label="Student type"
        >
          {(
            [
              { id: "regular", label: "Regular Student", Icon: GraduationCap },
              { id: "fresher", label: "1st Year Fresher", Icon: User2 },
            ] as { id: StudentMode; label: string; Icon: React.ElementType }[]
          ).map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => { setMode(id); setError(""); }}
                className="flex-1 flex items-center justify-center gap-2 text-[0.78rem] font-semibold py-2.5 rounded-[14px] transition-all duration-200 cursor-pointer font-[family-name:var(--font-ui)]"
                style={
                  active
                    ? { background: "var(--col-primary)", color: "var(--bg)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.18)" }
                    : { background: "transparent", color: "var(--col-secondary)" }
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Mode description pill ──────────────────────────────────────── */}
        <div
          className="mb-6 px-3.5 py-2.5 rounded-[12px] text-[0.76rem] leading-[1.6] font-[family-name:var(--font-ui)]"
          style={{
            background: mode === "regular"
              ? "hsl(25 65% 45% / 0.08)"
              : "hsl(220 60% 55% / 0.08)",
            border: mode === "regular"
              ? "1px solid hsl(25 65% 45% / 0.2)"
              : "1px solid hsl(220 60% 55% / 0.2)",
            color: "var(--col-secondary)",
          }}
        >
          {mode === "regular"
            ? <>
              Use your <strong className="text-[var(--col-primary)]">Enrollment Number</strong> and{" "}
              <strong className="text-[var(--col-primary)]">@paruluniversity.ac.in</strong> email.
            </>
            : <>
              Use your <strong className="text-[var(--col-primary)]">UG Number</strong> (e.g. UG20261042) and{" "}
              <strong className="text-[var(--col-primary)]">personal email</strong>.
              You can link your official email later.
            </>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className={labelClass}>
              Full Name <span className="text-[var(--accent)]">*</span>
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="User full name"
                autoComplete="name"
                required
                className={inputBase}
              />
              <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--col-secondary)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </Squircle>
            </Squircle>
          </div>

          {/* ── Dynamic identifier field ───────────────────────────────── */}
          {mode === "regular" ? (
            <div className="space-y-1.5">
              <label htmlFor="enrollmentNumber" className={labelClass}>
                Enrollment Number <span className="text-[var(--accent)]">*</span>
              </label>
              <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
                <input
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  type="text"
                  placeholder="e.g. 21010112001"
                  autoComplete="off"
                  required
                  pattern="\d{10,}"
                  title="Must be at least 10 digits"
                  className={inputBase}
                />
                <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-[14px] h-[14px] text-[var(--col-secondary)]" strokeWidth={1.5} />
                </Squircle>
              </Squircle>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="ugNumber" className={labelClass}>
                UG Number <span className="text-[var(--accent)]">*</span>
              </label>
              <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
                <input
                  id="ugNumber"
                  name="ugNumber"
                  type="text"
                  placeholder="e.g. 26UG123456"
                  autoComplete="off"
                  required
                  pattern="^UG\d{7,}$"
                  title="Must start with UG followed by at least 7 digits"
                  className={inputBase}
                />
                <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                  <User2 className="w-[14px] h-[14px] text-[var(--col-secondary)]" strokeWidth={1.5} />
                </Squircle>
              </Squircle>
            </div>
          )}

          {/* ── Dynamic email field ────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label htmlFor="email" className={labelClass}>
              {mode === "regular" ? "University Email" : "Personal Email"}{" "}
              <span className="text-[var(--accent)]">*</span>
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={
                  mode === "regular"
                    ? "student@paruluniversity.ac.in"
                    : "student@gmail.com"
                }
                autoComplete="email"
                required
                className={inputBase}
              />
              <Squircle cornerRadius={14} cornerSmoothing={1} className="w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-[var(--col-secondary)] fill-none stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </Squircle>
            </Squircle>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label htmlFor="department" className={labelClass}>
              Department / Stream <span className="text-[0.58rem] text-[var(--col-dim)] normal-case">(optional)</span>
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className={fieldShell}>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                autoComplete="off"
                className={inputBase}
              />
            </Squircle>
          </div>

          {/* User Type */}
          <div className="space-y-1.5">
            <label htmlFor="userType" className={labelClass}>
              Account Type <span className="text-[var(--accent)]">*</span>
            </label>
            <Squircle cornerRadius={18} cornerSmoothing={1} className={`relative ${fieldShell}`}>
              <select
                id="userType"
                name="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                required
                className={`${inputBase} pr-12 appearance-none cursor-pointer`}
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
              </select>
              <Squircle cornerRadius={14} cornerSmoothing={1} className="pointer-events-none absolute right-[5px] top-1/2 -translate-y-1/2 w-[38px] h-[38px] border border-[var(--col-primary)]/20 flex items-center justify-center">
                <ChevronDown className="w-[15px] h-[15px] text-[var(--col-secondary)]" strokeWidth={1.6} />
              </Squircle>
            </Squircle>
          </div>

          {/* Password + Confirm */}
          <PwField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />
          <PwField
            id="confirmPassword"
            label="Confirm Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />

          {error && (
            <p role="alert" className="text-[0.78rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">
              {error}
            </p>
          )}

          {/* Submit */}
          <Squircle
            cornerRadius={22}
            cornerSmoothing={1}
            className="group w-full inline-flex items-center justify-between text-[0.92rem] font-medium tracking-[0.04em] pl-7 pr-[6px] py-[6px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
            style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
            asChild
          >
            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
              <Squircle cornerRadius={18} cornerSmoothing={1} className="w-[46px] h-[46px] border border-white/70 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
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

      {/* ── Success modal ─────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          />
          <Squircle
            cornerRadius={20}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-sm p-8"
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
                {mode === "fresher"
                  ? "Your account is ready! You can link your official university email anytime from your profile."
                  : "Your account has been created. Please login to continue exploring PUVerse."}
              </p>
              <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className="group w-full inline-flex items-center justify-center gap-[10px] text-[0.8rem] font-medium tracking-[0.04em] px-5 py-[11px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
                asChild
              >
                <button onClick={() => { setShowSuccess(false); router.push("/login"); }}>
                  Go to Login
                  <Squircle cornerRadius={10} cornerSmoothing={1} className="w-[26px] h-[26px] border border-white/70 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] stroke-current fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
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