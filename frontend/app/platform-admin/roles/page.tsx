"use client";

import { useState } from "react";
import { Squircle } from "@squircle-js/react";
import { ROLE_PERMISSIONS } from "@/constants/mock-data";
import {
  ShieldCheck,
  Plus,
  Pencil,
  X,
  Check,
} from "lucide-react";

const ALL_PERMISSIONS = [
  "events.read", "events.create", "events.update", "events.approve",
  "registrations.create", "registrations.read",
  "tickets.read", "certificates.read",
  "attendance.manage", "staff.assign",
  "users.manage", "organizations.manage",
  "analytics.read", "roles.manage", "settings.manage", "*",
];

export default function PlatformAdminRolesPage() {
  const [roles, setRoles] = useState(ROLE_PERMISSIONS);
  const [editRole, setEditRole] = useState<(typeof ROLE_PERMISSIONS)[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const glassStyle = {
    background: "hsl(0 0% 96% / 0.42)",
    backdropFilter: "blur(24px) saturate(1.4)",
    WebkitBackdropFilter: "blur(24px) saturate(1.4)",
    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
  };

  const togglePermission = (perm: string) => {
    if (!editRole) return;
    const has = editRole.permissions.includes(perm);
    setEditRole({
      ...editRole,
      permissions: has ? editRole.permissions.filter((p) => p !== perm) : [...editRole.permissions, perm],
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
            Roles & Permissions
            <span className="text-[var(--accent)] font-[family-name:var(--font-cursive)] font-normal text-[0.7em]"> .</span>
          </h1>
          <p className="mt-2 text-[0.84rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
            Manage user roles and their platform permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-[10px] text-[0.78rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)]"
          style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}
        >
          <Plus className="w-[13px] h-[13px]" strokeWidth={1.5} />
          Add Custom Role
        </button>
      </div>

      {/* Role cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {roles.map((role) => (
          <Squircle key={role.id} cornerRadius={24} cornerSmoothing={1} className="p-6" style={glassStyle}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-[var(--role-platform)] flex items-center justify-center">
                  <ShieldCheck className="w-[15px] h-[15px] text-[var(--role-platform)]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[0.92rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">{role.name}</p>
                  <p className="text-[0.72rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">{role.description}</p>
                </div>
              </div>
              <button
                onClick={() => setEditRole({ ...role })}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer"
              >
                <Pencil className="w-[12px] h-[12px]" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-2">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <Squircle
                    key={p}
                    cornerRadius={6}
                    cornerSmoothing={1}
                    className="px-2 py-[2px] text-[0.54rem] uppercase tracking-[0.08em] font-medium font-[family-name:var(--font-mono)] text-[var(--col-dim)]"
                    style={{ background: "hsl(0 0% 90% / 0.5)" }}
                  >
                    {p}
                  </Squircle>
                ))}
              </div>
            </div>
          </Squircle>
        ))}
      </div>

      {/* Edit modal */}
      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setEditRole(null)} />
          <Squircle
            cornerRadius={24}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-lg p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                Edit Role: {editRole.name}
              </h3>
              <button onClick={() => setEditRole(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer">
                <X className="w-[14px] h-[14px]" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
              Permissions
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {ALL_PERMISSIONS.map((perm) => {
                const has = editRole.permissions.includes(perm);
                return (
                  <label
                    key={perm}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors hover:bg-[hsl(0_0%_100%_/_0.3)]"
                    style={{ borderRadius: "10px" }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        background: has ? "var(--col-primary)" : "hsl(0 0% 100% / 0.5)",
                        border: has ? "none" : "1px solid hsl(0 0% 80%)",
                      }}
                    >
                      {has && <Check className="w-[10px] h-[10px] text-white" strokeWidth={2.5} />}
                    </div>
                    <input type="checkbox" checked={has} onChange={() => togglePermission(perm)} className="sr-only" />
                    <span className="text-[0.76rem] text-[var(--col-primary)] font-[family-name:var(--font-mono)]">{perm}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setRoles(roles.map((r) => (r.id === editRole.id ? editRole : r)));
                  setEditRole(null);
                }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditRole(null)}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              >
                Cancel
              </button>
            </div>
          </Squircle>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[hsl(0_0%_10%_/_0.4)] backdrop-blur-sm animate-fade-in" onClick={() => setShowAdd(false)} />
          <Squircle
            cornerRadius={24}
            cornerSmoothing={1}
            className="relative z-10 w-full max-w-sm p-7 animate-scale-in"
            style={{ background: "hsl(0 0% 96% / 0.9)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", boxShadow: "0 8px 40px var(--shadow-lg), inset 0 1px 0 hsl(0 0% 100% / 0.6)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[1rem] font-semibold text-[var(--col-primary)] font-[family-name:var(--font-display)]">Add Custom Role</h3>
              <button onClick={() => setShowAdd(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--col-dim)] hover:text-[var(--col-primary)] hover:bg-[hsl(0_0%_0%_/_0.05)] transition-colors cursor-pointer">
                <X className="w-[14px] h-[14px]" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Role Name</label>
                <input
                  type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Moderator"
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none"
                  style={{ borderRadius: "12px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
                />
              </div>
              <div>
                <label className="text-[0.64rem] uppercase tracking-[0.14em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-1.5 block">Description</label>
                <input
                  type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What this role can do"
                  className="w-full px-4 py-[10px] text-[0.82rem] font-[family-name:var(--font-ui)] text-[var(--col-primary)] placeholder:text-[var(--col-dim)] outline-none"
                  style={{ borderRadius: "12px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setRoles([...roles, { id: `r-${Date.now()}`, name: newName || "Custom Role", description: newDesc || "Custom role", permissions: ["events.read"] }]);
                  setNewName(""); setNewDesc(""); setShowAdd(false);
                }}
                className="flex-1 py-[11px] text-[0.8rem] font-medium text-white transition-all duration-300 hover:opacity-85 cursor-pointer font-[family-name:var(--font-display)] text-center"
                style={{ borderRadius: "14px", background: "var(--col-primary)", boxShadow: "0 2px 12px hsl(0 0% 10% / 0.2)" }}
              >
                Add Role
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 text-center text-[0.8rem] font-medium py-[11px] transition-all duration-300 hover:bg-[hsl(0_0%_92%)] font-[family-name:var(--font-display)] cursor-pointer text-[var(--col-secondary)]"
                style={{ borderRadius: "14px", background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(0 0% 85% / 0.4)" }}
              >
                Cancel
              </button>
            </div>
          </Squircle>
        </div>
      )}
    </div>
  );
}
