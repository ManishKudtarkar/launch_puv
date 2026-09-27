"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event } from "@/lib/api-client";
import { ArrowLeft, Check, Calendar, MapPin, FileText, Image as ImageIcon, Users, List, Mic, Award, FormInput } from "lucide-react";

function toDatetimeLocal(dateStr?: string | Date) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

const inputStyle = {
  background: "hsl(0 0% 100% / 0.55)",
  border: "1px solid hsl(0 0% 85% / 0.5)",
  borderRadius: "14px",
};

const inputClass =
  "w-full px-4 py-3 text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30";
const labelClass =
  "block text-[0.68rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  const [form, setForm] = useState({
    title: "",
    venue: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    description: "",
    bannerUrl: "",
  });

  useEffect(() => {
    api.events
      .get(id)
      .then((data) => {
        setEvent(data);
        setForm({
          title: data.title || "",
          venue: (data.venue as string) || "",
          eventDate: toDatetimeLocal(data.eventDate),
          startTime: toDatetimeLocal(data.startTime as string),
          endTime: toDatetimeLocal(data.endTime as string),
          description: (data.description as string) || "",
          bannerUrl: (data.bannerUrl as string) || "",
        });
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.eventDate) {
      setError("Please fill in the required fields (Title & Event Date).");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await api.events.update(id, {
        title: form.title.trim(),
        venue: form.venue.trim() || undefined,
        eventDate: new Date(form.eventDate).toISOString(),
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        description: form.description.trim() || undefined,
        bannerUrl: form.bannerUrl.trim() || undefined,
      });

      setEvent(updated);
      setShowSaved(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading event details...</p>
      </div>
    );
  }

  if (!event && !loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-[0.92rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">{error || "Event not found."}</p>
        <Link href="/admin/events" className="text-[var(--accent)] text-[0.84rem] font-medium font-[family-name:var(--font-ui)]">
          &larr; Back to events
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/admin/events/${id}`}
            className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)] mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to event details
          </Link>
          <h1 className="text-[clamp(1.3rem,2.5vw,1.7rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Edit Event Information
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-1.5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Update title, date, venue, description, and banner info for {event?.title}.
          </p>
        </div>
      </div>

      {error && <p className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start max-w-[1100px]">
        {/* Main Edit Form */}
        <Squircle cornerRadius={24} cornerSmoothing={1} className="p-7" style={glassStyle}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Event Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Event Title *
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className={inputClass}
                style={inputStyle}
                placeholder="Enter event title"
              />
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="venue" className={labelClass}>
                Venue / Location
              </label>
              <input
                id="venue"
                type="text"
                value={form.venue}
                onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Auditorium 1, Parul University Campus"
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="eventDate" className={labelClass}>
                  Event Date *
                </label>
                <input
                  id="eventDate"
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="startTime" className={labelClass}>
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="endTime" className={labelClass}>
                  End Time
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Banner URL */}
            <div>
              <label htmlFor="bannerUrl" className={labelClass}>
                Banner Image URL
              </label>
              <input
                id="bannerUrl"
                type="url"
                value={form.bannerUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="https://example.com/banner-image.png"
              />
            </div>

            {/* Description textarea */}
            <div>
              <label htmlFor="description" className={labelClass}>
                Event Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
                className={`${inputClass} resize-none`}
                style={inputStyle}
                placeholder="Provide a complete description of the event..."
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className="group inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }}
                asChild
              >
                <button type="submit" disabled={saving}>
                  {saving ? "Saving Changes..." : "Save All Changes"}
                  <Squircle cornerRadius={12} cornerSmoothing={1} className="w-[34px] h-[34px] border border-white/70 flex items-center justify-center flex-shrink-0">
                    <Check className="w-[12px] h-[12px]" strokeWidth={2} />
                  </Squircle>
                </button>
              </Squircle>

              <Link href={`/admin/events/${id}`}>
                <Squircle
                  cornerRadius={16}
                  cornerSmoothing={1}
                  className="inline-flex items-center text-[0.82rem] font-medium px-5 py-[10px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                  style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
                >
                  Cancel
                </Squircle>
              </Link>
            </div>
          </form>
        </Squircle>

        {/* Quick Management Links Side Card */}
        <div className="space-y-4">
          <Squircle cornerRadius={24} cornerSmoothing={1} className="p-6 space-y-3" style={glassStyle}>
            <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-[var(--col-dim)] mb-2 font-[family-name:var(--font-mono)]">
              Event Management
            </h3>

            <Link
              href={`/admin/events/${id}/registrations`}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white transition-all text-[0.82rem] font-medium text-[var(--col-primary)] border border-[hsl(0_0%_88%_/_0.5)] shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent)]" /> Registrations
              </span>
              <span className="text-[0.7rem] text-[var(--col-dim)]">&rarr;</span>
            </Link>

            <Link
              href={`/admin/events/${id}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white transition-all text-[0.82rem] font-medium text-[var(--col-primary)] border border-[hsl(0_0%_88%_/_0.5)] shadow-xs"
            >
              <span className="flex items-center gap-2">
                <List className="w-4 h-4 text-[var(--accent)]" /> Agenda, Speakers & Form
              </span>
              <span className="text-[0.7rem] text-[var(--col-dim)]">&rarr;</span>
            </Link>
          </Squircle>
        </div>
      </div>

      {/* Success Modal */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowSaved(false);
              router.push(`/admin/events/${id}`);
            }}
          />
          <Squircle
            cornerRadius={24}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-sm p-7 animate-scale-in text-center"
            style={{
              background: "hsl(0 0% 96% / 0.92)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
            }}
          >
            <div className="w-12 h-12 rounded-full bg-[hsl(142_50%_45%_/_0.12)] flex items-center justify-center mx-auto mb-4">
              <Check className="w-5 h-5 text-[hsl(142,50%,35%)]" strokeWidth={2} />
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
              Event Saved Successfully!
            </h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
              All event information has been updated and is now live across the platform.
            </p>
            <Squircle
              cornerRadius={14}
              cornerSmoothing={1}
              className="w-full text-center text-[0.8rem] font-medium py-[11px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ boxShadow: "0 2px 12px var(--shadow-lg)" }}
              asChild
            >
              <button
                onClick={() => {
                  setShowSaved(false);
                  router.push(`/admin/events/${id}`);
                }}
              >
                View Updated Event
              </button>
            </Squircle>
          </Squircle>
        </div>
      )}
    </div>
  );
}
