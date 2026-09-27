"use client";

import { useEffect, useState, useCallback } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { Community, Club } from "@/types";
import { Building2, Users2, Users, CalendarDays, Search, Loader2, ChevronRight, RefreshCw, Globe } from "lucide-react";

type Tab = "communities" | "clubs";
const glassCard = { background: "hsl(0 0% 96% / 0.42)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)", boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)" };

type Membership = { id: string; userId: string; role: string; user: { id: string; fullName: string; email: string } };
type OrgExtra = { id: string; status: string; logoUrl?: string; name: string; shortDescription?: string; followerCount: number; clubCount?: number; eventCount: number; memberships?: Membership[]; community?: { name: string } };

function MemberList({ memberships, gradient }: { memberships: Membership[]; gradient: string }) {
  if (memberships.length === 0) return <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] italic">No assigned members yet.</p>;
  return (
    <div className="space-y-2">
      {memberships.map((m) => (
        <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-[12px]" style={{ background: "hsl(0 0% 100% / 0.45)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.56rem] font-bold flex-shrink-0" style={{ background: gradient }}>
            {m.user?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.76rem] font-medium text-[var(--col-primary)] truncate">{m.user?.fullName}</p>
            <p className="text-[0.6rem] text-[var(--col-dim)] truncate">{m.user?.email}</p>
          </div>
          <span className="flex-shrink-0 text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: m.role === "HEAD" ? "hsl(25 65% 45% / 0.12)" : "hsl(0 0% 0% / 0.06)", color: m.role === "HEAD" ? "var(--accent)" : "var(--col-secondary)" }}>
            {m.role === "HEAD" ? "Head" : "Core Member"}
          </span>
        </div>
      ))}
    </div>
  );
}

function OrgRow({ org, isClub }: { org: OrgExtra; isClub?: boolean }) {
  const isActive = org.status === "ACTIVE";
  const memberships = org.memberships ?? [];
  const [open, setOpen] = useState(false);
  const gradient = isClub ? "linear-gradient(135deg, hsl(220 50% 55%), hsl(220 60% 65%))" : "linear-gradient(135deg, var(--accent), hsl(25 75% 55%))";
  const borderColor = isActive ? (isClub ? "hsl(220 50% 55% / 0.2)" : "hsl(25 65% 45% / 0.18)") : "hsl(0 0% 80% / 0.25)";
  return (
    <div style={{ ...glassCard, borderRadius: "18px", border: "1px solid " + borderColor, overflow: "hidden" }}>
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[hsl(0_0%_100%_/_0.3)] transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: org.logoUrl ? "url(" + org.logoUrl + ") center/cover no-repeat" : gradient }}>
          {!org.logoUrl && (isClub ? <Users2 className="w-4 h-4 text-white" /> : <Building2 className="w-4 h-4 text-white" />)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{org.name}</p>
            <span className="flex-shrink-0 text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full font-[family-name:var(--font-mono)]" style={{ background: isActive ? "hsl(142 50% 45% / 0.1)" : "hsl(0 0% 60% / 0.1)", color: isActive ? "hsl(142 50% 35%)" : "hsl(0 0% 50%)" }}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {isClub && org.community && <p className="text-[0.62rem] font-medium font-[family-name:var(--font-mono)]" style={{ color: isClub ? "hsl(220 50% 55%)" : "var(--accent)" }}>{org.community.name}</p>}
          {org.shortDescription && <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{org.shortDescription}</p>}
        </div>
        <div className="hidden sm:flex items-center gap-5 text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.followerCount ?? 0} followers</span>
          {!isClub && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{org.clubCount ?? 0} clubs</span>}
          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{org.eventCount ?? 0} events</span>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--col-dim)] transition-transform duration-200 flex-shrink-0" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-[hsl(0_0%_85%_/_0.3)]">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-3 mb-2">Members ({memberships.length})</p>
          <MemberList memberships={memberships} gradient={gradient} />
        </div>
      )}
    </div>
  );
}

export default function AdminOrganizationsPage() {
  const [tab, setTab] = useState<Tab>("communities");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [c, cl] = await Promise.all([api.communities.list(), api.clubs.list()]);
      setCommunities(c); setClubs(cl);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase().trim();
  const orgedCommunities = communities as unknown as OrgExtra[];
  const orgedClubs = clubs as unknown as OrgExtra[];
  const filteredCommunities = orgedCommunities.filter(c => c.name.toLowerCase().includes(q) || (c.shortDescription ?? "").toLowerCase().includes(q));
  const filteredClubs = orgedClubs.filter(c => c.name.toLowerCase().includes(q) || (c.shortDescription ?? "").toLowerCase().includes(q));
  const activeCommunities = orgedCommunities.filter(c => c.status === "ACTIVE");
  const activeClubs = orgedClubs.filter(c => c.status === "ACTIVE");

  const EmptyState = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <Squircle cornerRadius={24} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassCard}>
      <Icon className="w-8 h-8 mb-3 opacity-40" style={{ color: label === "departments" ? "var(--accent)" : "hsl(220 50% 55%)" }} />
      <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">No {label} found</p>
      <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">{search ? "Try a different search." : "No " + label + " created yet."}</p>
    </Squircle>
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">Admin View</p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Departments &amp; Clubs<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">View all departments (communities) and clubs. Contact a Super Admin to create or manage organizations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Departments", value: communities.length, Icon: Building2, color: "var(--accent)" },
          { label: "Active Departments", value: activeCommunities.length, Icon: Globe, color: "hsl(142 50% 40%)" },
          { label: "Total Clubs", value: clubs.length, Icon: Users2, color: "hsl(220 50% 55%)" },
          { label: "Active Clubs", value: activeClubs.length, Icon: Users, color: "hsl(142 50% 40%)" },
        ].map((stat) => (
          <Squircle key={stat.label} cornerRadius={22} cornerSmoothing={1} className="p-5" style={glassCard}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: stat.color }}>
                <stat.Icon className="w-[15px] h-[15px]" style={{ color: stat.color }} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[1.8rem] font-semibold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{loading ? "—" : stat.value}</p>
            <p className="text-[0.68rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-1.5 uppercase tracking-[0.1em]">{stat.label}</p>
          </Squircle>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center">
        <div className="flex gap-1 p-1 rounded-[14px] flex-shrink-0" style={{ background: "hsl(0 0% 100% / 0.45)", border: "1px solid hsl(0 0% 85% / 0.5)" }}>
          {(["communities", "clubs"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="text-[0.72rem] font-medium px-4 py-2 transition-all duration-200 font-[family-name:var(--font-ui)] cursor-pointer" style={{ borderRadius: "10px", background: tab === t ? "var(--col-primary)" : "transparent", color: tab === t ? "var(--bg)" : "var(--col-secondary)" }}>
              {t === "communities" ? "Departments (" + communities.length + ")" : "Clubs (" + clubs.length + ")"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--col-dim)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "communities" ? "Search departments..." : "Search clubs..."} className="w-full pl-10 pr-4 py-2.5 text-[0.84rem] outline-none font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.5)", borderRadius: "14px", color: "var(--col-primary)" }} />
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-[0.72rem] font-medium px-4 py-2.5 transition-all font-[family-name:var(--font-ui)] cursor-pointer flex-shrink-0" style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.5)", color: "var(--col-secondary)" }}>
          <RefreshCw className={"w-3.5 h-3.5" + (loading ? " animate-spin" : "")} /> Refresh
        </button>
      </div>

      <div className="mb-5 p-3.5 rounded-[14px] flex items-start gap-3 text-[0.74rem] font-[family-name:var(--font-ui)]" style={{ background: "hsl(25 65% 45% / 0.07)", border: "1px solid hsl(25 65% 45% / 0.2)", color: "var(--col-secondary)" }}>
        <Building2 className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
        <span>As an <strong className="text-[var(--col-primary)]">Admin</strong>, you can view departments and clubs. To create, edit, or deactivate organizations, please contact a <strong className="text-[var(--col-primary)]">Super Admin</strong>.</span>
      </div>

      {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>}
      {error && !loading && <div className="p-4 rounded-[14px] text-[0.84rem] mb-4" style={{ background: "hsl(0 60% 50% / 0.08)", border: "1px solid hsl(0 60% 50% / 0.2)", color: "hsl(0 60% 45%)" }}>{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {tab === "communities" && (filteredCommunities.length === 0
            ? <EmptyState icon={Building2} label="departments" />
            : filteredCommunities.map((c) => <OrgRow key={c.id} org={c} />)
          )}
          {tab === "clubs" && (filteredClubs.length === 0
            ? <EmptyState icon={Users2} label="clubs" />
            : filteredClubs.map((c) => <OrgRow key={c.id} org={c} isClub />)
          )}
        </div>
      )}
    </div>
  );
}
