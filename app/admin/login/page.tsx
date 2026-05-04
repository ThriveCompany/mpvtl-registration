"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Login failed.");
      }

      router.push("/admin/registrations");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900">
      <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">MPVTL Admin</p>
        <h1 className="mt-3 text-2xl font-semibold text-navy-950">Sign in</h1>
        <div className="mt-7 grid gap-5">
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          {error && <p className="text-sm font-semibold text-brand-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
