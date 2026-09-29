"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { Community, Club } from "@/types";
import {
  Search,
  Building2,
  Users2,
  CalendarDays,
  Users,
  Heart,
  HeartOff,
  Loader2,
  ChevronRight,
} from "lucide-react";

type Filter = "all" | "communities" | "clubs";

function FollowBtn({
  isFollowing,
  count,
  onToggle,
  loading,
}: {
  isFollowing: boolean;
  count: number;
  onToggle: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onToggle(); }}
      disabled={loading}
      className="flex items-center gap-1.5 text-[0.7rem] font-medium transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        padding: "5px 12px",
        borderRadius: "20px",
        background: isFollowing ? "hsl(25 65% 45% / 0.12)" : "hsl(0 0% 0% / 0.06)",
        border: `1px solid ${isFollowing ? "hsl(25 65% 45% / 0.3)" : "hsl(0 0% 80% / 0.4)"}`,
        color: isFollowing ? "var(--accent)" : "var(--col-secondary)",
      }}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isFollowing ? (
        <HeartOff className="w-3 h-3" />
      ) : (
        <Heart className="w-3 h-3" />
      )}
      {isFollowing ? "Following" : "Follow"} · {count}
    </button>
  );
}

function CommunityCard({ community, onFollowToggle }: { community: Community; onFollowToggle: (id: string, isFollowing: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(community.isFollowing);
  const [localCount, setLocalCount] = useState(community.followerCount);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = localFollowing
        ? await api.communities.unfollow(community.id)
        : await api.communities.follow(community.id);
      setLocalFollowing(res.isFollowing);
      setLocalCount(res.followerCount);
      onFollowToggle(community.id, res.isFollowing);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <Link href={`/student/communities/${community.slug}`} className="block group">
      <Squircle
        cornerRadius={24}
        cornerSmoothing={1}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        style={{
          background: "hsl(0 0% 96% / 0.48)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
        }}
      >
        {/* Banner */}
        <div
          className="w-full h-24 relative flex-shrink-0"
          style={{
            background: community.bannerUrl
              ? `url(${community.bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, hsl(25 65% 45% / 0.3), hsl(25 75% 55% / 0.15))",
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, hsl(0 0% 96% / 0.5))" }} />
          {/* Logo */}
          <div
            className="absolute -bottom-6 left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: community.logoUrl
                ? `url(${community.logoUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, var(--accent), hsl(25 75% 55%))",
              border: "2px solid hsl(0 0% 100% / 0.6)",
            }}
          >
            {!community.logoUrl && <Building2 className="w-5 h-5 text-white" />}
          </div>
          {/* Status badge */}
          <div
            className="absolute top-2.5 right-3 text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: community.status === "ACTIVE" ? "hsl(142 50% 45% / 0.9)" : "hsl(0 0% 60% / 0.9)",
              color: "white",
            }}
          >
            {community.status === "ACTIVE" ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="pt-8 px-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <span
                className="text-[0.54rem] font-bold uppercase tracking-widest mb-1 block font-[family-name:var(--font-mono)]"
                style={{ color: "var(--accent)" }}
              >
                Community
              </span>
              <h3 className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight truncate">
                {community.name}
              </h3>
            </div>
          </div>

          {community.shortDescription && (
            <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-3 line-clamp-2">
              {community.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-3 text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {localCount} followers</span>
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {community.clubCount} clubs</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {community.eventCount} events</span>
          </div>

          <div className="flex items-center justify-between">
            <FollowBtn isFollowing={localFollowing} count={localCount} onToggle={toggle} loading={loading} />
            <ChevronRight className="w-4 h-4 text-[var(--col-dim)] group-hover:text-[var(--accent)] transition-colors" />
          </div>
        </div>
      </Squircle>
    </Link>
  );
}

function ClubCard({ club, onFollowToggle }: { club: Club; onFollowToggle: (id: string, isFollowing: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(club.isFollowing);
  const [localCount, setLocalCount] = useState(club.followerCount);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = localFollowing
        ? await api.clubs.unfollow(club.id)
        : await api.clubs.follow(club.id);
      setLocalFollowing(res.isFollowing);
      setLocalCount(res.followerCount);
      onFollowToggle(club.id, res.isFollowing);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <Link href={`/student/clubs/${club.slug}`} className="block group">
      <Squircle
        cornerRadius={24}
        cornerSmoothing={1}
        className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        style={{
          background: "hsl(0 0% 96% / 0.48)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
        }}
      >
        {/* Banner */}
        <div
          className="w-full h-24 relative"
          style={{
            background: club.bannerUrl
              ? `url(${club.bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, hsl(220 50% 55% / 0.25), hsl(220 60% 65% / 0.12))",
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, hsl(0 0% 96% / 0.5))" }} />
          <div
            className="absolute -bottom-6 left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: club.logoUrl
                ? `url(${club.logoUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, hsl(220 50% 55%), hsl(220 60% 65%))",
              border: "2px solid hsl(0 0% 100% / 0.6)",
            }}
          >
            {!club.logoUrl && <Users2 className="w-5 h-5 text-white" />}
          </div>
          <div
            className="absolute top-2.5 right-3 text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: club.status === "ACTIVE" ? "hsl(142 50% 45% / 0.9)" : "hsl(0 0% 60% / 0.9)",
              color: "white",
            }}
          >
            {club.status === "ACTIVE" ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="pt-8 px-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <span
                className="text-[0.54rem] font-bold uppercase tracking-widest mb-1 block font-[family-name:var(--font-mono)]"
                style={{ color: "hsl(220 50% 55%)" }}
              >
                Club{club.community ? ` · ${club.community.name}` : ""}
              </span>
              <h3 className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight truncate">
                {club.name}
              </h3>
            </div>
          </div>

          {club.shortDescription && (
            <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-3 line-clamp-2">
              {club.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-3 text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {localCount} followers</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {club.eventCount} events</span>
          </div>

          <div className="flex items-center justify-between">
            <FollowBtn isFollowing={localFollowing} count={localCount} onToggle={toggle} loading={loading} />
            <ChevronRight className="w-4 h-4 text-[var(--col-dim)] group-hover:text-[var(--accent)] transition-colors" />
          </div>
        </div>
      </Squircle>
    </Link>
  );
}

export default function StudentCommunitiesPage() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as Filter | null;
  const [filter, setFilter] = useState<Filter>(urlFilter === "clubs" ? "clubs" : "all");
  const [search, setSearch] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, cl] = await Promise.all([api.communities.list(), api.clubs.list()]);
      setCommunities(c);
      setClubs(cl);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase().trim();

  const filteredCommunities = communities.filter(
    (c) => filter !== "clubs" && (c.name.toLowerCase().includes(q) || (c.shortDescription ?? "").toLowerCase().includes(q))
  );
  const filteredClubs = clubs.filter(
    (c) => filter !== "communities" && (c.name.toLowerCase().includes(q) || (c.shortDescription ?? "").toLowerCase().includes(q))
  );

  const FILTERS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Communities", value: "communities" },
    { label: "Clubs", value: "clubs" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Explore
        </p>
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          Communities & Clubs
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
          Discover university departments and student clubs. Follow to get notified about events and announcements.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--col-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities & clubs..."
            className="w-full pl-10 pr-4 py-2.5 text-[0.84rem] outline-none font-[family-name:var(--font-ui)]"
            style={{
              background: "hsl(0 0% 100% / 0.5)",
              border: "1px solid hsl(0 0% 85% / 0.5)",
              borderRadius: "14px",
              color: "var(--col-primary)",
            }}
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-[0.72rem] font-medium px-4 py-2.5 transition-all duration-200 font-[family-name:var(--font-ui)]"
              style={{
                borderRadius: "14px",
                background: filter === f.value ? "var(--col-primary)" : "hsl(0 0% 100% / 0.5)",
                color: filter === f.value ? "var(--bg)" : "var(--col-secondary)",
                border: `1px solid ${filter === f.value ? "transparent" : "hsl(0 0% 85% / 0.5)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 text-[0.84rem] text-red-500">{error}</div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-8">
          {/* Communities */}
          {filteredCommunities.length > 0 && (
            <section>
              {filter === "all" && (
                <h2 className="text-[0.68rem] tracking-[0.2em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] font-medium mb-4 flex items-center gap-2">
                  Communities
                  <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(0 0% 80% / 0.3), transparent)" }} />
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((c) => (
                  <CommunityCard key={c.id} community={c} onFollowToggle={() => { }} />
                ))}
              </div>
            </section>
          )}

          {/* Clubs */}
          {filteredClubs.length > 0 && (
            <section>
              {filter === "all" && (
                <h2 className="text-[0.68rem] tracking-[0.2em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] font-medium mb-4 flex items-center gap-2">
                  Clubs
                  <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(0 0% 80% / 0.3), transparent)" }} />
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClubs.map((c) => (
                  <ClubCard key={c.id} club={c} onFollowToggle={() => { }} />
                ))}
              </div>
            </section>
          )}

          {filteredCommunities.length === 0 && filteredClubs.length === 0 && (
            <Squircle
              cornerRadius={28}
              cornerSmoothing={1}
              className="py-16 flex flex-col items-center justify-center"
              style={{
                background: "hsl(0 0% 96% / 0.42)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
              }}
            >
              <Building2 className="w-8 h-8 text-[var(--accent)] mb-3 opacity-50" />
              <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">Nothing found</p>
              <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
                {search ? "Try a different search term." : "No communities or clubs available yet."}
              </p>
            </Squircle>
          )}
        </div>
      )}
    </div>
  );
}
