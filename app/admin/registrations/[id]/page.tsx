import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
      question: `Why do you want to take ${courseName}?`,
      longAnswer: true,
    },
    {
      key: "availableForPracticalTraining",
      question: "Are you available for practical training?",
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

  const { id } = await params;
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      files: { orderBy: { createdAt: "asc" } },
      approvedBy: { select: { name: true, email: true } },
    },
  });

  if (!registration || !canViewCenter(admin, registration.center)) notFound();

  const answers = typeof registration.verificationAnswers === "object" && registration.verificationAnswers !== null
    ? registration.verificationAnswers as Record<string, string>
    : {};
  const verificationItems = getVerificationDisplayItems(registration.level, registration.course);
  const files = Array.isArray(registration.files) ? registration.files : [];
  const detailItems = safeArray([
    ["Full name", registration.fullName],
    ["Email", registration.email],
    ["Phone", registration.phone],
    ["Course", registration.course],
    ["Category", registration.category],
    ["Level", registration.level],
    ["Center", registration.center],
    ["Session", registration.session],
    ["Hostel", registration.hostel],
    ["Action", registration.action],
    ["Receive updates", registration.receiveUpdates ? "Yes" : "No"],
    ["Status", registration.status],
  ] as const);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/registrations" className="text-sm font-bold text-brand-700">Back to registrations</Link>

        <div className="mt-5 rounded-3xl bg-navy-950 p-6 text-white shadow-premium">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-200">Applicant Profile</p>
          <h1 className="mt-2 text-2xl font-semibold">{registration.fullName}</h1>
          <p className="mt-2 text-sm text-slate-300">{registration.course}</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-950">Registration Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {safeArray(detailItems).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-2 font-semibold text-navy-950">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-950">Actions</h2>
            <div className="mt-5">
              <ProfileActions registrationId={registration.id} />
            </div>
            {registration.approvedAt && (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Approved on {registration.approvedAt.toLocaleString()} by {registration.approvedBy?.name || "MPVTL"}.
              </p>
            )}
          </aside>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy-950">Verification Answers</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {safeArray(verificationItems).map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl bg-slate-50 p-4 ${item.longAnswer ? "md:col-span-2" : ""}`}
              >
                <p className="text-sm font-bold leading-6 text-navy-950">{item.question}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {getAnswer(answers, item.key, item.fallbackKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy-950">Uploaded Evidence</h2>
          <div className="mt-5 grid gap-3">
            {safeArray(files).map((file) => (
              <a
                key={file.id}
                href={`/api/admin/files/${file.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-navy-950 transition hover:border-brand-300"
              >
                {file.originalName} - {Math.ceil(file.size / 1024)}KB
              </a>
            ))}
            {files.length === 0 && <p className="text-sm text-slate-600">No evidence uploaded.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
