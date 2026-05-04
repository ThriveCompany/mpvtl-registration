"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    role: "MARKETING_OFFICIAL",
    center: "",
    active: true,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
    setForm({ name: "", email: "", password: "", role: "MARKETING_OFFICIAL", center: "", active: true });
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
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <select className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="MARKETING_OFFICIAL">MARKETING_OFFICIAL</option>
              <option value="CENTER_MANAGER">CENTER_MANAGER</option>
            </select>
            <input className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4" placeholder="Center for center manager" value={form.center} onChange={(event) => setForm({ ...form, center: event.target.value })} />
            <label className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
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
            {!loading && users.map((user) => (
              <div key={user.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-bold text-navy-950">{user.name}</p>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {user.role}{user.center ? ` - ${user.center}` : ""} - {user.active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
            {!loading && users.length === 0 && (
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
