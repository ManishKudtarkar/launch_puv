"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event } from "@/lib/api-client";
import { Plus, MapPin, Clock, CalendarDays, Eye, Pencil, Trash2 } from "lucide-react";

type FilterStatus = "all" | "DRAFT" | "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "COMPLETED";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Changes", value: "CHANGES_REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Published", value: "PUBLISHED" },
];

const statusDot: Record<string, string> = {
  PUBLISHED: "var(--positive)", PENDING_APPROVAL: "var(--warning)", APPROVED: "hsl(200 60% 45%)",
  CHANGES_REQUESTED: "hsl(270 50% 55%)", COMPLETED: "var(--col-dim)", REJECTED: "var(--danger)", DRAFT: "var(--col-secondary)",
};
const statusLabel: Record<string, string> = {
  PUBLISHED: "Published", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes Requested", COMPLETED: "Completed", REJECTED: "Rejected", DRAFT: "Draft",
};

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    api.events.mine()
      .then(setEvents)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.status === filter);

  const handleSubmit = async (id: string) => {
    setActingId(id);
    try {
      const updated = await api.events.submit(id);
      // Merge so local-enriched fields (reviewNotes, approvals) are preserved
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setActingId(null); }
  };

  const handleResubmit = async (id: string) => {
    setActingId(id);
    try {
      const updated = await api.events.resubmit(id);
      // Merge so local-enriched fields (reviewNotes, approvals) are preserved
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setActingId(null); }
  };

  const handlePublish = async (id: string) => {
    setActingId(id);
    try {
      const updated = await api.events.publish(id);
      // Merge with existing event to preserve enriched fields while updating status to PUBLISHED
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setActingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft event?")) return;
    setActingId(id);
    try {
      await api.events.remove(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setActingId(null); }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            My Events<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            {events.length} event{events.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <Link href="/admin/events/create">
          <Squircle cornerRadius={16} cornerSmoothing={1} className="group inline-flex items-center gap-2.5 text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
            style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}>
            Create Event
            <Squircle cornerRadius={12} cornerSmoothing={1} className="w-[34px] h-[34px] border border-white/70 flex items-center justify-center flex-shrink-0">
              <Plus className="w-[13px] h-[13px]" strokeWidth={2} />
            </Squircle>
          </Squircle>
        </Link>
      </div>

      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}
      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading events...</p>}

      <div className="flex items-center gap-2 mb-7">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? events.length : events.filter((e) => e.status === f.value).length;
          const active = filter === f.value;
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="text-[0.74rem] font-medium px-3.5 py-[7px] transition-all duration-300 font-[family-name:var(--font-ui)] cursor-pointer"
              style={{ borderRadius: "12px", ...(active ? { background: "var(--col-primary)", color: "var(--bg)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" } : { background: "hsl(0 0% 100% / 0.4)", color: "var(--col-secondary)", border: "1px solid hsl(0 0% 85% / 0.4)" }) }}>
              {f.label}<span className="ml-1.5 text-[0.6rem] font-[family-name:var(--font-mono)]" style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && !loading ? (
        <Squircle cornerRadius={22} cornerSmoothing={1} className="p-14 text-center" style={glassStyle}>
          <CalendarDays className="w-10 h-10 text-[var(--col-dim)] mx-auto mb-3 opacity-40" strokeWidth={1} />
          <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No events match this filter.</p>
        </Squircle>
      ) : (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
          <div className="grid items-center gap-4 px-6 py-3.5" style={{ gridTemplateColumns: "1fr 140px 130px 160px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Event</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Date</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Status</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] text-right">Actions</span>
          </div>
          {filtered.map((event, i) => {
            const d = new Date(event.eventDate);
            const dot = statusDot[event.status as string] || statusDot.DRAFT;
            const label = statusLabel[event.status as string] || "Draft";
            const isActing = actingId === event.id;
            return (
              <div key={event.id} className="group flex flex-col transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
                style={{ ...(i < filtered.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}) }}>
                <div className="grid items-center gap-4 px-6 py-4" style={{ gridTemplateColumns: "1fr 140px 130px 160px" }}>
                  <Link href={`/admin/events/${event.id}`} className="flex items-center gap-3 min-w-0">
                    <Squircle cornerRadius={12} cornerSmoothing={1} className="w-10 h-10 flex items-center justify-center text-white text-[0.5rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}>
                      {event.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </Squircle>
                    <div className="min-w-0">
                      <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate group-hover:text-[var(--accent)] transition-colors duration-200">{event.title}</p>
                      {event.venue && <div className="flex items-center gap-1.5 mt-0.5"><MapPin className="w-[10px] h-[10px] text-[var(--col-dim)]" strokeWidth={1.5} /><span className="text-[0.66rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{event.venue as string}</span></div>}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                    <Clock className="w-3 h-3 text-[var(--col-dim)]" strokeWidth={1.5} />
                    {d.toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: dot }} />
                    <span className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                  <Link href={`/admin/events/${event.id}`} title="View Event Details">
                    <div className="w-7 h-7 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer">
                      <Eye className="w-[12px] h-[12px]" strokeWidth={1.5} />
                    </div>
                  </Link>
                  <Link href={`/admin/events/create?event=${event.id}`} title="Edit Event in Wizard">
                    <div className="w-7 h-7 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--col-primary)] hover:text-[var(--col-primary)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer">
                      <Pencil className="w-[11px] h-[11px]" strokeWidth={1.5} />
                    </div>
                  </Link>
                  {event.status === "DRAFT" && (
                    <button onClick={() => handleSubmit(event.id)} disabled={isActing}
                      className="px-2.5 py-1 text-[0.62rem] font-medium rounded-[8px] transition-all duration-200 hover:opacity-80 disabled:opacity-50 cursor-pointer font-[family-name:var(--font-mono)]"
                      style={{ background: "hsl(200 70% 50% / 0.1)", color: "hsl(200 60% 35%)" }}>
                      {isActing ? "..." : "Submit"}
                    </button>
                  )}
                  {event.status === "CHANGES_REQUESTED" && (
                    <button onClick={() => handleResubmit(event.id)} disabled={isActing}
                      className="px-2.5 py-1 text-[0.62rem] font-medium rounded-[8px] transition-all duration-200 hover:opacity-80 disabled:opacity-50 cursor-pointer font-[family-name:var(--font-mono)]"
                      style={{ background: "hsl(270 60% 65% / 0.1)", color: "hsl(270 50% 40%)" }}>
                      {isActing ? "..." : "Resubmit"}
                    </button>
                  )}
                  {event.status === "APPROVED" && (
                    <button
                      onClick={() => handlePublish(event.id)}
                      disabled={isActing}
                      title="Publish this approved event to make it publicly discoverable"
                      className="px-2.5 py-1 text-[0.62rem] font-medium rounded-[8px] transition-all duration-200 hover:opacity-80 disabled:opacity-50 cursor-pointer font-[family-name:var(--font-mono)]"
                      style={{ background: "hsl(142 50% 45% / 0.12)", color: "hsl(142 50% 30%)" }}>
                      {isActing ? "Publishing..." : "Publish"}
                    </button>
                  )}
                  {event.status === "DRAFT" && (
                    <button onClick={() => handleDelete(event.id)} disabled={isActing}
                      className="w-7 h-7 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer disabled:opacity-50">
                      <Trash2 className="w-[11px] h-[11px]" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                </div>
                {typeof event.reviewNotes === "string" && event.reviewNotes && (event.status === "CHANGES_REQUESTED" || event.status === "REJECTED") && (
                  <div className="px-6 pb-4">
                    <div className="bg-[hsl(0_0%_96%)] border-l-2 border-[var(--danger)] px-4 py-2.5 rounded-r-[8px] text-[0.76rem] font-[family-name:var(--font-ui)]">
                      <span className="font-semibold text-[var(--col-primary)] block mb-1 font-[family-name:var(--font-display)]">Remarks / Feedback:</span>
                      <span className="text-[var(--col-secondary)]">{event.reviewNotes}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Squircle>
      )}
    </div>
  );
}
