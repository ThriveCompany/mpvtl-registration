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
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
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
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setViewMode("table");
    }

    loadRegistrations();
    checkNotifications();
    const interval = window.setInterval(checkNotifications, 10000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadRegistrations();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pageshow", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pageshow", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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

        <section className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-4">
          <div className="rounded-2xl border border-navy-800 bg-navy-950 p-3 text-white shadow-[0_20px_60px_rgba(6,19,33,0.16)] sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-100 sm:text-xs sm:tracking-[0.14em]">Total</p>
            <p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">{visibleRegistrations.length}</p>
          </div>
          <div className="rounded-2xl border border-brand-200 bg-white p-3 shadow-[0_20px_60px_rgba(127,29,45,0.10)] sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700 sm:text-xs sm:tracking-[0.14em]">New</p>
            <p className="mt-1 text-2xl font-bold text-brand-700 sm:mt-2 sm:text-3xl">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(6,19,33,0.08)] sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">Final</p>
            <p className="mt-1 text-2xl font-bold text-navy-950 sm:mt-2 sm:text-3xl">{finalCount}</p>
          </div>
        </section>

        <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_55px_rgba(6,19,33,0.08)] sm:grid-cols-2 sm:p-4 xl:grid-cols-[1fr_190px_190px_auto]">
          <input
            value={courseSearch}
            onChange={(event) => setCourseSearch(event.target.value)}
            placeholder="Search course"
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:col-span-2 xl:col-span-1"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status === "All Statuses" ? status : formatRegistrationStatus(status)}</option>
            ))}
          </select>
          <select
            value={centerFilter}
            onChange={(event) => setCenterFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          >
            {centerOptions.map((center) => (
              <option key={center} value={center}>{center === "All Centers" ? center : formatCenter(center)}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-slate-50 p-1 sm:col-span-2 xl:col-span-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                viewMode === "table" ? "bg-navy-950 text-white shadow-[0_10px_25px_rgba(6,19,33,0.18)]" : "text-slate-600"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                viewMode === "grid" ? "bg-navy-950 text-white shadow-[0_10px_25px_rgba(6,19,33,0.18)]" : "text-slate-600"
              }`}
            >
              Grid
            </button>
          </div>
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
            <section className={`${viewMode === "table" ? "hidden xl:block" : "hidden"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(6,19,33,0.10)]`}>
              <div className="grid grid-cols-[minmax(130px,1.1fr)_minmax(250px,1.8fr)_minmax(100px,.8fr)_minmax(160px,1fr)_minmax(110px,.9fr)] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Applicant</span>
                <span>Course</span>
                <span>Center</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => {
                const isNew = registration.status === "NEW";
                const textClass = isNew ? "font-bold text-navy-950" : "font-normal text-slate-700";

                return (
                  <Link
                    key={registration.id}
                    href={`/admin/registrations/${registration.id}`}
                    className={`grid grid-cols-[minmax(130px,1.1fr)_minmax(250px,1.8fr)_minmax(100px,.8fr)_minmax(160px,1fr)_minmax(110px,.9fr)] gap-4 border-b border-slate-100 px-5 py-4 text-sm transition last:border-b-0 hover:bg-slate-50 ${
                      isNew ? "bg-brand-50/35" : "bg-white"
                    }`}
                  >
                    <span className={textClass}>{registration.fullName}</span>
                    <span className={textClass}>{registration.course}</span>
                    <span className={textClass}>{formatCenter(registration.center)}</span>
                    <span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ${
                        isNew ? "font-bold" : "font-semibold"
                      } whitespace-nowrap ${getRegistrationStatusClass(registration.status)}`}>
                        {formatRegistrationStatus(registration.status)}
                      </span>
                    </span>
                    <span className={isNew ? "font-bold text-navy-950" : "font-normal text-slate-500"}>{new Date(registration.createdAt).toLocaleDateString()}</span>
                  </Link>
                );
              })}
            </section>

            <section className={`${viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3" : "grid xl:hidden md:grid-cols-2"} gap-3`}>
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => {
                const isNew = registration.status === "NEW";
                const titleClass = isNew ? "font-bold text-navy-950" : "font-normal text-navy-950";
                const textClass = isNew ? "font-bold text-slate-800" : "font-normal text-slate-600";

                return (
                  <Link
                    key={registration.id}
                    href={`/admin/registrations/${registration.id}`}
                    className={`rounded-2xl border p-4 shadow-[0_18px_50px_rgba(6,19,33,0.08)] transition hover:border-brand-300 hover:shadow-[0_22px_65px_rgba(6,19,33,0.12)] sm:p-5 ${
                      isNew ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className={titleClass}>{registration.fullName}</h2>
                        <p className={`mt-1 text-sm leading-6 ${textClass}`}>{registration.course}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ring-1 sm:text-xs ${
                        isNew ? "font-bold" : "font-semibold"
                      } ${getRegistrationStatusClass(registration.status)}`}>
                        {formatRegistrationStatus(registration.status)}
                      </span>
                    </div>
                    <p className={`mt-3 text-sm ${textClass}`}>{formatCenter(registration.center)}</p>
                    <p className={`mt-1 text-xs ${isNew ? "font-bold text-navy-950" : "font-normal text-slate-500"}`}>
                      {new Date(registration.createdAt).toLocaleString()}
                    </p>
                  </Link>
                );
              })}
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
