"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="grid min-h-screen place-items-center bg-[#f3f5f8] px-4 py-12 text-slate-900">
      <form onSubmit={handleSubmit} className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(6,19,33,0.18)]">
        <div className="bg-navy-950 px-7 py-7 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">MPVTL</p>
          <h1 className="mt-2 text-2xl font-bold">Admin Portal</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Sign in to manage short course registrations.</p>
        </div>
        <div className="grid gap-5 p-7">
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-navy-950">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
          </label>
          {error && <p className="text-sm font-semibold text-brand-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.22)] transition hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
