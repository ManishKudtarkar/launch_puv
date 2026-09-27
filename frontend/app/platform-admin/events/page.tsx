"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import { useDemoStore } from "@/store/demo-store";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  Building2,
  User,
} from "lucide-react";

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  published: { bg: "hsl(142 50% 45% / 0.1)", text: "hsl(142 50% 35%)", label: "Published", dot: "var(--positive)" },
  pending_approval: { bg: "hsl(45 90% 50% / 0.1)", text: "hsl(45 80% 35%)", label: "Pending", dot: "var(--warning)" },
  completed: { bg: "hsl(0 0% 60% / 0.1)", text: "var(--col-dim)", label: "Completed", dot: "var(--col-dim)" },
  cancelled: { bg: "hsl(0 60% 50% / 0.1)", text: "hsl(0 60% 45%)", label: "Rejected", dot: "var(--danger)" },
  draft: { bg: "hsl(0 0% 85% / 0.3)", text: "var(--col-secondary)", label: "Draft", dot: "var(--col-secondary)" },
};

export default function PlatformAdminEventsPage() {
  const events = useDemoStore((s) => s.events);
  const approveEvent = useDemoStore((s) => s.approveEvent);
  const rejectEvent = useDemoStore((s) => s.rejectEvent);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "approve" | "reject" } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const pending = events.filter((e) => e.status === "pending_approval");
  const filtered = filter === "all" ? events : events.filter((e) => e.status === filter);

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "approve") approveEvent(confirmAction.id);
    else rejectEvent(confirmAction.id);
    setConfirmAction(null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });

  const filters = [
    { key: "all", label: "All" },
    { key: "pending_approval", label: "Pending" },
    { key: "published", label: "Published" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          All Events
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          View, approve, or reject all events across the platform.
        </p>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <Squircle cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-5 py-3.5 mb-6"
          style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.2)" }}>
          <div className="w-8 h-8 rounded-full border border-[var(--warning)] flex items-center justify-center">
            <ShieldCheck className="w-[14px] h-[14px] text-[var(--warning)]" strokeWidth={1.5} />
          </div>
          <p className="text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)]">
            <span className="font-semibold font-[family-name:var(--font-mono)]">{pending.length}</span> event{pending.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </Squircle>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-6">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-[7px] text-[0.72rem] font-medium transition-all duration-200 cursor-pointer font-[family-name:var(--font-ui)]"
            style={{
              borderRadius: "10px",
              ...(filter === f.key
                ? { background: "var(--col-primary)", color: "white" }
                : { background: "hsl(0 0% 100% / 0.4)", color: "var(--col-secondary)", border: "1px solid hsl(0 0% 85% / 0.3)" }),
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Pending section */}
      {filter === "all" && pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Pending Review</h2>
          <div className="space-y-4">
            {pending.map((event) => {
              const isExpanded = expanded === event.id;
              const initials = event.organization.split(" ").map((w) => w[0]).join("").slice(0, 2);
              return (
                <Squircle key={event.id} cornerRadius={24} cornerSmoothing={1} className="overflow-hidden transition-all duration-300"
                  style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.15)" }}>
                  <div className="flex items-center gap-4 p-5">
                    <Squircle cornerRadius={14} cornerSmoothing={1}
                      className="w-12 h-12 flex items-center justify-center text-white text-[0.55rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--warning), var(--accent))" }}>{initials}</Squircle>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.9rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[0.7rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{event.organization}</span>
                        <span className="text-[0.5rem] text-[var(--col-dim)]">&bull;</span>
                        <span className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{fmtDate(event.startDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setConfirmAction({ id: event.id, type: "approve" })}
                        className="inline-flex items-center gap-2 px-4 py-[9px] text-[0.76rem] font-medium transition-all hover:opacity-80 cursor-pointer font-[family-name:var(--font-display)]"
                        style={{ borderRadius: "14px", background: "hsl(142 50% 45% / 0.12)", color: "hsl(142 50% 30%)" }}>
                        <CheckCircle2 className="w-[13px] h-[13px]" strokeWidth={1.5} />Approve</button>
                      <button onClick={() => setConfirmAction({ id: event.id, type: "reject" })}
                        className="inline-flex items-center gap-2 px-4 py-[9px] text-[0.76rem] font-medium transition-all hover:opacity-80 cursor-pointer font-[family-name:var(--font-display)]"
                        style={{ borderRadius: "14px", background: "hsl(0 60% 50% / 0.08)", color: "hsl(0 60% 40%)" }}>
                        <XCircle className="w-[13px] h-[13px]" strokeWidth={1.5} />Reject</button>
                      <button onClick={() => setExpanded(isExpanded ? null : event.id)}
                        className="w-8 h-8 rounded-full border border-[hsl(0_0%_85%_/_0.4)] flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] transition-colors cursor-pointer ml-1">
                        {isExpanded ? <ChevronUp className="w-[13px] h-[13px]" strokeWidth={1.5} /> : <ChevronDown className="w-[13px] h-[13px]" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0" style={{ borderTop: "1px solid hsl(0 0% 88% / 0.3)" }}>
                      <div className="pt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-relaxed">{event.description}</p>
                          {event.aboutEvent && <p className="text-[0.78rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] leading-relaxed">{event.aboutEvent}</p>}
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { icon: MapPin, label: event.venue },
                            { icon: CalendarDays, label: `${fmtDate(event.startDate)} — ${fmtDate(event.endDate)}` },
                            { icon: Clock, label: `${fmtTime(event.startDate)} – ${fmtTime(event.endDate)}` },
                            { icon: Users, label: `Capacity: ${event.capacity}` },
                            { icon: Building2, label: event.organization },
                            { icon: User, label: `Organizer: ${event.organizer}` },
                          ].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                              <div key={idx} className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(0 0% 100% / 0.5)" }}>
                                  <Icon className="w-[12px] h-[12px] text-[var(--col-dim)]" strokeWidth={1.5} /></div>
                                <span className="text-[0.76rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)]">{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Squircle>
              );
            })}
          </div>
        </section>
      )}

      {/* All Events Table */}
      <section>
        <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
          {filter === "all" ? "All Events" : filters.find((f) => f.key === filter)?.label || "Events"}
        </h2>
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
          <div className="grid items-center gap-4 px-6 py-3.5"
            style={{ gridTemplateColumns: "1fr 140px 110px 90px 100px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}>
            {["Event", "Organization", "Date", "Capacity", "Status"].map((h) => (
              <span key={h} className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{h}</span>
            ))}
          </div>
          {filtered.map((event, i) => {
            const sc = statusConfig[event.status] || statusConfig.draft;
            const initials = event.organization.split(" ").map((w) => w[0]).join("").slice(0, 2);
            return (
              <div key={event.id} className="grid items-center gap-4 px-6 py-4 transition-colors hover:bg-[hsl(0_0%_100%_/_0.25)]"
                style={{ gridTemplateColumns: "1fr 140px 110px 90px 100px", ...(i < filtered.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}) }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Squircle cornerRadius={10} cornerSmoothing={1}
                    className="w-8 h-8 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}>{initials}</Squircle>
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                    <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">by {event.organizer}</p>
                  </div>
                </div>
                <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{event.organization}</span>
                <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-mono)]">{fmtDate(event.startDate)}</span>
                <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-mono)] tabular-nums">{event.registered}/{event.capacity}</span>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                  <span className="text-[0.72rem] font-[family-name:var(--font-ui)]" style={{ color: sc.text }}>{sc.label}</span>
                </div>
              </div>
            );
          })}
        </Squircle>
      </section>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setConfirmAction(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in text-center"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: confirmAction.type === "approve" ? "hsl(142 50% 45% / 0.12)" : "hsl(0 60% 50% / 0.1)" }}>
              {confirmAction.type === "approve"
                ? <CheckCircle2 className="w-5 h-5 text-[hsl(142,50%,35%)]" strokeWidth={2} />
                : <XCircle className="w-5 h-5 text-[hsl(0,60%,45%)]" strokeWidth={2} />}
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
              {confirmAction.type === "approve" ? "Approve Event?" : "Reject Event?"}
            </h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
              {confirmAction.type === "approve" ? "This event will be published and visible to students." : "This event will be rejected and hidden from students."}
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={handleConfirm}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer text-white"
                style={{
                  borderRadius: "14px",
                  ...(confirmAction.type === "approve"
                    ? { background: "hsl(142 50% 40%)", boxShadow: "0 2px 12px hsl(142 50% 40% / 0.3)" }
                    : { background: "hsl(0 60% 48%)", boxShadow: "0 2px 12px hsl(0 60% 48% / 0.3)" }),
                }}>
                {confirmAction.type === "approve" ? "Approve" : "Reject"}
              </button>
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
                Cancel
              </button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
