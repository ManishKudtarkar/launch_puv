"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type Registration } from "@/lib/api-client";
import { ArrowLeft, Users } from "lucide-react";

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

export default function EventAttendancePage() {
  const params = useParams();
  const id = params.id as string;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.events.registrations.list(id),
      api.events.registrations.count(id),
    ])
      .then(([regs, countData]) => {
        setRegistrations(regs);
        setCount(countData.totalRegistrations ?? regs.length);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)] transition-colors duration-200 font-[family-name:var(--font-ui)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />Back to event
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Attendance<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
          {count} registered attendee{count !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Squircle cornerRadius={20} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">Total Registrations</p>
          <p className="text-[2.4rem] font-bold font-[family-name:var(--font-mono)] text-[var(--col-primary)] leading-none">{count}</p>
        </Squircle>
        <Squircle cornerRadius={20} cornerSmoothing={1} className="p-6" style={glassStyle}>
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">Active</p>
          <p className="text-[2.4rem] font-bold font-[family-name:var(--font-mono)] text-[var(--positive)] leading-none">{registrations.filter(r => (r as unknown as Record<string, string>).status === "ACTIVE" || !(r as unknown as Record<string, string>).status).length}</p>
        </Squircle>
      </div>

      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}
      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading attendance...</p>}

      {registrations.length === 0 && !loading ? (
        <Squircle cornerRadius={22} cornerSmoothing={1} className="p-14 text-center" style={glassStyle}>
          <Users className="w-10 h-10 text-[var(--col-dim)] mx-auto mb-3 opacity-40" strokeWidth={1} />
          <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No registrations yet.</p>
          <p className="mt-1 text-[0.76rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">Students who register for this event will appear here.</p>
        </Squircle>
      ) : (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
          <div
            className="grid items-center gap-4 px-6 py-3.5"
            style={{ gridTemplateColumns: "1fr 1fr 1fr 100px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}
          >
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Name</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Email</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">University ID</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Registered</span>
          </div>
          {registrations.map((reg, i) => {
            const data = reg.registrationData as Record<string, string>;
            const regRecord = reg as unknown as Record<string, string>;
            return (
              <div
                key={reg.id}
                className="grid items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 100px",
                  ...(i < registrations.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}),
                }}
              >
                <p className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">
                  {data?.FULL_NAME || "—"}
                </p>
                <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                  {data?.EMAIL || "—"}
                </p>
                <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">
                  {data?.UNIVERSITY_ID || "—"}
                </p>
                <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                  {new Date(regRecord.registeredAt || regRecord.createdAt || Date.now()).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </p>
              </div>
            );
          })}
        </Squircle>
      )}
    </div>
  );
}
