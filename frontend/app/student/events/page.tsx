"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event as ApiEvent } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Search, MapPin, Clock, Users, Eye, Pencil, Plus, Calendar, Send, CheckCircle2, XCircle, CircleDot, RotateCcw, QrCode, Ticket, X } from "lucide-react";

type StatusFilter = "all" | "DRAFT" | "PENDING_APPROVAL" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED" | "PUBLISHED" | "COMPLETED";

function eventSlugFor(event: ApiEvent) {
  if (event.slug && event.slug.trim()) return `/events/${event.slug}`;
  const title = (event.title || "event").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/events/${title}`;
}

function normalizeStatus(status?: string) {
  return (status || "DRAFT").toUpperCase();
}

function QRBlock({ code, size = 150 }: { code: string; size?: number }) {
  const cells = 11;
  const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      const isCorner =
        (row < 3 && col < 3) ||
        (row < 3 && col >= cells - 3) ||
        (row >= cells - 3 && col < 3);
      const isPattern = (row * 7 + col * 13 + hash) % 3 === 0;
      return isCorner || isPattern;
    }),
  );
  const cellSize = size / cells;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 10 }}>
      <rect width={size} height={size} fill="white" rx="10" />
      {grid.map((row, ri) =>
        row.map((filled, ci) =>
          filled ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellSize}
              y={ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1A1A1A"
              rx="1"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export default function StudentEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [ticketModalEvent, setTicketModalEvent] = useState<ApiEvent | null>(null);
  const user = useAuthStore((s) => s.user);
  const isEventAdmin = user?.role === "EVENT_ADMIN";

  useEffect(() => {
    if (user && !isEventAdmin) {
      router.replace("/explore-events");
      return;
    }
  }, [user, isEventAdmin, router]);

  const loadMyEvents = () => {
    setLoading(true);
    const request = isEventAdmin ? api.events.mine() : api.events.list();

    request
      .then((items) => setEvents(items))
      .catch((requestError) => setError(getApiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isEventAdmin) {
      loadMyEvents();
    }
  }, [isEventAdmin]);

  const statusButtons = [
    { label: "All", filter: "all" as StatusFilter },
    { label: "Draft", filter: "DRAFT" as StatusFilter },
    { label: "Pending", filter: "PENDING_APPROVAL" as StatusFilter },
    { label: "Changes", filter: "CHANGES_REQUESTED" as StatusFilter },
    { label: "Approved", filter: "APPROVED" as StatusFilter },
    { label: "Published", filter: "PUBLISHED" as StatusFilter },
  ];

  const counts = useMemo(() => {
    return {
      all: events.length,
      DRAFT: events.filter((item) => normalizeStatus(item.status) === "DRAFT").length,
      PENDING_APPROVAL: events.filter((item) => normalizeStatus(item.status) === "PENDING_APPROVAL").length,
      CHANGES_REQUESTED: events.filter((item) => normalizeStatus(item.status) === "CHANGES_REQUESTED").length,
      APPROVED: events.filter((item) => normalizeStatus(item.status) === "APPROVED").length,
      REJECTED: events.filter((item) => normalizeStatus(item.status) === "REJECTED").length,
      PUBLISHED: events.filter((item) => normalizeStatus(item.status) === "PUBLISHED").length,
      COMPLETED: events.filter((item) => normalizeStatus(item.status) === "COMPLETED").length,
    };
  }, [events]);

  const filtered = events.filter((event) => {
    const matchStatus = selectedStatus === "all" || normalizeStatus(event.status) === selectedStatus;
    const matchSearch =
      (event.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (event.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (event.venue || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSubmit = async (eventId: string) => {
    try {
      setSubmittingId(eventId);
      await api.events.submit(eventId);
      loadMyEvents();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      setPublishingId(eventId);
      await api.events.publish(eventId);
      loadMyEvents();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
              <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
              Events
            </p>
            <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              {isEventAdmin ? "My Events" : "Explore Events"}
              <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
                {" "}.
              </span>
            </h1>
            <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
              {isEventAdmin ? "Manage and review your event submissions." : "Discover published events and upcoming campus activity."}
            </p>
          </div>

          {isEventAdmin && (
            <Link href="/student/events/create" className="inline-flex items-center gap-2 rounded-full bg-[var(--col-primary)] px-4 py-2.5 text-[0.78rem] font-bold text-[var(--bg)] shadow-sm transition hover:opacity-90">
              <span>Create Event</span>
              <Plus className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusButtons.map((button) => (
            <button
              key={button.filter}
              type="button"
              onClick={() => setSelectedStatus(button.filter)}
              className={`rounded-full border px-4 py-2 text-[0.74rem] font-semibold ${selectedStatus === button.filter ? "border-[var(--col-primary)] bg-[var(--col-primary)] text-[var(--bg)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--col-secondary)] hover:text-[var(--col-primary)]"}`}
            >
              {button.label} <span className="ml-1">{button.filter === "all" ? counts.all : counts[button.filter as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <Squircle
          cornerRadius={16}
          cornerSmoothing={1}
          className="w-full flex items-center gap-3 px-4 py-3"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.5), 0 1px 4px var(--shadow)",
          }}
        >
          <Search className="w-4 h-4 text-[var(--col-dim)] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none placeholder:text-[var(--col-dim)]"
          />
        </Squircle>
      </div>

      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading events...</p>}
      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}

      <section className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface)]/80 shadow-[0_20px_60px_var(--shadow)] backdrop-blur-xl">
        <div className="grid grid-cols-[minmax(250px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] gap-4 border-b border-[var(--line-soft)] px-6 py-4 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
          <span>Event</span>
          <span>Date</span>
          <span>View</span>
          <span>Tickets</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              No events match your search.
            </p>
          </div>
        )}

        {filtered.map((event) => {
          const eventDate = event.startTime ?? event.eventDate ?? new Date().toISOString();
          const d = new Date(eventDate);
          const ticketCode = `PUV-${(event.title || "EV").slice(0, 3).toUpperCase()}-${event.id.slice(0, 4).toUpperCase()}`;

          return (
            <div key={event.id} className="grid grid-cols-[minmax(250px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] items-center gap-4 px-6 py-5 border-b border-[var(--line-soft)] last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--col-primary)] text-[0.76rem] font-black text-white">
                  {event.title?.slice(0, 2).toUpperCase() || "EV"}
                </div>
                <div>
                  <p className="text-[0.82rem] font-black text-[var(--col-primary)] font-[family-name:var(--font-display)]">{event.title}</p>
                  <p className="mt-1 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{event.venue ?? "Seminar Hall"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>

              {/* View Column (Big & Distinct Button) */}
              <div className="flex items-center gap-2">
                <Link
                  href={eventSlugFor(event)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--col-primary)] text-[var(--bg)] hover:bg-[var(--col-primary)]/85 text-[0.78rem] font-bold font-[family-name:var(--font-display)] shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  aria-label="View event details"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>

                {isEventAdmin && (
                  <>
                    <Link href={`/student/events/create?event=${event.id}`} className="rounded-full border border-[var(--line)] bg-[var(--surface)] p-2.5 text-[var(--col-secondary)] transition hover:text-[var(--col-primary)]" aria-label="Edit event">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>

                    {normalizeStatus(event.status) === "APPROVED" ? (
                      <button type="button" onClick={() => handlePublish(event.id)} disabled={publishingId === event.id} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[0.72rem] font-black text-[var(--col-primary)] disabled:opacity-60">
                        {publishingId === event.id ? "Publishing..." : "Publish"}
                      </button>
                    ) : normalizeStatus(event.status) !== "PUBLISHED" && normalizeStatus(event.status) !== "REJECTED" && normalizeStatus(event.status) !== "PENDING_APPROVAL" ? (
                      <button type="button" onClick={() => handleSubmit(event.id)} disabled={submittingId === event.id} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[0.72rem] font-black text-[var(--col-primary)] disabled:opacity-60">
                        {submittingId === event.id ? "Sending..." : "Submit"}
                      </button>
                    ) : (
                      <button type="button" disabled className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[0.72rem] font-black text-[var(--col-secondary)] opacity-80">
                        {normalizeStatus(event.status) === "REJECTED" ? "Resubmit" : normalizeStatus(event.status) === "PENDING_APPROVAL" ? "Review" : "Published"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Tickets Column (QR Ticket Button) */}
              <div>
                <button
                  type="button"
                  onClick={() => setTicketModalEvent(event)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white text-[0.76rem] font-bold font-[family-name:var(--font-display)] transition-all cursor-pointer shadow-sm"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Ticket</span>
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Ticket QR Modal */}
      {ticketModalEvent && (() => {
        const eventDate = ticketModalEvent.startTime ?? ticketModalEvent.eventDate ?? new Date().toISOString();
        const d = new Date(eventDate);
        const ticketCode = `PUV-${(ticketModalEvent.title || "EV").slice(0, 3).toUpperCase()}-${ticketModalEvent.id.slice(0, 4).toUpperCase()}`;

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setTicketModalEvent(null)}
            />
            <Squircle
              cornerRadius={28}
              cornerSmoothing={1}
              className="relative z-10 w-full max-w-[360px] p-6 shadow-2xl overflow-hidden"
              style={{
                background: "hsl(0 0% 98% / 0.96)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "1px solid hsl(0 0% 100% / 0.8)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line-soft)] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)]">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                    Event Ticket
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketModalEvent(null)}
                  className="w-7 h-7 rounded-full border border-[var(--line-soft)] flex items-center justify-center text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-snug">
                  {ticketModalEvent.title}
                </h3>
                <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-1">
                  {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {ticketModalEvent.venue || "Campus Hall"}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-[20px] bg-white border border-slate-100 shadow-inner mb-4">
                <QRBlock code={ticketCode} size={150} />
                <p className="mt-3 text-[0.72rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tracking-[0.08em]">
                  {ticketCode}
                </p>
              </div>

              <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] text-center mb-4">
                Scan this QR code at the venue for instant entry check-in.
              </p>

              <button
                type="button"
                onClick={() => setTicketModalEvent(null)}
                className="w-full py-2.5 rounded-[12px] bg-[var(--col-primary)] hover:bg-[var(--col-primary)]/90 text-white text-[0.78rem] font-bold font-[family-name:var(--font-display)] transition-all cursor-pointer"
              >
                Done
              </button>
            </Squircle>
          </div>
        );
      })()}
    </div>
  );
}
