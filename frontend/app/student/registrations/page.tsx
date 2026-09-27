"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Registration, type Event as ApiEvent } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Search, Calendar, Eye, Ticket, X, QrCode, AlertCircle, Trash2, CalendarSearch } from "lucide-react";

type RegWithMeta = Registration & {
  event: ApiEvent;
  registeredAt?: string;
  status?: string;
};

function eventSlugFor(event: ApiEvent) {
  if (event.slug && event.slug.trim()) return `/events/${event.slug}`;
  const title = (event.title || "event")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/events/${title}`;
}

function getInitials(title?: string) {
  if (!title) return "EV";
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
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

export default function StudentRegistrationsPage() {
  const user = useAuthStore((s) => s.user);
  const [registrations, setRegistrations] = useState<RegWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "CANCELLED">("all");
  const [cancelTarget, setCancelTarget] = useState<RegWithMeta | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [ticketModalItem, setTicketModalItem] = useState<RegWithMeta | null>(null);

  const fetchRegistrations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const events = await api.events.list();
      const results: RegWithMeta[] = [];

      await Promise.allSettled(
        events.map(async (ev) => {
          try {
            const reg = await api.events.registrations.me(ev.id);
            if (reg && reg.id) {
              results.push({
                ...reg,
                event: ev,
              });
            }
          } catch {
            // User not registered for this event
          }
        }),
      );

      setRegistrations(results);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user]);

  const counts = useMemo(() => {
    const active = registrations.filter(
      (r) => (r as unknown as Record<string, string>).status !== "CANCELLED",
    ).length;
    const cancelled = registrations.filter(
      (r) => (r as unknown as Record<string, string>).status === "CANCELLED",
    ).length;
    return {
      all: registrations.length,
      ACTIVE: active,
      CANCELLED: cancelled,
    };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const regStatus = (reg as unknown as Record<string, string>).status || "ACTIVE";
      const matchFilter =
        filter === "all" ||
        (filter === "ACTIVE" && regStatus !== "CANCELLED") ||
        (filter === "CANCELLED" && regStatus === "CANCELLED");

      const eventTitle = reg.event?.title || "";
      const venue = reg.event?.venue || "";
      const regData = reg.registrationData as Record<string, string> | undefined;
      const email = regData?.EMAIL || "";
      const matchSearch =
        search === "" ||
        eventTitle.toLowerCase().includes(search.toLowerCase()) ||
        venue.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [registrations, filter, search]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const eventId = cancelTarget.eventId || cancelTarget.event?.id;
      await api.events.registrations.cancel(eventId, cancelTarget.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== cancelTarget.id));
      setCancelTarget(null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-3 font-[family-name:var(--font-mono)]">
              <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
              Student Portal
            </p>
            <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              My Registrations
              <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
                {" "}.
              </span>
            </h1>
            <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
              View your registered events, download tickets and manage your attendance.
            </p>
          </div>

          <Link
            href="/explore-events"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--col-primary)] px-4 py-2.5 text-[0.78rem] font-bold text-[var(--bg)] shadow-sm transition hover:opacity-90"
          >
            <span>Explore Events</span>
            <CalendarSearch className="h-4 w-4 text-[var(--accent)]" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" as const, count: counts.all },
            { label: "Active", value: "ACTIVE" as const, count: counts.ACTIVE },
            { label: "Cancelled", value: "CANCELLED" as const, count: counts.CANCELLED },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full border px-4 py-2 text-[0.74rem] font-semibold transition-all cursor-pointer ${
                filter === item.value
                  ? "border-[var(--col-primary)] bg-[var(--col-primary)] text-[var(--bg)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--col-secondary)] hover:text-[var(--col-primary)]"
              }`}
            >
              {item.label} <span className="ml-1.5 opacity-80">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Squircle
          cornerRadius={16}
          cornerSmoothing={1}
          className="w-full flex items-center gap-3 px-4 py-3"
          style={{
            background: "hsl(0 0% 96% / 0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.6), 0 1px 4px var(--shadow)",
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

      {error && (
        <div className="mb-5 p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-600 text-[0.82rem] flex items-center gap-2 font-[family-name:var(--font-ui)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Loading your registrations...
        </p>
      )}

      {/* Registrations Table Container */}
      <section className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface)]/85 shadow-[0_20px_60px_var(--shadow)] backdrop-blur-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[minmax(240px,2fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 border-b border-[var(--line-soft)] px-6 py-4 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
          <span>Event</span>
          <span>Date</span>
          <span>View</span>
          <span>Tickets</span>
          <span className="text-right pr-2">Cancel</span>
        </div>

        {/* Empty State */}
        {!loading && filteredRegistrations.length === 0 && (
          <div className="py-16 text-center px-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(25 65% 45% / 0.1)" }}
            >
              <CalendarSearch className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <p className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              No registrations found
            </p>
            <p className="mt-1 text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              {search ? "No events match your search term." : "You haven't registered for any events yet."}
            </p>
            <Link
              href="/explore-events"
              className="inline-flex items-center gap-2 mt-4 rounded-full bg-[var(--col-primary)] px-4 py-2 text-[0.76rem] font-bold text-white shadow-sm hover:opacity-90 transition-all"
            >
              Explore Events
            </Link>
          </div>
        )}

        {/* Rows */}
        {filteredRegistrations.map((item) => {
          const ev = item.event;
          const rawDate = ev.startTime ?? ev.eventDate ?? new Date().toISOString();
          const d = new Date(rawDate);
          const isCancelled = (item as unknown as Record<string, string>).status === "CANCELLED";
          const eventSlug = eventSlugFor(ev);
          const initials = getInitials(ev.title);

          return (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(240px,2fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center gap-4 px-6 py-5 border-b border-[var(--line-soft)] last:border-b-0 hover:bg-[hsl(0_0%_0%_/_0.015)] transition-colors"
            >
              {/* Event Column: Avatar + Title + Venue */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--col-primary)] text-[0.76rem] font-black text-white shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.84rem] font-black text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                    {ev.title || "Untitled Event"}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                    {ev.venue || "Seminar Hall 2"}
                  </p>
                </div>
              </div>

              {/* Date Column */}
              <div className="flex items-center gap-2 text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--accent)] flex-shrink-0" />
                <span>
                  {d.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>

              {/* View Column (Black pill button) */}
              <div>
                <Link
                  href={eventSlug}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--col-primary)] text-[var(--bg)] hover:bg-[var(--col-primary)]/85 text-[0.76rem] font-bold font-[family-name:var(--font-display)] shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  aria-label="View event details"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View</span>
                </Link>
              </div>

              {/* Tickets Column (Peach/Orange pill button) */}
              <div>
                <button
                  type="button"
                  onClick={() => setTicketModalItem(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white text-[0.76rem] font-bold font-[family-name:var(--font-display)] transition-all cursor-pointer shadow-sm"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Ticket</span>
                </button>
              </div>

              {/* Cancel Column */}
              <div className="text-right pr-2">
                {!isCancelled ? (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white text-[0.72rem] font-semibold transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <span className="text-[0.66rem] uppercase tracking-wider font-semibold text-slate-400 font-[family-name:var(--font-mono)]">
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Ticket QR Modal */}
      {ticketModalItem && (() => {
        const ev = ticketModalItem.event;
        const rawDate = ev.startTime ?? ev.eventDate ?? new Date().toISOString();
        const d = new Date(rawDate);
        const ticketCode = `PUV-${(ev.title || "EV").slice(0, 3).toUpperCase()}-${ticketModalItem.id.slice(0, 4).toUpperCase()}`;
        const regData = ticketModalItem.registrationData as Record<string, string> | undefined;

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-md"
              onClick={() => setTicketModalItem(null)}
            />
            <Squircle
              cornerRadius={28}
              cornerSmoothing={1}
              className="relative z-10 w-full max-w-[370px] p-6 shadow-2xl overflow-hidden"
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
                    Entry Pass & Ticket
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketModalItem(null)}
                  className="w-7 h-7 rounded-full border border-[var(--line-soft)] flex items-center justify-center text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-snug">
                  {ev.title}
                </h3>
                <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mt-1">
                  {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {ev.venue || "Campus Seminar Hall"}
                </p>
                {regData?.EMAIL && (
                  <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-0.5">
                    {regData.EMAIL}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-[20px] bg-white border border-slate-100 shadow-inner mb-4">
                <QRBlock code={ticketCode} size={150} />
                <p className="mt-3 text-[0.72rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tracking-[0.08em]">
                  {ticketCode}
                </p>
              </div>

              <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] text-center mb-4">
                Scan this QR code at the event entrance for fast check-in.
              </p>

              <button
                type="button"
                onClick={() => setTicketModalItem(null)}
                className="w-full py-2.5 rounded-[12px] bg-[var(--col-primary)] hover:bg-[var(--col-primary)]/90 text-white text-[0.78rem] font-bold font-[family-name:var(--font-display)] transition-all cursor-pointer"
              >
                Done
              </button>
            </Squircle>
          </div>
        );
      })()}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
            onClick={() => !cancelling && setCancelTarget(null)}
          />
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-[380px] p-6 shadow-2xl"
            style={{
              background: "hsl(0 0% 98% / 0.95)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              boxShadow: "0 20px 60px hsl(0 0% 0% / 0.2)",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1.5">
              Cancel Registration
            </h3>
            <p className="text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.6] mb-5">
              Are you sure you want to cancel your registration for{" "}
              <strong className="text-[var(--col-primary)] font-semibold">
                {cancelTarget.event?.title || "this event"}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 text-[0.8rem] font-medium py-2.5 text-[var(--col-secondary)] font-[family-name:var(--font-ui)] transition-colors duration-200 hover:text-[var(--col-primary)] rounded-[14px] bg-[hsl(0_0%_100%_/_0.7)] border border-[var(--line-soft)] cursor-pointer"
              >
                Keep Registration
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 text-[0.8rem] font-semibold py-2.5 text-white text-center transition-all duration-200 cursor-pointer hover:opacity-90 font-[family-name:var(--font-ui)] disabled:opacity-50 rounded-[14px] bg-red-600"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
