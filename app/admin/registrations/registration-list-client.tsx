"use client";

import type { SafeAdmin } from "@/lib/auth";
import { formatCenter, formatRegistrationStatus, formatRole, getRegistrationStatusClass } from "@/lib/admin-constants";
import { MoreHorizontal, Search, X } from "lucide-react";
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

const finalDecisionStatuses = new Set(["APPROVED", "UNAPPROVED", "NEEDS_FURTHER_REVIEW", "REJECTED"]);
const unreviewedStatuses = new Set(["NEW", "VIEWED"]);

function formatMobileStatus(status: string) {
  return status === "NEEDS_FURTHER_REVIEW" ? "NFR" : formatRegistrationStatus(status);
}

function formatMobileDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RegistrationListClient({ admin }: { admin: SafeAdmin }) {
  const [registrations, setRegistrations] = useState<RegistrationListItem[]>([]);
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [centerFilter, setCenterFilter] = useState("All Centers");
  const [courseSearch, setCourseSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
  const finalCount = visibleRegistrations.filter((registration) => finalDecisionStatuses.has(registration.status)).length;
  const needsReviewCount = visibleRegistrations.length - finalCount;

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

        <section className="mb-3 grid grid-cols-3 gap-1.5 lg:mb-5 lg:gap-4">
          <div className="rounded-xl border border-navy-800 bg-navy-950 p-2.5 text-white shadow-[0_14px_38px_rgba(6,19,33,0.14)] lg:rounded-2xl lg:p-5 lg:shadow-[0_20px_60px_rgba(6,19,33,0.16)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-brand-100 lg:text-xs lg:tracking-[0.14em]">Total</p>
            <p className="mt-0.5 text-xl font-bold leading-none lg:mt-2 lg:text-3xl">{visibleRegistrations.length}</p>
          </div>
          <div className="rounded-xl border border-brand-200 bg-white p-2.5 shadow-[0_14px_38px_rgba(127,29,45,0.08)] lg:rounded-2xl lg:p-5 lg:shadow-[0_20px_60px_rgba(127,29,45,0.10)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-brand-700 lg:hidden">New</p>
            <p className="hidden text-xs font-bold uppercase tracking-[0.14em] text-brand-700 lg:block">Needs Review</p>
            <p className="mt-0.5 text-xl font-bold leading-none text-brand-700 lg:mt-2 lg:text-3xl">{needsReviewCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_14px_38px_rgba(6,19,33,0.07)] lg:rounded-2xl lg:p-5 lg:shadow-[0_20px_60px_rgba(6,19,33,0.08)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 lg:text-xs lg:tracking-[0.14em]">Final Decisions</p>
            <p className="mt-0.5 text-xl font-bold leading-none text-navy-950 lg:mt-2 lg:text-3xl">{finalCount}</p>
          </div>
        </section>

        <div className="relative mb-3 lg:hidden">
          {mobileSearchOpen ? (
            <div className="flex items-center gap-2">
              <input
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                autoFocus
                placeholder="Search course"
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setCourseSearch("");
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-navy-950"
              >
                <X size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Search registrations"
                onClick={() => {
                  setMobileSearchOpen(true);
                  setMobileFiltersOpen(false);
                }}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-950 shadow-[0_10px_26px_rgba(6,19,33,0.06)]"
              >
                <Search size={17} />
              </button>
              <button
                type="button"
                aria-label="Open filters"
                aria-expanded={mobileFiltersOpen}
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-950 shadow-[0_10px_26px_rgba(6,19,33,0.06)]"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          )}

          {mobileFiltersOpen && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_22px_60px_rgba(6,19,33,0.16)]">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status === "All Statuses" ? status : formatMobileStatus(status)}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Center</span>
                <select
                  value={centerFilter}
                  onChange={(event) => setCenterFilter(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  {centerOptions.map((center) => (
                    <option key={center} value={center}>{center === "All Centers" ? center : formatCenter(center)}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="mb-5 hidden gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(6,19,33,0.06)] lg:grid lg:grid-cols-2 xl:grid-cols-[1fr_190px_190px_auto]">
          <input
            value={courseSearch}
            onChange={(event) => setCourseSearch(event.target.value)}
            placeholder="Search course"
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 lg:col-span-2 xl:col-span-1"
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
          <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-slate-50 p-1 lg:col-span-2 xl:col-span-1">
            <button
              type="button"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                viewMode === "list" ? "bg-navy-950 text-white shadow-[0_10px_25px_rgba(6,19,33,0.18)]" : "text-slate-600 hover:text-navy-950"
              }`}
            >
              List
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                viewMode === "grid" ? "bg-navy-950 text-white shadow-[0_10px_25px_rgba(6,19,33,0.18)]" : "text-slate-600 hover:text-navy-950"
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
            <section className={`${viewMode === "list" ? "hidden lg:block" : "hidden"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(6,19,33,0.10)]`}>
              <div className="grid grid-cols-[minmax(130px,1.1fr)_minmax(250px,1.8fr)_minmax(100px,.8fr)_minmax(160px,1fr)_minmax(110px,.9fr)] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Applicant</span>
                <span>Course</span>
                <span>Center</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => {
                const isNew = registration.status === "NEW";
                const needsAttention = unreviewedStatuses.has(registration.status);
                const textClass = needsAttention ? "font-bold text-navy-950" : "font-normal text-slate-700";
                const rowClass = isNew
                  ? "border-l-4 border-l-brand-700 bg-brand-50/45"
                  : needsAttention
                    ? "border-l-4 border-l-navy-900 bg-slate-50/80"
                    : "border-l-4 border-l-transparent bg-white";

                return (
                  <Link
                    key={registration.id}
                    href={`/admin/registrations/${registration.id}`}
                    className={`grid grid-cols-[minmax(130px,1.1fr)_minmax(250px,1.8fr)_minmax(100px,.8fr)_minmax(160px,1fr)_minmax(110px,.9fr)] gap-4 border-b border-slate-100 px-5 py-4 text-sm transition last:border-b-0 hover:bg-slate-50 ${
                      rowClass
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
                    <span className={needsAttention ? "font-bold text-navy-950" : "font-normal text-slate-500"}>{new Date(registration.createdAt).toLocaleDateString()}</span>
                  </Link>
                );
              })}
            </section>

            <section className="grid gap-1.5 lg:hidden">
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => {
                const isNew = registration.status === "NEW";
                const needsAttention = unreviewedStatuses.has(registration.status);
                const titleClass = isNew ? "text-[15px] font-black text-navy-950" : "text-sm font-normal text-slate-800";
                const metaClass = isNew ? "text-[12.5px] font-bold text-navy-950" : "text-xs font-normal text-slate-600";
                const dateClass = isNew ? "text-[11px] font-bold text-navy-950" : "text-[10px] font-normal text-slate-500";
                const cardClass = isNew
                  ? "border-brand-200 border-l-brand-700 bg-brand-50/45"
                  : needsAttention
                    ? "border-slate-200 border-l-navy-900 bg-slate-50/80"
                    : "border-slate-200 border-l-transparent bg-white";
                const cardSpacing = isNew ? "px-3 py-2.5" : "px-2.5 py-2";

                return (
                  <Link
                    key={registration.id}
                    href={`/admin/registrations/${registration.id}`}
                    className={`block overflow-hidden rounded-lg border border-l-4 shadow-[0_8px_22px_rgba(6,19,33,0.05)] transition hover:border-brand-300 ${cardSpacing} ${cardClass}`}
                  >
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2.5">
                      <div className="min-w-0">
                        <h2 className={`leading-5 ${titleClass}`}>{registration.fullName}</h2>
                      </div>
                      <span className={`inline-flex items-center justify-center self-start justify-self-end whitespace-nowrap rounded-full px-1.5 py-0.5 text-center text-[7.5px] font-bold leading-3 ring-1 ${getRegistrationStatusClass(registration.status)}`}>
                        {formatMobileStatus(registration.status)}
                      </span>
                      <p className={`col-span-2 mt-1 flex min-w-0 max-w-full items-center overflow-hidden leading-4 ${metaClass}`}>
                        <span className="min-w-0 flex-1 truncate">{registration.course}</span>
                        <span className="mx-1 shrink-0 text-slate-400">·</span>
                        <span className="shrink-0">{formatCenter(registration.center)}</span>
                      </p>
                      <p className={`col-span-2 mt-1 leading-4 ${dateClass}`}>
                        {formatMobileDate(registration.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </section>

            <section className={`${viewMode === "grid" ? "hidden lg:grid lg:grid-cols-2 xl:grid-cols-3" : "hidden"} gap-3`}>
              {(Array.isArray(filteredRegistrations) ? filteredRegistrations : []).map((registration) => {
                const isNew = registration.status === "NEW";
                const needsAttention = unreviewedStatuses.has(registration.status);
                const titleClass = needsAttention ? "font-bold text-navy-950" : "font-normal text-navy-950";
                const textClass = needsAttention ? "font-bold text-slate-800" : "font-normal text-slate-600";
                const cardClass = isNew
                  ? "border-brand-200 border-l-brand-700 bg-brand-50/45"
                  : needsAttention
                    ? "border-slate-200 border-l-navy-900 bg-slate-50/80"
                    : "border-slate-200 border-l-transparent bg-white";

                return (
                  <Link
                    key={registration.id}
                    href={`/admin/registrations/${registration.id}`}
                    className={`rounded-2xl border border-l-4 p-3.5 shadow-[0_14px_42px_rgba(6,19,33,0.07)] transition hover:border-brand-300 hover:shadow-[0_22px_65px_rgba(6,19,33,0.12)] sm:p-5 ${cardClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className={`text-sm leading-5 sm:text-base ${titleClass}`}>{registration.fullName}</h2>
                        <p className={`mt-1 break-words text-xs leading-5 sm:text-sm sm:leading-6 ${textClass}`}>{registration.course}</p>
                      </div>
                      <span className={`max-w-[8rem] shrink-0 whitespace-normal rounded-full px-2 py-0.5 text-center text-[9px] leading-4 ring-1 sm:px-2.5 sm:py-1 sm:text-xs ${
                        isNew ? "font-bold" : "font-semibold"
                      } ${getRegistrationStatusClass(registration.status)}`}>
                        {formatRegistrationStatus(registration.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className={`text-xs sm:text-sm ${textClass}`}>{formatCenter(registration.center)}</p>
                      <p className={`text-xs ${needsAttention ? "font-bold text-navy-950" : "font-normal text-slate-500"}`}>
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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
