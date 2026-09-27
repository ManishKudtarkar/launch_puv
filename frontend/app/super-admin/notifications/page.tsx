"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import { NOTIFICATIONS } from "@/constants/mock-data";
import {
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ChevronDown,
} from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
}

const SENT_BROADCASTS: Broadcast[] = [
  {
    id: "b1",
    title: "Platform Maintenance Notice",
    message: "PUVerse will be under maintenance on Aug 10, 2026 from 2:00 AM to 5:00 AM IST.",
    audience: "All Users",
    sentAt: "2026-07-20T10:00:00",
  },
  {
    id: "b2",
    title: "New Feature: Certificate Downloads",
    message: "Students can now download certificates directly from the Certificates page.",
    audience: "Students",
    sentAt: "2026-07-15T14:30:00",
  },
  {
    id: "b3",
    title: "Event Submission Deadline",
    message: "All events for August must be submitted for approval by July 30.",
    audience: "Admins",
    sentAt: "2026-07-18T09:00:00",
  },
];

const typeIcon = { success: CheckCircle2, warning: AlertCircle, info: Info } as const;
const typeColor = { success: "var(--positive)", warning: "var(--warning)", info: "var(--info)" } as const;

export default function SuperAdminNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState(SENT_BROADCASTS);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", audience: "all" });
  const [sent, setSent] = useState(false);

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });

  const handleSend = () => {
    setBroadcasts([
      {
        id: `b-${Date.now()}`,
        title: form.title || "Untitled Broadcast",
        message: form.message || "No message provided.",
        audience: form.audience === "all" ? "All Users" : form.audience === "students" ? "Students" : form.audience === "admins" ? "Admins" : "Super Admins",
        sentAt: new Date().toISOString(),
      },
      ...broadcasts,
    ]);
    setForm({ title: "", message: "", audience: "all" });
    setShowCompose(false);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Notifications
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Send broadcasts and manage platform alerts.
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center gap-2 px-5 py-[10px] text-[0.78rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
          style={{
            borderRadius: "14px",
            background: "var(--col-primary)",
            boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)",
          }}
        >
          <Send className="w-[13px] h-[13px]" strokeWidth={1.5} />
          Compose Broadcast
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sent Broadcasts */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            Sent Broadcasts
          </h2>
          <div className="space-y-4">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="pb-4"
                style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "hsl(0 0% 100% / 0.5)" }}
                  >
                    <Send className="w-[12px] h-[12px] text-[var(--col-dim)]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      {b.title}
                    </p>
                    <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-1 leading-relaxed">
                      {b.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Squircle
                        cornerRadius={6}
                        cornerSmoothing={1}
                        className="px-2 py-[2px] text-[0.54rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] text-[var(--col-dim)]"
                        style={{ background: "hsl(0 0% 90% / 0.5)" }}
                      >
                        {b.audience}
                      </Squircle>
                      <span className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                        {fmtDate(b.sentAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Squircle>

        {/* System Notifications */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-5">
            System Notifications
          </h2>
          <div className="space-y-3.5">
            {NOTIFICATIONS.map((n) => {
              const Icon = typeIcon[n.type as keyof typeof typeIcon] || Info;
              const color = typeColor[n.type as keyof typeof typeColor] || "var(--info)";
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 pb-3.5"
                  style={{ borderBottom: "1px solid hsl(0 0% 88% / 0.3)" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15` }}
                  >
                    <Icon className="w-[12px] h-[12px]" style={{ color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.8rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                        {n.title}
                      </p>
                      {!n.read && (
                        <div className="w-[6px] h-[6px] rounded-full bg-[var(--accent)] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5">
                      {fmtDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Squircle>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setShowCompose(false)} />
          <Squircle
            cornerRadius={24}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-md p-7 animate-scale-in"
            style={{
              background: "hsl(0 0% 96% / 0.9)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                Compose Broadcast
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer"
              >
                <X className="w-[14px] h-[14px]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none transition-all duration-200"
                  style={{
                    borderRadius: "12px",
                    background: "hsl(0 0% 100% / 0.5)",
                    border: "1px solid hsl(0 0% 85% / 0.4)",
                  }}
                />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="Write your broadcast message..."
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none transition-all duration-200 resize-none"
                  style={{
                    borderRadius: "12px",
                    background: "hsl(0 0% 100% / 0.5)",
                    border: "1px solid hsl(0 0% 85% / 0.4)",
                  }}
                />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">
                  Target Audience
                </label>
                <div className="relative">
                  <select
                    value={form.audience}
                    onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                    className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer"
                    style={{
                      borderRadius: "12px",
                      background: "hsl(0 0% 100% / 0.5)",
                      border: "1px solid hsl(0 0% 85% / 0.4)",
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students</option>
                    <option value="admins">Admins</option>
                    <option value="super_admins">Super Admins</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSend}
                className="flex-1 inline-flex items-center justify-center gap-2 py-[11px] text-[0.8rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
                style={{
                  borderRadius: "14px",
                  background: "var(--col-primary)",
                  boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)",
                }}
              >
                <Send className="w-[13px] h-[13px]" strokeWidth={1.5} />
                Send Broadcast
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              >
                Cancel
              </button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Success toast */}
      {sent && (
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
          <span className="text-[0.8rem] font-medium font-[family-name:var(--font-display)]">Broadcast sent successfully</span>
        </div>
      )}
    </div>
  );
}
