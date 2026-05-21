"use client";

import type { SafeAdmin } from "@/lib/auth";
import { CENTER_OPTIONS, formatCenter, formatRole, isOfficialEmail, USER_CREATABLE_ROLES } from "@/lib/admin-constants";
import { Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../admin-shell";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  center: string | null;
  active: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type UserAction = "set-password" | "generate-password" | "set-active" | "update-role";

type PendingAction = {
  type: UserAction;
  user: AdminUserRow;
  active?: boolean;
};

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Not recorded";
}

export default function UsersClient({ admin }: { admin: SafeAdmin }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "DIRECTOR",
    center: "",
    active: true,
    superAdminPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCreateSecurityPassword, setShowCreateSecurityPassword] = useState(false);
  const [actionRole, setActionRole] = useState("DIRECTOR");
  const [actionCenter, setActionCenter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const visibleUsers = Array.isArray(users) ? users : [];
  const activeManagerCenters = useMemo(() => {
    return new Set(
      visibleUsers
        .filter((user) => user.role === "CENTER_MANAGER" && user.active && user.center)
        .map((user) => user.center as string),
    );
  }, [visibleUsers]);
  const availableCenters = CENTER_OPTIONS.filter((center) => !activeManagerCenters.has(center.value));

  function centersForAction(user: AdminUserRow) {
    return CENTER_OPTIONS.filter((center) => !activeManagerCenters.has(center.value) || center.value === user.center);
  }

  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { users?: unknown; message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Could not load users.");
      }

      setUsers(Array.isArray(result?.users) ? result.users as AdminUserRow[] : []);
    } catch (loadError) {
      setUsers([]);
      setMessage(loadError instanceof Error ? loadError.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isOfficialEmail(form.email)) {
      setMessage("Official accounts must use an @moaetscandg.org.ng email address.");
      return;
    }

    if (form.role === "CENTER_MANAGER" && !form.center) {
      setMessage("Center is required for center managers.");
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null) as { emailWarning?: boolean; message?: string } | null;

    if (!response.ok) {
      setMessage(result?.message || "Could not create user.");
      return;
    }

    setMessage(result?.emailWarning
      ? "User created, but the onboarding email could not be sent."
      : "User created and onboarding email sent.");
    setForm({ name: "", email: "", role: "DIRECTOR", center: "", active: true, superAdminPassword: "" });
    await loadUsers();
  }

  function openAction(action: PendingAction) {
    setPendingAction(action);
    setSecurityPassword("");
    setNewPassword("");
    setShowSecurityPassword(false);
    setShowNewPassword(false);
    setActionRole(action.user.role);
    setActionCenter(action.user.center || "");
    setMessage("");
  }

  async function submitAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingAction) return;

    setActionLoading(true);
    setMessage("");

    const body: Record<string, unknown> = {
      action: pendingAction.type,
      superAdminPassword: securityPassword,
    };

    if (pendingAction.type === "set-password") body.newPassword = newPassword;
    if (pendingAction.type === "set-active") body.active = pendingAction.active;
    if (pendingAction.type === "update-role") {
      body.role = actionRole;
      body.center = actionRole === "CENTER_MANAGER" ? actionCenter : null;
    }

    try {
      const response = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null) as { emailWarning?: boolean; message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Could not update user.");
      }

      const successMessage = pendingAction.type === "generate-password" || pendingAction.type === "set-password"
        ? result?.emailWarning
          ? "Password updated, but email could not be sent."
          : "Password updated and reset email sent."
        : "User updated.";

      setPendingAction(null);
      setMessage(successMessage);
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update user.");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const isSuccessMessage = message === "User created and onboarding email sent.";

  return (
    <AdminShell
      admin={admin}
      active="users"
      title="Admin Users"
      subtitle="Create official MPVTL admin accounts and manage secure access."
    >
        <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950">Create user</h2>
              <p className="mt-1 text-sm text-slate-600">A secure temporary password will be emailed to the user.</p>
            </div>
            <button type="submit" className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.20)] hover:bg-brand-800">
              Create & Send Invite
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <select className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, center: "" })}>
              {USER_CREATABLE_ROLES.map((role) => (
                <option key={role} value={role}>{formatRole(role)}</option>
              ))}
            </select>
            {form.role === "SUPER_ADMIN" && (
              <div className="md:col-span-2 xl:col-span-3">
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm font-semibold text-brand-800">
                  Super Admin accounts have full system access.
                </div>
                <PasswordInput
                  label="Confirm your SUPER_ADMIN password"
                  value={form.superAdminPassword}
                  visible={showCreateSecurityPassword}
                  onToggle={() => setShowCreateSecurityPassword((current) => !current)}
                  onChange={(value) => setForm({ ...form, superAdminPassword: value })}
                />
              </div>
            )}
            {form.role === "CENTER_MANAGER" && (
              availableCenters.length > 0 ? (
                <select className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" value={form.center} onChange={(event) => setForm({ ...form, center: event.target.value })}>
                  <option value="">Select center</option>
                  {availableCenters.map((center) => (
                    <option key={center.value} value={center.value}>{center.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex min-h-12 items-center rounded-xl border border-brand-100 bg-brand-50 px-4 text-sm font-semibold text-brand-800">
                  All centers already have active managers.
                </div>
              )
            )}
            <select
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              value={form.active ? "active" : "inactive"}
              onChange={(event) => setForm({ ...form, active: event.target.value === "active" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {message && (
            <p className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${
              isSuccessMessage
                ? "border border-green-200 bg-green-50 text-green-700"
                : "text-brand-700"
            }`}>
              {message}
            </p>
          )}
        </form>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <div className="rounded-t-2xl border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-navy-950">Existing users</h2>
          </div>
          <div>
            {loading && (
              <div className="p-5 text-sm text-slate-600">
                Loading users...
              </div>
            )}

            {!loading && visibleUsers.length > 0 && (
              <div className="hidden xl:block">
                <div className="grid grid-cols-[1.2fr_1.4fr_1fr_.9fr_.9fr_1.3fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Password</span>
                  <span>Actions</span>
                </div>
                {(Array.isArray(visibleUsers) ? visibleUsers : []).map((user) => (
                  <div key={user.id} className="grid grid-cols-[1.2fr_1.4fr_1fr_.9fr_.9fr_1.3fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0">
                    <span>
                      <span className="block font-bold text-navy-950">{user.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">Created {formatDate(user.createdAt)}</span>
                    </span>
                    <span className="break-words text-slate-700">{user.email}</span>
                    <span className="text-slate-700">
                      {formatRole(user.role)}
                      {user.center && <span className="mt-1 block text-xs text-slate-500">{formatCenter(user.center)}</span>}
                    </span>
                    <span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                        user.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {user.forcePasswordChange ? "Change required" : "Set"}
                      <span className="mt-1 block text-slate-500">Last login: {formatDate(user.lastLoginAt)}</span>
                    </span>
                    <UserActions user={user} openAction={openAction} currentAdminId={admin.id} />
                  </div>
                ))}
              </div>
            )}

            {!loading && visibleUsers.length > 0 && (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:hidden">
                {(Array.isArray(visibleUsers) ? visibleUsers : []).map((user) => (
                  <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(6,19,33,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-navy-950">{user.name}</p>
                        <p className="mt-1 break-words text-sm text-slate-600">{user.email}</p>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                          user.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                        <UserActions user={user} openAction={openAction} currentAdminId={admin.id} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{formatRole(user.role)}</p>
                    {user.center && <p className="mt-1 text-sm text-slate-600">{formatCenter(user.center)}</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <span>Created: {formatDate(user.createdAt)}</span>
                      <span>Last login: {formatDate(user.lastLoginAt)}</span>
                      <span className="col-span-2 font-semibold text-navy-950">
                        Password: {user.forcePasswordChange ? "Change required" : "Set"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && visibleUsers.length === 0 && (
              <div className="p-5 text-sm text-slate-600">
                No admin users found.
              </div>
            )}
          </div>
        </section>

        {pendingAction && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 px-4">
            <form onSubmit={submitAction} className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-[0_28px_90px_rgba(6,19,33,0.28)]">
              <h3 className="text-xl font-bold text-navy-950">Security Confirmation</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Please confirm your SUPER_ADMIN password to continue.
              </p>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-navy-950">
                {actionTitle(pendingAction)}
              </p>

              {pendingAction.type === "set-password" && (
                <PasswordInput
                  label="Temporary password"
                  value={newPassword}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((current) => !current)}
                  onChange={setNewPassword}
                />
              )}

              {pendingAction.type === "update-role" && (
                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="text-sm font-bold text-navy-950">Role</span>
                    <select className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" value={actionRole} onChange={(event) => {
                      setActionRole(event.target.value);
                      setActionCenter("");
                    }}>
                      {USER_CREATABLE_ROLES.map((role) => (
                        <option key={role} value={role}>{formatRole(role)}</option>
                      ))}
                    </select>
                  </label>
                  {actionRole === "CENTER_MANAGER" && (
                    <label className="block">
                      <span className="text-sm font-bold text-navy-950">Center</span>
                      <select className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" value={actionCenter} onChange={(event) => setActionCenter(event.target.value)}>
                        <option value="">Select center</option>
                        {centersForAction(pendingAction.user).map((center) => (
                          <option key={center.value} value={center.value}>{center.label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <PasswordInput
                label="SUPER_ADMIN password"
                value={securityPassword}
                visible={showSecurityPassword}
                onToggle={() => setShowSecurityPassword((current) => !current)}
                onChange={setSecurityPassword}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-navy-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {actionLoading ? "Working..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        )}
    </AdminShell>
  );
}

function actionTitle(action: PendingAction) {
  if (action.type === "generate-password") return `Generate temporary password for ${action.user.name}`;
  if (action.type === "set-password") return `Set temporary password for ${action.user.name}`;
  if (action.type === "set-active") return `${action.active ? "Activate" : "Disable"} ${action.user.name}`;
  if (action.type === "update-role") return `Change role for ${action.user.name}`;
  return action.user.name;
}

function UserActions({
  user,
  openAction,
  currentAdminId,
}: {
  user: AdminUserRow;
  openAction: (action: PendingAction) => void;
  currentAdminId: string;
}) {
  const [open, setOpen] = useState(false);

  function selectAction(action: PendingAction) {
    setOpen(false);
    openAction(action);
  }

  const menuItemClass = "w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-navy-950 transition hover:bg-brand-50 hover:text-brand-700";

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        aria-label={`Open actions for ${user.name}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-navy-950 shadow-[0_10px_28px_rgba(6,19,33,0.08)] transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_70px_rgba(6,19,33,0.18)]">
          <button type="button" className={menuItemClass} onClick={() => selectAction({ type: "generate-password", user })}>
            Generate Temp
          </button>
          <button type="button" className={menuItemClass} onClick={() => selectAction({ type: "set-password", user })}>
            Set Password
          </button>
          {user.id !== currentAdminId && (
            <button type="button" className={menuItemClass} onClick={() => selectAction({ type: "update-role", user })}>
              Change Role
            </button>
          )}
          {user.id !== currentAdminId && (
            <button
              type="button"
              className={`${menuItemClass} ${user.active ? "text-brand-700" : "text-navy-950"}`}
              onClick={() => selectAction({ type: "set-active", user, active: !user.active })}
            >
              {user.active ? "Disable" : "Activate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-bold text-navy-950">{label}</span>
      <div className="relative mt-2">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-11 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy-950"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
