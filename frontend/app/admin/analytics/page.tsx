"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Squircle } from "@squircle-js/react";
import {
  api,
  getApiErrorMessage,
  type Event,
  type EventDay,
  type AnalyticsRow,
  type AnalyticsResult,
} from "@/lib/api-client";
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
  Download,
  Calendar,
} from "lucide-react";

// ── Same glassCard as /admin/organizations ───────────────────────────────────
const glassCard = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

type StatusFilter = "ALL" | "PRESENT" | "ABSENT";

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");

  // Day selector
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>(""); // "" = cumulative, "all" = all-days

  // Status filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Analytics result
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // ── Load events ─────────────────────────────────────────────────────────────
  const loadEvents = useCallback(() => {
    setLoadingEvents(true);
    setError("");
    api.events
      .mine()
      .then((evs) => {
        setEvents(evs);
        if (evs.length > 0) setSelectedEventId(evs[0].id);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // ── Fetch EventDays when event changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedEventId) return;
    setEventDays([]);
    setSelectedDayId("");
    api.events.days.list(selectedEventId)
      .then((days) => {
        setEventDays(days);
        // Auto-select today's day if present
        if (days.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          const today = days.find((d) => d.date.split("T")[0] === todayStr);
          // If multi-day, default to today; otherwise leave as cumulative
          if (days.length > 1) setSelectedDayId(today ? today.id : "");
        }
      })
      .catch(() => setEventDays([]));
  }, [selectedEventId]);

  // ── Fetch analytics whenever event, day, or status changes ─────────────────
  useEffect(() => {
    if (!selectedEventId) return;
    setLoadingAnalytics(true);
    setError("");
    api.admin.analytics
      .get(selectedEventId, {
        dayId: selectedDayId || undefined,
        status: statusFilter,
      })
      .then((res) => setAnalyticsResult(res))
      .catch((e) => { setError(getApiErrorMessage(e)); setAnalyticsResult(null); })
      .finally(() => setLoadingAnalytics(false));
  }, [selectedEventId, selectedDayId, statusFilter]);

  // ── Derived rows for the table ──────────────────────────────────────────────
  const tableRows = useMemo<AnalyticsRow[]>(() => {
    if (!analyticsResult) return [];
    if (analyticsResult.type === "cumulative" || analyticsResult.type === "day") {
      return analyticsResult.rows;
    }
    // multi_day: flatten all days' rows
    return analyticsResult.days.flatMap((d) => d.rows);
  }, [analyticsResult]);

  const metrics = useMemo(() => {
    if (!analyticsResult) return null;
    if (analyticsResult.type === "multi_day") {
      const totalRegistered = analyticsResult.days.reduce((s, d) => s + d.totalRegistered, 0);
      const totalPresent = analyticsResult.days.reduce((s, d) => s + d.totalPresent, 0);
      const totalAbsent = analyticsResult.days.reduce((s, d) => s + d.totalAbsent, 0);
      const turnoutRate = totalRegistered > 0
        ? parseFloat(((totalPresent / totalRegistered) * 100).toFixed(1)) : 0;
      return { totalRegistered, totalPresent, totalAbsent, turnoutRate };
    }
    return {
      totalRegistered: analyticsResult.totalRegistered,
      totalPresent: analyticsResult.totalPresent,
      totalAbsent: analyticsResult.totalAbsent,
      turnoutRate: analyticsResult.turnoutRate,
    };
  }, [analyticsResult]);

  // ── Download CSV ────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!selectedEventId) return;
    setDownloading(true);
    const selectedEvent = events.find((e) => e.id === selectedEventId);
    const slugPart = selectedEvent?.slug || selectedEventId.slice(-8);
    const dayPart = selectedDayId === "all" ? "all-days" : selectedDayId ? `day-${selectedDayId.slice(-6)}` : "master";
    const filename = `attendance-${slugPart}-${dayPart}.xlsx`;
    try {
      await api.admin.export.download(
        selectedEventId,
        { dayId: selectedDayId || undefined, status: statusFilter },
        filename,
      );
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  const loading = loadingEvents || loadingAnalytics;
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">
          Admin View
        </p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Analytics
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]">
            {" "}.
          </span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          Real-time attendance analytics and CSV exports — filter by day and status.
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full mb-8">
        {[
          { label: "Registered", value: metrics?.totalRegistered ?? 0, Icon: Users, color: "var(--accent)" },
          { label: "Present", value: metrics?.totalPresent ?? 0, Icon: CheckCircle2, color: "hsl(142 50% 40%)" },
          { label: "Absent", value: metrics?.totalAbsent ?? 0, Icon: XCircle, color: "#F87171" },
          { label: "Turnout Rate", value: metrics ? `${metrics.turnoutRate}%` : "—", Icon: Target, color: "hsl(38 90% 50%)" },
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

      {/* ── Controls row: event selector + day selector + status filters + download ── */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Row 1: Event + refresh */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 min-w-0">
            {selectedEvent && (
              <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                {selectedEvent.title}
              </p>
            )}
          </div>

          {!loadingEvents && events.length > 0 && (
            <div className="relative flex-shrink-0">
              <select
                value={selectedEventId}
                onChange={(e) => { setSelectedEventId(e.target.value); setAnalyticsResult(null); }}
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
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--col-dim)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

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

        {/* Row 2: Status filters (left) + Day selector + Download (right) */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Status filter pills */}
          <div
            className="flex gap-1 p-1 rounded-[14px] flex-shrink-0"
            style={{
              background: "hsl(0 0% 100% / 0.45)",
              border: "1px solid hsl(0 0% 85% / 0.5)",
            }}
          >
            {(["ALL", "PRESENT", "ABSENT"] as StatusFilter[]).map((s) => {
              const isActive = statusFilter === s;
              const colors: Record<StatusFilter, { bg: string; text: string }> = {
                ALL: { bg: "var(--col-primary)", text: "var(--bg)" },
                PRESENT: { bg: "hsl(142 50% 40%)", text: "#fff" },
                ABSENT: { bg: "#EF4444", text: "#fff" },
              };
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="text-[0.72rem] font-semibold px-4 py-2 transition-all duration-200 font-[family-name:var(--font-ui)] cursor-pointer"
                  style={{
                    borderRadius: "10px",
                    background: isActive ? colors[s].bg : "transparent",
                    color: isActive ? colors[s].text : "var(--col-secondary)",
                  }}
                >
                  {s === "ALL" ? "All" : s === "PRESENT" ? "Present" : "Absent"}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Day selector (only shown when event has days) */}
            {eventDays.length > 0 && (
              <div className="relative flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[var(--col-dim)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayId(e.target.value)}
                  className="appearance-none pl-8 pr-9 py-2.5 text-[0.82rem] font-semibold outline-none cursor-pointer font-[family-name:var(--font-display)]"
                  style={{
                    background: "hsl(0 0% 100% / 0.5)",
                    border: "1px solid hsl(0 0% 85% / 0.5)",
                    borderRadius: "14px",
                    color: "var(--col-primary)",
                    minWidth: 200,
                  }}
                >
                  <option value="">All Days (Master Summary)</option>
                  <option value="all">All Days (Multi-Tab Export)</option>
                  {eventDays.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title ?? `Day ${d.dayNumber}`} — {new Date(`${d.date.split("T")[0]}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--col-dim)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Download CSV */}
            <button
              onClick={handleDownload}
              disabled={downloading || loading || !selectedEventId}
              className="flex items-center gap-1.5 text-[0.76rem] font-bold px-4 py-2.5 transition-all font-[family-name:var(--font-display)] cursor-pointer flex-shrink-0"
              style={{
                borderRadius: "14px",
                background: downloading ? "hsl(0 0% 90%)" : "var(--col-primary)",
                color: downloading ? "var(--col-dim)" : "var(--bg)",
                opacity: !selectedEventId ? 0.5 : 1,
              }}
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading ? "Exporting…" : "Download Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
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

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* ── No events ─────────────────────────────────────────────────────────── */}
      {!loading && events.length === 0 && !error && (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
          <BarChart3 className="w-8 h-8 mb-3 opacity-40" style={{ color: "var(--accent)" }} />
          <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">No events found</p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Create an event to see attendance analytics here.
          </p>
        </Squircle>
      )}

      {/* ── Main analytics content ────────────────────────────────────────────── */}
      {!loading && analyticsResult && (
        <div className="space-y-4">
          {/* Turnout bar */}
          {metrics && (
            <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassCard}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                  Attendance Rate
                </p>
                <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">
                  {metrics.turnoutRate}%
                </p>
              </div>
              <div className="h-2 rounded-full bg-[hsl(0_0%_85%_/_0.35)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${metrics.turnoutRate}%`,
                    background:
                      metrics.turnoutRate >= 80
                        ? "hsl(142 60% 40%)"
                        : metrics.turnoutRate >= 50
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
          )}

          {/* Multi-day section headers (when type = multi_day, show per-day sub-headers) */}
          {analyticsResult.type === "multi_day" && (
            <div className="flex gap-2 flex-wrap">
              {analyticsResult.days.map((d) => (
                <Squircle
                  key={d.dayId}
                  cornerRadius={14}
                  cornerSmoothing={1}
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ ...glassCard, boxShadow: "none", border: "1px solid hsl(0 0% 85% / 0.4)" }}
                >
                  <div>
                    <p className="text-[0.7rem] font-bold text-[var(--col-dim)] uppercase font-[family-name:var(--font-mono)]">{d.dayTitle}</p>
                    <p className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                      {d.totalPresent}/{d.totalRegistered} present
                      <span className="text-[0.64rem] text-[var(--col-secondary)] ml-1">({d.turnoutRate}%)</span>
                    </p>
                  </div>
                </Squircle>
              ))}
            </div>
          )}

          {/* Attendee rows */}
          <div className="w-full overflow-x-auto">
            <div className="space-y-3 min-w-[300px]">
              {tableRows.length === 0 ? (
                <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
                  <CheckCircle2 className="w-8 h-8 mb-3 opacity-30" style={{ color: "hsl(142 50% 40%)" }} />
                  <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">No records</p>
                  <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                    No attendees match the current filters.
                  </p>
                </Squircle>
              ) : (
                tableRows.map((row, i) => {
                  const isPresent = row.status === "PRESENT";
                  return (
                    <div
                      key={i}
                      style={{
                        ...glassCard,
                        borderRadius: "18px",
                        border: `1px solid ${isPresent ? "hsl(142 50% 45% / 0.2)" : "hsl(0 0% 80% / 0.25)"}`,
                        overflow: "hidden",
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[0.62rem] font-bold font-[family-name:var(--font-display)]"
                          style={{
                            background: isPresent
                              ? "linear-gradient(135deg, hsl(142 50% 40%), hsl(142 60% 50%))"
                              : "linear-gradient(135deg, hsl(0 0% 55%), hsl(0 0% 65%))",
                          }}
                        >
                          {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                            {row.name}
                          </p>
                          <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                            {row.email}
                          </p>
                        </div>

                        {/* Right metadata */}
                        <div className="hidden sm:flex items-center gap-5 text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                          {isPresent && row.checkedInAt ? (
                            <span className="flex items-center gap-1.5 text-[0.9rem] font-bold tabular-nums">
                              <Clock className="w-4 h-4" />
                              {new Date(row.checkedInAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : row.ticketToken ? (
                            <span className="flex items-center gap-1 text-[0.64rem] text-[var(--col-dim)]">
                              <QrCode className="w-3 h-3" />
                              {row.ticketToken.slice(-8)}
                            </span>
                          ) : null}
                        </div>

                        {/* Scanned By badge (present only) */}
                        {isPresent && (
                          <span
                            className="flex-shrink-0 hidden sm:flex items-center gap-1 text-[0.58rem] font-medium px-2 py-1 rounded-full font-[family-name:var(--font-mono)] max-w-[140px]"
                            style={{
                              background: "hsl(0 0% 0% / 0.05)",
                              color: "var(--col-secondary)",
                              border: "1px solid hsl(0 0% 80% / 0.4)",
                            }}
                            title={`Scanned by ${row.checkedInBy ?? "Event Admin"}`}
                          >
                            <UserCheck className="w-3 h-3 flex-shrink-0" strokeWidth={1.6} />
                            <span className="truncate">{row.checkedInBy ?? "Event Admin"}</span>
                          </span>
                        )}

                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
                          style={{
                            background: isPresent ? "hsl(142 50% 45% / 0.1)" : "hsl(0 0% 0% / 0.06)",
                            color: isPresent ? "hsl(142 50% 35%)" : "var(--col-secondary)",
                          }}
                        >
                          {isPresent ? "Checked In" : "Not Arrived"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
