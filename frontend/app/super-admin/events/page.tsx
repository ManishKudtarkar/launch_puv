"use client";

import { useState, useEffect } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event } from "@/lib/api-client";
import { ShieldCheck, CheckCircle2, XCircle, MapPin, Clock, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  PUBLISHED: { bg: "hsl(142 50% 45% / 0.1)", text: "hsl(142 50% 35%)", label: "Published", dot: "var(--positive)" },
  PENDING_APPROVAL: { bg: "hsl(45 90% 50% / 0.1)", text: "hsl(45 80% 35%)", label: "Pending Approval", dot: "var(--warning)" },
  APPROVED: { bg: "hsl(200 70% 50% / 0.1)", text: "hsl(200 60% 35%)", label: "Approved", dot: "hsl(200 60% 45%)" },
  CHANGES_REQUESTED: { bg: "hsl(270 60% 65% / 0.1)", text: "hsl(270 50% 45%)", label: "Changes Requested", dot: "hsl(270 50% 55%)" },
  COMPLETED: { bg: "hsl(0 0% 60% / 0.1)", text: "var(--col-dim)", label: "Completed", dot: "var(--col-dim)" },
  REJECTED: { bg: "hsl(0 60% 50% / 0.1)", text: "hsl(0 60% 45%)", label: "Rejected", dot: "var(--danger)" },
  DRAFT: { bg: "hsl(0 0% 85% / 0.3)", text: "var(--col-secondary)", label: "Draft", dot: "var(--col-secondary)" },
};

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

export default function SuperAdminEventsPage() {
  const [pending, setPending] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "approve" | "reject" | "changes"; remarks: string } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    Promise.all([api.admin.events.pending(), api.events.list()])
      .then(([p, all]) => { setPending(p); setAllEvents(all); })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async () => {
    if (!confirmAction) return;
    setActing(true);
    try {
      const remarks = confirmAction.remarks || undefined;
      if (confirmAction.type === "approve") await api.admin.events.approve(confirmAction.id, remarks);
      else if (confirmAction.type === "reject") await api.admin.events.reject(confirmAction.id, remarks);
      else await api.admin.events.requestChanges(confirmAction.id, remarks);
      setPending((prev) => prev.filter((e) => e.id !== confirmAction.id));
      setConfirmAction(null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setActing(false);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Event Approvals<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Review and approve events submitted by admins.</p>
      </div>

      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}
      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading...</p>}

      {pending.length > 0 && (
        <Squircle cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-5 py-3.5 mb-7" style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.2)" }}>
          <div className="w-8 h-8 rounded-full border border-[var(--warning)] flex items-center justify-center">
            <ShieldCheck className="w-[14px] h-[14px] text-[var(--warning)]" strokeWidth={1.5} />
          </div>
          <p className="text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)]">
            <span className="font-semibold font-[family-name:var(--font-mono)]">{pending.length}</span> event{pending.length !== 1 ? "s" : ""} awaiting your approval
          </p>
        </Squircle>
      )}

      <section className="mb-10">
        <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Pending Review</h2>
        {pending.length === 0 && !loading ? (
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-14 text-center" style={glassStyle}>
            <CheckCircle2 className="w-10 h-10 text-[var(--positive)] mx-auto mb-3 opacity-50" strokeWidth={1} />
            <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">All caught up — no pending approvals.</p>
          </Squircle>
        ) : (
          <div className="space-y-4">
            {pending.map((event) => {
              const isExpanded = expanded === event.id;
              return (
                <Squircle key={event.id} cornerRadius={24} cornerSmoothing={1} className="overflow-hidden transition-all duration-300" style={{ ...glassStyle, border: "1px solid hsl(45 90% 50% / 0.15)" }}>
                  <div className="flex items-center gap-4 p-5">
                    <Squircle cornerRadius={14} cornerSmoothing={1} className="w-12 h-12 flex items-center justify-center text-white text-[0.55rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--warning), var(--accent))" }}>
                      {event.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </Squircle>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.9rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />{(event.createdBy as any)?.fullName || "Unknown Admin"}</span>
                        {event.venue && <span className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
                        <span className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtDate(event.eventDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setConfirmAction({ id: event.id, type: "approve", remarks: "" })}
                        className="inline-flex items-center gap-2 px-4 py-[9px] text-[0.76rem] font-medium transition-all duration-300 hover:opacity-80 cursor-pointer font-[family-name:var(--font-display)]"
                        style={{ borderRadius: "14px", background: "hsl(142 50% 45% / 0.12)", color: "hsl(142 50% 30%)" }}>
                        <CheckCircle2 className="w-[13px] h-[13px]" strokeWidth={1.5} />Approve
                      </button>
                      <button onClick={() => setConfirmAction({ id: event.id, type: "changes", remarks: "" })}
                        className="inline-flex items-center gap-2 px-4 py-[9px] text-[0.76rem] font-medium transition-all duration-300 hover:opacity-80 cursor-pointer font-[family-name:var(--font-display)]"
                        style={{ borderRadius: "14px", background: "hsl(270 60% 65% / 0.1)", color: "hsl(270 50% 40%)" }}>
                        <Clock className="w-[13px] h-[13px]" strokeWidth={1.5} />Changes
                      </button>
                      <button onClick={() => setConfirmAction({ id: event.id, type: "reject", remarks: "" })}
                        className="inline-flex items-center gap-2 px-4 py-[9px] text-[0.76rem] font-medium transition-all duration-300 hover:opacity-80 cursor-pointer font-[family-name:var(--font-display)]"
                        style={{ borderRadius: "14px", background: "hsl(0 60% 50% / 0.08)", color: "hsl(0 60% 40%)" }}>
                        <XCircle className="w-[13px] h-[13px]" strokeWidth={1.5} />Reject
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : event.id)}
                        className="w-8 h-8 rounded-full border border-[var(--line-soft)] flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:border-[var(--col-primary)] transition-colors duration-200 cursor-pointer ml-1">
                        {isExpanded ? <ChevronUp className="w-[13px] h-[13px]" strokeWidth={1.5} /> : <ChevronDown className="w-[13px] h-[13px]" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0" style={{ borderTop: "1px solid hsl(0 0% 88% / 0.3)" }}>
                      <div className="pt-4">
                        <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-relaxed">{event.description || "No description provided."}</p>
                        {event.startTime && <p className="text-[0.76rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.startTime as string).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>}
                      </div>
                    </div>
                  )}
                </Squircle>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Published Events</h2>
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-x-auto overflow-y-hidden max-w-full" style={glassStyle}>
          {/* On phones the table scrolls inside the card instead of widening the page */}
          <div className="min-w-[440px]">
            <div className="grid items-center gap-4 px-6 py-3.5" style={{ gridTemplateColumns: "1fr 140px 120px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Event</span>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Date</span>
              <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Status</span>
            </div>
            {allEvents.length === 0 && !loading && (
              <p className="px-6 py-8 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No published events.</p>
            )}
            {allEvents.map((event, i) => {
              const sc = statusConfig[event.status as string] || statusConfig.DRAFT;
              return (
                <div key={event.id} className="grid items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
                  style={{ gridTemplateColumns: "1fr 140px 120px", ...(i < allEvents.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}) }}>
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{event.title}</p>
                    {event.venue && <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{event.venue as string}</p>}
                  </div>
                  <span className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-mono)]">{fmtDate(event.eventDate)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                    <span className="text-[0.72rem] font-[family-name:var(--font-ui)]" style={{ color: sc.text }}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Squircle>
      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg)" }}>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-2">
              {confirmAction.type === "approve" ? "Approve Event?" : confirmAction.type === "reject" ? "Reject Event?" : "Request Changes?"}
            </h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">
              {confirmAction.type === "approve" ? "This event will be approved and the admin can publish it." : confirmAction.type === "reject" ? "This event will be rejected." : "The admin will be asked to make changes."}
            </p>
            <textarea value={confirmAction.remarks} onChange={(e) => setConfirmAction({ ...confirmAction, remarks: e.target.value })}
              placeholder="Remarks (optional, max 1000 chars)" rows={3}
              className="w-full px-4 py-3 text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none resize-none mb-4"
              style={{ background: "hsl(0 0% 100% / 0.55)", border: "1px solid hsl(0 0% 85% / 0.5)", borderRadius: "12px" }} />
            <div className="flex items-center gap-3">
              <button onClick={handleAction} disabled={acting}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
                style={{ borderRadius: "14px", background: confirmAction.type === "approve" ? "hsl(142 50% 40%)" : confirmAction.type === "reject" ? "hsl(0 60% 48%)" : "hsl(270 50% 50%)", color: "white" }}>
                {acting ? "Processing..." : confirmAction.type === "approve" ? "Approve" : confirmAction.type === "reject" ? "Reject" : "Request Changes"}
              </button>
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
