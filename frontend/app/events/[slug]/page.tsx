"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Squircle } from "@squircle-js/react";
import {
  api,
  getApiErrorMessage,
  type Event,
  type AgendaItem,
  type Speaker,
  type Sponsor,
  type Registration,
  type RegistrationField,
} from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Check,
  X,
  AlertCircle,
  FileText,
  Ticket,
  CalendarX,
} from "lucide-react";
import { isEventExpired } from "@/lib/event-status";

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

const inputStyle = {
  background: "hsl(0 0% 100% / 0.65)",
  border: "1px solid hsl(0 0% 85% / 0.6)",
  borderRadius: "12px",
};

const inputClass =
  "w-full px-3.5 py-2.5 text-[0.82rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30";

const labelClass =
  "block text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[var(--col-secondary)] font-[family-name:var(--font-mono)] mb-1.5";

const FIELD_CATALOG: Record<string, { label: string; inputType: string; category?: string }> = {
  FULL_NAME: { label: "Full Name", inputType: "TEXT" },
  EMAIL: { label: "University Email", inputType: "EMAIL" },
  UNIVERSITY_ID: { label: "University ID / Roll Number", inputType: "TEXT" },
  PHONE_NUMBER: { label: "Phone Number", inputType: "PHONE" },
  COLLEGE: { label: "College / Faculty", inputType: "TEXT" },
  DEPARTMENT: { label: "Department / Stream", inputType: "TEXT" },
  COURSE: { label: "Course / Degree", inputType: "TEXT" },
  YEAR: { label: "Current Year", inputType: "NUMBER" },
  SEMESTER: { label: "Current Semester", inputType: "NUMBER" },
  CGPA: { label: "Current CGPA", inputType: "NUMBER" },
  GENDER: { label: "Gender", inputType: "TEXT" },
  DATE_OF_BIRTH: { label: "Date of Birth", inputType: "DATE" },
  CITY: { label: "City / Hometown", inputType: "TEXT" },
  GITHUB: { label: "GitHub Profile", inputType: "URL" },
  LINKEDIN: { label: "LinkedIn Profile", inputType: "URL" },
  TECHNICAL_SKILLS: { label: "Technical Skills", inputType: "TEXTAREA" },
  PROGRAMMING_LANGUAGES: { label: "Programming Languages", inputType: "TEXTAREA" },
  TEAM_NAME: { label: "Team Name", inputType: "TEXT" },
  TEAM_SIZE: { label: "Team Size", inputType: "NUMBER" },
  PROJECT_TITLE: { label: "Project Title", inputType: "TEXT" },
  PROJECT_DESCRIPTION: { label: "Project Description", inputType: "TEXTAREA" },
  TECHNOLOGY_STACK: { label: "Technology Stack", inputType: "TEXTAREA" },
  EXPERIENCE_LEVEL: { label: "Experience Level", inputType: "TEXT" },
  LEARNING_GOAL: { label: "Learning Goal", inputType: "TEXTAREA" },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeEventStatus(status?: string) {
  return (status || "DRAFT").toString().toUpperCase();
}

function initialsFromName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PublicEventSlugPage() {
  const params = useParams();
  const routeSlug = (params.slug as string) || "";
  const user = useAuthStore((s) => s.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegModal, setShowRegModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Dynamic Registration Form state
  const [formFields, setFormFields] = useState<{ key: string; label: string; inputType: string; required: boolean }[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Clock for expiry checks. Ticks every 30s so an open page locks registration
  // the moment the event ends, without calling Date.now() during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  // Once true, the CTA, form and modal are all withheld (modal render is gated too).
  const isExpired = isEventExpired(event, now);

  useEffect(() => {
    let active = true;

    api.events
      .list()
      .then((items) => {
        if (!active) return;
        const target = items.find(
          (item) => item.slug === routeSlug || slugify(item.title || "") === routeSlug || item.id === routeSlug
        );
        if (!target) {
          setError("Event not found.");
          setLoading(false);
          return;
        }

        const eventId = target.id;
        const related = items
          .filter((item) => item.id !== eventId && normalizeEventStatus(item.status) === "PUBLISHED")
          .slice(0, 3);
        setRelatedEvents(related);

        Promise.all([
          api.events.get(eventId),
          api.events.agenda.list(eventId).catch(() => []),
          api.events.speakers.list(eventId).catch(() => []),
          api.events.sponsors.list(eventId).catch(() => []),
          api.events.registrationForm.getPublic(eventId).catch(() => null),
        ])
          .then(([ev, ag, sp, spon, pubForm]) => {
            if (!active) return;
            setEvent(ev);
            setAgenda(ag);
            setSpeakers(sp);
            setSponsors(spon);

            // Configure Registration Fields from published registration form
            const rawPub = pubForm as { selectedFields?: { key: string; required: boolean }[] } | null;
            if (rawPub && Array.isArray(rawPub.selectedFields) && rawPub.selectedFields.length > 0) {
              const mapped = rawPub.selectedFields.map((f) => {
                const meta = FIELD_CATALOG[f.key] || { label: f.key.replace(/_/g, " "), inputType: "TEXT" };
                return {
                  key: f.key,
                  label: meta.label,
                  inputType: meta.inputType,
                  required: f.required ?? true,
                };
              });
              setFormFields(mapped);
            } else {
              // Fallback system defaults if no custom form
              setFormFields([
                { key: "FULL_NAME", label: "Full Name", inputType: "TEXT", required: true },
                { key: "EMAIL", label: "University Email", inputType: "EMAIL", required: true },
                { key: "UNIVERSITY_ID", label: "University ID", inputType: "TEXT", required: true },
                { key: "PHONE_NUMBER", label: "Phone Number", inputType: "PHONE", required: true },
                { key: "COLLEGE", label: "College", inputType: "TEXT", required: true },
                { key: "DEPARTMENT", label: "Department", inputType: "TEXT", required: true },
              ]);
            }
          })
          .catch((e) => {
            if (!active) return;
            setError(getApiErrorMessage(e));
          })
          .finally(() => {
            if (!active) return;
            setLoading(false);
          });

        if (user) {
          api.events.registrations
            .me(eventId)
            .then((reg) => {
              if (!active) return;
              setMyReg(reg);
            })
            .catch(() => {
              if (!active) return;
              setMyReg(null);
            });
        }
      })
      .catch((e) => {
        if (!active) return;
        setError(getApiErrorMessage(e));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeSlug, user]);

  // Open modal and pre-fill form data with user details
  const openRegistrationModal = () => {
    if (!user || isExpired) return;
    const initialValues: Record<string, string> = {
      FULL_NAME: user.fullName || "",
      EMAIL: user.email || "",
      COLLEGE: "Parul University",
      DEPARTMENT: "",
      UNIVERSITY_ID: "",
      PHONE_NUMBER: "",
      ...formData,
    };
    setFormData(initialValues);
    setRegError("");
    setShowRegModal(true);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || isExpired) return;

    // Client-side required field validation
    for (const field of formFields) {
      if (field.required) {
        const val = formData[field.key];
        if (!val || !val.trim()) {
          setRegError(`"${field.label}" is required.`);
          return;
        }
      }
    }

    setRegistering(true);
    setRegError("");

    try {
      // Build clean payload with only configured fields
      const payload: Record<string, string> = {};
      for (const field of formFields) {
        payload[field.key] = (formData[field.key] || "").trim();
      }

      const reg = await api.events.registrations.register(event.id, payload);
      setMyReg(reg);
      setShowRegModal(false);
    } catch (e) {
      setRegError(getApiErrorMessage(e));
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId || !myReg || !event) return;
    setCancelling(true);
    try {
      await api.events.registrations.cancel(event.id, cancelId);
      setMyReg(null);
      setCancelId(null);
    } catch (e) {
      setRegError(getApiErrorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center">
        <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading event...</p>
      </div>
    );

  if (error || !event)
    return (
      <div className="py-20 text-center">
        <p className="text-[0.92rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">{error || "Event not found."}</p>
        <Link href="/explore-events" className="text-[var(--accent)] text-[0.84rem] font-medium font-[family-name:var(--font-ui)]">
          &larr; Back to explore events
        </Link>
      </div>
    );

  const startD = event.startTime ? new Date(event.startTime) : new Date(event.eventDate);
  const endD = event.endTime ? new Date(event.endTime) : null;
  const fmt = (d: Date) => d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dayName = startD.toLocaleDateString("en", { weekday: "short" });
  const monthShort = startD.toLocaleDateString("en", { month: "short" });
  const dayNum = startD.getDate();
  const year = startD.getFullYear();
  const isRegistered = !!myReg;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg)]">
      <nav className="sticky top-0 z-[200] border-b border-[var(--line-soft)] bg-[var(--bg-card)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-[7px]">
            <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)] shadow-[0_1px_4px_var(--shadow-lg)]" />
            <span className="text-[1.1rem] leading-none">
              <span className="font-extrabold tracking-[-0.02em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">PU</span>
              <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">verse</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/explore-events" className="text-[0.82rem] font-medium text-[var(--col-primary)]">
              Explore Events
            </Link>
            <Link href="/student/registrations" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)]">
              My Registrations
            </Link>
            <Link href="/student" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)]">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
        <Link
          href="/explore-events"
          className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)] mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to explore events
        </Link>

        {/* Header / Event Title Section (Clean & Bold outside banner) */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)] font-[family-name:var(--font-mono)] font-bold">
                {event.category ?? "Technology & Innovation"}
              </span>
            </div>
            <h1 className="text-[clamp(1.85rem,3.8vw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
              {event.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isExpired ? (
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[hsl(0_0%_90%_/_0.6)] px-5 py-2.5 text-[0.82rem] font-bold text-[var(--col-secondary)] shadow-sm font-[family-name:var(--font-display)]"
              >
                <CalendarX className="w-4 h-4" /> Event Ended · Registration Closed
              </div>
            ) : isRegistered ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-[0.82rem] font-bold text-emerald-700 shadow-sm font-[family-name:var(--font-display)]">
                <Check className="w-4 h-4 text-emerald-600" /> Registered
              </div>
            ) : !user ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] hover:opacity-90 px-6 py-2.5 text-[0.84rem] font-bold text-white transition-all shadow-md font-[family-name:var(--font-display)]"
              >
                Register Now
              </Link>
            ) : (
              <button
                type="button"
                onClick={openRegistrationModal}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] hover:opacity-90 px-6 py-2.5 text-[0.84rem] font-bold text-white transition-all shadow-md font-[family-name:var(--font-display)] cursor-pointer"
              >
                Register Now
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event.title, url: window.location.href }).catch(() => { });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[0.82rem] font-semibold text-slate-700 transition-all shadow-sm font-[family-name:var(--font-display)] cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 stroke-current fill-none stroke-2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share Event
            </button>
          </div>
        </div>

        {/* Clean Banner Image Section (Full artwork, no cropping) */}
        {event.bannerUrl ? (
          <div className="relative w-full max-w-full overflow-hidden rounded-[24px] mb-8 border border-[var(--line-soft)] shadow-md bg-slate-900 flex items-center justify-center min-h-[250px] sm:min-h-[350px] max-h-[520px] p-2 sm:p-3">
            {/* Ambient blurred fill — uses the poster's own colours to fill margins */}
            <img
              src={event.bannerUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none"
            />
            {/* Foreground banner — 100% of the uploaded artwork, no crop */}
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="relative z-10 w-full h-auto max-h-[500px] object-contain object-center rounded-2xl transition-all duration-300"
            />
          </div>
        ) : (
          <Squircle
            cornerRadius={24}
            cornerSmoothing={1}
            className="w-full min-h-[220px] mb-8 flex items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #182238 0%, #0d131f 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
            />
            <div className="relative z-10 text-center px-6 py-8">
              <span className="text-[0.85rem] uppercase tracking-[0.2em] font-bold text-white/60 font-[family-name:var(--font-mono)]">
                {event.category ?? "PUVerse Event"}
              </span>
            </div>
          </Squircle>
        )}

        {/* 3 Top Information Metric Cards (Structured like Photo 1 with Orange Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Squircle
            cornerRadius={20}
            cornerSmoothing={1}
            className="flex items-center gap-4 p-5 transition-all duration-200 bg-white/70 shadow-sm border border-slate-100"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#CC5F1C]/10 border border-[#CC5F1C]/20 flex items-center justify-center flex-shrink-0 text-[#CC5F1C]">
              <Calendar className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[0.68rem] text-slate-500 font-[family-name:var(--font-ui)] font-medium">
                Date
              </p>
              <p className="text-[0.92rem] font-bold text-slate-900 font-[family-name:var(--font-display)] mt-0.5">
                {monthShort} {dayNum}, {year}
              </p>
            </div>
          </Squircle>

          <Squircle
            cornerRadius={20}
            cornerSmoothing={1}
            className="flex items-center gap-4 p-5 transition-all duration-200 bg-white/70 shadow-sm border border-slate-100"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#CC5F1C]/10 border border-[#CC5F1C]/20 flex items-center justify-center flex-shrink-0 text-[#CC5F1C]">
              <MapPin className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.68rem] text-slate-500 font-[family-name:var(--font-ui)] font-medium">
                Venue
              </p>
              <p className="text-[0.92rem] font-bold text-slate-900 font-[family-name:var(--font-display)] mt-0.5 truncate">
                {event.venue ? String(event.venue) : "Campus Auditorium"}
              </p>
            </div>
          </Squircle>

          <Squircle
            cornerRadius={20}
            cornerSmoothing={1}
            className="flex items-center gap-4 p-5 transition-all duration-200 bg-white/70 shadow-sm border border-slate-100"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#CC5F1C]/10 border border-[#CC5F1C]/20 flex items-center justify-center flex-shrink-0 text-[#CC5F1C]">
              <Ticket className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.68rem] text-slate-500 font-[family-name:var(--font-ui)] font-medium">
                Price
              </p>
              <p className="text-[0.92rem] font-bold text-slate-900 font-[family-name:var(--font-display)] mt-0.5">
                Free / Student
              </p>
            </div>
          </Squircle>
        </div>

        {/* 2-Column Main Content & Registration Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="space-y-6 min-w-0">
            {/* About the Event (Photo 1 Structure) */}
            <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
              <h2 className="text-[1.25rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-4">
                About the Event
              </h2>
              {event.description ? (
                <p className="text-[0.88rem] text-slate-600 leading-[1.8] font-[family-name:var(--font-ui)] whitespace-pre-line">
                  {event.description as string}
                </p>
              ) : (
                <p className="text-[0.88rem] text-slate-600 leading-[1.8] font-[family-name:var(--font-ui)]">
                  Join us for this exciting campus experience. Engage directly with student leaders, mentors, and experts in an interactive environment designed to help you expand your network and learn practical skills.
                </p>
              )}
            </Squircle>

            {/* Schedule Highlights (Photo 1 Structure) */}
            {agenda.length > 0 ? (
              <Squircle cornerRadius={22} cornerSmoothing={1} className="p-7 bg-white/75 shadow-sm border border-slate-100">
                <h2 className="text-[1.25rem] font-bold text-[#CC5F1C] font-[family-name:var(--font-display)] mb-6">
                  Schedule Highlights
                </h2>
                <div className="space-y-5">
                  {agenda.map((item, i) => {
                    const itemDate = new Date(item.startTime);
                    const dayNumber = itemDate.getDate();
                    return (
                      <div
                        key={item.id || i}
                        className="flex items-start gap-5 pb-5 border-b border-slate-100 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-col items-center justify-center w-14 flex-shrink-0 text-center">
                          <span className="text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[#CC5F1C] font-[family-name:var(--font-mono)]">
                            DAY {i + 1}
                          </span>
                          <span className="text-[1.25rem] font-bold text-slate-800 font-[family-name:var(--font-display)] leading-tight mt-0.5">
                            {dayNumber || (i + 1)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5 border-l border-slate-100 pl-5">
                          <p className="text-[0.94rem] font-bold text-slate-900 font-[family-name:var(--font-display)]">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[0.76rem] text-slate-500 font-[family-name:var(--font-ui)] mt-1">
                            <span>
                              {itemDate.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              {item.endTime && ` - ${new Date(item.endTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true })}`}
                            </span>
                            {event.venue && <span>| {event.venue}</span>}
                          </div>
                          {item.description && (
                            <p className="text-[0.8rem] text-slate-600 leading-[1.6] font-[family-name:var(--font-ui)] mt-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Squircle>
            ) : null}

            {/* Speakers & Guests */}
            {speakers.length > 0 && (
              <section>
                <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
                  Speakers & Guests
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {speakers.map((s) => (
                    <Squircle key={s.id} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover mb-3" />
                      ) : (
                        <Squircle
                          cornerRadius={14}
                          cornerSmoothing={1}
                          className="w-12 h-12 flex items-center justify-center text-white text-[0.62rem] font-bold font-[family-name:var(--font-display)] mb-3"
                          style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}
                        >
                          {initialsFromName(s.name || "Speaker")}
                        </Squircle>
                      )}
                      <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                        {s.name}
                      </p>
                      {s.designation && (
                        <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{s.designation}</p>
                      )}
                      {s.organization && (
                        <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{s.organization}</p>
                      )}
                    </Squircle>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsors & Partners */}
            {sponsors.length > 0 && (
              <section>
                <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
                  Sponsors & Partners
                </h2>
                <div className="flex flex-wrap gap-3">
                  {sponsors.map((s) => (
                    <Squircle key={s.id} cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-4 py-3" style={glassStyle}>
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <Squircle
                          cornerRadius={8}
                          cornerSmoothing={1}
                          className="w-8 h-8 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}
                        >
                          {initialsFromName(s.name || "Sponsor")}
                        </Squircle>
                      )}
                      <div>
                        <p className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                          {s.name}
                        </p>
                        {s.sponsorshipLevel && (
                          <p className="text-[0.62rem] text-[var(--accent)] font-[family-name:var(--font-mono)]">{s.sponsorshipLevel}</p>
                        )}
                      </div>
                    </Squircle>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar: Registration Box (Photo 1 Structure - Orange Theme) */}
          <div className="min-w-0">
            <Squircle
              cornerRadius={24}
              cornerSmoothing={1}
              className="p-6 shadow-xl text-white"
              style={{
                background: "linear-gradient(145deg, #CC5F1C 0%, #A84E16 100%)",
              }}
            >
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    <Calendar className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/75 font-[family-name:var(--font-mono)]">
                      DATE
                    </span>
                    <p className="text-[0.88rem] font-bold text-white font-[family-name:var(--font-display)]">
                      {monthShort} {dayNum}, {year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    <MapPin className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/75 font-[family-name:var(--font-mono)]">
                      VENUE
                    </span>
                    <p className="text-[0.88rem] font-bold text-white font-[family-name:var(--font-display)] truncate">
                      {event.venue ? String(event.venue) : "PU Tech Center, Hall A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    <Ticket className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/75 font-[family-name:var(--font-mono)]">
                      PRICE
                    </span>
                    <p className="text-[0.88rem] font-bold text-white font-[family-name:var(--font-display)]">
                      Free / Student
                    </p>
                  </div>
                </div>
              </div>

              {regError && (
                <p className="text-[0.76rem] text-red-100 bg-red-900/30 p-2.5 rounded-xl border border-red-400/30 font-[family-name:var(--font-ui)] mb-3">
                  {regError}
                </p>
              )}

              {isExpired ? (
                <Squircle
                  cornerRadius={16}
                  cornerSmoothing={1}
                  className="w-full p-4 bg-white/15 border border-white/25 backdrop-blur-sm"
                >
                  <div role="status" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                      <CalendarX className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[0.84rem] font-bold text-white font-[family-name:var(--font-display)]">
                        Event Ended · Registration Closed
                      </p>
                      <p className="text-[0.7rem] text-white/80 font-[family-name:var(--font-ui)]">
                        {isRegistered ? (
                          <>
                            You were registered. View it in{" "}
                            <Link href="/student/registrations" className="text-white font-bold underline">
                              My Registrations
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href="/explore-events" className="text-white font-bold underline">
                              Explore upcoming events
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </Squircle>
              ) : isRegistered ? (
                <div>
                  <Squircle
                    cornerRadius={16}
                    cornerSmoothing={1}
                    className="w-full p-4 mb-3 bg-white/15 border border-white/25 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-400/25 border border-emerald-300/40 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <p className="text-[0.84rem] font-bold text-white font-[family-name:var(--font-display)]">
                          You&apos;re registered!
                        </p>
                        <p className="text-[0.7rem] text-white/80 font-[family-name:var(--font-ui)]">
                          View in{" "}
                          <Link href="/student/registrations" className="text-white font-bold underline">
                            My Registrations
                          </Link>
                        </p>
                      </div>
                    </div>
                  </Squircle>
                  <button
                    onClick={() => setCancelId(myReg!.id)}
                    className="w-full text-center text-[0.78rem] font-semibold py-[10px] transition-all duration-200 hover:bg-white/15 font-[family-name:var(--font-display)] cursor-pointer text-white/90 rounded-[14px] border border-white/25 bg-white/10"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : !user ? (
                <Link href="/login" className="block w-full">
                  <button
                    type="button"
                    className="w-full py-3 px-4 rounded-[14px] bg-white hover:bg-white/95 text-[#CC5F1C] text-[0.86rem] font-bold font-[family-name:var(--font-display)] text-center transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    Register Now
                  </button>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openRegistrationModal}
                  disabled={registering}
                  className="w-full py-3 px-4 rounded-[14px] bg-white hover:bg-white/95 text-[#CC5F1C] text-[0.86rem] font-bold font-[family-name:var(--font-display)] text-center transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  Register Now
                </button>
              )}
            </Squircle>
          </div>
        </div>
      </main>

      {/* Dynamic Registration Form Modal (never rendered once the event has ended) */}
      {showRegModal && !isExpired && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-[hsl(0_0%_10%_/_0.45)] backdrop-blur-sm" onClick={() => setShowRegModal(false)} />
          <Squircle
            cornerRadius={26}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto my-auto shadow-2xl"
            style={{
              background: "hsl(0 0% 98% / 0.96)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid hsl(0 0% 100% / 0.8)",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[var(--line-soft)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                    Event Registration
                  </span>
                </div>
                <h3 className="text-[1.15rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                  {event.title}
                </h3>
                <p className="mt-1 text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  Please complete the form fields specified by the organizer below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="w-8 h-8 rounded-[10px] border border-[var(--line-soft)] flex items-center justify-center text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="mb-5 p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger)]/30 text-[var(--danger)] text-[0.74rem] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 w-full max-w-full overflow-x-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
                {formFields.map((field) => {
                  const isFullWidth = field.inputType === "TEXTAREA" || field.key === "PROJECT_DESCRIPTION" || field.key === "TECHNICAL_SKILLS";
                  return (
                    <div key={field.key} className={isFullWidth ? "sm:col-span-2" : ""}>
                      <label className={labelClass}>
                        {field.label} {field.required && <span className="text-[var(--accent)] font-bold">*</span>}
                      </label>
                      {field.inputType === "TEXTAREA" ? (
                        <textarea
                          required={field.required}
                          value={formData[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className={`${inputClass} resize-none`}
                          style={inputStyle}
                          rows={3}
                        />
                      ) : (
                        <input
                          type={
                            field.inputType === "EMAIL"
                              ? "email"
                              : field.inputType === "NUMBER"
                                ? "number"
                                : field.inputType === "DATE"
                                  ? "date"
                                  : field.inputType === "URL"
                                    ? "url"
                                    : field.inputType === "PHONE"
                                      ? "tel"
                                      : "text"
                          }
                          required={field.required}
                          value={formData[field.key] || ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className={inputClass}
                          style={inputStyle}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[var(--line-soft)] flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-5 py-2.5 text-[0.78rem] font-medium rounded-[12px] border border-[var(--line-soft)] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-6 py-2.5 text-[0.78rem] font-medium rounded-[12px] bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md flex items-center gap-2 font-[family-name:var(--font-display)]"
                >
                  {registering ? (
                    "Registering..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Confirm Registration
                    </>
                  )}
                </button>
              </div>
            </form>
          </Squircle>
        </div>
      )}

      {/* Organizer & More Events Section */}
      {event && (
        <div className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
          <section className="mt-8">
            <div className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
              <div className="mb-3 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-[var(--accent)]" />
                <p className="text-[0.84rem] font-black uppercase tracking-[0.14em] text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                  Organizer
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--col-primary)] text-[0.8rem] font-black text-white">
                  {initialsFromName(event.organizer || event.title || "Organizer")}
                </div>
                <div>
                  <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    {event.organizer || "PUVerse Team"}
                  </p>
                  <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                    {event.category ?? "Campus Initiative"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {relatedEvents.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[0.84rem] font-black uppercase tracking-[0.14em] text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                  Explore More Events
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedEvents.map((related) => (
                  <Link
                    key={related.id}
                    href={related.slug ? `/events/${related.slug}` : `/events/${slugify(related.title || "event")}`}
                    className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-1"
                  >
                    <div className="h-28 overflow-hidden rounded-[16px] mb-4">
                      {related.bannerUrl ? (
                        <img src={related.bannerUrl} alt={related.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center border border-[var(--line-soft)] text-[var(--col-secondary)]">
                          <span className="text-[0.76rem] uppercase tracking-[0.2em] font-[family-name:var(--font-mono)]">
                            {related.title.slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-[0.72rem] uppercase tracking-[0.1em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
                      {related.category ?? "General"}
                    </div>
                    <div className="mt-2 text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                      {related.title}
                    </div>
                    <div className="mt-2 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] line-clamp-2">
                      {related.description ?? "Discover this campus event."}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-12 border-t border-[var(--line-soft)] py-10">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-[7px]">
                  <div className="h-[7px] w-[7px] rounded-full bg-[var(--accent)]" />
                  <span className="text-[0.9rem] font-black text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    PUVerse
                  </span>
                </div>
                <p className="mt-3 text-[0.74rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  Event management, discovery, engagement, and certificates across campus life.
                </p>
              </div>
              <div>
                <p className="text-[0.74rem] font-black uppercase tracking-[0.14em] text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                  Platform
                </p>
                <ul className="mt-3 space-y-2 text-[0.72rem] text-[var(--col-secondary)]">
                  <li>
                    <Link href="/explore-events">Explore Events</Link>
                  </li>
                  <li>
                    <Link href="/student/events">My Events</Link>
                  </li>
                  <li>
                    <Link href="/login">Login</Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-[0.74rem] font-black uppercase tracking-[0.14em] text-[var(--col-primary)] font-[family-name:var(--font-mono)]">
                  Contact
                </p>
                <p className="mt-3 text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                  support@puverse.edu
                </p>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      {cancelId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "hsl(0 0% 0% / 0.3)", backdropFilter: "blur(8px)" }}
            onClick={() => setCancelId(null)}
          />
          <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-[380px] p-6 mx-4"
            style={{
              background: "hsl(0 0% 96% / 0.95)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              boxShadow: "0 20px 60px hsl(0 0% 0% / 0.2)",
            }}
          >
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-2">
              Cancel Registration
            </h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.6] mb-6">
              Are you sure? This action will release your registration for this event.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 text-[0.8rem] font-medium py-2.5 text-[var(--col-secondary)] font-[family-name:var(--font-ui)] transition-colors duration-200 hover:text-[var(--col-primary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              >
                Keep It
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 text-[0.8rem] font-medium py-2.5 text-white text-center transition-all duration-200 cursor-pointer hover:opacity-90 font-[family-name:var(--font-ui)] disabled:opacity-50"
                style={{ borderRadius: "14px", background: "hsl(0 65% 50%)" }}
              >
                {cancelling ? "Cancelling..." : "Cancel Registration"}
              </button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
