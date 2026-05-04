"use client";

import type { SafeAdmin } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RegistrationListItem = {
  id: string;
  fullName: string;
  course: string;
  center: string;
  status: string;
  createdAt: string;
};

export default function RegistrationListClient({ admin }: { admin: SafeAdmin }) {
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);

  async function loadRegistrations() {
    try {
      setError("");
      const response = await fetch("/api/admin/registrations", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { registrations?: unknown; message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Could not load registrations.");
      }

      setRegistrations(Array.isArray(result?.registrations) ? result.registrations as RegistrationListItem[] : []);
    } catch (loadError) {
      setRegistrations([]);
      setError(loadError instanceof Error ? loadError.message : "Could not load registrations.");
    } finally {
      setLoading(false);
    }
  }

  function playRing() {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = audioRef.current ?? new AudioContextCtor();
    audioRef.current = context;
    const endAt = context.currentTime + 10;

    for (let index = 0; index < 10; index += 1) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = index % 2 === 0 ? 880 : 660;
      gain.gain.setValueAtTime(0.001, context.currentTime + index);
      gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + index + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index + 0.45);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + index);
      oscillator.stop(Math.min(context.currentTime + index + 0.5, endAt));
    }
  }

  async function checkNotifications() {
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) return;

      const result = await response.json().catch(() => null) as { count?: unknown; notifications?: unknown } | null;
      const notificationCount = typeof result?.count === "number"
        ? result.count
        : Array.isArray(result?.notifications)
          ? result.notifications.length
          : 0;

      if (notificationCount > 0) {
        setAlert("New Registration");
        playRing();
        await loadRegistrations();
      }
    } catch {
      // Polling should never take down the admin page.
    }
  }

  async function markSeen() {
    try {
      await fetch("/api/admin/notifications/mark-seen", { method: "PATCH" });
      setAlert("");
    } catch {
      setAlert("");
    }
  }

  useEffect(() => {
    loadRegistrations();
    checkNotifications();
    const interval = window.setInterval(checkNotifications, 10000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-navy-950 p-6 text-white shadow-premium sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-200">MPVTL Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Registrations</h1>
            <p className="mt-2 text-sm text-slate-300">{admin.name} - {admin.role.replaceAll("_", " ")}</p>
          </div>
          <div className="flex gap-3">
            {admin.role === "SUPER_ADMIN" && (
              <Link href="/admin/users" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-navy-950">Users</Link>
            )}
            <button
              type="button"
              onClick={() => fetch("/api/admin/logout", { method: "POST" }).then(() => window.location.assign("/admin/login"))}
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {alert && (
          <button
            type="button"
            onClick={markSeen}
            className="mb-5 w-full rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left text-sm font-bold text-brand-800 shadow-redGlow"
          >
            {alert} - click to mark seen
          </button>
        )}

        <div className="grid gap-4">
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              Loading registrations...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-3xl border border-brand-100 bg-brand-50 p-8 text-center text-sm font-semibold text-brand-800">
              {error}
            </div>
          )}

          {!loading && !error && registrations.map((registration) => (
            <Link
              key={registration.id}
              href={`/admin/registrations/${registration.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-premium"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy-950">{registration.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{registration.course}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{registration.center}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-navy-950">{registration.status}</span>
                  <p className="mt-3 text-sm text-slate-500">{new Date(registration.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}

          {!loading && !error && registrations.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No registrations yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
