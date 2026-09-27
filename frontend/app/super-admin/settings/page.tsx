"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import {
  Save,
  Trash2,
  Download,
  CheckCircle2,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState({
    requireApproval: true,
    allowSelfRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    maxEventsPerOrg: "10",
    defaultCapacity: "100",
    platformName: "PUVerse",
    supportEmail: "support@pu.ac.in",
    timezone: "Asia/Kolkata",
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) =>
    setSettings((s) => ({ ...s, [key]: !s[key as keyof typeof s] }));

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const inputStyle = {
    borderRadius: "12px",
    background: "hsl(0 0% 100% / 0.5)",
    border: "1px solid hsl(0 0% 85% / 0.4)",
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="relative w-10 h-[22px] flex-shrink-0 transition-colors duration-200 cursor-pointer"
        style={{
          borderRadius: "11px",
          background: enabled ? "var(--col-primary)" : "hsl(0 0% 82%)",
        }}
      >
        <div
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
          style={{ left: enabled ? "20px" : "3px" }}
        />
      </button>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Settings
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Configure platform behavior and defaults.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Settings */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Event Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
              <div>
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Require Event Approval</p>
                <p className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-0.5">Events must be approved before publishing.</p>
              </div>
              <Toggle enabled={settings.requireApproval as boolean} onToggle={() => toggle("requireApproval")} />
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
              <div>
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Allow Self-Registration</p>
                <p className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-0.5">Students can register without approval.</p>
              </div>
              <Toggle enabled={settings.allowSelfRegistration as boolean} onToggle={() => toggle("allowSelfRegistration")} />
            </div>
            <div className="pt-2 space-y-3">
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                  Max Events Per Organization
                </label>
                <input
                  type="number"
                  value={settings.maxEventsPerOrg}
                  onChange={(e) => setSettings((s) => ({ ...s, maxEventsPerOrg: e.target.value }))}
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                  Default Event Capacity
                </label>
                <input
                  type="number"
                  value={settings.defaultCapacity}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultCapacity: e.target.value }))}
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </Squircle>

        {/* Notification Settings */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Notification Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
              <div>
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Email Notifications</p>
                <p className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-0.5">Send email for event updates and registrations.</p>
              </div>
              <Toggle enabled={settings.emailNotifications as boolean} onToggle={() => toggle("emailNotifications")} />
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
              <div>
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Maintenance Mode</p>
                <p className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-0.5">Show maintenance page to all non-super-admin users.</p>
              </div>
              <Toggle enabled={settings.maintenanceMode as boolean} onToggle={() => toggle("maintenanceMode")} />
            </div>
          </div>
        </Squircle>

        {/* General */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            General
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
                className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer"
                style={inputStyle}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </Squircle>

        {/* Actions */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
              style={{
                borderRadius: "14px",
                background: "var(--col-primary)",
                boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)",
              }}
            >
              <Save className="w-[13px] h-[13px]" strokeWidth={1.5} />
              Save All Settings
            </button>
            <button
              onClick={() => alert("Cache cleared (demo)")}
              className="w-full inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] cursor-pointer font-[family-name:var(--font-display)]"
              style={{
                borderRadius: "14px",
                background: "hsl(0 0% 100% / 0.5)",
                border: "1px solid hsl(0 0% 85% / 0.4)",
              }}
            >
              <Trash2 className="w-[13px] h-[13px]" strokeWidth={1.5} />
              Clear Platform Cache
            </button>
            <button
              onClick={() => alert("Export started (demo)")}
              className="w-full inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] cursor-pointer font-[family-name:var(--font-display)]"
              style={{
                borderRadius: "14px",
                background: "hsl(0 0% 100% / 0.5)",
                border: "1px solid hsl(0 0% 85% / 0.4)",
              }}
            >
              <Download className="w-[13px] h-[13px]" strokeWidth={1.5} />
              Export Platform Data
            </button>
          </div>
        </Squircle>
      </div>

      {/* Saved toast */}
      {saved && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 animate-scale-in"
          style={{
            borderRadius: "14px",
            background: "hsl(142 50% 40%)",
            color: "white",
            boxShadow: "0 4px 20px hsl(142 50% 30% / 0.3)",
          }}
        >
          <CheckCircle2 className="w-[15px] h-[15px]" strokeWidth={1.5} />
          <span className="text-[0.8rem] font-medium font-[family-name:var(--font-display)]">Settings saved successfully</span>
        </div>
      )}
    </div>
  );
}
