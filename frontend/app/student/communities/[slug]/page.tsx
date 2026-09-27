"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { Community } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Users,
  CalendarDays,
  Heart,
  HeartOff,
  Loader2,
  Crown,
  User2,
  Newspaper,
  CheckCircle,
} from "lucide-react";

export default function CommunityDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.communities.get(slug);
      setCommunity(data);
      setLocalFollowing(data.isFollowing);
      setLocalFollowerCount(data.followerCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!community || followLoading) return;
    setFollowLoading(true);
    try {
      const res = localFollowing
        ? await api.communities.unfollow(community.id)
        : await api.communities.follow(community.id);
      setLocalFollowing(res.isFollowing);
      setLocalFollowerCount(res.followerCount);
    } catch { /* silent */ }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="text-center py-20">
        <p className="text-[0.88rem] text-red-500 mb-4">{error || "Community not found."}</p>
        <Link href="/student/communities" className="text-[0.78rem] text-[var(--accent)] underline">← Back to Communities</Link>
      </div>
    );
  }

  const head = community.memberships?.find((m) => m.role === "HEAD");
  const coreMembers = community.memberships?.filter((m) => m.role === "CORE_MEMBER") ?? [];
  const approvedUpdates = community.updates?.filter((u) => u.status === "APPROVED") ?? [];

  return (
    <div>
      {/* Back */}
      <Link
        href="/student/communities"
        className="inline-flex items-center gap-1.5 text-[0.74rem] text-[var(--col-dim)] hover:text-[var(--accent)] transition-colors mb-6 font-[family-name:var(--font-mono)]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Communities & Clubs
      </Link>

      {/* Banner + Logo */}
      <Squircle
        cornerRadius={28}
        cornerSmoothing={1}
        className="overflow-hidden mb-6"
        style={{
          background: "hsl(0 0% 96% / 0.48)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 2px 24px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
        }}
      >
        {/* Banner */}
        <div
          className="w-full h-40 relative"
          style={{
            background: community.bannerUrl
              ? `url(${community.bannerUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, hsl(25 65% 45% / 0.35), hsl(25 75% 55% / 0.2))",
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, hsl(0 0% 96% / 0.6))" }} />
          {/* Status */}
          <div
            className="absolute top-3 right-4 text-[0.55rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: community.status === "ACTIVE" ? "hsl(142 50% 45% / 0.9)" : "hsl(0 0% 60% / 0.9)",
              color: "white",
            }}
          >
            {community.status === "ACTIVE" ? "Active" : "Inactive"}
          </div>
          {/* Logo */}
          <div
            className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: community.logoUrl
                ? `url(${community.logoUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, var(--accent), hsl(25 75% 55%))",
              border: "3px solid hsl(0 0% 100% / 0.7)",
            }}
          >
            {!community.logoUrl && <Building2 className="w-7 h-7 text-white" />}
          </div>
        </div>

        {/* Info */}
        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span
                className="text-[0.55rem] font-bold uppercase tracking-widest font-[family-name:var(--font-mono)]"
                style={{ color: "var(--accent)" }}
              >
                Community
              </span>
              <h1 className="text-[clamp(1.4rem,3vw,1.9rem)] font-bold tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight mt-0.5">
                {community.name}
              </h1>
              {community.shortDescription && (
                <p className="text-[0.82rem] text-[var(--col-secondary)] mt-1 font-[family-name:var(--font-ui)]">
                  {community.shortDescription}
                </p>
              )}
            </div>

            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className="flex items-center gap-2 text-[0.78rem] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                background: localFollowing ? "hsl(25 65% 45% / 0.12)" : "var(--accent)",
                border: `1.5px solid ${localFollowing ? "hsl(25 65% 45% / 0.4)" : "transparent"}`,
                color: localFollowing ? "var(--accent)" : "white",
              }}
            >
              {followLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : localFollowing ? (
                <HeartOff className="w-3.5 h-3.5" />
              ) : (
                <Heart className="w-3.5 h-3.5" />
              )}
              {localFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
              {localFollowerCount} followers
            </span>
            <span className="flex items-center gap-1.5 text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              {community.clubCount} clubs
            </span>
            <span className="flex items-center gap-1.5 text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
              {community.eventCount} events
            </span>
          </div>
        </div>
      </Squircle>

      {/* Grid: About + Team + Clubs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* About */}
        {community.fullDescription && (
          <Squircle
            cornerRadius={22}
            cornerSmoothing={1}
            className="p-5 lg:col-span-2"
            style={{
              background: "hsl(0 0% 96% / 0.42)",
              backdropFilter: "blur(20px) saturate(1.4)",
              WebkitBackdropFilter: "blur(20px) saturate(1.4)",
              boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
            }}
          >
            <h2 className="text-[0.7rem] uppercase tracking-[0.18em] font-[family-name:var(--font-mono)] text-[var(--col-dim)] mb-3">About</h2>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.7] whitespace-pre-wrap">
              {community.fullDescription}
            </p>
          </Squircle>
        )}

        {/* Team */}
        <Squircle
          cornerRadius={22}
          cornerSmoothing={1}
          className="p-5"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
          }}
        >
          <h2 className="text-[0.7rem] uppercase tracking-[0.18em] font-[family-name:var(--font-mono)] text-[var(--col-dim)] mb-3">Team</h2>
          <div className="space-y-2.5">
            {head && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[0.78rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    {head.user.fullName}
                  </p>
                  <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Community Head</p>
                </div>
              </div>
            )}
            {coreMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[hsl(0_0%_0%_/_0.05)] flex items-center justify-center flex-shrink-0">
                  <User2 className="w-3.5 h-3.5 text-[var(--col-dim)]" />
                </div>
                <div>
                  <p className="text-[0.78rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    {m.user.fullName}
                  </p>
                  <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Core Team</p>
                </div>
              </div>
            ))}
            {!head && coreMembers.length === 0 && (
              <p className="text-[0.74rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">No team members yet.</p>
            )}
          </div>
        </Squircle>
      </div>

      {/* Clubs under this Community */}
      {(community.clubs?.length ?? 0) > 0 && (
        <div className="mb-6">
          <h2 className="text-[0.68rem] uppercase tracking-[0.18em] font-[family-name:var(--font-mono)] text-[var(--col-dim)] mb-4 flex items-center gap-2">
            Clubs under this Community
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(0 0% 80% / 0.3), transparent)" }} />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {community.clubs!.map((club) => (
              <Link key={club.id} href={`/student/clubs/${club.slug}`} className="block">
                <Squircle
                  cornerRadius={18}
                  cornerSmoothing={1}
                  className="p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200"
                  style={{
                    background: "hsl(0 0% 96% / 0.42)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 2px 12px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: club.logoUrl
                        ? `url(${club.logoUrl}) center/cover no-repeat`
                        : "linear-gradient(135deg, hsl(220 50% 55%), hsl(220 60% 65%))",
                    }}
                  >
                    {!club.logoUrl && <Users className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{club.name}</p>
                    <p className="text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                      {(club as Community & { followerCount: number }).followerCount ?? 0} followers
                    </p>
                  </div>
                </Squircle>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Announcements / Updates */}
      {approvedUpdates.length > 0 && (
        <div>
          <h2 className="text-[0.68rem] uppercase tracking-[0.18em] font-[family-name:var(--font-mono)] text-[var(--col-dim)] mb-4 flex items-center gap-2">
            Announcements
            <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(0 0% 80% / 0.3), transparent)" }} />
          </h2>
          <div className="space-y-3">
            {approvedUpdates.map((u) => (
              <Squircle
                key={u.id}
                cornerRadius={20}
                cornerSmoothing={1}
                className="p-5"
                style={{
                  background: "hsl(0 0% 96% / 0.42)",
                  backdropFilter: "blur(20px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
                  boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <h3 className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    {u.title}
                  </h3>
                  <span className="ml-auto text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] flex-shrink-0">
                    {formatDate(u.publishedAt ?? u.createdAt)}
                  </span>
                </div>
                <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.6]">
                  {u.content}
                </p>
                {u.imageUrl && (
                  <img src={u.imageUrl} alt="update" className="mt-3 w-full rounded-xl object-cover max-h-48" />
                )}
                <p className="text-[0.62rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-2.5">
                  — {u.author.fullName}
                </p>
              </Squircle>
            ))}
          </div>
        </div>
      )}

      {approvedUpdates.length === 0 && (community.clubs?.length ?? 0) === 0 && !community.fullDescription && (
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          className="py-12 flex flex-col items-center justify-center"
          style={{
            background: "hsl(0 0% 96% / 0.42)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.55)",
          }}
        >
          <Newspaper className="w-8 h-8 text-[var(--accent)] mb-3 opacity-40" />
          <p className="text-[0.84rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">Coming Soon</p>
          <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            This community hasn&apos;t posted any announcements yet.
          </p>
        </Squircle>
      )}
    </div>
  );
}
