"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type RegistrationPreview = {
  id: string;
  fullName: string;
  email: string;
  course: string;
  center: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  editCount: number;
};

type DuplicateGroup = {
  key: string;
  count: number;
  primary: RegistrationPreview;
  archive: RegistrationPreview[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function DataCleanupClient() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mergingKey, setMergingKey] = useState("");

  async function loadGroups() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/data-cleanup/duplicates", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { groups?: unknown; message?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Could not load duplicate records.");
      setGroups(Array.isArray(result?.groups) ? result.groups as DuplicateGroup[] : []);
    } catch (error) {
      setGroups([]);
      setMessage(error instanceof Error ? error.message : "Could not load duplicate records.");
    } finally {
      setLoading(false);
    }
  }

  async function mergeGroup(group: DuplicateGroup) {
    setMergingKey(group.key);
    setMessage("");
    try {
      const response = await fetch("/api/admin/data-cleanup/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryId: group.primary.id,
          archiveIds: group.archive.map((item) => item.id),
        }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Could not merge duplicate records.");
      setMessage("Duplicate records archived. Analytics will now count the applicant/course once.");
      await loadGroups();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not merge duplicate records.");
    } finally {
      setMergingKey("");
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-950">Duplicate registration groups</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Same normalized full name, email, and course. Newest updated record is kept as primary.
            </p>
          </div>
          <button
            type="button"
            onClick={loadGroups}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-navy-950"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        {message && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-navy-950">
            {message}
          </p>
        )}
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          Loading duplicate records...
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          No duplicate groups found.
        </div>
      )}

      {!loading && groups.map((group) => (
        <section key={group.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.09)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{group.count} duplicate records</p>
              <h3 className="mt-1 text-lg font-bold text-navy-950">{group.primary.fullName}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{group.primary.email}</p>
              <p className="text-sm font-semibold text-navy-950">{group.primary.course}</p>
            </div>
            <button
              type="button"
              disabled={mergingKey === group.key}
              onClick={() => mergeGroup(group)}
              className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.20)] disabled:opacity-60"
            >
              {mergingKey === group.key ? "Merging..." : "Merge duplicates"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Keep primary</p>
              <p className="mt-2 text-sm font-bold text-navy-950">{group.primary.center} · {group.primary.status}</p>
              <p className="mt-1 text-xs text-slate-600">Created {formatDate(group.primary.createdAt)}</p>
              <p className="text-xs text-slate-600">Updated {formatDate(group.primary.updatedAt)}</p>
            </div>
            <div className="grid gap-2">
              {group.archive.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Archive duplicate</p>
                  <p className="mt-2 text-sm font-bold text-navy-950">{record.center} · {record.status}</p>
                  <p className="mt-1 text-xs text-slate-600">Created {formatDate(record.createdAt)}</p>
                  <p className="text-xs text-slate-600">Updated {formatDate(record.updatedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
