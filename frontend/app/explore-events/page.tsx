"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { useDemoStore } from "@/store/demo-store";
import { ROLE_HOME } from "@/constants/navigation";
import { api, type Event as ApiEvent, getApiErrorMessage } from "@/lib/api-client";
import { Calendar, Clock3, Filter, MapPin, Search, LogOut, LayoutDashboard, User, ArrowRight, Grid, List } from "lucide-react";

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
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "past";
}

function formatLongDate(item: string) {
  if (!item) return "TBA";
  const d = new Date(item);
  if (isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeRange(start: string, end: string) {
  if (!start) return "TBA";
  const startDate = new Date(start);
  if (isNaN(startDate.getTime())) return "TBA";
  const endDate = new Date(end || start);
  const startLabel = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endLabel = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${startLabel} - ${endLabel}`;
}

export default function ExploreEventsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const authLogout = useAuthStore((s) => s.logout);
  const demoLogout = useDemoStore((s) => s.logout);

  const isLoggedIn = initialized && !!user && !!accessToken;
  const uiRole = user ? backendRoleToUiRole(user) : "student";
  const dashboardHref = "/student"; // always route to student portal; Event Admins access /admin from there
  const roleLabel =
    uiRole === "super_admin"
      ? "Super Admin"
      : uiRole === "admin"
        ? "Event Admin"
        : uiRole === "platform_admin"
          ? "Platform Admin"
          : "Student";

  const [profileOpen, setProfileOpen] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>("all");
  const [search, setSearch] = useState("");
  const [layoutMode, setLayoutMode] = useState<"card" | "grid">("card");

  useEffect(() => {
    let active = true;
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

    return () => {
      active = false;
    };
  }, []);

  const publishedEvents = useMemo(() => {
    return events.filter((item) => {
      const st = normalizeEventStatus(item.status);
      return st === "PUBLISHED" || st === "APPROVED" || st === "DRAFT" || st === "PENDING_APPROVAL" || !item.status;
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

      const start = event.startTime || event.eventDate || event.endTime || new Date().toISOString();
      const end = event.endTime || event.startTime || event.eventDate || new Date().toISOString();
      const timeline = classifyEvent(start, end);
      const matchTimeline = selectedTimeline === "all" || timeline === selectedTimeline;

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
      {/* Navigation Header */}
      <nav className="sticky top-0 z-[200] border-b border-[hsl(25_18%_75%_/_0.42)] bg-[hsl(35_20%_96%_/_0.78)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-[7px]">
            <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)] shadow-[0_1px_4px_var(--shadow-lg)]" />
            <span className="text-[1.1rem] leading-none">
              <span className="font-extrabold tracking-[-0.02em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/explore-events" className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Explore Events</Link>
            <Link href="/student/communities" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]">Departments</Link>
            <Link href="/student/communities?filter=clubs" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]">Clubs</Link>
            <Link href="#about" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]">About</Link>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--col-primary)] shadow-sm transition-all hover:scale-105 cursor-pointer"
                  aria-label="Open profile menu"
                >
                  <User className="h-4 w-4" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-52 rounded-[20px] border border-[hsl(25_18%_75%_/_0.55)] bg-[hsl(35_20%_97%_/_0.98)] p-2.5 shadow-2xl backdrop-blur-xl z-50">
                    <div className="px-3 py-2 border-b border-[hsl(25_18%_75%_/_0.3)] mb-1">
                      <p className="text-[0.78rem] font-semibold text-[var(--col-primary)] truncate font-[family-name:var(--font-display)]">
                        {user.fullName || "User"}
                      </p>
                      <p className="text-[0.66rem] text-[var(--col-dim)] truncate font-[family-name:var(--font-mono)]">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium bg-[var(--accent)] text-white">
                        {roleLabel}
                      </span>
                    </div>

                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-[0.78rem] font-medium text-[var(--col-secondary)] hover:bg-[var(--surface)] hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={async () => {
                        await authLogout();
                        demoLogout();
                        setProfileOpen(false);
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[0.78rem] font-medium text-[var(--col-secondary)] hover:bg-[var(--surface)] hover:text-[var(--danger)] cursor-pointer font-[family-name:var(--font-ui)]"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-[hsl(0_0%_85%_/_0.6)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--col-primary)] hover:bg-[var(--surface)] font-[family-name:var(--font-display)] transition-colors">Login</Link>
                <Link href="/register" className="rounded-full bg-[var(--col-primary)] px-4 py-2 text-[0.78rem] font-semibold text-[var(--bg)] shadow-md hover:opacity-90 font-[family-name:var(--font-display)] transition-opacity">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

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
              { key: "upcoming", label: "Upcoming" },
              { key: "ongoing", label: "Ongoing" },
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
            <div className={layoutMode === "card" ? "grid gap-5" : "grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))]"}>
              {filteredEvents.map((event) => {
                const start = event.startTime || event.eventDate || "";
                const end = event.endTime || start || "";
                const timeline = classifyEvent(start || new Date().toISOString(), end || new Date().toISOString());

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
                    className={`w-full overflow-hidden rounded-[24px] border border-[hsl(25_18%_75%_/_0.48)] bg-[hsl(35_24%_97%_/_0.68)] backdrop-blur-xl shadow-[0_10px_35px_var(--shadow)] transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_18px_50px_var(--shadow-lg)] hover:-translate-y-1 group cursor-pointer ${layoutMode === "card" ? "md:grid md:grid-cols-[minmax(13rem,31%)_minmax(0,1fr)]" : "flex flex-col"
                      }`}
                  >
                    {/* Auto-Sizing Image / Banner Wrapper */}
                    <div
                      className={`relative overflow-hidden flex items-center justify-center bg-[hsl(0_0%_92%_/_0.6)] ${layoutMode === "card"
                          ? "w-full aspect-[16/9] md:aspect-auto md:min-h-full"
                          : "w-full aspect-[16/9]"
                        }`}
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
                    <div className="flex min-w-0 flex-col justify-between p-5 md:p-7">
                      <div>
                        {/* Event Timing Bar */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] font-[family-name:var(--font-mono)]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatLongDate(start)}
                          </span>
                          <span className="text-[var(--col-dim)]">•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTimeRange(start, end)}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="mt-2.5 text-[clamp(1.15rem,2vw,1.55rem)] font-bold leading-snug text-[var(--col-primary)] group-hover:text-[var(--accent)] transition-colors font-[family-name:var(--font-display)]">
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

                        {/* Description */}
                        <p className="mt-3.5 text-[var(--col-secondary)] text-sm leading-relaxed line-clamp-3 font-[family-name:var(--font-ui)]">
                          {event.description || "Crafting seamless university experiences and campus digital events. Click View Details to learn more and register for this session."}
                        </p>
                      </div>

                      {/* Action Button Area matching PUVerse Design System */}
                      <div className="mt-7 flex flex-col gap-3 sm:flex-row items-center pt-2">
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
