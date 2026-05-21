import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { formatCenter, formatRegistrationStatus, getRegistrationStatusClass } from "@/lib/admin-constants";
import { prisma } from "@/lib/prisma";
import AdminShell from "../../admin-shell";
import ProfileActions from "./profile-actions";

function safeArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

type VerificationLevel = "Basic" | "Intermediate" | "Advanced";

type VerificationAnswerKey =
  | "priorExposure"
  | "completedBasicCourse"
  | "experienceDescription"
  | "availableForEntryReview"
  | "availableForScreening"
  | "canReadAndWrite"
  | "newToField"
  | "reasonForCourse"
  | "availableForPracticalTraining"
  | "basicWriting"
  | "basicDeclaration"
  | "priorTraining"
  | "hasPreviousCertificate"
  | "practicalExperience"
  | "availableForAssessment";

type VerificationDisplayItem = {
  key: VerificationAnswerKey;
  fallbackKey?: VerificationAnswerKey;
  question: string;
  longAnswer?: boolean;
};

function normalizeLevel(level: string): VerificationLevel {
  if (level === "Intermediate" || level === "Advanced") return level;
  return "Basic";
}

function getVerificationDisplayItems(level: string, course: string): VerificationDisplayItem[] {
  const courseName = course || "this course";
  const normalizedLevel = normalizeLevel(level);

  if (normalizedLevel === "Intermediate") {
    return [
      {
        key: "priorExposure",
        question: `Do you have basic knowledge or prior exposure to ${courseName}?`,
      },
      {
        key: "completedBasicCourse",
        question: `Have you completed a basic course in ${courseName} before?`,
      },
      {
        key: "experienceDescription",
        question: `Describe your experience with ${courseName} briefly.`,
        longAnswer: true,
      },
      {
        key: "availableForEntryReview",
        fallbackKey: "availableForScreening",
        question: "Are you available for entry review?",
      },
    ];
  }

  if (normalizedLevel === "Advanced") {
    return [
      {
        key: "priorTraining",
        question: `Do you have prior training or demonstrable experience in ${courseName}?`,
      },
      {
        key: "hasPreviousCertificate",
        question: "Do you have a previous certificate?",
      },
      {
        key: "practicalExperience",
        question: `Describe your practical experience with ${courseName}.`,
        longAnswer: true,
      },
      {
        key: "availableForAssessment",
        question: "Are you available for assessment or interview?",
      },
    ];
  }

  return [
    {
      key: "canReadAndWrite",
      question: "Can you read and write in English?",
    },
    {
      key: "newToField",
      question: `Are you new to ${courseName}?`,
    },
    {
      key: "reasonForCourse",
      question: `Why are you registering for ${courseName}?`,
      longAnswer: true,
    },
    {
      key: "availableForPracticalTraining",
      question: "Are you available for practical training?",
    },
    {
      key: "basicWriting",
      fallbackKey: "basicDeclaration",
      question: "Writing sample typed by applicant.",
      longAnswer: true,
    },
  ];
}

function getAnswer(
  answers: Record<string, string>,
  key: VerificationAnswerKey,
  fallbackKey?: VerificationAnswerKey,
) {
  const value = answers[key]?.trim() || (fallbackKey ? answers[fallbackKey]?.trim() : "");
  return value || "Not provided";
}

export default async function RegistrationProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");

  const { id } = await params;
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      files: { orderBy: { createdAt: "asc" } },
      approvedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true, role: true } },
    },
  });

  if (!registration || !canViewCenter(admin, registration.center)) notFound();

  if (registration.needsAdminAttention) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { needsAdminAttention: false },
    });
  }

  const answers = typeof registration.verificationAnswers === "object" && registration.verificationAnswers !== null
    ? registration.verificationAnswers as Record<string, string>
    : {};
  const questionSnapshot = typeof registration.verificationQuestionSnapshot === "object" && registration.verificationQuestionSnapshot !== null
    ? registration.verificationQuestionSnapshot as Record<string, string>
    : {};
  const verificationItems = getVerificationDisplayItems(registration.level, registration.course);
  const isBasicRegistration = normalizeLevel(registration.level) === "Basic";
  const files = Array.isArray(registration.files) ? registration.files : [];
  const detailItems = safeArray([
    ["Full name", registration.fullName],
    ["Email", registration.email],
    ["Phone", registration.phone],
    ["Course", registration.course],
    ["Category", registration.category],
    ["Level", registration.level],
    ["Center", formatCenter(registration.center)],
    ["Session", registration.session],
    ["Hostel", registration.hostel],
    ["Action", registration.action],
    ["Receive updates", registration.receiveUpdates ? "Yes" : "No"],
  ] as const);

  return (
    <AdminShell
      admin={admin}
      active="registrations"
      title="Applicant Profile"
      subtitle="Review applicant details, evidence, verification answers, and final decision."
    >
      <Link href="/admin/registrations" className="mb-4 inline-flex text-sm font-bold text-brand-700 hover:text-brand-800">
        Back to registrations
      </Link>

      <section className="rounded-2xl border border-navy-800 bg-navy-950 p-6 text-white shadow-[0_24px_80px_rgba(6,19,33,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Applicant</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{registration.fullName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{registration.course}</p>
            {registration.wasEdited && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">
                  Response Edited
                </span>
                {registration.editedAfterDecision && (
                  <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white ring-1 ring-brand-300">
                    Edited After Decision
                  </span>
                )}
              </div>
            )}
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getRegistrationStatusClass(registration.status)}`}>
            {formatRegistrationStatus(registration.status)}
          </span>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.09)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">Registration Details</h2>
            </div>
            <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {safeArray(detailItems).map(([label, value]) => (
                <div key={label} className="border-b border-slate-100 px-5 py-4 last:border-b-0 sm:last:border-b">
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
                  <dd className="mt-1.5 break-words text-sm font-semibold leading-6 text-navy-950">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.09)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">Response History</h2>
            </div>
            <dl className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Original submission</dt>
                <dd className="mt-1.5 text-sm font-semibold leading-6 text-navy-950">
                  {(registration.originalSubmittedAt || registration.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Last edited</dt>
                <dd className="mt-1.5 text-sm font-semibold leading-6 text-navy-950">
                  {registration.editedAt ? registration.editedAt.toLocaleString() : "Not edited"}
                </dd>
              </div>
              <div className="px-5 py-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Number of edits</dt>
                <dd className="mt-1.5 text-sm font-semibold leading-6 text-navy-950">
                  {registration.editCount}
                </dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.09)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">
                {isBasicRegistration ? "Basic Verification Answers" : "Verification Answers"}
              </h2>
              {isBasicRegistration && (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Review literacy, motivation, practical availability, and the applicant's typed writing sample.
                </p>
              )}
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {safeArray(verificationItems).map((item) => (
                <div
                  key={item.key}
                  className={`rounded-2xl border p-5 ${
                    item.longAnswer ? "border-brand-100 bg-brand-50/40 md:col-span-2" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-bold leading-6 text-navy-950">{questionSnapshot[item.key] || item.question}</p>
                  <p className={`mt-3 whitespace-pre-wrap leading-7 text-slate-800 ${
                    item.longAnswer ? "text-base font-medium" : "text-base font-semibold"
                  }`}>
                    {getAnswer(answers, item.key, item.fallbackKey)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(6,19,33,0.09)]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-base font-bold text-navy-950">Uploaded Evidence</h2>
            </div>
            <div className="grid gap-3 p-5">
              {safeArray(files).map((file) => (
                <a
                  key={file.id}
                  href={`/api/admin/files/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-navy-950 transition hover:border-brand-300 hover:bg-white"
                >
                  {file.originalName} - {Math.ceil(file.size / 1024)}KB
                </a>
              ))}
              {files.length === 0 && <p className="text-sm text-slate-600">No evidence uploaded.</p>}
            </div>
          </section>
        </div>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(6,19,33,0.12)] lg:sticky lg:top-28">
          <div className="rounded-xl bg-navy-950 px-4 py-3 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Decision</p>
            <h2 className="mt-1 text-base font-bold">Actions</h2>
          </div>
          <div className="mt-4">
            <ProfileActions
              registrationId={registration.id}
              clientEmail={registration.email}
              status={registration.status}
              reviewedByName={registration.reviewedBy?.name}
              reviewedRole={registration.reviewedRole || registration.reviewedBy?.role}
              reviewedAt={registration.reviewedAt}
              submittedReviewNote={registration.reviewNote}
              submittedReviewReason={registration.reviewReason}
              submittedReviewReasonOther={registration.reviewReasonOther}
            />
          </div>
          {registration.approvedAt && !registration.reviewedAt && (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Approved on {registration.approvedAt.toLocaleString()} by {registration.approvedBy?.name || "MPVTL"}.
            </p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
