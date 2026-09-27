"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Event, type AgendaItem, type Speaker, type Sponsor } from "@/lib/api-client";
import { ArrowLeft, Calendar, Clock, MapPin, Pencil, Image, ClipboardList } from "lucide-react";

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

export default function AdminEventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.events.preview(id),
      api.events.agenda.list(id),
      api.events.speakers.list(id),
      api.events.sponsors.list(id),
    ])
      .then(([preview, ag, sp, spon]) => {
        setEvent(preview.event);
        setAgenda(ag);
        setSpeakers(sp);
        setSponsors(spon);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center"><p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading event...</p></div>;
  if (error || !event) return (
    <div className="py-20 text-center">
      <p className="text-[0.92rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-4">{error || "Event not found."}</p>
      <Link href="/admin/events" className="text-[var(--accent)] text-[0.84rem] font-medium font-[family-name:var(--font-ui)]">&larr; Back to events</Link>
    </div>
  );

  const startD = event.startTime ? new Date(event.startTime) : new Date(event.eventDate);
  const endD = event.endTime ? new Date(event.endTime) : null;
  const fmt = (d: Date) => d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dayName = startD.toLocaleDateString("en", { weekday: "short" });
  const monthShort = startD.toLocaleDateString("en", { month: "short" });
  const dayNum = startD.getDate();
  const year = startD.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)]">
          <ArrowLeft className="w-3.5 h-3.5" />Back to events
        </Link>
        {(event.status !== "COMPLETED" && event.status !== "REJECTED") && (
          <Link href={`/admin/events/${id}/edit`}>
            <Squircle cornerRadius={14} cornerSmoothing={1} className="group inline-flex items-center gap-2 text-[0.78rem] font-medium tracking-[0.04em] pl-4 pr-[4px] py-[4px] transition-all duration-300 hover:bg-[hsl(0_0%_96%_/_0.8)] font-[family-name:var(--font-display)] cursor-pointer"
              style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>
              Edit Event
              <Squircle cornerRadius={10} cornerSmoothing={1} className="w-[30px] h-[30px] border border-[var(--col-primary)] flex items-center justify-center flex-shrink-0">
                <Pencil className="w-[11px] h-[11px] text-[var(--col-primary)]" strokeWidth={1.5} />
              </Squircle>
            </Squircle>
          </Link>
        )}
      </div>

      {event.bannerUrl ? (
        <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full h-[220px] mb-6 overflow-hidden">
          <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        </Squircle>
      ) : (
        <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full h-[220px] mb-6 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, hsl(0 0% 88%) 0%, hsl(0 0% 82%) 100%)" }}>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <Image className="w-10 h-10 text-[var(--col-secondary)]" strokeWidth={1} />
            <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Event cover photo</p>
          </div>
        </Squircle>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full" style={{ background: statusDot[event.status as string] || statusDot.DRAFT }} />
            <span className="text-[0.68rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{statusLabel[event.status as string] || "Draft"}</span>
          </div>
        </div>
        <h1 className="text-[clamp(1.5rem,3vw,2.1rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          {event.title}<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        {event.description && <p className="mt-3 text-[0.86rem] text-[var(--col-secondary)] leading-[1.7] max-w-[640px] font-[family-name:var(--font-ui)]">{event.description as string}</p>}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Squircle cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-4 py-3" style={glassStyle}>
          <div className="w-9 h-9 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0"><Calendar className="w-[14px] h-[14px] text-[var(--accent)]" strokeWidth={1.5} /></div>
          <div><p className="text-[0.58rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Date</p><p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{dayName}, {monthShort} {dayNum}, {year}</p></div>
        </Squircle>
        {endD && (
          <Squircle cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-4 py-3" style={glassStyle}>
            <div className="w-9 h-9 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0"><Clock className="w-[14px] h-[14px] text-[var(--accent)]" strokeWidth={1.5} /></div>
            <div><p className="text-[0.58rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Time</p><p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{fmt(startD)} — {fmt(endD)}</p></div>
          </Squircle>
        )}
        {event.venue && (
          <Squircle cornerRadius={16} cornerSmoothing={1} className="flex items-center gap-3 px-4 py-3" style={glassStyle}>
            <div className="w-9 h-9 rounded-full border border-[var(--accent)] flex items-center justify-center flex-shrink-0"><MapPin className="w-[14px] h-[14px] text-[var(--accent)]" strokeWidth={1.5} /></div>
            <div><p className="text-[0.58rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Venue</p><p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{event.venue as string}</p></div>
          </Squircle>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-6">
          {agenda.length > 0 && (
            <section>
              <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Agenda</h2>
              <Squircle cornerRadius={22} cornerSmoothing={1} className="p-6" style={glassStyle}>
                <div className="space-y-4">
                  {agenda.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center w-5 flex-shrink-0">
                        <div className="w-[10px] h-[10px] rounded-full border-2 flex-shrink-0 mt-1" style={{ borderColor: "var(--accent)", background: "var(--accent)" }} />
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{new Date(item.startTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                        <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{item.title}</p>
                        {item.description && <p className="text-[0.78rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)] mt-1">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Squircle>
            </section>
          )}
          {speakers.length > 0 && (
            <section>
              <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Speakers</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {speakers.map((s) => (
                  <Squircle key={s.id} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
                    {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover mb-3" /> : (
                      <Squircle cornerRadius={14} cornerSmoothing={1} className="w-12 h-12 flex items-center justify-center text-white text-[0.62rem] font-bold font-[family-name:var(--font-display)] mb-3"
                        style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}>
                        {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </Squircle>
                    )}
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{s.name}</p>
                    {s.designation && <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{s.designation}</p>}
                    {s.organization && <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{s.organization}</p>}
                  </Squircle>
                ))}
              </div>
            </section>
          )}
          {sponsors.length > 0 && (
            <section>
              <h2 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Sponsors</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {sponsors.map((s) => (
                  <Squircle key={s.id} cornerRadius={22} cornerSmoothing={1} className="p-5 flex items-center gap-3" style={glassStyle}>
                    {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="w-10 h-10 object-contain rounded-lg" /> : (
                      <Squircle cornerRadius={10} cornerSmoothing={1} className="w-10 h-10 flex items-center justify-center text-white text-[0.5rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--col-primary), hsl(0 0% 30%))" }}>
                        {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </Squircle>
                    )}
                    <div>
                      <p className="text-[0.82rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{s.name}</p>
                      {s.sponsorshipLevel && <p className="text-[0.68rem] text-[var(--accent)] font-[family-name:var(--font-mono)]">{s.sponsorshipLevel}</p>}
                    </div>
                  </Squircle>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Squircle cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassStyle}>
            <h3 className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">Manage</h3>
            <div className="space-y-2">
              <Link href={`/admin/events/${id}/registrations`}>
                <div className="flex items-center gap-3 p-3 transition-all duration-200 hover:bg-[hsl(0_0%_100%_/_0.4)] cursor-pointer" style={{ borderRadius: "12px" }}>
                  <div className="w-8 h-8 rounded-full border border-[var(--line-soft)] flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-[14px] h-[14px] text-[var(--col-dim)]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">Registrations</p>
                    <p className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">View all attendees</p>
                  </div>
                </div>
              </Link>
            </div>
          </Squircle>
        </div>
      </div>
    </div>
  );
}
