"use client";

import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import { useState } from "react";
import { Mail, Building2, GraduationCap, Calendar, Shield, KeyRound, Ticket, Award, ClipboardList, X } from "lucide-react";

export default function StudentProfilePage() {
  const user = useDemoStore((s) => s.user);
  const registrations = useDemoStore((s) => s.registrations);
  const tickets = useDemoStore((s) => s.tickets);
  const certificates = useDemoStore((s) => s.certificates);
  const [showSave, setShowSave] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const activeRegs = registrations.filter((r) => r.status !== "cancelled").length;
  const activeTickets = tickets.filter((t) => t.status === "active").length;

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSave(true);
  };

  const stats = [
    { label: "Registrations", value: activeRegs, icon: ClipboardList },
    { label: "Tickets", value: activeTickets, icon: Ticket },
    { label: "Certificates", value: certificates.length, icon: Award },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Profile
        </p>
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          My Profile
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
      </div>

      {/* Hero profile card */}
      <Squircle
        cornerRadius={28}
        cornerSmoothing={1}
        className="relative overflow-hidden mb-6"
        style={{
          background: "linear-gradient(135deg, var(--col-primary) 0%, hsl(0 0% 18%) 50%, hsl(25 30% 22%) 100%)",
          boxShadow: "0 8px 40px hsl(0 0% 10% / 0.3)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full" style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }} />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ border: "1px solid hsl(0 0% 100% / 0.04)" }} />
        <div className="absolute bottom-0 left-[30%] w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, hsl(25 65% 45% / 0.15) 0%, transparent 70%)" }} />

        <div className="relative p-8">
          <div className="flex items-center gap-6">
            {/* Large avatar */}
            <Squircle
              cornerRadius={24}
              cornerSmoothing={1}
              className="w-[90px] h-[90px] flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(145deg, var(--accent), hsl(25 75% 35%))",
                boxShadow: "0 6px 24px hsl(25 65% 45% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
              }}
            >
              <span className="text-[1.8rem] font-bold text-white font-[family-name:var(--font-display)] tracking-[-0.02em]">
                {initials}
              </span>
            </Squircle>

            {/* Name + meta */}
            <div className="min-w-0">
              <h2 className="text-[1.5rem] font-bold text-white font-[family-name:var(--font-display)] tracking-[-0.02em] leading-tight">
                {user?.name}
              </h2>
              <p className="text-[0.78rem] text-white/50 font-[family-name:var(--font-ui)] mt-1 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                {user?.email}
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                <span
                  className="text-[0.58rem] uppercase tracking-[0.12em] font-medium font-[family-name:var(--font-mono)] px-3 py-1"
                  style={{
                    borderRadius: "20px",
                    background: "hsl(25 65% 45% / 0.2)",
                    color: "hsl(25 65% 70%)",
                    border: "1px solid hsl(25 65% 45% / 0.25)",
                  }}
                >
                  Student
                </span>
                {user?.department && (
                  <span className="text-[0.68rem] text-white/40 font-[family-name:var(--font-mono)] flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {user.department}
                  </span>
                )}
                {user?.year && (
                  <span className="text-[0.68rem] text-white/40 font-[family-name:var(--font-mono)] flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {user.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 p-3"
                style={{
                  borderRadius: "16px",
                  background: "hsl(0 0% 100% / 0.06)",
                  border: "1px solid hsl(0 0% 100% / 0.06)",
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(25 65% 45% / 0.15)" }}>
                  <s.icon className="w-4 h-4 text-[hsl(25,65%,65%)]" />
                </div>
                <div>
                  <p className="text-[1.15rem] font-semibold text-white font-[family-name:var(--font-mono)] leading-none tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-[0.58rem] text-white/40 font-[family-name:var(--font-mono)] uppercase tracking-[0.08em] mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Squircle>

      {/* Two-column layout for details */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Personal info form */}
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="p-6"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
          }}
        >
          <h3 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-5">
            Personal Information
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            {[
              { label: "Full Name", id: "name", value: user?.name, icon: null, disabled: false },
              { label: "Email", id: "email", value: user?.email, icon: Mail, disabled: true },
              { label: "Department", id: "dept", value: user?.department ?? "CSE", icon: Building2, disabled: false },
              { label: "Year", id: "year", value: user?.year ?? "3rd Year", icon: GraduationCap, disabled: false },
              { label: "Organization", id: "org", value: user?.organization ?? "", icon: Calendar, disabled: false },
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-[0.68rem] font-medium text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em] mb-1.5">
                  {field.label}
                </label>
                <Squircle
                  cornerRadius={14}
                  cornerSmoothing={1}
                  className={`flex items-center gap-2.5 px-4 py-3 ${field.disabled ? "opacity-50" : ""}`}
                  style={{
                    background: "hsl(0 0% 100% / 0.55)",
                    border: "1px solid hsl(0 0% 85% / 0.4)",
                    boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.7)",
                  }}
                >
                  {field.icon && <field.icon className="w-3.5 h-3.5 text-[var(--col-dim)] flex-shrink-0" />}
                  <input
                    type={field.id === "email" ? "email" : "text"}
                    defaultValue={field.value}
                    disabled={field.disabled}
                    className="flex-1 bg-transparent text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none placeholder:text-[var(--col-dim)] disabled:cursor-not-allowed"
                  />
                </Squircle>
              </div>
            ))}

            <button type="submit" className="group w-full mt-2">
              <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className="w-full inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.02em] pl-5 pr-[5px] py-[5px] transition-all duration-300 font-[family-name:var(--font-display)]"
                style={{ background: "var(--col-primary)", color: "var(--bg)" }}
              >
                Save Changes
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] stroke-white fill-none stroke-2 transition-transform duration-300 -rotate-45 group-hover:rotate-0" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Squircle>
            </button>
          </form>
        </Squircle>

        {/* Right column — security + account */}
        <div className="space-y-5">
          {/* Security card */}
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="p-6"
            style={{
              background: "hsl(0 0% 96% / 0.42)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(25 65% 45% / 0.1)" }}>
                <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>
              <h3 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                Security
              </h3>
            </div>

            {/* Password */}
            <div className="mb-5">
              <p className="text-[0.68rem] font-medium text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em] mb-2">
                Password
              </p>
              <Squircle
                cornerRadius={14}
                cornerSmoothing={1}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: "hsl(0 0% 100% / 0.45)",
                  border: "1px solid hsl(0 0% 85% / 0.35)",
                }}
              >
                <span className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-mono)] tracking-[0.15em]">
                  ••••••••
                </span>
                <button
                  onClick={() => setShowPassword(true)}
                  className="text-[0.7rem] font-medium text-[var(--accent)] font-[family-name:var(--font-ui)] hover:underline"
                >
                  Change
                </button>
              </Squircle>
            </div>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: "linear-gradient(90deg, hsl(0 0% 85% / 0.4), transparent)" }} />

            {/* Role info */}
            <div>
              <p className="text-[0.68rem] font-medium text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em] mb-2">
                Account Role
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="text-[0.62rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] px-3 py-1.5"
                  style={{
                    borderRadius: "20px",
                    background: "hsl(25 65% 45% / 0.1)",
                    color: "var(--accent)",
                    border: "1px solid hsl(25 65% 45% / 0.15)",
                  }}
                >
                  {user?.role?.replace("_", " ")}
                </span>
              </div>
            </div>
          </Squircle>

          {/* Quick links card */}
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="p-6"
            style={{
              background: "hsl(0 0% 96% / 0.42)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
            }}
          >
            <h3 className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-4">
              Account
            </h3>

            <div className="space-y-1.5">
              {[
                { label: "Email Preferences", desc: "Manage email notifications" },
                { label: "Privacy", desc: "Control profile visibility" },
                { label: "Help & Support", desc: "FAQs and contact support" },
              ].map((item) => (
                <Squircle
                  key={item.label}
                  cornerRadius={14}
                  cornerSmoothing={1}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-[hsl(0_0%_100%_/_0.5)]"
                  style={{ background: "hsl(0 0% 100% / 0.3)" }}
                >
                  <div>
                    <p className="text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-ui)]">
                      {item.label}
                    </p>
                    <p className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
                      {item.desc}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[var(--col-dim)] fill-none stroke-2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Squircle>
              ))}
            </div>
          </Squircle>
        </div>
      </div>

      {/* Save success modal */}
      {showSave && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "hsl(0 0% 0% / 0.3)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowSave(false)}
          />
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-[340px] p-6 mx-4 text-center"
            style={{
              background: "hsl(0 0% 96% / 0.85)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              boxShadow: "0 20px 60px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "hsl(142 50% 45% / 0.1)" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[hsl(142,50%,35%)] fill-none stroke-2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
              Profile Updated
            </h3>
            <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
              Your changes have been saved successfully.
            </p>
            <button
              onClick={() => setShowSave(false)}
              className="text-[0.78rem] font-medium py-2 px-6 text-[var(--col-secondary)] font-[family-name:var(--font-ui)] transition-colors duration-200 hover:text-[var(--col-primary)]"
              style={{
                borderRadius: "14px",
                background: "hsl(0 0% 100% / 0.5)",
                border: "1px solid hsl(0 0% 85% / 0.4)",
              }}
            >
              Done
            </button>
          </Squircle>
        </div>
      )}

      {/* Change password modal */}
      {showPassword && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "hsl(0 0% 0% / 0.3)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowPassword(false)}
          />
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-[380px] p-6 mx-4"
            style={{
              background: "hsl(0 0% 96% / 0.85)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              boxShadow: "0 20px 60px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(25 65% 45% / 0.1)" }}>
                  <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  Change Password
                </h3>
              </div>
              <button
                onClick={() => setShowPassword(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors"
                style={{ background: "hsl(0 0% 0% / 0.04)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Current Password", id: "current" },
                { label: "New Password", id: "new" },
                { label: "Confirm Password", id: "confirm" },
              ].map((field) => (
                <div key={field.id}>
                  <label className="block text-[0.65rem] font-medium text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em] mb-1">
                    {field.label}
                  </label>
                  <Squircle
                    cornerRadius={12}
                    cornerSmoothing={1}
                    className="px-4 py-2.5"
                    style={{
                      background: "hsl(0 0% 100% / 0.55)",
                      border: "1px solid hsl(0 0% 85% / 0.4)",
                    }}
                  >
                    <input
                      type="password"
                      className="w-full bg-transparent text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none"
                    />
                  </Squircle>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowPassword(false)}
                className="flex-1 text-[0.8rem] font-medium py-2.5 text-[var(--col-secondary)] font-[family-name:var(--font-ui)] transition-colors duration-200 hover:text-[var(--col-primary)]"
                style={{
                  borderRadius: "14px",
                  background: "hsl(0 0% 100% / 0.5)",
                  border: "1px solid hsl(0 0% 85% / 0.4)",
                }}
              >
                Cancel
              </button>
              <Squircle
                cornerRadius={14}
                cornerSmoothing={1}
                className="flex-1 text-[0.8rem] font-medium py-2.5 text-center transition-all duration-200 cursor-pointer hover:opacity-90 font-[family-name:var(--font-ui)]"
                style={{ background: "var(--col-primary)", color: "var(--bg)" }}
                onClick={() => {
                  setShowPassword(false);
                  alert("Password updated (demo)");
                }}
              >
                Update Password
              </Squircle>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
