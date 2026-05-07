"use client";

import { formatRegistrationStatus, formatRole, isFinalRegistrationStatus } from "@/lib/admin-constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DecisionStatus = "APPROVED" | "UNAPPROVED" | "NEEDS_FURTHER_REVIEW";

type PendingDecision = {
  status: DecisionStatus;
  buttonLabel: string;
  title: string;
  message: string;
  confirmLabel: string;
  noteRequired?: boolean;
};

export default function ProfileActions({
  registrationId,
  clientEmail,
  status,
  reviewedByName,
  reviewedRole,
  reviewedAt,
}: {
  registrationId: string;
  clientEmail: string;
  status: string;
  reviewedByName?: string | null;
  reviewedRole?: string | null;
  reviewedAt?: string | Date | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const isFinal = isFinalRegistrationStatus(status);

  async function submitStatus(nextStatus: string, note = "") {
    setLoading(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) throw new Error(result?.message || "Could not update status.");
      setPendingDecision(null);
      setReviewNote("");
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setLoading("");
    }
  }

  async function updateStatus(decision: PendingDecision) {
    await submitStatus(decision.status, reviewNote);
  }

  const decisions: PendingDecision[] = [
    {
      status: "APPROVED",
      buttonLabel: "Approve",
      title: "Confirm Approval",
      message: `This will send an approval email to ${clientEmail}. Do you want to proceed?`,
      confirmLabel: "Send Approval Email",
    },
    {
      status: "UNAPPROVED",
      buttonLabel: "Unapprove",
      title: "Confirm Unapproval",
      message: "This will permanently mark this applicant as unapproved. Do you want to proceed?",
      confirmLabel: "Submit Unapproval",
    },
    {
      status: "NEEDS_FURTHER_REVIEW",
      buttonLabel: "Needs Further Review",
      title: "Confirm Further Review",
      message: "This will permanently mark this applicant as needing further review. Do you want to proceed?",
      confirmLabel: "Submit Review Decision",
      noteRequired: true,
    },
  ];

  return (
    <div className={isFinal ? "opacity-75" : ""}>
      {isFinal && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Final Decision Submitted</p>
          <p className="mt-2 text-xl font-black uppercase tracking-wide text-navy-950">
            {formatRegistrationStatus(status)}
          </p>
          <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-700">
            <p><span className="font-bold text-navy-950">Reviewed by:</span> {reviewedByName || "MPVTL"}</p>
            <p><span className="font-bold text-navy-950">Role:</span> {reviewedRole ? formatRole(reviewedRole) : "Not recorded"}</p>
            <p><span className="font-bold text-navy-950">Date:</span> {reviewedAt ? new Date(reviewedAt).toLocaleString() : "Not recorded"}</p>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => submitStatus("CONTACTED")}
          disabled={Boolean(loading) || isFinal}
          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "CONTACTED" ? "Saving..." : "Mark Contacted"}
        </button>

        {decisions.map((decision) => (
          <button
            key={decision.status}
            type="button"
            onClick={() => setPendingDecision(decision)}
            disabled={Boolean(loading) || isFinal}
            className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              decision.status === "APPROVED"
                ? "bg-brand-700 text-white hover:bg-brand-800"
                : decision.status === "UNAPPROVED"
                  ? "bg-navy-950 text-white hover:bg-navy-900"
                  : "border border-slate-300 bg-white text-navy-950"
            }`}
          >
            {loading === decision.status ? "Saving..." : decision.buttonLabel}
          </button>
        ))}
      </div>

      {isFinal && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">
          This applicant already has a final decision. Actions are locked.
        </p>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-brand-700">{error}</p>}

      {pendingDecision && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-xl">
            <h3 className="text-xl font-bold text-navy-950">{pendingDecision.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pendingDecision.message}</p>

            {pendingDecision.noteRequired && (
              <label className="mt-5 block">
                <span className="text-sm font-bold text-navy-950">Reason / review note</span>
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </label>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingDecision(null);
                  setReviewNote("");
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-navy-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus(pendingDecision)}
                disabled={Boolean(loading)}
                className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? "Submitting..." : pendingDecision.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
