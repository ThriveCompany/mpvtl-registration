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
  reasons: string[];
};

const approveReasons = [
  "Meets entry requirements",
  "Required documents reviewed",
  "Eligible for selected course",
  "Approved after review",
  "Other",
];

const unapproveReasons = [
  "Does not meet entry requirements",
  "Incomplete or invalid information",
  "Uploaded document not acceptable",
  "Course level not suitable",
  "Unable to verify applicant details",
  "Other",
];

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
  submittedReviewReason,
  submittedReviewReasonOther,
  wasEdited,
  editedAfterDecision,
  needsAdminAttention,
}: {
  registrationId: string;
  clientEmail: string;
  status: string;
  reviewedByName?: string | null;
  reviewedRole?: string | null;
  reviewedAt?: string | Date | null;
  submittedReviewNote?: string | null;
  submittedReviewReason?: string | null;
  submittedReviewReasonOther?: string | null;
  wasEdited?: boolean;
  editedAfterDecision?: boolean;
  needsAdminAttention?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [additionalReviewNote, setAdditionalReviewNote] = useState("");
  const isFinal = isFinalRegistrationStatus(status);
  const canChangeDecisionAfterEdit = Boolean(isFinal && wasEdited && editedAfterDecision && needsAdminAttention);
  const actionsLocked = isFinal && !canChangeDecisionAfterEdit;

  async function submitStatus(nextStatus: string, reason: string, reasonOther = "") {
    setLoading(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason, reasonOther }),
      });
      const result = await response.json().catch(() => null) as { emailWarning?: boolean; message?: string } | null;

      if (!response.ok) throw new Error(result?.message || "Could not update status.");
      setPendingDecision(null);
      setReviewReason("");
      setAdditionalReviewNote("");
      if (result?.emailWarning) {
        setError("Decision saved, but email could not be sent.");
      }
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setLoading("");
    }
  }

  async function updateStatus(decision: PendingDecision) {
    await submitStatus(
      decision.status,
      reviewReason,
      reviewReason === "Other" ? additionalReviewNote.trim() : "",
    );
  }

  function openDecision(decision: PendingDecision) {
    setError("");
    setReviewReason("");
    setAdditionalReviewNote("");
    setPendingDecision(decision);
  }

  function getDecisionButtonClass(statusValue: DecisionStatus) {
    if (statusValue === "APPROVED") {
      return "bg-emerald-600 text-white shadow-[0_16px_45px_rgba(5,150,105,0.22)] hover:bg-emerald-700";
    }

    if (statusValue === "UNAPPROVED") {
      return "bg-red-600 text-white shadow-[0_16px_45px_rgba(220,38,38,0.22)] hover:bg-red-700";
    }

    return "bg-amber-500 text-navy-950 shadow-[0_16px_45px_rgba(245,158,11,0.22)] hover:bg-amber-400";
  }

  const decisions: PendingDecision[] = [
    {
      status: "APPROVED",
      buttonLabel: canChangeDecisionAfterEdit ? "Approve Updated Response" : "Approve",
      title: canChangeDecisionAfterEdit ? "Confirm Updated Approval" : "Confirm Approval",
      message: canChangeDecisionAfterEdit
        ? `This will change the previous decision to APPROVED after reviewing the edited response. This will send an updated review email to ${clientEmail}. Do you want to proceed?`
        : `This action will mark this registration as APPROVED. This will send an email to ${clientEmail}. Do you want to proceed?`,
      confirmLabel: canChangeDecisionAfterEdit ? "Send Updated Approval" : "Send Approval Email",
      reasons: approveReasons,
    },
    {
      status: "UNAPPROVED",
      buttonLabel: canChangeDecisionAfterEdit ? "Unapprove Updated Response" : "Unapprove",
      title: canChangeDecisionAfterEdit ? "Confirm Updated Unapproval" : "Confirm Unapproval",
      message: canChangeDecisionAfterEdit
        ? `This will change the previous decision to UNAPPROVED after reviewing the edited response. This will send an updated review email to ${clientEmail}. Do you want to proceed?`
        : `This action will mark this registration as UNAPPROVED. This will send an email to ${clientEmail}. Do you want to proceed?`,
      confirmLabel: canChangeDecisionAfterEdit ? "Send Updated Decision" : "Submit Unapproval",
      reasons: unapproveReasons,
    },
    {
      status: "NEEDS_FURTHER_REVIEW",
      buttonLabel: canChangeDecisionAfterEdit ? "Request Further Review Again" : "Needs Further Review",
      title: canChangeDecisionAfterEdit ? "Confirm Updated Further Review" : "Confirm Further Review",
      message: canChangeDecisionAfterEdit
        ? `This will change the previous decision to NEEDS FURTHER REVIEW after reviewing the edited response. This will send an updated review email to ${clientEmail}. Do you want to proceed?`
        : `This action will mark this registration as NEEDS FURTHER REVIEW. This will send an email to ${clientEmail}. Do you want to proceed?`,
      confirmLabel: canChangeDecisionAfterEdit ? "Send Updated Review Email" : "Submit Review Decision",
      reasons: furtherReviewReasons,
    },
  ];

  return (
    <div className={actionsLocked ? "opacity-75" : ""}>
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
            {(submittedReviewReason || submittedReviewNote) && (
              <p><span className="font-bold text-navy-950">Decision Reason:</span> {submittedReviewReason || submittedReviewNote}</p>
            )}
            {submittedReviewReasonOther && (
              <p><span className="font-bold text-navy-950">Additional Reason:</span> {submittedReviewReasonOther}</p>
            )}
          </div>
        </div>
      )}

      {canChangeDecisionAfterEdit && (
        <div className="mb-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-[0_14px_45px_rgba(127,29,45,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Updated Response Awaiting Review</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            The applicant changed their response after the previous decision. Review the updated information, then change the decision below if needed.
          </p>
        </div>
      )}

      {(!isFinal || canChangeDecisionAfterEdit) && (
        <div className="grid gap-3">
          {decisions.map((decision) => (
            <button
              key={decision.status}
              type="button"
              onClick={() => openDecision(decision)}
              disabled={Boolean(loading)}
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${getDecisionButtonClass(decision.status)}`}
            >
              {loading === decision.status ? "Saving..." : decision.buttonLabel}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-brand-700">{error}</p>}

      {pendingDecision && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-[0_28px_90px_rgba(6,19,33,0.28)]">
            <h3 className="text-xl font-bold text-navy-950">{pendingDecision.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pendingDecision.message}</p>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm font-bold text-navy-950">Reason</span>
                <select
                  value={reviewReason}
                  onChange={(event) => {
                    setReviewReason(event.target.value);
                    if (event.target.value !== "Other") setAdditionalReviewNote("");
                  }}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select a reason</option>
                  {pendingDecision.reasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </label>

              {reviewReason === "Other" && (
                <label className="block">
                  <span className="text-sm font-bold text-navy-950">Additional reason</span>
                  <input
                    type="text"
                    value={additionalReviewNote}
                    onChange={(event) => setAdditionalReviewNote(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                </label>
              )}
            </div>

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
                disabled={Boolean(loading) || !reviewReason || (reviewReason === "Other" && !additionalReviewNote.trim())}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60 ${getDecisionButtonClass(pendingDecision.status)}`}
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
