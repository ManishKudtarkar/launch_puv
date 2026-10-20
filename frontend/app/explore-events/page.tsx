"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LandingNav from "@/components/shared/LandingNav";
import { api, type Event as ApiEvent, getApiErrorMessage } from "@/lib/api-client";
import { Calendar, Clock3, Filter, MapPin, Search, ArrowRight, Grid, List } from "lucide-react";

type TimelineFilter = "all" | "upcoming" | "ongoing" | "past";

function eventUrlFor(event: ApiEvent) {
  if (event.slug && event.slug.trim()) return `/events/${event.slug}`;
  if (event.id) return `/events/${event.id}`;
  const title = (event.title || "event").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `/events/${title}`;
}

function normalizeEventStatus(status?: string) {
  return (status || "DRAFT").toString().toUpperCase();
}

function classifyEvent(startDate: string, endDate: string): "upcoming" | "ongoing" | "past" {
  const now = new Date();

  // Compare using date-only boundaries so a multi-day event stays "ongoing"
  // for the entire calendar day of endDate (until midnight of that day passes).
  const startDay = new Date(startDate.slice(0, 10) + "T00:00:00");
  // End of the end-date calendar day (23:59:59.999)
  const endDayClose = new Date(endDate.slice(0, 10) + "T23:59:59.999");

  if (now < startDay) return "upcoming";
  if (now >= startDay && now <= endDayClose) return "ongoing";
  return "past";
}

function formatShortDate(item: string) {
  if (!item) return "";
  const d = new Date(item);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en", { day: "2-digit", month: "short" });
}

function formatEventDate(event: ApiEvent): string {
  const start = event.startDate || event.eventDate || "";
  const end = event.endDate || "";
  const isMultiDay = event.isMultiDay === true || (start && end && start.slice(0, 10) !== end.slice(0, 10));

  if (!start) return "TBA";

  const startD = new Date(start);
  if (isNaN(startD.getTime())) return "TBA";

  if (!isMultiDay || !end) {
    return startD.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" });
  }

  const endD = new Date(end);
  if (isNaN(endD.getTime())) {
    return startD.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" });
  }

  const startMonth = startD.toLocaleDateString("en", { month: "short" });
  const endMonth = endD.toLocaleDateString("en", { month: "short" });
  const endYear = endD.getFullYear();
  const startDay = startD.getDate();
  const endDay = endD.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${endYear}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}, ${endYear}`;
}

function formatTimeRange(startIso: string, endIso: string) {
  if (!startIso) return "TBA";

  // Extract HH:mm directly from the UTC ISO string so the time the admin
  // typed (e.g. 09:00) is shown as-is, regardless of the viewer's timezone.
  const extractTime = (iso: string): string | null => {
    // ISO format: "2026-10-18T09:00:00.000Z" → take chars 11-15
    if (iso.length >= 16) {
      const hhmm = iso.slice(11, 16); // "09:00"
      const [hh, mm] = hhmm.split(":").map(Number);
      if (!isNaN(hh) && !isNaN(mm)) {
        const h12 = hh % 12 || 12;
        const ampm = hh < 12 ? "AM" : "PM";
        return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
      }
    }
    return null;
  };

  const startLabel = extractTime(startIso);
  if (!startLabel) return "TBA";
  const endLabel = endIso ? extractTime(endIso) : null;
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
}

export default function ExploreEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>("all");
  const [search, setSearch] = useState("");
  const [layoutMode, setLayoutMode] = useState<"grid" | "card">("grid");

  useEffect(() => {
    let active = true;

    const fetchEvents = () => {
      api.events
        .list()
        .then((items) => {
          if (!active) return;
          setEvents(items);
        })
        .catch((error) => {
          if (!active) return;
          setLoadError(getApiErrorMessage(error));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchEvents();

    // Re-fetch when the tab regains focus so edits made in the wizard
    // (another tab or a back-navigation) are reflected immediately.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchEvents();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const publishedEvents = useMemo(() => {
    return events.filter((item) => {
      const st = normalizeEventStatus(item.status);
      return st === "PUBLISHED" || !item.status; // Fallback for legacy events without status
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    return publishedEvents.filter((event) => {
      const description = (event.description || "").toLowerCase();
      const venue = (event.venue || "").toLowerCase();
      const organizer = (event.organizer || "").toLowerCase();
      const title = (event.title || "").toLowerCase();
      const category = (event.category || "").toLowerCase();
      const matchSearch =
        !search.trim() ||
        title.includes(search.toLowerCase()) ||
        description.includes(search.toLowerCase()) ||
        venue.includes(search.toLowerCase()) ||
        organizer.includes(search.toLowerCase()) ||
        category.includes(search.toLowerCase());

      // Use startDate/endDate (calendar range) for classification.
      // Fall back to eventDate for legacy single-day events.
      const start = event.startDate || event.eventDate || "";
      const end = event.endDate || event.startDate || event.eventDate || "";
      const timeline = (start && end) ? classifyEvent(start, end) : "upcoming";
      const matchTimeline =
        selectedTimeline === "all"
          ? true                        // "All Events" shows every timeline bucket
          : timeline === selectedTimeline;

      return matchSearch && matchTimeline;
    });
  }, [publishedEvents, selectedTimeline, search]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] font-[family-name:var(--font-ui)] text-[var(--col-primary)]">
      <div className="blob-container" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      {/* Navigation Header — shared with the landing page (same mobile hamburger + drawer) */}
      <LandingNav />

      {/* Hero Header */}
      <section className="mx-auto max-w-[1280px] px-4 py-8 md:px-10">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-[var(--accent)] bg-[hsl(35_30%_97%_/_0.58)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
            <Calendar className="mr-2 h-3.5 w-3.5" /> Campus Event Directory
          </div>
          <h1 className="text-balance text-center text-[clamp(2.35rem,5vw,4.2rem)] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Campus events, gathered.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[0.92rem] leading-7 text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Find the programs, gatherings, and opportunities shaping life at PUVerse.
          </p>
        </div>

        {/* Filter & View Bar */}
        <div className="mt-9 rounded-[24px] border border-[hsl(25_18%_75%_/_0.5)] bg-[hsl(35_24%_97%_/_0.64)] p-3 shadow-[0_15px_50px_var(--shadow)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-1 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              <Filter className="h-4 w-4" />
            </div>

            {[
              { key: "all", label: "All Events" },
              { key: "ongoing", label: "Ongoing" },
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedTimeline(item.key as TimelineFilter)}
                className={`rounded-full px-4 py-2 text-[0.72rem] font-semibold transition-all cursor-pointer font-[family-name:var(--font-display)] ${selectedTimeline === item.key
                  ? "bg-[var(--col-primary)] text-[var(--bg)] shadow-md"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--col-secondary)] hover:text-[var(--col-primary)]"
                  }`}
              >
                {item.label}
              </button>
            ))}

            <div className="relative ml-auto min-w-[240px] flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--col-dim)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campus events..."
                className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-11 pr-4 text-[0.78rem] text-[var(--col-primary)] outline-none transition-all placeholder:text-[var(--col-dim)] focus:border-[var(--accent)] font-[family-name:var(--font-ui)]"
              />
            </div>

            {/* Layout Toggle Button */}
            <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={() => setLayoutMode("card")}
                className={`rounded-full p-2 transition-colors cursor-pointer ${layoutMode === "card" ? "bg-[var(--col-primary)] text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)]"}`}
                title="Responsive Flex Card View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                className={`rounded-full p-2 transition-colors cursor-pointer ${layoutMode === "grid" ? "bg-[var(--col-primary)] text-[var(--bg)]" : "text-[var(--col-secondary)] hover:text-[var(--col-primary)]"}`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Events Section */}
        <div className="mt-8">
          {loading && (
            <div className="rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.4)] py-14 text-center text-[0.86rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              Loading published events...
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-[24px] border border-[var(--danger)] bg-[hsl(0_0%_96%_/_0.4)] py-14 text-center text-[0.86rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">
              {loadError}
            </div>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.4)] py-16 text-center text-[0.86rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
              No matching events found in this category.
            </div>
          )}

          {!loading && filteredEvents.length > 0 && (
            <div
              className={
                layoutMode === "card"
                  ? "grid gap-5 w-full max-w-full"
                  : // Fixed columns: 1 (mobile) → 2 (tablet) → 3 (desktop). Rows stretch so cards share a height.
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto my-6 items-stretch"
              }
            >
              {filteredEvents.map((event) => {
                const start = event.startDate || event.eventDate || "";
                const end = event.endDate || event.startDate || event.eventDate || "";
                const timeline = classifyEvent(
                  start || new Date().toISOString(),
                  end || new Date().toISOString(),
                );

                // Use startTime / endTime for the time-of-day display on the card.
                // These fields hold the actual clock time the admin set (e.g. 09:00 – 17:00).
                // startDate / endDate are date-range boundaries and must NOT be used here.
                const timeStart = event.startTime || "";
                const timeEnd = event.endTime || "";

                const venue = (event.venue as string) || "Campus Venue";
                const eventCategory = (event.category as string) || "General";
                const eventOrganizer = (event.organizer as string) || "PUVerse";
                const capacity = (event.capacity as number) || 100;
                const attendance = (event.registered as number) || 0;

                return (
                  <article
                    key={event.id}
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(eventUrlFor(event))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(eventUrlFor(event));
                      }
                    }}
                    className={`w-full overflow-hidden rounded-[24px] border border-[hsl(25_18%_75%_/_0.48)] bg-[hsl(35_24%_97%_/_0.68)] backdrop-blur-xl shadow-[0_10px_35px_var(--shadow)] transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_18px_50px_var(--shadow-lg)] hover:-translate-y-1 group cursor-pointer ${layoutMode === "card" ? "md:grid md:grid-cols-[minmax(13rem,31%)_minmax(0,1fr)]" : "flex flex-col h-full min-w-0"
                      }`}
                  >
                    {/* Auto-Sizing Image / Banner Wrapper */}
                    <div
                      className={`relative overflow-hidden flex items-center justify-center bg-[hsl(0_0%_92%_/_0.6)] w-full aspect-[16/9] ${layoutMode === "card" ? "md:self-start" : ""}`}
                    >
                      {event.bannerUrl ? (
                        <img
                          src={event.bannerUrl as string}
                          alt={event.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[200px] bg-[linear-gradient(135deg,var(--col-primary)_0%,var(--col-primary)_58%,var(--accent)_150%)] flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-white font-extrabold text-xl tracking-wide uppercase font-[family-name:var(--font-display)]">
                            {eventCategory}
                          </span>
                          <span className="mt-1 text-xs text-white/80 font-[family-name:var(--font-mono)] uppercase tracking-widest">
                            PUVerse Campus
                          </span>
                        </div>
                      )}

                      {/* Overlaid Badges */}
                      <div className="absolute left-3.5 top-3.5 rounded-full bg-[hsl(0_0%_96%_/_0.9)] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-[var(--accent)] border border-[hsl(0_0%_85%_/_0.6)] backdrop-blur-md font-[family-name:var(--font-mono)] shadow-sm">
                        {eventCategory}
                      </div>
                      <div className="absolute bottom-3.5 left-3.5 rounded-full bg-[var(--col-primary)]/85 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm font-[family-name:var(--font-mono)]">
                        {timeline}
                      </div>
                    </div>

                    {/* Content & Action Area */}
                    <div className={`flex min-w-0 flex-col justify-between ${layoutMode === "card" ? "p-5 md:p-7" : "flex-1 p-5"}`}>
                      <div>
                        {/* Event Timing Bar */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] font-[family-name:var(--font-mono)]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatEventDate(event)}
                          </span>
                          <span className="text-[var(--col-dim)]">•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTimeRange(timeStart, timeEnd)}
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          className={`mt-2.5 text-[clamp(1.15rem,2vw,1.55rem)] font-bold leading-snug text-[var(--col-primary)] group-hover:text-[var(--accent)] transition-colors font-[family-name:var(--font-display)] ${layoutMode === "card" ? "" : "line-clamp-2 min-h-[2.75em] break-words"}`}
                          title={event.title}
                        >
                          {event.title}
                        </h2>

                        {/* Organizer & Venue Tagline */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--col-secondary)] font-[family-name:var(--font-mono)]">
                          <span className="text-[var(--accent)]">{eventOrganizer}</span>
                          <span className="text-[var(--col-dim)]">•</span>
                          <span className="normal-case text-[var(--col-secondary)] font-medium flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[var(--accent)] flex-shrink-0" />
                            {venue}
                          </span>
                        </div>

                      </div>

                      {/* Action Button Area matching PUVerse Design System */}
                      <div
                        className={
                          layoutMode === "card"
                            ? "mt-7 flex flex-col gap-3 sm:flex-row items-center pt-2"
                            : // Grid: pinned to the card bottom, full-width stacked buttons (fit narrow 3-col cards)
                            "mt-auto pt-5 flex flex-col gap-2.5 [&>button]:w-full"
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(eventUrlFor(event));
                          }}
                          className="w-full rounded-full bg-[var(--col-primary)] px-6 py-2.5 text-center text-xs font-bold text-[var(--bg)] transition-all duration-300 hover:bg-[var(--accent)] hover:scale-[1.02] active:scale-[0.98] sm:w-auto inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_12px_var(--shadow-lg)] font-[family-name:var(--font-display)]"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(eventUrlFor(event));
                          }}
                          className="w-full rounded-full border border-[hsl(0_0%_85%_/_0.6)] bg-[hsl(0_0%_96%_/_0.55)] px-5 py-2.5 text-center text-xs font-semibold text-[var(--col-primary)] transition-all duration-300 hover:bg-[hsl(0_0%_96%_/_0.9)] hover:border-[var(--line)] sm:w-auto cursor-pointer font-[family-name:var(--font-display)]"
                        >
                          Register Now ({Math.max(capacity - attendance, 0)} spots left)
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
