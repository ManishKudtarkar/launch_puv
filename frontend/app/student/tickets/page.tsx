"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, getAccessToken, API_URL, type Registration, type Event as ApiEvent } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { Ticket, MapPin, Clock, Maximize2, Lock, CheckCircle2, AlertTriangle, CalendarSearch, Calendar, Download } from "lucide-react";

type RegWithMeta = Registration & {
  event: ApiEvent;
  registeredAt?: string;
  status?: string;
};

// ─── Real QR code component ─────────────────────────────────────────────────
// Fetches the scannable PNG QR from the backend using the auth token.
// Falls back to showing the token string if the fetch fails.
function RealQR({
  eventId,
  ticketToken,
  size = 140,
}: {
  eventId: string;
  ticketToken: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    const token = getAccessToken();
    if (!token) { setFailed(true); return; }

    fetch(`${API_URL}/events/${eventId}/registrations/me/qr`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("qr fetch failed");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setFailed(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [eventId, ticketToken]);

  if (failed) {
    // Minimal text fallback — still shows the token
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-[12px] bg-white border border-slate-100 p-2 text-center"
      >
        <span className="text-[0.55rem] font-mono text-slate-400 break-all leading-tight">
          {ticketToken}
        </span>
      </div>
    );
  }

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-[12px] bg-white border border-slate-100 animate-pulse"
      >
        <div className="w-1/2 h-1/2 rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`QR ticket ${ticketToken}`}
      width={size}
      height={size}
      style={{ borderRadius: 12, display: "block" }}
    />
  );
}

// Helper to download the QR PNG
function downloadQR(eventId: string, ticketToken: string) {
  const token = getAccessToken();
  if (!token) return;
  fetch(`${API_URL}/events/${eventId}/registrations/me/qr`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ticket-${ticketToken}.png`;
      a.click();
    })
    .catch(() => { });
}

function getTicketStatus(item: RegWithMeta) {
  const isCancelled = (item as unknown as Record<string, string>).status === "CANCELLED";
  if (isCancelled) return { state: "CANCELLED", label: "Cancelled", color: "text-red-500 bg-red-500/10 border-red-500/20" };

  if (item.checkedInAt) {
    return { state: "CHECKED_IN", label: "Checked In", color: "text-emerald-700 bg-emerald-500/15 border-emerald-500/30" };
  }

  const ev = item.event;
  const rawDate = ev.startTime ?? ev.eventDate;
  const eventDate = new Date(rawDate);
  const eventEnd = ev.endTime ? new Date(ev.endTime) : new Date(eventDate.getTime() + 8 * 3600 * 1000);
  const now = new Date();

  // Check if expired
  if (now > eventEnd) {
    return { state: "EXPIRED", label: "Expired", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
  }

  // Check if locked by release schedule
  if (ev.ticketReleaseMode === "HOURS_BEFORE" && ev.ticketReleaseHours) {
    const unlockTime = new Date(eventDate.getTime() - Number(ev.ticketReleaseHours) * 3600 * 1000);
    if (now < unlockTime) {
      return {
        state: "LOCKED",
        label: `Unlocks ${ev.ticketReleaseHours}h before`,
        unlockDate: unlockTime,
        color: "text-amber-700 bg-amber-500/15 border-amber-500/30",
      };
    }
  }

  if (ev.ticketReleaseMode === "CUSTOM_TIME" && ev.ticketReleaseCustomDate) {
    const unlockTime = new Date(String(ev.ticketReleaseCustomDate));
    if (now < unlockTime) {
      return {
        state: "LOCKED",
        label: "Locked until release",
        unlockDate: unlockTime,
        color: "text-amber-700 bg-amber-500/15 border-amber-500/30",
      };
    }
  }

  return { state: "ACTIVE", label: "Active Pass", color: "text-emerald-700 bg-emerald-500/15 border-emerald-500/30" };
}

export default function StudentTicketsPage() {
  const user = useAuthStore((s) => s.user);
  const [registrations, setRegistrations] = useState<RegWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RegWithMeta | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    api.events
      .list()
      .then(async (events) => {
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
              // Not registered
            }
          }),
        );
        setRegistrations(results);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-3 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Event Tickets & Passes
        </p>
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          My Tickets
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
        <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
          Present your digital QR pass at the entrance for verification and entry.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-600 text-[0.82rem] font-[family-name:var(--font-ui)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[0.86rem] text-[var(--col-secondary)]">
          Loading your event passes...
        </div>
      ) : registrations.length === 0 ? (
        <Squircle
          cornerRadius={28}
          cornerSmoothing={1}
          className="py-16 flex flex-col items-center justify-center text-center px-4"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(25 65% 45% / 0.1)" }}
          >
            <Ticket className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-[0.96rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
            No active tickets yet
          </p>
          <p className="text-[0.8rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5 max-w-[340px]">
            Register for campus events to unlock instant digital entry passes and QR tickets.
          </p>
          <Link
            href="/explore-events"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--col-primary)] px-5 py-2.5 text-[0.78rem] font-bold text-white shadow-sm hover:opacity-90 transition-all"
          >
            <span>Explore Events</span>
            <CalendarSearch className="w-4 h-4 text-[var(--accent)]" />
          </Link>
        </Squircle>
      ) : (
        <div className="space-y-5">
          {registrations.map((item) => {
            const ev = item.event;
            const statusInfo = getTicketStatus(item);
            const isLocked = statusInfo.state === "LOCKED";
            const isCancelled = statusInfo.state === "CANCELLED";
            const isExpired = statusInfo.state === "EXPIRED";
            const isCheckedIn = statusInfo.state === "CHECKED_IN";

            const rawDate = ev.startTime ?? ev.eventDate ?? new Date().toISOString();
            const d = new Date(rawDate);
            const dayNum = d.getDate();
            const monthShort = d.toLocaleDateString("en-US", { month: "short" });
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

            const ticketCode =
              item.ticketToken ||
              `PUV-${(ev.title || "EV").slice(0, 3).toUpperCase()}-${item.id.slice(0, 4).toUpperCase()}`;

            return (
              <Squircle
                key={item.id}
                cornerRadius={28}
                cornerSmoothing={1}
                className="overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "hsl(0 0% 96% / 0.55)",
                  backdropFilter: "blur(24px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                  boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6), inset 0 -1px 0 hsl(0 0% 80% / 0.1)",
                }}
              >
                {/* Horizontal ticket stub layout */}
                <div className="flex flex-col sm:flex-row min-h-[190px]">
                  {/* Left — event info */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      {/* Status + ticket icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "hsl(25 65% 45% / 0.1)" }}
                        >
                          <Ticket className="w-3.5 h-3.5 text-[var(--accent)]" />
                        </div>
                        <span
                          className={`text-[0.62rem] uppercase tracking-[0.1em] font-bold font-[family-name:var(--font-mono)] px-2.5 py-1 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/events/${ev.slug || ev.id}`} className="group/title">
                        <h3 className="text-[1.1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-[1.25] group-hover/title:text-[var(--accent)] transition-colors">
                          {ev.title}
                        </h3>
                      </Link>
                    </div>

                    {/* Date + venue row */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2.5">
                        <Squircle
                          cornerRadius={12}
                          cornerSmoothing={1}
                          className="w-[48px] h-[48px] flex flex-col items-center justify-center flex-shrink-0"
                          style={{
                            background: "linear-gradient(145deg, var(--accent), hsl(25 75% 35%))",
                            boxShadow: "0 3px 12px hsl(25 65% 45% / 0.3)",
                          }}
                        >
                          <span className="text-[1.05rem] font-bold text-white leading-none font-[family-name:var(--font-mono)]">
                            {dayNum}
                          </span>
                          <span className="text-[0.48rem] uppercase tracking-[0.08em] text-white/80 font-[family-name:var(--font-mono)]">
                            {monthShort}
                          </span>
                        </Squircle>
                        <div>
                          <p className="text-[0.76rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                            {dayName}, {timeStr}
                          </p>
                          <p className="text-[0.7rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-[11px] h-[11px] text-[var(--accent)] flex-shrink-0" />
                            <span>{ev.venue || "Campus Seminar Hall"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical tear line */}
                  <div className="relative w-full sm:w-0 h-px sm:h-auto flex-shrink-0">
                    <div
                      className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
                      style={{ background: "var(--bg)" }}
                    />
                    <div
                      className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full"
                      style={{ background: "var(--bg)" }}
                    />
                    <div
                      className="hidden sm:block absolute top-5 bottom-5 left-1/2 -translate-x-1/2 w-px"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(180deg, hsl(0 0% 75% / 0.4) 0px, hsl(0 0% 75% / 0.4) 4px, transparent 4px, transparent 8px)",
                      }}
                    />
                  </div>

                  {/* Right — QR stub */}
                  <div className="w-full sm:w-[210px] flex-shrink-0 p-5 flex flex-col items-center justify-center bg-[hsl(0_0%_100%_/_0.3)] border-t sm:border-t-0 sm:border-l border-[var(--line-soft)]">
                    {isLocked ? (
                      <div className="w-[110px] h-[110px] rounded-[16px] bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center p-3 text-center">
                        <Lock className="w-6 h-6 text-amber-600 mb-1" />
                        <span className="text-[0.6rem] font-bold text-amber-700 leading-tight">
                          QR Pass Locked
                        </span>
                      </div>
                    ) : isCancelled ? (
                      <div className="w-[110px] h-[110px] rounded-[16px] bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center p-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-600 mb-1" />
                        <span className="text-[0.6rem] font-bold text-red-700 leading-tight">
                          Registration Cancelled
                        </span>
                      </div>
                    ) : (
                      <div className={`p-1.5 rounded-[14px] bg-white shadow-sm ${isExpired ? "opacity-30 grayscale" : ""}`}>
                        <RealQR eventId={ev.id} ticketToken={ticketCode} size={105} />
                      </div>
                    )}

                    <p className="text-[0.66rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tracking-[0.06em] mt-2 text-center truncate max-w-[180px]">
                      {ticketCode}
                    </p>

                    {!isCancelled && !isLocked && (
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="mt-2.5 inline-flex items-center gap-1.5 text-[0.68rem] font-bold px-3.5 py-1.5 rounded-full bg-[var(--col-primary)] text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                        <span>View Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              </Squircle>
            );
          })}
        </div>
      )}

      {/* Full Ticket Modal */}
      {selected && (() => {
        const ev = selected.event;
        const rawDate = ev.startTime ?? ev.eventDate ?? new Date().toISOString();
        const d = new Date(rawDate);
        const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const ticketCode =
          selected.ticketToken ||
          `PUV-${(ev.title || "EV").slice(0, 3).toUpperCase()}-${selected.id.slice(0, 4).toUpperCase()}`;
        const regData = selected.registrationData as Record<string, string> | undefined;

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-md"
              onClick={() => setSelected(null)}
            />
            <Squircle
              cornerRadius={32}
              cornerSmoothing={1}
              className="relative z-10 w-full max-w-[370px] overflow-hidden shadow-2xl"
              style={{
                background: "hsl(0 0% 98% / 0.96)",
                backdropFilter: "blur(40px) saturate(1.6)",
                WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                border: "1px solid hsl(0 0% 100% / 0.8)",
              }}
            >
              {/* Accent strip at top */}
              <div
                className="h-[5px]"
                style={{ background: "linear-gradient(90deg, var(--accent), hsl(25 75% 55%))" }}
              />

              {/* Header */}
              <div className="p-6 pb-4 text-center">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "hsl(25 65% 45% / 0.1)" }}
                >
                  <Ticket className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h3 className="text-[1.1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-[1.3] mb-1.5">
                  {ev.title}
                </h3>
                <div className="inline-flex items-center gap-2 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>
                    {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {timeStr}
                  </span>
                </div>
                {ev.venue && (
                  <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--accent)]" />
                    <span>{ev.venue}</span>
                  </p>
                )}
                {regData?.EMAIL && (
                  <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1">
                    Attendee: {regData.FULL_NAME || user?.fullName} ({regData.EMAIL})
                  </p>
                )}
              </div>

              {/* QR section */}
              <div className="px-6 pb-6 flex flex-col items-center">
                <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-inner mb-3">
                  <RealQR eventId={ev.id} ticketToken={ticketCode} size={200} />
                </div>
                <p className="text-[0.82rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tracking-[0.08em] mb-1">
                  {ticketCode}
                </p>
                <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)] mb-4 text-center">
                  Point this QR code at the event volunteer scanner for instant check-in.
                </p>
                <button
                  type="button"
                  onClick={() => downloadQR(ev.id, ticketCode)}
                  className="w-full mb-2 py-2.5 rounded-[12px] border border-[var(--line)] text-[var(--col-primary)] text-[0.78rem] font-semibold hover:bg-[hsl(0_0%_96%)] transition-all cursor-pointer font-[family-name:var(--font-display)] flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Download QR Pass
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full py-2.5 rounded-[12px] bg-[var(--col-primary)] hover:opacity-90 text-white text-[0.78rem] font-bold transition-all cursor-pointer font-[family-name:var(--font-display)]"
                >
                  Done
                </button>
              </div>
            </Squircle>
          </div>
        );
      })()}
    </div>
  );
}
