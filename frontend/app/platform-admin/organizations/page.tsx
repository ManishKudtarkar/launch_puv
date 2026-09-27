"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import { ORGANIZATIONS } from "@/constants/mock-data";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  CalendarDays,
  CheckCircle2,
  Power,
  ChevronDown,
} from "lucide-react";

const typeColors: Record<string, string> = {
  Committee: "var(--accent)",
  Club: "var(--info)",
  Cell: "var(--positive)",
  Department: "var(--role-admin)",
};

export default function PlatformAdminOrganizationsPage() {
  const [orgs, setOrgs] = useState(ORGANIZATIONS);
  const [showAdd, setShowAdd] = useState(false);
  const [editOrg, setEditOrg] = useState<(typeof ORGANIZATIONS)[0] | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<(typeof ORGANIZATIONS)[0] | null>(null);
  const [success, setSuccess] = useState("");

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const inputStyle = { borderRadius: "12px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" };
  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2000); };

  const active = orgs.filter((o) => o.status === "active");
  const totalMembers = orgs.reduce((s, o) => s + o.members, 0);
  const totalEvents = orgs.reduce((s, o) => s + o.events, 0);

  const summaryStats = [
    { label: "Active", value: active.length, color: "var(--positive)" },
    { label: "Total Members", value: totalMembers, color: "var(--info)" },
    { label: "Events Hosted", value: totalEvents, color: "var(--accent)" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Organizations
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Oversee all campus organizations, clubs, and committees.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-[10px] text-[0.78rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
          style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>
          <Plus className="w-[13px] h-[13px]" strokeWidth={1.5} />
          Add Organization
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {summaryStats.map((s) => (
          <Squircle key={s.label} cornerRadius={16} cornerSmoothing={1} className="px-5 py-4 flex items-center gap-3" style={glassStyle}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[1.2rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{s.value}</span>
            <span className="text-[0.7rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] uppercase tracking-[0.1em]">{s.label}</span>
          </Squircle>
        ))}
      </div>

      {/* Org cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => {
          const initials = org.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
          const color = typeColors[org.type] || "var(--col-dim)";
          const maxMembers = Math.max(...orgs.map((o) => o.members));
          const maxEvents = Math.max(...orgs.map((o) => o.events));
          const circumference = 2 * Math.PI * 14;
          const eventPct = maxEvents ? (org.events / maxEvents) * 100 : 0;

          return (
            <Squircle key={org.id} cornerRadius={22} cornerSmoothing={1} className="p-5 relative overflow-hidden" style={glassStyle}>
              {/* Colored top border */}
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Squircle
                    cornerRadius={12}
                    cornerSmoothing={1}
                    className="w-10 h-10 flex items-center justify-center text-white text-[0.46rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                  >
                    {initials}
                  </Squircle>
                  <div>
                    <p className="text-[0.88rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{org.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Squircle cornerRadius={5} cornerSmoothing={1} className="px-1.5 py-[1px] text-[0.48rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)]"
                        style={{ background: `${color}15`, color }}>{org.type}</Squircle>
                      <div className="flex items-center gap-1">
                        <div className="w-[5px] h-[5px] rounded-full" style={{ background: org.status === "active" ? "var(--positive)" : "var(--col-dim)" }} />
                        <span className="text-[0.56rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] capitalize">{org.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-[10px] h-[10px] text-[var(--col-dim)]" strokeWidth={1.5} />
                    <span className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{org.members} members</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-[hsl(0_0%_85%_/_0.3)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(org.members / maxMembers) * 100}%`, background: color }} />
                  </div>
                </div>
                <div className="relative w-[40px] h-[40px] flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(0 0% 85% / 0.3)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                      strokeDasharray={`${(eventPct / 100) * circumference} ${circumference}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[0.5rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-mono)]">{org.events}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrgs(orgs.map((o) => o.id === org.id ? { ...o, status: o.status === "active" ? "inactive" as const : "active" as const } : o))}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-[7px] text-[0.68rem] font-medium transition-all hover:opacity-80 cursor-pointer font-[family-name:var(--font-ui)]"
                  style={{ borderRadius: "10px", background: org.status === "active" ? "hsl(0 60% 50% / 0.08)" : "hsl(142 50% 45% / 0.08)", color: org.status === "active" ? "hsl(0 60% 40%)" : "hsl(142 50% 35%)" }}
                >
                  <Power className="w-[10px] h-[10px]" strokeWidth={1.5} />
                  {org.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => setEditOrg(org)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer">
                  <Pencil className="w-[10px] h-[10px]" strokeWidth={1.5} />
                </button>
                <button onClick={() => setDeleteOrg(org)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[hsl(0,60%,45%)] hover:bg-[hsl(0_60%_50%_/_0.05)] transition-colors cursor-pointer">
                  <Trash2 className="w-[10px] h-[10px]" strokeWidth={1.5} />
                </button>
              </div>
            </Squircle>
          );
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setShowAdd(false)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Add Organization</h3>
              <button onClick={() => setShowAdd(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Name</label>
                <input type="text" placeholder="e.g. Robotics Club" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Type</label>
                <div className="relative"><select className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                  <option>Club</option><option>Committee</option><option>Cell</option><option>Department</option>
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" /></div></div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { setOrgs([...orgs, { id: `org-${Date.now()}`, name: "New Organization", type: "Club", members: 0, events: 0, status: "active" }]); setShowAdd(false); flash("Organization added"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>Add</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Edit modal */}
      {editOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setEditOrg(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Edit Organization</h3>
              <button onClick={() => setEditOrg(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Name</label>
                <input type="text" defaultValue={editOrg.name} className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Type</label>
                <div className="relative"><select defaultValue={editOrg.type} className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                  <option>Club</option><option>Committee</option><option>Cell</option><option>Department</option>
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" /></div></div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { setEditOrg(null); flash("Organization updated"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>Save</button>
              <button onClick={() => setEditOrg(null)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Delete confirm */}
      {deleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setDeleteOrg(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in text-center"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(0 60% 50% / 0.1)" }}>
              <Trash2 className="w-5 h-5 text-[hsl(0,60%,45%)]" strokeWidth={2} />
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">Remove Organization?</h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
              Remove {deleteOrg.name}? All associated events will also be removed.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setOrgs(orgs.filter((o) => o.id !== deleteOrg.id)); setDeleteOrg(null); flash("Organization removed"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white cursor-pointer font-[family-name:var(--font-display)]"
                style={{ borderRadius: "14px", background: "hsl(0 60% 48%)", boxShadow: "0 2px 12px hsl(0 60% 48% / 0.3)" }}>Remove</button>
              <button onClick={() => setDeleteOrg(null)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {success && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 animate-scale-in"
          style={{ borderRadius: "14px", background: "hsl(142 50% 40%)", color: "white", boxShadow: "0 4px 20px hsl(142 50% 30% / 0.3)" }}>
          <CheckCircle2 className="w-[15px] h-[15px]" strokeWidth={1.5} />
          <span className="text-[0.8rem] font-medium font-[family-name:var(--font-display)]">{success}</span>
        </div>
      )}
    </div>
  );
}
