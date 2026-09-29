"use client";

import { useEffect, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event, type AdminEvent, type AttendanceResponse } from "@/lib/api-client";
import {
  Users,
  Target,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  ChevronDown,
  Loader2,
  RefreshCw,
  UserCheck,
} from "lucide-react";

// ── Exact same glassCard constant used in /admin/organizations ───────────────
const glassCard = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

type EventAnalytics = {
  event: Event;
  totalRegistered: number;
  totalAttended: number;
  totalAbsent: number;
  turnoutRate: number;
  presentAttendees: Array<{
    ticketToken?: string;
    attendedAt: string | null;
    fullName: string;
    email: string;
    scannedBy: string | null;
  }>;
  absentAttendees: Array<{
    ticketToken?: string;
    registeredAt: string;
    fullName: string;
    email: string;
  }>;
};

export default function SuperAdminAnalyticsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, EventAnalytics>>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"present" | "absent">("present");
  const [error, setError] = useState("");

  // ── Load events ──────────────────────────────────────────────────────────────
  const loadEvents = () => {
    setLoadingEvents(true);
    setError("");
    // Platform-wide: every event from every admin (Super Admin only endpoint)
    api.admin.events
      .all()
      .then((evs) => {
        setEvents(evs);
        if (evs.length > 0) setSelectedEventId(evs[0].id);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoadingEvents(false));
  };

  useEffect(() => { loadEvents(); }, []);

  // ── Load attendance for selected event ───────────────────────────────────────
  useEffect(() => {
    if (!selectedEventId) return;
    if (analyticsMap[selectedEventId]) return;

    setLoadingAnalytics(true);
    api.events.attendance
      .list(selectedEventId)
      .then((res: AttendanceResponse) => {
        const totalRegistered = res.metrics.totalRegistered;
        const totalAttended = res.metrics.totalCheckedIn;
        const totalAbsent = totalRegistered - totalAttended;
        const turnoutRate = totalRegistered > 0
          ? parseFloat(((totalAttended / totalRegistered) * 100).toFixed(1))
          : 0;

        const presentAttendees = res.registrations
          .filter((r) => r.checkedInAt !== null)
          .sort((a, b) => {
            const ta = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
            const tb = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
            return tb - ta;
          })
          .map((r) => ({
            ticketToken: r.ticketToken,
            attendedAt: r.checkedInAt ?? null,
            fullName: r.attendeeName,
            email: r.attendeeEmail,
            scannedBy: r.checkedInByName ?? null,
          }));

        const absentAttendees = res.registrations
          .filter((r) => r.checkedInAt === null)
          .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
          .map((r) => ({
            ticketToken: r.ticketToken,
            registeredAt: r.registeredAt,
            fullName: r.attendeeName,
            email: r.attendeeEmail,
          }));

        setAnalyticsMap((prev) => ({
          ...prev,
          [selectedEventId]: {
            event: res.event as Event,
            totalRegistered,
            totalAttended,
            totalAbsent,
            turnoutRate,
            presentAttendees,
            absentAttendees,
          },
        }));
      })
      .catch(() => {
        const ev = events.find((e) => e.id === selectedEventId);
        if (ev) {
          setAnalyticsMap((prev) => ({
            ...prev,
            [selectedEventId]: {
              event: ev,
              totalRegistered: 0,
              totalAttended: 0,
              totalAbsent: 0,
              turnoutRate: 0,
              presentAttendees: [],
              absentAttendees: [],
            },
          }));
        }
      })
      .finally(() => setLoadingAnalytics(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, events]);

  useEffect(() => { setActiveTab("present"); }, [selectedEventId]);

  const selected = analyticsMap[selectedEventId];
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const loading = loadingEvents || loadingAnalytics;

  return (
    <div>
      {/* ── Page header — matches /admin/organizations exactly ─────────────── */}
      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">
          Super Admin View
        </p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Analytics
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Real-time attendance analytics for every event, across all admins.
        </p>
      </div>

      {/* ── Stat cards — same pattern as /admin/organizations ──────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full mb-8">
        {[
          { label: "Registered", value: selected?.totalRegistered ?? 0, Icon: Users, color: "var(--accent)" },
          { label: "Attended", value: selected?.totalAttended ?? 0, Icon: CheckCircle2, color: "hsl(142 50% 40%)" },
          { label: "Absent", value: selected?.totalAbsent ?? 0, Icon: XCircle, color: "#F87171" },
          { label: "Turnout Rate", value: selected ? `${selected.turnoutRate}%` : "—", Icon: Target, color: "hsl(38 90% 50%)" },
        ].map((stat) => (
          <Squircle key={stat.label} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassCard}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: stat.color }}>
                <stat.Icon className="w-[15px] h-[15px]" style={{ color: stat.color }} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[1.8rem] font-semibold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
              {loading ? "—" : stat.value}
            </p>
            <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5 uppercase tracking-[0.1em]">
              {stat.label}
            </p>
          </Squircle>
        ))}
      </div>

      {/* ── Event selector + refresh row — same style as tab+search+refresh ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center">
        {/* Event name display — top-left, matches org page heading style */}
        <div className="flex-1 min-w-0">
          {selectedEvent && (
            <>
              <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                {selectedEvent.title}
              </p>
              {selectedEvent.createdBy && (
                <p className="mt-0.5 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                  Created by {selectedEvent.createdBy.fullName}
                  <span className="text-[var(--col-dim)]"> · {selectedEvent.createdBy.email}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Event dropdown — styled exactly like the search bar */}
        {!loadingEvents && events.length > 0 && (
          <div className="relative flex-shrink-0">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-2.5 text-[0.84rem] outline-none font-[family-name:var(--font-ui)] cursor-pointer"
              style={{
                background: "hsl(0 0% 100% / 0.5)",
                border: "1px solid hsl(0 0% 85% / 0.5)",
                borderRadius: "14px",
                color: "var(--col-primary)",
                minWidth: 220,
              }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}{ev.createdBy?.fullName ? ` — ${ev.createdBy.fullName}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[var(--col-dim)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Refresh button — exact match from organizations page */}
        <button
          onClick={loadEvents}
          disabled={loading}
          className="flex items-center gap-1.5 text-[0.72rem] font-medium px-4 py-2.5 transition-all font-[family-name:var(--font-ui)] cursor-pointer flex-shrink-0"
          style={{
            borderRadius: "14px",
            background: "hsl(0 0% 100% / 0.5)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
            color: "var(--col-secondary)",
          }}
        >
          <RefreshCw className={"w-3.5 h-3.5" + (loading ? " animate-spin" : "")} />
          Refresh
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div
          className="p-4 rounded-[14px] text-[0.84rem] mb-4"
          style={{
            background: "hsl(0 60% 50% / 0.08)",
            border: "1px solid hsl(0 60% 50% / 0.2)",
            color: "hsl(0 60% 45%)",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading spinner ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* ── No events ──────────────────────────────────────────────────────── */}
      {!loading && events.length === 0 && !error && (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
          <BarChart3 className="w-8 h-8 mb-3 opacity-40" style={{ color: "var(--accent)" }} />
          <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
            No events found
          </p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Create an event to see attendance analytics here.
          </p>
        </Squircle>
      )}

      {/* ── Main analytics content ─────────────────────────────────────────── */}
      {!loading && selected && (
        <div className="space-y-4">
          {/* Turnout bar */}
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassCard}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                Attendance Rate
              </p>
              <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                {selected.turnoutRate}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-[hsl(0_0%_85%_/_0.35)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${selected.turnoutRate}%`,
                  background:
                    selected.turnoutRate >= 80
                      ? "hsl(142 60% 40%)"
                      : selected.turnoutRate >= 50
                        ? "hsl(38 90% 50%)"
                        : "var(--accent)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">0%</span>
              <span className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">100%</span>
            </div>
          </Squircle>

          {/* Tab switcher — same pattern as organizations page tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div
              className="flex gap-1 p-1 rounded-[14px] flex-shrink-0"
              style={{
                background: "hsl(0 0% 100% / 0.45)",
                border: "1px solid hsl(0 0% 85% / 0.5)",
              }}
            >
              {(["present", "absent"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const count =
                  tab === "present"
                    ? selected.presentAttendees.length
                    : selected.absentAttendees.length;
                const label = tab === "present"
                  ? `Present (${count})`
                  : `Absent (${count})`;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="text-[0.72rem] font-medium px-4 py-2 transition-all duration-200 font-[family-name:var(--font-ui)] cursor-pointer"
                    style={{
                      borderRadius: "10px",
                      background: isActive ? "var(--col-primary)" : "transparent",
                      color: isActive ? "var(--bg)" : "var(--col-secondary)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attendee rows — same OrgRow card style ───────────────────────── */}
          <div className="w-full overflow-x-auto">
            <div className="space-y-3 min-w-[300px]">
              {activeTab === "present" ? (
                selected.presentAttendees.length === 0 ? (
                  <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
                    <CheckCircle2 className="w-8 h-8 mb-3 opacity-30" style={{ color: "hsl(142 50% 40%)" }} />
                    <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">No check-ins yet</p>
                    <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No attendees have been scanned in for this event.</p>
                  </Squircle>
                ) : (
                  selected.presentAttendees.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        ...glassCard,
                        borderRadius: "18px",
                        border: "1px solid hsl(142 50% 45% / 0.2)",
                        overflow: "hidden",
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Avatar — same gradient style as OrgRow */}
                        <div
                          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[0.62rem] font-bold font-[family-name:var(--font-display)]"
                          style={{ background: "linear-gradient(135deg, hsl(142 50% 40%), hsl(142 60% 50%))" }}
                        >
                          {a.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                            {a.fullName}
                          </p>
                          <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                            {a.email}
                          </p>
                        </div>

                        {/* Right side metadata */}
                        <div className="hidden sm:flex items-center gap-5 text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                          {a.attendedAt && (
                            <span className="flex items-center gap-1.5 text-[0.9rem] font-bold tabular-nums">
                              <Clock className="w-4 h-4" />
                              {new Date(a.attendedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>

                        {/* Scanned By (Volunteer) badge — subtle, theme-consistent */}
                        <span
                          className="flex-shrink-0 flex items-center gap-1 text-[0.58rem] font-medium px-2 py-1 rounded-full font-[family-name:var(--font-mono)] max-w-[140px]"
                          style={{
                            background: "hsl(0 0% 0% / 0.05)",
                            color: "var(--col-secondary)",
                            border: "1px solid hsl(0 0% 80% / 0.4)",
                          }}
                          title={`Scanned by ${a.scannedBy ?? "Event Admin"}`}
                        >
                          <UserCheck className="w-3 h-3 flex-shrink-0" strokeWidth={1.6} />
                          <span className="truncate">{a.scannedBy ?? "Event Admin"}</span>
                        </span>

                        {/* Status badge — same as OrgRow status badge */}
                        <span
                          className="flex-shrink-0 text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
                          style={{
                            background: "hsl(142 50% 45% / 0.1)",
                            color: "hsl(142 50% 35%)",
                          }}
                        >
                          Checked In
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                selected.absentAttendees.length === 0 ? (
                  <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
                    <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: "hsl(142 50% 45%)" }} />
                    <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
                      {selected.totalRegistered === 0 ? "No registrations yet" : "Everyone checked in! 🎉"}
                    </p>
                    <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                      {selected.totalRegistered === 0
                        ? "No students have registered for this event yet."
                        : "All registered attendees have been scanned in."}
                    </p>
                  </Squircle>
                ) : (
                  selected.absentAttendees.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        ...glassCard,
                        borderRadius: "18px",
                        border: "1px solid hsl(0 0% 80% / 0.25)",
                        overflow: "hidden",
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[0.62rem] font-bold font-[family-name:var(--font-display)]"
                          style={{ background: "linear-gradient(135deg, hsl(0 0% 55%), hsl(0 0% 65%))" }}
                        >
                          {a.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                            {a.fullName}
                          </p>
                          <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                            {a.email}
                          </p>
                        </div>

                        {/* Right side metadata */}
                        <div className="hidden sm:flex items-center gap-5 text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                          {a.ticketToken && (
                            <span className="flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              {a.ticketToken.slice(-8)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(a.registeredAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
                          style={{
                            background: "hsl(0 0% 0% / 0.06)",
                            color: "var(--col-secondary)",
                          }}
                        >
                          Not Arrived
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
