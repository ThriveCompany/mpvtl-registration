"use client";

import type { SafeAdmin } from "@/lib/auth";
import { formatCenter, formatRegistrationStatus, formatRole, getRegistrationStatusClass } from "@/lib/admin-constants";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "../admin-shell";

type RegistrationListItem = {
  id: string;
  fullName: string;
  course: string;
  center: string;
  status: string;
  createdAt: string;
};

type NotificationItem = {
  id?: unknown;
  registrationId?: unknown;
  registration?: {
    id?: unknown;
  };
};

function getNotificationKeys(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const notification = item as NotificationItem;
      const id = typeof notification.id === "string" ? notification.id : "";
      const registrationId = typeof notification.registrationId === "string"
        ? notification.registrationId
        : typeof notification.registration?.id === "string"
          ? notification.registration.id
          : "";

      return registrationId || id;
    })
    .filter(Boolean);
}

export default function RegistrationListClient({ admin }: { admin: SafeAdmin }) {
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [centerFilter, setCenterFilter] = useState("All Centers");
  const [courseSearch, setCourseSearch] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const playedNotificationKeysRef = useRef<Set<string>>(new Set());
  const visibleRegistrations = Array.isArray(registrations) ? registrations : [];
  const statusOptions = useMemo(() => [
    "All Statuses",
    ...Array.from(new Set(visibleRegistrations.map((registration) => registration.status))),
  ], [visibleRegistrations]);
  const centerOptions = useMemo(() => [
    "All Centers",
    ...Array.from(new Set(visibleRegistrations.map((registration) => registration.center))),
  ], [visibleRegistrations]);
  const filteredRegistrations = useMemo(() => {
    return visibleRegistrations.filter((registration) => {
      const matchesStatus = statusFilter === "All Statuses" || registration.status === statusFilter;
      const matchesCenter = centerFilter === "All Centers" || registration.center === centerFilter;
      const matchesSearch = registration.course.toLowerCase().includes(courseSearch.trim().toLowerCase());

      return matchesStatus && matchesCenter && matchesSearch;
    });
  }, [centerFilter, courseSearch, statusFilter, visibleRegistrations]);
  const pendingCount = visibleRegistrations.filter((registration) => registration.status === "NEW").length;
  const finalCount = visibleRegistrations.filter((registration) => (
    registration.status === "APPROVED" ||
    registration.status === "UNAPPROVED" ||
    registration.status === "NEEDS_FURTHER_REVIEW"
  )).length;

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

  function playNotificationBeeps() {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = audioRef.current ?? new AudioContextCtor();
    audioRef.current = context;

    for (let index = 0; index < 5; index += 1) {
      const startsAt = context.currentTime + index * 0.22;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 820;
      gain.gain.setValueAtTime(0.001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.2, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startsAt + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.14);
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
      const notificationKeys = getNotificationKeys(result?.notifications);
      const newNotificationKeys = notificationKeys.filter((key) => !playedNotificationKeysRef.current.has(key));

      if (notificationCount > 0) {
        setAlert("New Registration");
        if (newNotificationKeys.length > 0) {
          newNotificationKeys.forEach((key) => playedNotificationKeysRef.current.add(key));
          playNotificationBeeps();
        }
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
    <AdminShell
      admin={admin}
      active="registrations"
      title="Registrations"
      subtitle={`${formatRole(admin.role)} access. Review applications, filter records, and open applicant profiles.`}
    >
        {alert && (
          <button
            type="button"
            onClick={markSeen}
            className="mb-4 w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-left text-sm font-bold text-brand-800"
          >
            {alert} - click to mark seen
          </button>
        )}

        <section className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-navy-950">{visibleRegistrations.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">New</p>
            <p className="mt-2 text-2xl font-bold text-brand-700">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Final decisions</p>
            <p className="mt-2 text-2xl font-bold text-navy-950">{finalCount}</p>
          </div>
        </section>

        <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px_220px]">
          <input
            value={courseSearch}
            onChange={(event) => setCourseSearch(event.target.value)}
            placeholder="Search course"
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status === "All Statuses" ? status : formatRegistrationStatus(status)}</option>
            ))}
          </select>
          <select
            value={centerFilter}
            onChange={(event) => setCenterFilter(event.target.value)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          >
            {centerOptions.map((center) => (
              <option key={center} value={center}>{center === "All Centers" ? center : formatCenter(center)}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading registrations...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-8 text-center text-sm font-semibold text-brand-800">
            {error}
          </div>
        )}

        {!loading && !error && filteredRegistrations.length > 0 && (
          <>
            <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
              <div className="grid grid-cols-[1.1fr_1.8fr_1fr_1fr_1.1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Applicant</span>
                <span>Course</span>
                <span>Center</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => (
                <Link
                  key={registration.id}
                  href={`/admin/registrations/${registration.id}`}
                  className="grid grid-cols-[1.1fr_1.8fr_1fr_1fr_1.1fr] gap-4 border-b border-slate-100 px-4 py-4 text-sm transition last:border-b-0 hover:bg-slate-50"
                >
                  <span className="font-bold text-navy-950">{registration.fullName}</span>
                  <span className="text-slate-700">{registration.course}</span>
                  <span className="font-semibold text-slate-700">{formatCenter(registration.center)}</span>
                  <span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getRegistrationStatusClass(registration.status)}`}>
                      {formatRegistrationStatus(registration.status)}
                    </span>
                  </span>
                  <span className="text-slate-500">{new Date(registration.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </section>

            <section className="grid gap-3 md:hidden">
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => (
                <Link
                  key={registration.id}
                  href={`/admin/registrations/${registration.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-navy-950">{registration.fullName}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{registration.course}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getRegistrationStatusClass(registration.status)}`}>
                      {formatRegistrationStatus(registration.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{formatCenter(registration.center)}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(registration.createdAt).toLocaleString()}</p>
                </Link>
              ))}
            </section>
          </>
        )}

        {!loading && !error && filteredRegistrations.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No registrations match this view.
          </div>
        )}
    </AdminShell>
  );
}
