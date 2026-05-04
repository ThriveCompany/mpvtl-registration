"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(status: "APPROVED" | "CONTACTED" | "REJECTED") {
    setLoading(status);
    setError("");

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) throw new Error(result?.message || "Could not update status.");
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <button
          type="button"
          onClick={() => updateStatus("APPROVED")}
          disabled={Boolean(loading)}
          className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-center text-sm font-bold text-white shadow-redGlow disabled:opacity-60"
        >
          {loading === "APPROVED" ? "Approving..." : "Approve Registration"}
        </button>
        <button
          type="button"
          onClick={() => updateStatus("CONTACTED")}
          disabled={Boolean(loading)}
          className="inline-flex w-full items-center justify-center rounded-full bg-navy-950 px-5 py-3 text-center text-sm font-bold text-white disabled:opacity-60"
        >
          {loading === "CONTACTED" ? "Saving..." : "Mark Contacted"}
        </button>
        <button
          type="button"
          onClick={() => updateStatus("REJECTED")}
          disabled={Boolean(loading)}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-navy-950 disabled:opacity-60"
        >
          {loading === "REJECTED" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-brand-700">{error}</p>}
    </div>
  );
}
