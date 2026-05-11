"use client";

import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordClient({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Could not update password.");
      }

      router.push("/admin/registrations");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  function passwordField(key: keyof typeof form, label: string) {
    const isVisible = Boolean(visible[key]);

    return (
      <label className="block">
        <span className="text-sm font-bold text-navy-950">{label}</span>
        <div className="relative mt-2">
          <input
            type={isVisible ? "text" : "password"}
            value={form[key]}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={() => setVisible((current) => ({ ...current, [key]: !isVisible }))}
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy-950"
          >
            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5f8] px-4 py-12 text-slate-900">
      <form onSubmit={submit} className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(6,19,33,0.18)]">
        <div className="bg-navy-950 px-7 py-7 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-100">
            <ShieldCheck size={22} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-200">MPVTL Admin Security</p>
          <h1 className="mt-2 text-2xl font-bold">Change Password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {forced ? "Create a new password before continuing to the admin portal." : "Update your admin password securely."}
          </p>
        </div>
        <div className="grid gap-5 p-7">
          {passwordField("currentPassword", "Current password")}
          {passwordField("newPassword", "New password")}
          {passwordField("confirmPassword", "Confirm new password")}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            Use at least 8 characters with uppercase, lowercase, and a number.
          </div>

          {message && <p className="text-sm font-semibold text-brand-700">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.22)] transition hover:bg-brand-800 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </main>
  );
}
