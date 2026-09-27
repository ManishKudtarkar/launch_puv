"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import { ALL_USERS } from "@/constants/mock-data";
import { ROLE_LABELS } from "@/constants/navigation";
import type { User, UserRole } from "@/types";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  GraduationCap,
  Shield,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const roleColors: Record<string, string> = {
  student: "var(--role-student)",
  admin: "var(--role-admin)",
  super_admin: "var(--role-super)",
  platform_admin: "var(--role-platform)",
};

const RoleIcon = ({ role }: { role: string }) => {
  if (role === "student") return <GraduationCap className="w-[10px] h-[10px]" strokeWidth={1.5} />;
  return <Shield className="w-[10px] h-[10px]" strokeWidth={1.5} />;
};

export default function PlatformAdminUsersPage() {
  const [users, setUsers] = useState<User[]>(ALL_USERS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [success, setSuccess] = useState("");

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const inputStyle = { borderRadius: "12px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" };

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2000); };

  const filters = [
    { key: "all", label: "All", count: users.length },
    { key: "student", label: "Students", count: roleCounts.student || 0 },
    { key: "admin", label: "Admins", count: roleCounts.admin || 0 },
    { key: "super_admin", label: "Super Admins", count: roleCounts.super_admin || 0 },
    { key: "platform_admin", label: "Platform", count: roleCounts.platform_admin || 0 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            User Management
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Full user control — create, edit, assign roles, or remove users.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-[10px] text-[0.78rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
          style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}
        >
          <Plus className="w-[13px] h-[13px]" strokeWidth={1.5} />
          Add User
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)]" strokeWidth={1.5} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-[9px] text-[0.8rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none"
            style={inputStyle}
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-[7px] text-[0.72rem] font-medium transition-all duration-200 cursor-pointer font-[family-name:var(--font-ui)]"
              style={{
                borderRadius: "10px",
                ...(filter === f.key
                  ? { background: "var(--col-primary)", color: "white" }
                  : { background: "hsl(0 0% 100% / 0.4)", color: "var(--col-secondary)", border: "1px solid hsl(0 0% 85% / 0.3)" }),
              }}
            >
              {f.label} <span className="ml-1 opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Squircle cornerRadius={24} cornerSmoothing={1} className="overflow-hidden" style={glassStyle}>
        <div className="grid items-center gap-4 px-6 py-3.5" style={{ gridTemplateColumns: "1fr 1.2fr 100px 120px 80px", borderBottom: "1px solid hsl(0 0% 85% / 0.3)" }}>
          {["User", "Email", "Role", "Dept / Org", "Actions"].map((h) => (
            <span key={h} className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">{h}</span>
          ))}
        </div>
        {filtered.map((u, i) => {
          const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
          const color = roleColors[u.role] || "var(--col-dim)";
          return (
            <div
              key={u.id}
              className="grid items-center gap-4 px-6 py-3.5 transition-colors duration-200 hover:bg-[hsl(0_0%_100%_/_0.25)]"
              style={{
                gridTemplateColumns: "1fr 1.2fr 100px 120px 80px",
                ...(i < filtered.length - 1 ? { borderBottom: "1px solid hsl(0 0% 88% / 0.25)" } : {}),
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Squircle
                  cornerRadius={10}
                  cornerSmoothing={1}
                  className="w-8 h-8 flex items-center justify-center text-white text-[0.42rem] font-bold font-[family-name:var(--font-display)] flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                >
                  {initials}
                </Squircle>
                <span className="text-[0.82rem] font-medium text-[var(--col-primary)] font-[family-name:var(--font-display)] truncate">{u.name}</span>
              </div>
              <span className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-mono)] truncate">{u.email}</span>
              <Squircle
                cornerRadius={6}
                cornerSmoothing={1}
                className="inline-flex items-center gap-1.5 px-2 py-[2px] text-[0.54rem] uppercase tracking-[0.1em] font-medium font-[family-name:var(--font-mono)] w-fit"
                style={{ background: `${color}15`, color }}
              >
                <RoleIcon role={u.role} />
                {ROLE_LABELS[u.role as UserRole]}
              </Squircle>
              <span className="text-[0.76rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] truncate">{u.department ?? u.organization ?? "—"}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditUser(u)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer">
                  <Pencil className="w-[11px] h-[11px]" strokeWidth={1.5} />
                </button>
                <button onClick={() => setDeleteUser(u)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[hsl(0,60%,45%)] hover:bg-[hsl(0_60%_50%_/_0.05)] transition-colors cursor-pointer">
                  <Trash2 className="w-[11px] h-[11px]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}
      </Squircle>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setShowAdd(false)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Add User</h3>
              <button onClick={() => setShowAdd(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Full Name</label>
                <input type="text" placeholder="Full name" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Email</label>
                <input type="email" placeholder="email@pu.ac.in" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Role</label>
                <div className="relative"><select className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" /></div></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Department</label>
                <input type="text" placeholder="e.g. CSE" className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none" style={inputStyle} /></div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { setUsers([...users, { id: `u-${Date.now()}`, name: "New User", email: "newuser@pu.ac.in", role: "student", department: "CSE" }]); setShowAdd(false); flash("User added"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>Add</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setEditUser(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] cursor-pointer"><X className="w-[14px] h-[14px]" strokeWidth={1.5} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Full Name</label>
                <input type="text" defaultValue={editUser.name} className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Email</label>
                <input type="email" defaultValue={editUser.email} className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none" style={inputStyle} /></div>
              <div><label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Role</label>
                <div className="relative"><select defaultValue={editUser.role} className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] outline-none appearance-none cursor-pointer" style={inputStyle}>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--col-dim)] pointer-events-none" /></div></div>
            </div>
            {editUser.role !== "super_admin" && (
              <div className="pt-3 border-t border-[hsl(0_0%_88%_/_0.3)] mt-4">
                <button
                  type="button"
                  onClick={() => {
                    const target = editUser;
                    setEditUser(null);
                    setDeleteUser(target);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-[0.78rem] font-semibold text-[hsl(0,60%,45%)] bg-[hsl(0,60%,50%_/_0.1)] hover:bg-[hsl(0,60%,48%)] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User Account</span>
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => { setEditUser(null); flash("User updated"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}>Save</button>
              <button onClick={() => setEditUser(null)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Delete confirm */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setDeleteUser(null)} />
          <Squircle cornerRadius={24} cornerSmoothing={1} className="relative z-10 w-full max-w-sm p-7 animate-scale-in text-center"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(0 60% 50% / 0.1)" }}>
              <Trash2 className="w-5 h-5 text-[hsl(0,60%,45%)]" strokeWidth={2} />
            </div>
            <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-1">Remove User?</h3>
            <p className="text-[0.82rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-5">
              Remove {deleteUser.name}? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setUsers(users.filter((u) => u.id !== deleteUser.id)); setDeleteUser(null); flash("User removed"); }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white cursor-pointer font-[family-name:var(--font-display)]"
                style={{ borderRadius: "14px", background: "hsl(0 60% 48%)", boxShadow: "0 2px 12px hsl(0 60% 48% / 0.3)" }}>Remove</button>
              <button onClick={() => setDeleteUser(null)} className="flex-1 text-center text-[0.8rem] font-medium py-[11px] hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}>Cancel</button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Success toast */}
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
