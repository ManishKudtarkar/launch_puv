"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import {
  Save,
  Trash2,
  Download,
  Database,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const AUDIT_LOG = [
  { action: "User role changed", user: "Dr. Rajesh Kumar", target: "Sneha Reddy → Admin", time: "2 hours ago" },
  { action: "Event approved", user: "System Administrator", target: "Photography Workshop", time: "5 hours ago" },
  { action: "Organization created", user: "Dr. Rajesh Kumar", target: "AI Research Lab", time: "1 day ago" },
  { action: "Settings updated", user: "System Administrator", target: "Email notifications enabled", time: "2 days ago" },
  { action: "User created", user: "System Administrator", target: "Neha Patel (Student)", time: "3 days ago" },
];

export default function PlatformAdminSettingsPage() {
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    requireApproval: true,
    allowSelfRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    auditLogging: true,
    twoFactorRequired: false,
    maxEventsPerOrg: "10",
    maxFileUploadMB: "25",
    sessionTimeoutMin: "60",
    backupFrequency: "daily",
    platformName: "PUVerse",
    supportEmail: "support@pu.ac.in",
  });

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: !s[key as keyof typeof s] }));

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };
  const inputStyle = { borderRadius: "12px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="relative w-10 h-[22px] flex-shrink-0 transition-colors duration-200 cursor-pointer"
        style={{ borderRadius: "11px", background: enabled ? "var(--col-primary)" : "hsl(0 0% 82%)" }}>
        <div className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm" style={{ left: enabled ? "20px" : "3px" }} />
      </button>
    );
  }

  function SettingRow({ label, desc, settingKey }: { label: string; desc: string; settingKey: string }) {
    return (
      <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
        <div>
          <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">{label}</p>
          <p className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-0.5">{desc}</p>
        </div>
        <Toggle enabled={settings[settingKey as keyof typeof settings] as boolean} onToggle={() => toggle(settingKey)} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            System Settings
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Platform-wide configuration and system administration.
          </p>
        </div>
        <button onClick={() => setShowCreateAdmin(true)}
          className="inline-flex items-center gap-2 px-5 py-[10px] text-[0.78rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
          style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>
          <Plus className="w-[13px] h-[13px]" strokeWidth={1.5} />Create Super Admin
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event & Registration */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">Event & Registration</h2>
          <div className="space-y-4">
            <SettingRow label="Require Event Approval" desc="Events must be approved before publishing." settingKey="requireApproval" />
            <SettingRow label="Allow Self-Registration" desc="Students can register without admin approval." settingKey="allowSelfRegistration" />
            <div className="pt-2">
              <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Max Events Per Org</label>
              <input type="number" value={settings.maxEventsPerOrg} onChange={(e) => setSettings((s) => ({ ...s, maxEventsPerOrg: e.target.value }))}
                className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} />
            </div>
          </div>
        </Squircle>

        {/* Security */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">Security</h2>
          <div className="space-y-4">
            <SettingRow label="Two-Factor Authentication" desc="Require 2FA for admin accounts." settingKey="twoFactorRequired" />
            <SettingRow label="Audit Logging" desc="Log all administrative actions." settingKey="auditLogging" />
            <div className="pt-2">
              <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Session Timeout (min)</label>
              <input type="number" value={settings.sessionTimeoutMin} onChange={(e) => setSettings((s) => ({ ...s, sessionTimeoutMin: e.target.value }))}
                className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} />
            </div>
          </div>
        </Squircle>

        {/* Platform */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">Platform</h2>
          <div className="space-y-4">
            <SettingRow label="Maintenance Mode" desc="Show maintenance page to non-admin users." settingKey="maintenanceMode" />
            <SettingRow label="Email Notifications" desc="Send system-wide email notifications." settingKey="emailNotifications" />
            <div className="pt-2 space-y-3">
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Platform Name</label>
                <input type="text" value={settings.platformName} onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Support Email</label>
                <input type="email" value={settings.supportEmail} onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Backup Frequency</label>
                <div className="relative">
                  <select value={settings.backupFrequency} onChange={(e) => setSettings((s) => ({ ...s, backupFrequency: e.target.value }))}
                    className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                    <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Max File Upload (MB)</label>
                <input type="number" value={settings.maxFileUploadMB} onChange={(e) => setSettings((s) => ({ ...s, maxFileUploadMB: e.target.value }))}
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} />
              </div>
            </div>
          </div>
        </Squircle>

        {/* Audit Log */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">Recent Audit Log</h2>
          <div className="space-y-3.5">
            {AUDIT_LOG.map((entry, i) => (
              <div key={i} className="pb-3.5" style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}>
                <p className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">{entry.action}</p>
                <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-0.5">{entry.target}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">By: {entry.user}</span>
                  <span className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{entry.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Squircle>

        {/* Actions */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6 lg:col-span-2" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">System Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
              style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>
              <Save className="w-[13px] h-[13px]" strokeWidth={1.5} />Save All Settings</button>
            <button onClick={() => alert("Cache cleared (demo)")}
              className="inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] transition-all hover:bg-[hsl(0_0%_92%)] cursor-pointer font-[family-name:var(--font-display)]"
              style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
              <Trash2 className="w-[13px] h-[13px]" strokeWidth={1.5} />Clear Cache</button>
            <button onClick={() => alert("Backup started (demo)")}
              className="inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] transition-all hover:bg-[hsl(0_0%_92%)] cursor-pointer font-[family-name:var(--font-display)]"
              style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
              <Database className="w-[13px] h-[13px]" strokeWidth={1.5} />Run Backup</button>
            <button onClick={() => alert("Export started (demo)")}
              className="inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] transition-all hover:bg-[hsl(0_0%_92%)] cursor-pointer font-[family-name:var(--font-display)]"
              style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
              <Download className="w-[13px] h-[13px]" strokeWidth={1.5} />Export Data</button>
          </div>
        </Squircle>
      </div>

      {/* Create admin modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateAdmin(false)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Create Super Admin</h3>
              <button onClick={() => setShowCreateAdmin(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Full Name</label>
                <input type="text" placeholder="e.g. Dr. New Admin" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Email</label>
                <input type="email" placeholder="admin@pu.ac.in" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Role</label>
                <div className="relative"><select className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                  <option value="super_admin">Super Admin</option><option value="platform_admin">Platform Admin</option>
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" /></div></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Temporary Password</label>
                <input type="password" placeholder="Minimum 8 characters" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { setShowCreateAdmin(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>Create Account</button>
              <button onClick={() => setShowCreateAdmin(false)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 animate-scale-in"
          style={{ borderRadius: "14px", background: "hsl(142 50% 40%)", color: "white", boxShadow: "0 4px 20px hsl(142 50% 30% / 0.3)" }}>
          <CheckCircle2 className="w-[15px] h-[15px]" strokeWidth={1.5} />
          <span className="text-[0.8rem] font-medium font-[family-name:var(--font-display)]">Saved successfully</span>
        </div>
      )}
    </div>
  );
}
