"use client";

import { useState, useEffect } from "react";
import { Squircle } from "@squircle-js/react";
import { api, getApiErrorMessage, type ApiUser } from "@/lib/api-client";
import type { BackendRole, UserType } from "@/types";
import { Users, Search, Pencil, Trash2, Mail, GraduationCap, Shield, Building2, Check, Plus, X } from "lucide-react";

const BACKEND_ROLE_LABELS: Record<BackendRole, string> = {
  PARTICIPANT: "Student",
  EVENT_ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const roleBadge: Record<BackendRole, { bg: string; text: string }> = {
  PARTICIPANT: { bg: "hsl(200 80% 55% / 0.1)", text: "hsl(200 70% 40%)" },
  EVENT_ADMIN: { bg: "hsl(270 60% 65% / 0.1)", text: "hsl(270 50% 45%)" },
  SUPER_ADMIN: { bg: "hsl(25 80% 50% / 0.1)", text: "hsl(25 70% 40%)" },
};

const roleIcon: Record<BackendRole, typeof GraduationCap> = {
  PARTICIPANT: GraduationCap,
  EVENT_ADMIN: Building2,
  SUPER_ADMIN: Shield,
};

type FilterRole = "all" | BackendRole;

const glassStyle = {
  background: "hsl(0 0% 96% / 0.42)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
};
const inputStyle = { background: "hsl(0 0% 100% / 0.55)", border: "1px solid hsl(0 0% 85% / 0.5)", borderRadius: "14px" };
const inputClass = "w-full px-4 py-3 text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30";
const labelClass = "block text-[0.68rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterRole>("all");
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [editRole, setEditRole] = useState<BackendRole>("PARTICIPANT");
  const [saving, setSaving] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deleteUser, setDeleteUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showSuccess, setShowSuccess] = useState("");
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "PARTICIPANT" as BackendRole,
    userType: "STUDENT" as UserType,
  });

  useEffect(() => {
    api.users.list()
      .then(setUsers)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const updated = await api.users.updateRole(editUser.id, editRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setShowSuccess(`Role updated for ${updated.fullName}.`);
      setEditUser(null);
    } catch (e) {
      setShowSuccess(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setShowSuccess("Please fill in all required fields.");
      return;
    }

    setCreatingUser(true);
    try {
      const created = await api.users.create({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        userType: createForm.userType,
      });

      setUsers((prev) => [created.user, ...prev]);
      setShowCreateUser(false);
      setShowSuccess(`User created successfully for ${created.user.fullName}.`);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        role: "PARTICIPANT",
        userType: "STUDENT",
      });
    } catch (e) {
      setShowSuccess(getApiErrorMessage(e));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeletingUser(true);
    try {
      await api.users.delete(deleteUser.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteUser.id));
      setShowSuccess(`${deleteUser.fullName} was permanently deleted.`);
      setDeleteUser(null);
    } catch (e) {
      setShowSuccess(getApiErrorMessage(e));
    } finally {
      setDeletingUser(false);
    }
  };

  const roleFilters: { label: string; value: FilterRole }[] = [
    { label: "All", value: "all" },
    { label: "Students", value: "PARTICIPANT" },
    { label: "Admins", value: "EVENT_ADMIN" },
    { label: "Super Admins", value: "SUPER_ADMIN" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Users<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            {users.length} users &middot; {users.filter((u) => u.role === "PARTICIPANT").length} students &middot; {users.filter((u) => u.role === "EVENT_ADMIN").length} admins
          </p>
        </div>

        <button
          onClick={() => setShowCreateUser(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--col-primary)] px-4 py-2.5 text-[0.76rem] font-medium text-[var(--bg)] shadow-lg shadow-[var(--shadow)] hover:opacity-90 transition-opacity duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Create User
        </button>
      </div>

      {error && <p className="mb-5 text-[0.82rem] text-[var(--danger)] font-[family-name:var(--font-ui)]">{error}</p>}
      {loading && <p className="mb-5 text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">Loading users...</p>}

      <div className="flex items-center gap-4 mb-7">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)]" strokeWidth={1.5} />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-[9px] text-[0.78rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)] outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-30" style={inputStyle} />
        </div>
        <div className="flex items-center gap-2">
          {roleFilters.map((f) => {
            const count = f.value === "all" ? users.length : users.filter((u) => u.role === f.value).length;
            const active = filter === f.value;
            return (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="text-[0.74rem] font-medium px-3.5 py-[7px] transition-all duration-300 font-[family-name:var(--font-ui)] cursor-pointer"
                style={{ borderRadius: "12px", ...(active ? { background: "var(--col-primary)", color: "var(--bg)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" } : { background: "hsl(0 0% 100% / 0.4)", color: "var(--col-secondary)", border: "1px solid hsl(0 0% 85% / 0.4)" }) }}>
                {f.label}<span className="ml-1.5 text-[0.6rem] font-[family-name:var(--font-mono)]" style={{ opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <Squircle cornerRadius={22} cornerSmoothing={1} className="p-14 text-center" style={glassStyle}>
          <Users className="w-10 h-10 text-[var(--col-dim)] mx-auto mb-3 opacity-40" strokeWidth={1} />
          <p className="text-[0.88rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">No users match this filter.</p>
        </Squircle>
      ) : (
        <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
          <div className="grid items-center gap-4 px-6 py-3.5" style={{ gridTemplateColumns: "1fr 200px 140px 72px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">User</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Email</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">Role</span>
            <span className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] text-right">Actions</span>
          </div>
          {filtered.map((user, i) => {
            const badge = roleBadge[user.role];
            const RoleIcon = roleIcon[user.role];
            const initials = user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2);
            return (
              <div key={user.id} className="group grid items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
                style={{ gridTemplateColumns: "1fr 200px 140px 72px", ...(i < filtered.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}) }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Squircle cornerRadius={11} cornerSmoothing={1} className="w-9 h-9 flex items-center justify-center text-white text-[0.5rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${badge.text}, var(--col-primary))` }}>{initials}</Squircle>
                  <div className="min-w-0">
                    <p className="text-[0.84rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{user.fullName}</p>
                    <p className="text-[0.64rem] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{user.userType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-[10px] h-[10px] text-[var(--col-dim)] flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{user.email}</span>
                </div>
                <Squircle cornerRadius={8} cornerSmoothing={1} className="inline-flex items-center gap-1.5 px-2.5 py-1 w-fit" style={{ background: badge.bg }}>
                  <RoleIcon className="w-[10px] h-[10px]" style={{ color: badge.text }} strokeWidth={1.5} />
                  <span className="text-[0.64rem] font-medium font-[family-name:var(--font-mono)] uppercase tracking-[0.08em]" style={{ color: badge.text }}>{BACKEND_ROLE_LABELS[user.role]}</span>
                </Squircle>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditUser(user); setEditRole(user.role); }}
                    aria-label={`Edit ${user.fullName}`}
                    className="w-8 h-8 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--col-primary)] hover:text-[var(--col-primary)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer">
                    <Pencil className="w-[12px] h-[12px]" strokeWidth={1.5} />
                  </button>
                  {user.role !== "SUPER_ADMIN" && (
                    <button onClick={() => setDeleteUser(user)}
                      aria-label={`Delete ${user.fullName}`}
                      className="w-8 h-8 rounded-full border border-[var(--line-soft)] flex items-center justify-center hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors duration-200 text-[var(--col-dim)] cursor-pointer">
                      <Trash2 className="w-[12px] h-[12px]" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Squircle>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm" onClick={() => !deletingUser && setDeleteUser(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7" style={{ background: "hsl(0 0% 96% / 0.92)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Delete user?</h3>
              <button onClick={() => setDeleteUser(null)} disabled={deletingUser} aria-label="Close" className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer disabled:opacity-50"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <p className="text-[0.82rem] leading-relaxed text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">This will permanently delete <strong className="text-[var(--col-primary)]">{deleteUser.fullName}</strong> ({BACKEND_ROLE_LABELS[deleteUser.role]}) and remove their account from our dataset so they can never log in again. This action cannot be undone.</p>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleDeleteUser} disabled={deletingUser} className="flex-1 py-[11px] text-[0.8rem] font-medium text-white bg-[var(--danger)] hover:opacity-85 disabled:opacity-50 transition-opacity cursor-pointer" style={{ borderRadius: "14px" }}>{deletingUser ? "Deleting..." : "Delete permanently"}</button>
              <button onClick={() => setDeleteUser(null)} disabled={deletingUser} className="flex-1 py-[11px] text-[0.8rem] font-medium text-[var(--col-secondary)] hover:bg-[hsl(0_0%_92%)] disabled:opacity-50 cursor-pointer" style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-md p-7"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg)" }}>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-5">
              Edit Role<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>User</label>
                <p className="text-[0.84rem] text-[var(--col-primary)] font-[family-name:var(--font-ui)]">{editUser.fullName} — {editUser.email}</p>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as BackendRole)} className={`${inputClass} cursor-pointer`} style={inputStyle}>
                  <option value="PARTICIPANT">Student (PARTICIPANT)</option>
                  <option value="EVENT_ADMIN">Admin (EVENT_ADMIN)</option>
                  <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
                </select>
              </div>

              {editUser.role !== "SUPER_ADMIN" && (
                <div className="pt-3 border-t border-[hsl(0_0%_88%_/_0.3)] mt-4">
                  <label className="block text-[0.64rem] uppercase tracking-[0.14em] text-[var(--danger)] font-[family-name:var(--font-mono)] mb-2">
                    Danger Zone
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const userToDelete = editUser;
                      setEditUser(null);
                      setDeleteUser(userToDelete);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-[0.78rem] font-semibold text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)] hover:text-white transition-all duration-200 border border-[var(--danger)]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete User Account</span>
                  </button>
                  <p className="text-[0.68rem] text-[var(--col-dim)] mt-1.5 text-center">
                    Permanently delete this user from dataset so they can never log in again.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Squircle cornerRadius={16} cornerSmoothing={1}
                className="group inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }} asChild>
                <button onClick={handleSaveRole} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                  <Squircle cornerRadius={12} cornerSmoothing={1} className="w-[34px] h-[34px] border border-white/70 flex items-center justify-center flex-shrink-0">
                    <Check className="w-[12px] h-[12px]" strokeWidth={2} />
                  </Squircle>
                </button>
              </Squircle>
              <button onClick={() => setEditUser(null)} className="text-[0.82rem] font-medium px-5 py-[10px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)", borderRadius: "16px" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm" onClick={() => setShowCreateUser(false)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-lg p-7"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg)" }}>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-5">
              Create User<span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Enter temporary password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value as BackendRole }))}
                    className={`${inputClass} cursor-pointer`}
                    style={inputStyle}
                  >
                    <option value="PARTICIPANT">Student</option>
                    <option value="EVENT_ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>User Type</label>
                  <select
                    value={createForm.userType}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, userType: e.target.value as UserType }))}
                    className={`${inputClass} cursor-pointer`}
                    style={inputStyle}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty / Staff</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Squircle cornerRadius={16} cornerSmoothing={1}
                className="group inline-flex items-center justify-between text-[0.82rem] font-medium tracking-[0.04em] pl-5 pr-[5px] py-[5px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer disabled:opacity-50"
                style={{ boxShadow: "0 2px 16px var(--shadow-lg)" }} asChild>
                <button onClick={handleCreateUser} disabled={creatingUser}>
                  {creatingUser ? "Creating..." : "Create User"}
                  <Squircle cornerRadius={12} cornerSmoothing={1} className="w-[34px] h-[34px] border border-white/70 flex items-center justify-center flex-shrink-0">
                    <Check className="w-[12px] h-[12px]" strokeWidth={2} />
                  </Squircle>
                </button>
              </Squircle>

              <button
                onClick={() => setShowCreateUser(false)}
                className="text-[0.82rem] font-medium px-5 py-[10px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)", borderRadius: "16px" }}
              >
                Cancel
              </button>
            </div>
          </Squircle>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm" onClick={() => setShowSuccess("")} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 text-center"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg)" }}>
            <div className="w-12 h-12 rounded-full bg-[hsl(142_50%_45%_/_0.12)] flex items-center justify-center mx-auto mb-4">
              <Check className="w-5 h-5 text-[hsl(142,50%,35%)]" strokeWidth={2} />
            </div>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">{showSuccess}</p>
            <Squircle cornerRadius={14} cornerSmoothing={1} className="w-full text-center text-[0.8rem] font-medium py-[11px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 hover:opacity-80 font-[family-name:var(--font-display)] cursor-pointer"
              style={{ boxShadow: "0 2px 12px var(--shadow-lg)" }} asChild>
              <button onClick={() => setShowSuccess("")}>OK</button>
            </Squircle>
          </Squircle>
        </div>
      )}
    </div>
  );
}
