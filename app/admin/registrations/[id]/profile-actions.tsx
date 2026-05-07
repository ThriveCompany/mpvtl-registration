"use client";

import {
  formatRegistrationStatus,
  formatRole,
  getRegistrationStatusClass,
  isFinalRegistrationStatus,
} from "@/lib/admin-constants";
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

const furtherReviewReasons = [
  "Incomplete information",
  "Uploaded document unclear",
  "Qualification requires verification",
  "Previous experience unclear",
  "Further conversation required",
  "Awaiting supporting document",
  "Course suitability uncertain",
  "Center capacity review required",
  "Other",
];

export default function ProfileActions({
  registrationId,
  clientEmail,
  status,
  reviewedByName,
  reviewedRole,
  reviewedAt,
  submittedReviewNote,
}: {
  registrationId: string;
  clientEmail: string;
  status: string;
  reviewedByName?: string | null;
  reviewedRole?: string | null;
  reviewedAt?: string | Date | null;
  submittedReviewNote?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [additionalReviewNote, setAdditionalReviewNote] = useState("");
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
      setReviewReason("");
      setAdditionalReviewNote("");
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setLoading("");
    }
  }

  async function updateStatus(decision: PendingDecision) {
    const note = reviewReason === "Other" && additionalReviewNote.trim()
      ? `Other: ${additionalReviewNote.trim()}`
      : reviewReason;
    await submitStatus(decision.status, note);
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
      status: "NEEDS_FURTHER_REVIEW",
      buttonLabel: "Needs Further Review",
      title: "Confirm Further Review",
      message: "This will permanently mark this applicant as needing further review. Select the reason before submitting.",
      confirmLabel: "Submit Review Decision",
      noteRequired: true,
    },
    {
      status: "UNAPPROVED",
      buttonLabel: "Unapprove",
      title: "Confirm Unapproval",
      message: "This will permanently mark this applicant as unapproved. Do you want to proceed?",
      confirmLabel: "Submit Unapproval",
    },
  ];

  return (
    <div className={isFinal ? "opacity-75" : ""}>
      {isFinal && (
        <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Final Decision Submitted</p>
          <p className="mt-2 text-xl font-black uppercase tracking-wide text-navy-950">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getRegistrationStatusClass(status)}`}>
              {formatRegistrationStatus(status)}
            </span>
          </p>
          <div className="mt-3 grid gap-1 text-sm leading-6 text-slate-700">
            <p><span className="font-bold text-navy-950">Reviewed by:</span> {reviewedByName || "MPVTL"}</p>
            <p><span className="font-bold text-navy-950">Role:</span> {reviewedRole ? formatRole(reviewedRole) : "Not recorded"}</p>
            <p><span className="font-bold text-navy-950">Date:</span> {reviewedAt ? new Date(reviewedAt).toLocaleString() : "Not recorded"}</p>
            {submittedReviewNote && (
              <p><span className="font-bold text-navy-950">Reason:</span> {submittedReviewNote}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {decisions.map((decision) => (
          <button
            key={decision.status}
            type="button"
            onClick={() => setPendingDecision(decision)}
            disabled={Boolean(loading) || isFinal}
            className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              decision.status === "APPROVED"
                ? "bg-navy-950 text-white shadow-[0_16px_45px_rgba(6,19,33,0.18)] hover:bg-navy-900"
                : decision.status === "NEEDS_FURTHER_REVIEW"
                  ? "border border-slate-300 bg-white text-navy-950 hover:bg-slate-50"
                  : "bg-brand-700 text-white shadow-[0_16px_45px_rgba(127,29,45,0.20)] hover:bg-brand-800"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-[0_28px_90px_rgba(6,19,33,0.28)]">
            <h3 className="text-xl font-bold text-navy-950">{pendingDecision.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pendingDecision.message}</p>

            {pendingDecision.noteRequired && (
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-navy-950">Reason for Further Review</span>
                  <select
                    value={reviewReason}
                    onChange={(event) => {
                      setReviewReason(event.target.value);
                      if (event.target.value !== "Other") setAdditionalReviewNote("");
                    }}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  >
                    <option value="">Select a reason</option>
                    {furtherReviewReasons.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </label>

                {reviewReason === "Other" && (
                  <label className="block">
                    <span className="text-sm font-bold text-navy-950">Additional note</span>
                    <input
                      type="text"
                      value={additionalReviewNote}
                      onChange={(event) => setAdditionalReviewNote(event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                    />
                  </label>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingDecision(null);
                  setReviewReason("");
                  setAdditionalReviewNote("");
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-navy-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus(pendingDecision)}
                disabled={Boolean(loading) || (pendingDecision.noteRequired && !reviewReason)}
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
