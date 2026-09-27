"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage } from "@/lib/api-client";
import type { MyAssignment, EntityUpdate, Community, Club, MembershipRole } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Building2,
  Users2,
  Plus,
  Send,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  CalendarPlus,
  Pencil,
  ExternalLink,
  Users,
  CalendarDays,
  Check,
} from "lucide-react";

const STATUS_CONFIG = {
  DRAFT:            { label: "Draft",            color: "hsl(0 0% 55%)",         bg: "hsl(0 0% 90% / 0.5)" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "hsl(40 70% 45%)",       bg: "hsl(40 70% 50% / 0.12)" },
  APPROVED:         { label: "Approved",         color: "hsl(142 50% 38%)",      bg: "hsl(142 50% 45% / 0.1)" },
  REJECTED:         { label: "Rejected",         color: "hsl(0 60% 50%)",        bg: "hsl(0 60% 50% / 0.1)" },
} as const;

const STATUS_ICON = {
  DRAFT: FileText,
  PENDING_APPROVAL: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

function StatusBadge({ status }: { status: EntityUpdate["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = STATUS_ICON[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

type EntityRef =
  | { type: "community"; entity: Community & { membershipRole?: MembershipRole } }
  | { type: "club"; entity: Club & { membershipRole?: MembershipRole } };

const inputClass =
  "w-full px-3.5 py-2.5 text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200";

const inputStyle = {
  background: "hsl(0 0% 100% / 0.6)",
  border: "1px solid hsl(0 0% 80% / 0.5)",
  borderRadius: "12px",
};

const labelClass =
  "block text-[0.66rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

// ─── Edit Entity Modal ───────────────────────────────────────────────────────

function EditEntityModal({
  target,
  onClose,
  onUpdated,
}: {
  target: EntityRef;
  onClose: () => void;
  onUpdated: (entity: Community | Club) => void;
}) {
  const { entity, type } = target;
  const isCommunity = type === "community";

  const [name, setName] = useState(entity.name);
  const [shortDescription, setShortDescription] = useState(entity.shortDescription || "");
  const [fullDescription, setFullDescription] = useState(entity.fullDescription || "");
  const [bannerUrl, setBannerUrl] = useState(entity.bannerUrl || "");
  const [logoUrl, setLogoUrl] = useState(entity.logoUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      if (isCommunity) {
        const updated = await api.communities.update(entity.id, {
          name: name.trim(),
          shortDescription,
          fullDescription,
          bannerUrl,
          logoUrl,
        });
        onUpdated(updated);
      } else {
        const updated = await api.clubs.update(entity.id, {
          name: name.trim(),
          shortDescription,
          fullDescription,
          bannerUrl,
          logoUrl,
        });
        onUpdated(updated);
      }
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
          <h2 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Edit {isCommunity ? "Community" : "Club"} Profile
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)]">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} style={inputStyle} />
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
            <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed description" rows={4} className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]" style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}>Cancel</button>
          <button onClick={handleSave} disabled={submitting} className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl disabled:opacity-50 font-[family-name:var(--font-ui)]" style={{ background: isCommunity ? "var(--accent)" : "hsl(220 50% 55%)", color: "white" }}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Create Update Modal ─────────────────────────────────────────────────────

function CreateUpdateModal({
  target,
  onClose,
  onCreated,
}: {
  target: EntityRef;
  onClose: () => void;
  onCreated: (u: EntityUpdate) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const u = await api.updates.create({
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        ...(target.type === "community" ? { communityId: target.entity.id } : { clubId: target.entity.id }),
      });
      onCreated(u);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(6px)" }}
    >
      <Squircle
        cornerRadius={28}
        cornerSmoothing={1}
        className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: "hsl(0 0% 97% / 0.95)",
          backdropFilter: "blur(40px) saturate(1.5)",
          boxShadow: "0 8px 60px hsl(0 0% 10% / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            New Announcement
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[hsl(0_0%_0%_/_0.06)] transition-colors">
            <X className="w-4 h-4 text-[var(--col-dim)]" />
          </button>
        </div>

        <div className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
          Publishing for: <span className="font-bold text-[var(--col-secondary)]">{target.entity.name}</span>
        </div>

        <div className="space-y-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement headline"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Image URL (optional)">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Content">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement details..."
              rows={5}
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </Field>
          {error && <p className="text-[0.74rem] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button
            onClick={onClose}
            className="text-[0.78rem] font-medium px-4 py-2 rounded-xl font-[family-name:var(--font-ui)]"
            style={{ background: "hsl(0 0% 0% / 0.06)", color: "var(--col-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="flex items-center gap-1.5 text-[0.78rem] font-semibold px-5 py-2 rounded-xl font-[family-name:var(--font-ui)] transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Save Draft
          </button>
        </div>
      </Squircle>
    </div>
  );
}

// ─── Update Card ─────────────────────────────────────────────────────────────

function UpdateCard({
  update,
  onSubmit,
  onDelete,
}: {
  update: EntityUpdate;
  onSubmit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(update.id);
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(true);
    await onDelete(update.id);
    setDeleting(false);
  };

  return (
    <Squircle
      cornerRadius={18}
      cornerSmoothing={1}
      className="p-4"
      style={{
        background: "hsl(0 0% 96% / 0.38)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 2px 12px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.5)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            {update.title}
          </h4>
          <StatusBadge status={update.status} />
        </div>
        <p className="text-[0.6rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] flex-shrink-0">
          {formatDate(update.createdAt)}
        </p>
      </div>

      <p className="text-[0.74rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-3 line-clamp-3">
        {update.content}
      </p>

      {update.status === "PENDING_APPROVAL" && (
        <div className="text-[0.7rem] px-3 py-1.5 rounded-xl mb-3 font-[family-name:var(--font-ui)] flex items-center gap-1.5"
          style={{ background: "hsl(40 70% 50% / 0.1)", color: "hsl(40 70% 40%)" }}>
          <Clock className="w-3.5 h-3.5" />
          Awaiting Super Admin review and approval.
        </div>
      )}

      {update.status === "REJECTED" && update.reviewRemarks && (
        <div
          className="text-[0.7rem] px-3 py-2 rounded-xl mb-3 font-[family-name:var(--font-ui)]"
          style={{ background: "hsl(0 60% 50% / 0.08)", color: "hsl(0 60% 45%)", border: "1px solid hsl(0 60% 50% / 0.2)" }}
        >
          <span className="font-semibold">Rejection reason:</span> {update.reviewRemarks}
        </div>
      )}

      {(update.status === "DRAFT" || update.status === "REJECTED") && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 text-[0.72rem] font-semibold px-3.5 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 font-[family-name:var(--font-ui)]"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Submit for Approval
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 text-[0.72rem] px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-red-50 font-[family-name:var(--font-ui)]"
            style={{ color: "hsl(0 60% 50%)" }}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete
          </button>
        </div>
      )}
    </Squircle>
  );
}

// ─── Entity Section ──────────────────────────────────────────────────────────

function EntitySection({
  entityRef,
  updates,
  onUpdateCreate,
  onUpdateSubmit,
  onUpdateDelete,
  onEditEntity,
}: {
  entityRef: EntityRef;
  updates: EntityUpdate[];
  onUpdateCreate: (target: EntityRef) => void;
  onUpdateSubmit: (id: string) => Promise<void>;
  onUpdateDelete: (id: string) => Promise<void>;
  onEditEntity: (target: EntityRef) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { entity, type } = entityRef;
  const isCommunity = type === "community";
  const isHead = entity.membershipRole === "HEAD";

  const publicLink = isCommunity
    ? `/student/communities/${entity.slug}`
    : `/student/clubs/${entity.slug}`;

  const createEventLink = isCommunity
    ? `/student/events/create?communityId=${entity.id}`
    : `/student/events/create?clubId=${entity.id}`;

  return (
    <Squircle
      cornerRadius={24}
      cornerSmoothing={1}
      className="overflow-hidden"
      style={{
        background: "hsl(0 0% 96% / 0.48)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
        borderTop: isCommunity ? "2px solid var(--accent)" : "2px solid hsl(220 50% 55%)",
      }}
    >
      {/* Header Banner & Profile */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: entity.logoUrl
                  ? `url(${entity.logoUrl}) center/cover no-repeat`
                  : isCommunity
                  ? "linear-gradient(135deg, var(--accent), hsl(25 75% 55%))"
                  : "linear-gradient(135deg, hsl(220 50% 55%), hsl(220 60% 65%))",
              }}
            >
              {!entity.logoUrl && (
                isCommunity
                  ? <Building2 className="w-6 h-6 text-white" />
                  : <Users2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[0.52rem] font-bold uppercase tracking-widest font-[family-name:var(--font-mono)]"
                  style={{ color: isCommunity ? "var(--accent)" : "hsl(220 50% 55%)" }}
                >
                  {isCommunity ? "Community" : "Club"}
                </span>
                <span
                  className="text-[0.52rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full font-[family-name:var(--font-mono)]"
                  style={{
                    background: isHead ? "hsl(25 65% 45% / 0.12)" : "hsl(0 0% 85% / 0.5)",
                    color: isHead ? "var(--accent)" : "var(--col-dim)",
                  }}
                >
                  {isHead ? "Head" : "Core Member"}
                </span>
              </div>
              <h3 className="text-[1.05rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-tight">
                {entity.name}
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={createEventLink}
              className="flex items-center gap-1.5 text-[0.72rem] font-semibold px-3 py-1.5 rounded-xl font-[family-name:var(--font-ui)] transition-all hover:scale-105"
              style={{ background: "var(--col-primary)", color: "var(--bg)" }}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Host Event
            </Link>

            {isHead && (
              <button
                onClick={() => onEditEntity(entityRef)}
                className="flex items-center gap-1.5 text-[0.72rem] font-medium px-3 py-1.5 rounded-xl font-[family-name:var(--font-ui)] transition-all hover:bg-[hsl(0_0%_100%_/_0.8)]"
                style={{
                  background: "hsl(0 0% 100% / 0.6)",
                  border: "1px solid hsl(0 0% 85% / 0.5)",
                  color: "var(--col-secondary)",
                }}
              >
                <Pencil className="w-3 h-3" />
                Edit Profile
              </button>
            )}

            <button
              onClick={() => onUpdateCreate(entityRef)}
              className="flex items-center gap-1.5 text-[0.72rem] font-semibold px-3.5 py-1.5 rounded-xl transition-all hover:scale-105 font-[family-name:var(--font-ui)]"
              style={{ background: isCommunity ? "var(--accent)" : "hsl(220 50% 55%)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Announce
            </button>

            <Link
              href={publicLink}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[hsl(0_0%_0%_/_0.06)] transition-colors text-[var(--col-dim)]"
              title="View Public Page"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Short description */}
        {entity.shortDescription && (
          <p className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-[1.5] mb-4">
            {entity.shortDescription}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-[0.66rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)] pb-2">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {entity.followerCount ?? 0} followers</span>
          {isCommunity && (
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {(entity as Community).clubCount ?? 0} clubs</span>
          )}
          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {entity.eventCount ?? 0} events</span>
        </div>
      </div>

      {/* Announcements header toggle */}
      <div
        className="flex items-center justify-between px-5 py-3 border-t cursor-pointer hover:bg-[hsl(0_0%_0%_/_0.02)] transition-colors"
        style={{ borderColor: "hsl(0 0% 85% / 0.4)" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
          Announcements & Updates ({updates.length})
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--col-dim)]" /> : <ChevronDown className="w-4 h-4 text-[var(--col-dim)]" />}
      </div>

      {/* Updates list */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 space-y-2.5">
          {updates.length === 0 ? (
            <div
              className="py-6 text-center rounded-2xl"
              style={{ background: "hsl(0 0% 0% / 0.03)", border: "1px dashed hsl(0 0% 80% / 0.5)" }}
            >
              <Edit3 className="w-5 h-5 text-[var(--col-dim)] mx-auto mb-2 opacity-40" />
              <p className="text-[0.76rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
                No announcements yet. Click &quot;Announce&quot; to post a new draft!
              </p>
            </div>
          ) : (
            updates.map((u) => (
              <UpdateCard key={u.id} update={u} onSubmit={onUpdateSubmit} onDelete={onUpdateDelete} />
            ))
          )}
        </div>
      )}
    </Squircle>
  );
}

// ─── Main MyCommunities Page ────────────────────────────────────────────────

export default function MyCommunitiesPage() {
  const [data, setData] = useState<MyAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<EntityRef | null>(null);
  const [editingTarget, setEditingTarget] = useState<EntityRef | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.updates.myAssignments();
      setData(result);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdateCreated = (communityId: string | undefined, clubId: string | undefined, u: EntityUpdate) => {
    setData((prev) => {
      if (!prev) return prev;
      if (communityId) {
        return {
          ...prev,
          communities: (prev.communities || []).map((c) =>
            c.id === communityId ? { ...c, updates: [u, ...(c.updates ?? [])] } : c
          ),
        };
      }
      if (clubId) {
        return {
          ...prev,
          clubs: (prev.clubs || []).map((c) =>
            c.id === clubId ? { ...c, updates: [u, ...(c.updates ?? [])] } : c
          ),
        };
      }
      return prev;
    });
    setModal(null);
  };

  const handleEntityUpdated = (updated: Community | Club) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        communities: (prev.communities || []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        clubs: (prev.clubs || []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
      };
    });
  };

  const handleSubmit = async (updateId: string) => {
    try {
      const updated = await api.updates.submit(updateId);
      setData((prev) => {
        if (!prev) return prev;
        const patch = (updates: EntityUpdate[]) =>
          updates.map((u) => (u.id === updateId ? updated : u));
        return {
          communities: (prev.communities || []).map((c) => ({ ...c, updates: patch(c.updates ?? []) })),
          clubs: (prev.clubs || []).map((c) => ({ ...c, updates: patch(c.updates ?? []) })),
        };
      });
    } catch (e) {
      alert(getApiErrorMessage(e));
    }
  };

  const handleDelete = async (updateId: string) => {
    try {
      await api.updates.delete(updateId);
      setData((prev) => {
        if (!prev) return prev;
        const patch = (updates: EntityUpdate[]) => updates.filter((u) => u.id !== updateId);
        return {
          communities: (prev.communities || []).map((c) => ({ ...c, updates: patch(c.updates ?? []) })),
          clubs: (prev.clubs || []).map((c) => ({ ...c, updates: patch(c.updates ?? []) })),
        };
      });
    } catch (e) {
      alert(getApiErrorMessage(e));
    }
  };

  const hasCommunities = (data?.communities?.length ?? 0) > 0;
  const hasClubs = (data?.clubs?.length ?? 0) > 0;
  const hasData = hasCommunities || hasClubs;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-4 font-[family-name:var(--font-mono)]">
          <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
          Management Portal
        </p>
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
          My Communities & Clubs
          <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
        </h1>
        <p className="mt-2 text-[0.88rem] text-[var(--col-secondary)] leading-[1.6] font-[family-name:var(--font-ui)]">
          Manage your assigned communities & clubs, post announcements for Super Admin approval, and host approved events.
        </p>
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
      {!loading && !error && hasData && (
        <div className="space-y-6">
          {data!.communities.map((community) => (
            <EntitySection
              key={community.id}
              entityRef={{ type: "community", entity: community }}
              updates={community.updates ?? []}
              onUpdateCreate={(target) => setModal(target)}
              onUpdateSubmit={handleSubmit}
              onUpdateDelete={handleDelete}
              onEditEntity={(target) => setEditingTarget(target)}
            />
          ))}
          {data!.clubs.map((club) => (
            <EntitySection
              key={club.id}
              entityRef={{ type: "club", entity: club }}
              updates={club.updates ?? []}
              onUpdateCreate={(target) => setModal(target)}
              onUpdateSubmit={handleSubmit}
              onUpdateDelete={handleDelete}
              onEditEntity={(target) => setEditingTarget(target)}
            />
          ))}
        </div>
      )}

      {!loading && !error && !hasData && (
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
          <Building2 className="w-10 h-10 text-[var(--accent)] mb-3 opacity-30" />
          <p className="text-[0.92rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">
            No Active Assignments
          </p>
          <p className="text-[0.78rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            You are not assigned as Head or Core Member of any Community or Club yet.
          </p>
        </Squircle>
      )}

      {/* Create Update Modal */}
      {modal && (
        <CreateUpdateModal
          target={modal}
          onClose={() => setModal(null)}
          onCreated={(u) =>
            handleUpdateCreated(
              modal.type === "community" ? modal.entity.id : undefined,
              modal.type === "club" ? modal.entity.id : undefined,
              u
            )
          }
        />
      )}

      {/* Edit Entity Modal */}
      {editingTarget && (
        <EditEntityModal
          target={editingTarget}
          onClose={() => setEditingTarget(null)}
          onUpdated={handleEntityUpdated}
        />
      )}
    </div>
  );
}
