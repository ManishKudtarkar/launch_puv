"use client";

import { useEffect, useState, useCallback } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { ApiUser } from "@/lib/api-client";
import type { Community, Club, EntityUpdate, MembershipRole } from "@/types";
import {
  Building2,
  Users2,
  Users,
  CalendarDays,
  Plus,
  Power,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  UserPlus,
  Trash2,
  Pencil,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "communities" | "clubs" | "pending";

// ─── Helpers ────────────────────────────────────────────────────────────────

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};

const inputClass =
  "w-full px-4 py-2.5 text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200";

const inputStyle = {
  background: "hsl(0 0% 100% / 0.55)",
  border: "1px solid hsl(0 0% 85% / 0.5)",
  borderRadius: "12px",
};

const labelClass =
  "block text-[0.66rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

// ─── Status badge for updates ────────────────────────────────────────────────

const UPDATE_STATUS: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  DRAFT:            { label: "Draft",    color: "hsl(0 0% 50%)",   bg: "hsl(0 0% 90% / 0.6)",           Icon: Clock },
  PENDING_APPROVAL: { label: "Pending",  color: "hsl(40 70% 40%)", bg: "hsl(40 70% 50% / 0.12)",         Icon: Clock },
  APPROVED:         { label: "Approved", color: "hsl(142 50% 35%)",bg: "hsl(142 50% 45% / 0.1)",         Icon: CheckCircle },
  REJECTED:         { label: "Rejected", color: "hsl(0 60% 48%)",  bg: "hsl(0 60% 50% / 0.1)",           Icon: XCircle },
};

function UpdateStatusBadge({ status }: { status: string }) {
  const cfg = UPDATE_STATUS[status] ?? UPDATE_STATUS.DRAFT;
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Confirm modal ───────────────────────────────────────────────────────────

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}
    >
      <Squircle
        cornerRadius={24}
        cornerSmoothing={1}
        className="w-full max-w-sm p-6 text-center"
        style={{
          background: "hsl(0 0% 97% / 0.95)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
        }}
      >
        <p className="text-[0.88rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="text-[0.78rem] font-medium px-5 py-2 rounded-xl font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-[0.78rem] font-semibold px-5 py-2 rounded-xl font-[family-name:var(--font-ui)]"
            style={{ background: "var(--col-primary)", color: "var(--bg)" }}
          >
            Confirm
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Community Card ──────────────────────────────────────────────────────────

function CommunityCard({
  community,
  allUsers,
  onToggleStatus,
  onAssignMember,
  onRemoveMember,
  onEdit,
}: {
  community: Community;
  allUsers: ApiUser[];
  onToggleStatus: (id: string, status: "ACTIVE" | "INACTIVE") => Promise<void>;
  onAssignMember: (id: string, userId: string, role: MembershipRole) => Promise<void>;
  onRemoveMember: (id: string, userId: string) => Promise<void>;
  onEdit: (community: Community) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<MembershipRole>("CORE_MEMBER");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const isActive = (community as { status: string }).status === "ACTIVE";

  const handleToggle = async () => {
    setToggling(true);
    await onToggleStatus(community.id, isActive ? "INACTIVE" : "ACTIVE");
    setToggling(false);
  };

  const handleAssign = async () => {
    if (!assignUserId) { setAssignError("Select a user."); return; }
    setAssigning(true);
    setAssignError("");
    try {
      await onAssignMember(community.id, assignUserId, assignRole);
      setAssignUserId("");
    } catch (e) {
      setAssignError(getApiErrorMessage(e));
    }
    setAssigning(false);
  };

  const memberships = (community as { memberships?: Array<{ id: string; userId: string; role: string; user: { id: string; fullName: string; email: string } }> }).memberships ?? [];

  return (
    <Squircle
      cornerRadius={24}
      cornerSmoothing={1}
      className={`p-5 transition-all duration-300 ${!isActive ? "opacity-60" : ""}`}
      style={{
        ...glassStyle,
        borderTop: `2px solid var(--accent)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: (community as { logoUrl?: string }).logoUrl
                ? `url(${(community as { logoUrl: string }).logoUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, var(--accent), hsl(25 75% 55%))",
            }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight">
              {(community as { name: string }).name}
            </p>
            <span
              className="text-[0.5rem] font-bold uppercase tracking-widest font-[family-name:var(--font-mono)]"
              style={{ color: "var(--accent)" }}
            >
              Community
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.58rem] font-bold font-[family-name:var(--font-mono)]"
          style={{
            background: isActive ? "hsl(142 50% 45% / 0.1)" : "hsl(0 0% 60% / 0.1)",
            color: isActive ? "hsl(142 50% 35%)" : "hsl(0 0% 50%)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "hsl(142 50% 40%)" : "hsl(0 0% 60%)" }} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Short description */}
      {(community as { shortDescription?: string }).shortDescription && (
        <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-3 line-clamp-2">
          {(community as { shortDescription: string }).shortDescription}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(community as { followerCount: number }).followerCount ?? 0} followers</span>
        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {(community as { clubCount: number }).clubCount ?? 0} clubs</span>
        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {(community as { eventCount: number }).eventCount ?? 0} events</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)] disabled:opacity-50"
          style={{
            background: isActive ? "hsl(0 0% 100% / 0.5)" : "hsl(142 50% 45% / 0.1)",
            border: `1px solid ${isActive ? "hsl(0 0% 85% / 0.5)" : "hsl(142 50% 45% / 0.3)"}`,
            color: isActive ? "var(--col-secondary)" : "hsl(142 50% 35%)",
          }}
        >
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onEdit(community)}
          className="flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)] hover:bg-[hsl(0_0%_100%_/_0.8)]"
          style={{
            background: "hsl(0 0% 100% / 0.5)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
            color: "var(--col-secondary)",
          }}
          title="Edit Details"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => setShowMembers((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)]"
          style={{
            background: "hsl(0 0% 100% / 0.5)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
            color: "var(--col-secondary)",
          }}
        >
          <UserPlus className="w-3 h-3" />
          Team
          <ChevronDown className={`w-3 h-3 transition-transform ${showMembers ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Team management */}
      {showMembers && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: "hsl(0 0% 85% / 0.3)" }}>
          {memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[0.74rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">{m.user.fullName}</p>
                <p className="text-[0.58rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{m.role === "HEAD" ? "Head" : "Core Member"}</p>
              </div>
              <button
                onClick={() => onRemoveMember(community.id, m.userId)}
                className="text-[0.64rem] px-2.5 py-1 rounded-lg transition-colors hover:bg-red-50 font-[family-name:var(--font-ui)]"
                style={{ color: "hsl(0 60% 50%)" }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="flex-1 text-[0.72rem] px-2.5 py-1.5 outline-none font-[family-name:var(--font-ui)]"
              style={{ ...inputStyle, borderRadius: "10px" }}
            >
              <option value="">Select user…</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as MembershipRole)}
              className="text-[0.72rem] px-2.5 py-1.5 outline-none font-[family-name:var(--font-ui)]"
              style={{ ...inputStyle, borderRadius: "10px" }}
            >
              <option value="CORE_MEMBER">Core</option>
              <option value="HEAD">Head</option>
            </select>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="px-3 py-1.5 rounded-xl text-white text-[0.72rem] font-semibold transition-all disabled:opacity-50 font-[family-name:var(--font-ui)]"
              style={{ background: "var(--accent)" }}
            >
              {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>
          {assignError && <p className="text-[0.66rem] text-red-500">{assignError}</p>}
        </div>
      )}
    </Squircle>
  );
}

// ─── Club Card ───────────────────────────────────────────────────────────────

function ClubCard({
  club,
  allUsers,
  communities,
  onToggleStatus,
  onAssignMember,
  onRemoveMember,
  onEdit,
}: {
  club: Club;
  allUsers: ApiUser[];
  communities: Community[];
  onToggleStatus: (id: string, status: "ACTIVE" | "INACTIVE") => Promise<void>;
  onAssignMember: (id: string, userId: string, role: MembershipRole) => Promise<void>;
  onRemoveMember: (id: string, userId: string) => Promise<void>;
  onEdit: (club: Club) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<MembershipRole>("CORE_MEMBER");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const isActive = (club as { status: string }).status === "ACTIVE";
  const memberships = (club as { memberships?: Array<{ id: string; userId: string; role: string; user: { id: string; fullName: string; email: string } }> }).memberships ?? [];
  const parentCommunity = communities.find((c) => c.id === (club as { communityId?: string }).communityId);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleStatus(club.id, isActive ? "INACTIVE" : "ACTIVE");
    setToggling(false);
  };

  const handleAssign = async () => {
    if (!assignUserId) { setAssignError("Select a user."); return; }
    setAssigning(true);
    setAssignError("");
    try {
      await onAssignMember(club.id, assignUserId, assignRole);
      setAssignUserId("");
    } catch (e) {
      setAssignError(getApiErrorMessage(e));
    }
    setAssigning(false);
  };

  return (
    <Squircle
      cornerRadius={24}
      cornerSmoothing={1}
      className={`p-5 transition-all duration-300 ${!isActive ? "opacity-60" : ""}`}
      style={{
        ...glassStyle,
        borderTop: "2px solid hsl(220 50% 55%)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: (club as { logoUrl?: string }).logoUrl
                ? `url(${(club as { logoUrl: string }).logoUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, hsl(220 50% 55%), hsl(220 60% 65%))",
            }}
          >
            <Users2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight">
              {(club as { name: string }).name}
            </p>
            <span
              className="text-[0.5rem] font-bold uppercase tracking-widest font-[family-name:var(--font-mono)]"
              style={{ color: "hsl(220 50% 55%)" }}
            >
              Club{parentCommunity ? ` · ${(parentCommunity as { name: string }).name}` : ""}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.58rem] font-bold font-[family-name:var(--font-mono)]"
          style={{
            background: isActive ? "hsl(142 50% 45% / 0.1)" : "hsl(0 0% 60% / 0.1)",
            color: isActive ? "hsl(142 50% 35%)" : "hsl(0 0% 50%)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? "hsl(142 50% 40%)" : "hsl(0 0% 60%)" }} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {(club as { shortDescription?: string }).shortDescription && (
        <p className="text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-3 line-clamp-2">
          {(club as { shortDescription: string }).shortDescription}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4 text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(club as { followerCount: number }).followerCount ?? 0} followers</span>
        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {(club as { eventCount: number }).eventCount ?? 0} events</span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)] disabled:opacity-50"
          style={{
            background: isActive ? "hsl(0 0% 100% / 0.5)" : "hsl(142 50% 45% / 0.1)",
            border: `1px solid ${isActive ? "hsl(0 0% 85% / 0.5)" : "hsl(142 50% 45% / 0.3)"}`,
            color: isActive ? "var(--col-secondary)" : "hsl(142 50% 35%)",
          }}
        >
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
          {isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onEdit(club)}
          className="flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)] hover:bg-[hsl(0_0%_100%_/_0.8)]"
          style={{
            background: "hsl(0 0% 100% / 0.5)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
            color: "var(--col-secondary)",
          }}
          title="Edit Details"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => setShowMembers((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium rounded-xl transition-all duration-200 font-[family-name:var(--font-ui)]"
          style={{
            background: "hsl(0 0% 100% / 0.5)",
            border: "1px solid hsl(0 0% 85% / 0.5)",
            color: "var(--col-secondary)",
          }}
        >
          <UserPlus className="w-3 h-3" />
          Team
          <ChevronDown className={`w-3 h-3 transition-transform ${showMembers ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showMembers && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: "hsl(0 0% 85% / 0.3)" }}>
          {memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[0.74rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)]">{m.user.fullName}</p>
                <p className="text-[0.58rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{m.role === "HEAD" ? "Head" : "Core Member"}</p>
              </div>
              <button
                onClick={() => onRemoveMember(club.id, m.userId)}
                className="text-[0.64rem] px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors font-[family-name:var(--font-ui)]"
                style={{ color: "hsl(0 60% 50%)" }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="flex-1 text-[0.72rem] px-2.5 py-1.5 outline-none font-[family-name:var(--font-ui)]"
              style={{ ...inputStyle, borderRadius: "10px" }}
            >
              <option value="">Select user…</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value as MembershipRole)}
              className="text-[0.72rem] px-2.5 py-1.5 outline-none font-[family-name:var(--font-ui)]"
              style={{ ...inputStyle, borderRadius: "10px" }}
            >
              <option value="CORE_MEMBER">Core</option>
              <option value="HEAD">Head</option>
            </select>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="px-3 py-1.5 rounded-xl text-white text-[0.72rem] font-semibold transition-all disabled:opacity-50 font-[family-name:var(--font-ui)]"
              style={{ background: "hsl(220 50% 55%)" }}
            >
              {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>
          {assignError && <p className="text-[0.66rem] text-red-500">{assignError}</p>}
        </div>
      )}
    </Squircle>
  );
}

// ─── Pending Update Card ─────────────────────────────────────────────────────

function PendingUpdateCard({
  update,
  onApprove,
  onReject,
}: {
  update: EntityUpdate;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, remarks: string) => Promise<void>;
}) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    await onApprove(update.id);
    setApproving(false);
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) return;
    setRejecting(true);
    await onReject(update.id, rejectRemarks);
    setRejecting(false);
  };

  const entityName =
    (update as { community?: { name: string } }).community?.name ??
    (update as { club?: { name: string } }).club?.name ??
    "Unknown";

  const entityType =
    (update as { community?: unknown }).community ? "Community" : "Club";

  return (
    <Squircle
      cornerRadius={22}
      cornerSmoothing={1}
      className="p-5"
      style={glassStyle}
    >
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[0.55rem] font-bold uppercase tracking-widest font-[family-name:var(--font-mono)]"
              style={{ color: entityType === "Community" ? "var(--accent)" : "hsl(220 50% 55%)" }}
            >
              {entityType} · {entityName}
            </span>
            <UpdateStatusBadge status={update.status} />
          </div>
          <h3 className="text-[0.88rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            {update.title}
          </h3>
        </div>
        <p className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] flex-shrink-0">
          by {(update as { author?: { fullName: string } }).author?.fullName ?? "Unknown"}
        </p>
      </div>

      <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-4 line-clamp-4">
        {update.content}
      </p>

      {!showRejectInput ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-1.5 px-4 py-2 text-[0.74rem] font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(142 50% 45%)", color: "white" }}
          >
            {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Approve
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[0.74rem] font-semibold rounded-xl transition-all duration-200 hover:scale-105 font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(0 60% 50% / 0.1)", color: "hsl(0 60% 45%)", border: "1px solid hsl(0 60% 50% / 0.25)" }}
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="Rejection reason (required)"
            rows={2}
            className="w-full px-3.5 py-2 text-[0.78rem] outline-none resize-none font-[family-name:var(--font-ui)]"
            style={{ ...inputStyle, borderRadius: "10px", color: "var(--col-primary)" }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={rejecting || !rejectRemarks.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[0.72rem] font-semibold rounded-xl transition-all disabled:opacity-50 font-[family-name:var(--font-ui)]"
              style={{ background: "hsl(0 60% 50%)", color: "white" }}
            >
              {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Send Rejection
            </button>
            <button
              onClick={() => setShowRejectInput(false)}
              className="px-4 py-1.5 text-[0.72rem] rounded-xl font-[family-name:var(--font-ui)]"
              style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Squircle>
  );
}

// ─── Create Community Modal ──────────────────────────────────────────────────

function CreateCommunityModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Community) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const c = await api.communities.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
        shortDescription,
        fullDescription,
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });
      onCreated(c);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}>
      <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "hsl(0 0% 97% / 0.96)", backdropFilter: "blur(40px)", boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">New Community</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)]">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Custom Slug (optional)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. acm-student-chapter" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Logo Image URL (optional)">
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Banner Image URL (optional)">
            <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Short Description">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Full Description">
            <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description" rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}>Cancel</button>
          <button onClick={handleCreate} disabled={submitting} className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl disabled:opacity-50 font-[family-name:var(--font-ui)]" style={{ background: "var(--accent)", color: "white" }}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Edit Community Modal ────────────────────────────────────────────────────

function EditCommunityModal({
  community,
  onClose,
  onUpdated,
}: {
  community: Community;
  onClose: () => void;
  onUpdated: (c: Community) => void;
}) {
  const [name, setName] = useState(community.name);
  const [slug, setSlug] = useState(community.slug);
  const [shortDescription, setShortDescription] = useState(community.shortDescription || "");
  const [fullDescription, setFullDescription] = useState(community.fullDescription || "");
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl || "");
  const [logoUrl, setLogoUrl] = useState(community.logoUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const c = await api.communities.update(community.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        shortDescription,
        fullDescription,
        bannerUrl,
        logoUrl,
      });
      onUpdated(c);
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}>
      <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "hsl(0 0% 97% / 0.96)", backdropFilter: "blur(40px)", boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Edit Community</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)]">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Slug (URL identifier)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="community-slug" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Logo Image URL">
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Banner Image URL">
            <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Short Description">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Full Description">
            <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description" rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}>Cancel</button>
          <button onClick={handleUpdate} disabled={submitting} className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl disabled:opacity-50 font-[family-name:var(--font-ui)]" style={{ background: "var(--accent)", color: "white" }}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Create Club Modal ───────────────────────────────────────────────────────

function CreateClubModal({
  communities,
  onClose,
  onCreated,
}: {
  communities: Community[];
  onClose: () => void;
  onCreated: (c: Club) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const c = await api.clubs.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
        communityId: communityId || undefined,
        shortDescription,
        fullDescription,
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });
      onCreated(c);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}>
      <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "hsl(0 0% 97% / 0.96)", backdropFilter: "blur(40px)", boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">New Club</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)]">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Custom Slug (optional)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. robotics-club" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Parent Community (optional)">
            <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className={`${inputClass} cursor-pointer`} style={inputStyle}>
              <option value="">— Independent Club —</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{(c as { name: string }).name}</option>
              ))}
            </select>
          </Field>
          <Field label="Logo Image URL (optional)">
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Banner Image URL (optional)">
            <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Short Description">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Full Description">
            <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description" rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}>Cancel</button>
          <button onClick={handleCreate} disabled={submitting} className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl disabled:opacity-50 font-[family-name:var(--font-ui)]" style={{ background: "hsl(220 50% 55%)", color: "white" }}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Edit Club Modal ─────────────────────────────────────────────────────────

function EditClubModal({
  club,
  communities,
  onClose,
  onUpdated,
}: {
  club: Club;
  communities: Community[];
  onClose: () => void;
  onUpdated: (c: Club) => void;
}) {
  const [name, setName] = useState(club.name);
  const [slug, setSlug] = useState(club.slug);
  const [communityId, setCommunityId] = useState(club.communityId || "");
  const [shortDescription, setShortDescription] = useState(club.shortDescription || "");
  const [fullDescription, setFullDescription] = useState(club.fullDescription || "");
  const [bannerUrl, setBannerUrl] = useState(club.bannerUrl || "");
  const [logoUrl, setLogoUrl] = useState(club.logoUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const c = await api.clubs.update(club.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        communityId: communityId || undefined,
        shortDescription,
        fullDescription,
        bannerUrl,
        logoUrl,
      });
      onUpdated(c);
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}>
      <Squircle cornerRadius={28} cornerSmoothing={1} className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "hsl(0 0% 97% / 0.96)", backdropFilter: "blur(40px)", boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Edit Club</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)]">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Slug (URL identifier)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="club-slug" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Parent Community (optional)">
            <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className={`${inputClass} cursor-pointer`} style={inputStyle}>
              <option value="">— Independent Club —</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{(c as { name: string }).name}</option>
              ))}
            </select>
          </Field>
          <Field label="Logo Image URL">
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Banner Image URL">
            <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Short Description">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Full Description">
            <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description" rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}>Cancel</button>
          <button onClick={handleUpdate} disabled={submitting} className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl disabled:opacity-50 font-[family-name:var(--font-ui)]" style={{ background: "hsl(220 50% 55%)", color: "white" }}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SuperAdminOrganizationsPage() {
  const [tab, setTab] = useState<Tab>("communities");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<EntityUpdate[]>([]);
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, cl, pu, users] = await Promise.all([
        api.communities.list(),
        api.clubs.list(),
        api.updates.pending(),
        api.users.list(),
      ]);
      setCommunities(c);
      setClubs(cl);
      setPendingUpdates(pu);
      setAllUsers(users);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCommunities = communities.filter((c) => (c as { status: string }).status === "ACTIVE").length;
  const activeClubs = clubs.filter((c) => (c as { status: string }).status === "ACTIVE").length;
  const totalFollowers = [
    ...communities.map((c) => (c as { followerCount: number }).followerCount ?? 0),
    ...clubs.map((c) => (c as { followerCount: number }).followerCount ?? 0),
  ].reduce((a, b) => a + b, 0);
  const totalEvents = [
    ...communities.map((c) => (c as { eventCount: number }).eventCount ?? 0),
    ...clubs.map((c) => (c as { eventCount: number }).eventCount ?? 0),
  ].reduce((a, b) => a + b, 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleCommunityStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      const updated = await api.communities.toggleStatus(id, status);
      setCommunities((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    } catch (e) { alert(getApiErrorMessage(e)); }
  };

  const handleToggleClubStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    try {
      const updated = await api.clubs.toggleStatus(id, status);
      setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    } catch (e) { alert(getApiErrorMessage(e)); }
  };

  const handleAssignCommunityMember = async (id: string, userId: string, role: MembershipRole) => {
    const membership = await api.communities.assignMember(id, { userId, role });
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const existing = (c.memberships ?? []) as import("@/types").Membership[];
        const filtered = existing.filter((m) => m.userId !== userId);
        return { ...c, memberships: [...filtered, membership] };
      })
    );
    if (role === "HEAD") {
      setCommunities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, headId: userId } : c))
      );
    }
  };

  const handleRemoveCommunityMember = async (id: string, userId: string) => {
    await api.communities.removeMember(id, userId);
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const existing = (c.memberships ?? []) as import("@/types").Membership[];
        return { ...c, memberships: existing.filter((m) => m.userId !== userId) };
      })
    );
  };

  const handleAssignClubMember = async (id: string, userId: string, role: MembershipRole) => {
    const membership = await api.clubs.assignMember(id, { userId, role });
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const existing = (c.memberships ?? []) as import("@/types").Membership[];
        const filtered = existing.filter((m) => m.userId !== userId);
        return { ...c, memberships: [...filtered, membership] };
      })
    );
  };

  const handleRemoveClubMember = async (id: string, userId: string) => {
    await api.clubs.removeMember(id, userId);
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const existing = (c.memberships ?? []) as import("@/types").Membership[];
        return { ...c, memberships: existing.filter((m) => m.userId !== userId) };
      })
    );
  };

  const handleApproveUpdate = async (id: string) => {
    try {
      await api.updates.approve(id);
      setPendingUpdates((prev) => prev.filter((u) => u.id !== id));
      setSuccessMsg("Update approved & followers notified.");
    } catch (e) { alert(getApiErrorMessage(e)); }
  };

  const handleRejectUpdate = async (id: string, remarks: string) => {
    try {
      await api.updates.reject(id, remarks);
      setPendingUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch (e) { alert(getApiErrorMessage(e)); }
  };

  const TABS: { label: string; value: Tab; count?: number }[] = [
    { label: "Communities", value: "communities", count: communities.length },
    { label: "Clubs", value: "clubs", count: clubs.length },
    { label: "Pending Updates", value: "pending", count: pendingUpdates.length },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Communities & Clubs
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-1.5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Manage communities, clubs, teams, and approve announcements.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateClub(true)}
            className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(220 50% 55%)", color: "white" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Club
          </button>
          <button
            onClick={() => setShowCreateCommunity(true)}
            className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 font-[family-name:var(--font-ui)]"
            style={{ background: "var(--accent)", color: "white" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Community
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Communities", value: activeCommunities, Icon: Building2, color: "var(--accent)" },
            { label: "Active Clubs", value: activeClubs, Icon: Users2, color: "hsl(220 50% 55%)" },
            { label: "Total Followers", value: totalFollowers, Icon: Users, color: "hsl(142 50% 40%)" },
            { label: "Events Hosted", value: totalEvents, Icon: CalendarDays, color: "hsl(270 50% 55%)" },
          ].map(({ label, value, Icon, color }) => (
            <Squircle key={label} cornerRadius={20} cornerSmoothing={1} className="p-4" style={glassStyle}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-[1.3rem] font-bold tracking-[-0.03em] leading-none text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums">{value}</p>
                  <p className="text-[0.58rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mt-0.5 uppercase tracking-[0.1em]">{label}</p>
                </div>
              </div>
            </Squircle>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="flex items-center gap-1.5 text-[0.74rem] font-medium px-4 py-2 transition-all duration-200 font-[family-name:var(--font-ui)]"
            style={{
              borderRadius: "14px",
              background: tab === t.value ? "var(--col-primary)" : "hsl(0 0% 100% / 0.5)",
              color: tab === t.value ? "var(--bg)" : "var(--col-secondary)",
              border: `1px solid ${tab === t.value ? "transparent" : "hsl(0 0% 85% / 0.5)"}`,
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className="w-4 h-4 rounded-full text-[0.52rem] font-bold flex items-center justify-center"
                style={{
                  background: tab === t.value ? "hsl(0 0% 100% / 0.2)" : t.value === "pending" ? "var(--accent)" : "hsl(0 0% 0% / 0.08)",
                  color: tab === t.value ? "var(--bg)" : t.value === "pending" ? "white" : "var(--col-dim)",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
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

      {/* Communities Tab */}
      {!loading && !error && tab === "communities" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.length === 0 ? (
            <div className="col-span-full text-center py-16 text-[0.84rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
              No communities yet. Create your first one!
            </div>
          ) : (
            communities.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                allUsers={allUsers}
                onToggleStatus={handleToggleCommunityStatus}
                onAssignMember={handleAssignCommunityMember}
                onRemoveMember={handleRemoveCommunityMember}
                onEdit={(comm) => setEditingCommunity(comm)}
              />
            ))
          )}
        </div>
      )}

      {/* Clubs Tab */}
      {!loading && !error && tab === "clubs" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.length === 0 ? (
            <div className="col-span-full text-center py-16 text-[0.84rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
              No clubs yet. Create your first one!
            </div>
          ) : (
            clubs.map((c) => (
              <ClubCard
                key={c.id}
                club={c}
                allUsers={allUsers}
                communities={communities}
                onToggleStatus={handleToggleClubStatus}
                onAssignMember={handleAssignClubMember}
                onRemoveMember={handleRemoveClubMember}
                onEdit={(cl) => setEditingClub(cl)}
              />
            ))
          )}
        </div>
      )}

      {/* Pending Updates Tab */}
      {!loading && !error && tab === "pending" && (
        <div className="space-y-4">
          {pendingUpdates.length === 0 ? (
            <Squircle cornerRadius={28} cornerSmoothing={1} className="py-16 flex flex-col items-center justify-center" style={glassStyle}>
              <CheckCircle className="w-8 h-8 text-green-500 mb-3 opacity-40" />
              <p className="text-[0.88rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">All clear!</p>
              <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No pending announcements to review.</p>
            </Squircle>
          ) : (
            pendingUpdates.map((u) => (
              <PendingUpdateCard
                key={u.id}
                update={u}
                onApprove={handleApproveUpdate}
                onReject={handleRejectUpdate}
              />
            ))
          )}
        </div>
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.35)", backdropFilter: "blur(4px)" }}>
          <Squircle cornerRadius={24} cornerSmoothing={1} className="w-full max-w-sm p-7 text-center"
            style={{ background: "hsl(0 0% 97% / 0.96)", backdropFilter: "blur(40px)", boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(142 50% 45% / 0.12)" }}>
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">Done</h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">{successMsg}</p>
            <button onClick={() => setSuccessMsg("")} className="w-full text-center text-[0.8rem] font-medium py-2.5 rounded-xl transition-all hover:opacity-80 font-[family-name:var(--font-ui)]"
              style={{ background: "var(--col-primary)", color: "var(--bg)" }}>
              OK
            </button>
          </Squircle>
        </div>
      )}

      {/* Modals */}
      {showCreateCommunity && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onCreated={(c) => {
            setCommunities((prev) => [c, ...prev]);
            setShowCreateCommunity(false);
            setSuccessMsg("Community created successfully.");
          }}
        />
      )}
      {showCreateClub && (
        <CreateClubModal
          communities={communities}
          onClose={() => setShowCreateClub(false)}
          onCreated={(c) => {
            setClubs((prev) => [c, ...prev]);
            setShowCreateClub(false);
            setSuccessMsg("Club created successfully.");
          }}
        />
      )}
      {editingCommunity && (
        <EditCommunityModal
          community={editingCommunity}
          onClose={() => setEditingCommunity(null)}
          onUpdated={(updated) => {
            setCommunities((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            setSuccessMsg("Community updated successfully.");
          }}
        />
      )}
      {editingClub && (
        <EditClubModal
          club={editingClub}
          communities={communities}
          onClose={() => setEditingClub(null)}
          onUpdated={(updated) => {
            setClubs((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
            setSuccessMsg("Club updated successfully.");
          }}
        />
      )}
    </div>
  );
}
