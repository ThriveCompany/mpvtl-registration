"use client";

import type { SafeAdmin } from "@/lib/auth";
import { CENTER_OPTIONS, formatCenter, formatRole, isOfficialEmail, USER_CREATABLE_ROLES } from "@/lib/admin-constants";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../admin-shell";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  center: string | null;
  active: boolean;
  createdAt: string;
};

export default function UsersClient({ admin }: { admin: SafeAdmin }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DIRECTOR",
    center: "",
    active: true,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const visibleUsers = Array.isArray(users) ? users : [];
  const activeManagerCenters = useMemo(() => {
    return new Set(
      visibleUsers
        .filter((user) => user.role === "CENTER_MANAGER" && user.active && user.center)
        .map((user) => user.center as string),
    );
  }, [visibleUsers]);
  const availableCenters = CENTER_OPTIONS.filter((center) => !activeManagerCenters.has(center.value));

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
    const result = await response.json().catch(() => null) as { message?: string } | null;

    if (!response.ok) {
      setMessage(result?.message || "Could not create user.");
      return;
    }

    setMessage("User created.");
    setForm({ name: "", email: "", password: "", role: "DIRECTOR", center: "", active: true });
    await loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <AdminShell
      admin={admin}
      active="users"
      title="Admin Users"
      subtitle="Create official MPVTL admin accounts and review active access."
    >
        <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950">Create user</h2>
              <p className="mt-1 text-sm text-slate-600">Only @moaetscandg.org.ng accounts are allowed.</p>
            </div>
            <button type="submit" className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.20)] hover:bg-brand-800">
              Create User
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <div className="relative">
              <input
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy-950"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <select className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, center: "" })}>
              {USER_CREATABLE_ROLES.map((role) => (
                <option key={role} value={role}>{formatRole(role)}</option>
              ))}
            </select>
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
          {message && <p className="mt-4 text-sm font-semibold text-brand-700">{message}</p>}
        </form>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-navy-950">Existing users</h2>
          </div>
          <div>
            {loading && (
              <div className="p-5 text-sm text-slate-600">
                Loading users...
              </div>
            )}

            {!loading && visibleUsers.length > 0 && (
              <div className="hidden md:block">
                <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_.7fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Center</span>
                  <span>Status</span>
                </div>
                {(Array.isArray(visibleUsers) ? visibleUsers : []).map((user) => (
                  <div key={user.id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_.7fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0">
                    <span className="font-bold text-navy-950">{user.name}</span>
                    <span className="break-words text-slate-700">{user.email}</span>
                    <span className="text-slate-700">{formatRole(user.role)}</span>
                    <span className="text-slate-700">{user.center ? formatCenter(user.center) : "-"}</span>
                    <span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                        user.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!loading && visibleUsers.length > 0 && (
              <div className="grid gap-3 p-4 md:hidden">
                {(Array.isArray(visibleUsers) ? visibleUsers : []).map((user) => (
                  <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(6,19,33,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-navy-950">{user.name}</p>
                        <p className="mt-1 break-words text-sm text-slate-600">{user.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                        user.active ? "bg-navy-950 text-white ring-navy-950" : "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{formatRole(user.role)}</p>
                    {user.center && <p className="mt-1 text-sm text-slate-600">{formatCenter(user.center)}</p>}
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
    </AdminShell>
  );
}
