"use client";

import { CENTER_OPTIONS, formatCenter, formatRole, isOfficialEmail, USER_CREATABLE_ROLES } from "@/lib/admin-constants";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  center: string | null;
  active: boolean;
  createdAt: string;
};

export default function UsersClient() {
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
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/registrations" className="text-sm font-bold text-brand-700">Back to registrations</Link>
        <div className="mt-5 rounded-3xl bg-navy-950 p-6 text-white shadow-premium">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-200">Super Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Admin Users</h1>
        </div>

        <form onSubmit={createUser} className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy-950">Create user</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <select className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value, center: "" })}>
              {USER_CREATABLE_ROLES.map((role) => (
                <option key={role} value={role}>{formatRole(role)}</option>
              ))}
            </select>
            {form.role === "CENTER_MANAGER" && (
              availableCenters.length > 0 ? (
                <select className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" value={form.center} onChange={(event) => setForm({ ...form, center: event.target.value })}>
                  <option value="">Select center</option>
                  {availableCenters.map((center) => (
                    <option key={center.value} value={center.value}>{center.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex min-h-14 items-center rounded-2xl border border-brand-100 bg-brand-50 px-4 text-sm font-semibold text-brand-800">
                  All centers already have active managers.
                </div>
              )
            )}
            <select
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4"
              value={form.active ? "active" : "inactive"}
              onChange={(event) => setForm({ ...form, active: event.target.value === "active" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {message && <p className="mt-4 text-sm font-semibold text-brand-700">{message}</p>}
          <button type="submit" className="mt-5 rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow">
            Create User
          </button>
        </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy-950">Existing users</h2>
          <div className="mt-5 grid gap-3">
            {loading && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Loading users...
              </div>
            )}
            {!loading && (Array.isArray(visibleUsers) ? visibleUsers : []).map((user) => (
              <div key={user.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-bold text-navy-950">{user.name}</p>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {formatRole(user.role)}{user.center ? ` - ${formatCenter(user.center)}` : ""} - {user.active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
            {!loading && visibleUsers.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                No admin users found.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
