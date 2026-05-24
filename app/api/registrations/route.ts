import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendApplicantRegistrationReceivedEmail,
  sendInternalRegistrationEmail,
} from "@/lib/email";
import { storeEvidenceFile, validateEvidenceFile } from "@/lib/uploads";

export const runtime = "nodejs";

const verificationAnswerKeys = [
  "priorExposure",
  "completedBasicCourse",
  "experienceDescription",
  "availableForEntryReview",
  "canReadAndWrite",
  "newToField",
  "reasonForCourse",
  "availableForPracticalTraining",
  "basicWriting",
  "priorTraining",
  "hasPreviousCertificate",
  "practicalExperience",
  "availableForAssessment",
] as const;

const finalDecisionStatuses = new Set(["APPROVED", "UNAPPROVED", "NEEDS_FURTHER_REVIEW", "REJECTED"]);

type VerificationAnswerKey = (typeof verificationAnswerKeys)[number];
type VerificationAnswers = Record<VerificationAnswerKey, string>;
type SubmittedRegistrationAnswer = {
  questionId?: string;
  questionKey?: string;
  questionTextRendered?: string;
  questionType?: string;
  required?: boolean;
  answer?: string;
  sortOrder?: number;
};

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  return readText(formData, key) !== "false";
}

function safeArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function getVerificationAnswers(formData: FormData) {
  return Object.fromEntries(
    safeArray(verificationAnswerKeys).map((key) => [key, readText(formData, key)]),
  ) as VerificationAnswers;
}

function validateRequired(input: Record<string, string>) {
  const missing = Object.entries(input).find(([, value]) => !value);
  return missing ? `${missing[0]} is required.` : "";
}

function readJsonObject(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function readRegistrationAnswers(formData: FormData) {
  const value = readText(formData, "registrationAnswers");
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item as SubmittedRegistrationAnswer)
      .filter((item) => item.questionTextRendered && item.questionType)
      .map((item, index) => ({
        questionId: item.questionId || null,
        questionKey: item.questionKey || null,
        questionTextRendered: String(item.questionTextRendered || "").trim(),
        questionType: String(item.questionType || "").trim(),
        required: item.required !== false,
        answer: String(item.answer || "").trim(),
        sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      }));
  } catch {
    return [];
  }
}

function normalizeDuplicateValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid registration form data." }, { status: 400 });
  }

  const fullName = readText(formData, "fullName");
  const email = readText(formData, "email").toLowerCase();
  const phone = readText(formData, "phone");
  const course = readText(formData, "course");
  const category = readText(formData, "category");
  const level = readText(formData, "level");
  const center = readText(formData, "center") || readText(formData, "location");
  const session = readText(formData, "session") || readText(formData, "trainingSession");
  const hostel = readText(formData, "hostel") || "No";
  const action = readText(formData, "action") || "Submit Registration";
  const receiveUpdates = readBoolean(formData, "receiveUpdates");
  const emailVerificationId = readText(formData, "emailVerificationId");
  const submittedRegistrationId = readText(formData, "registrationId");
  const verificationAnswers = {
    ...getVerificationAnswers(formData),
    basicWriting: readText(formData, "basicWriting") || readText(formData, "basicDeclaration"),
  };
  const verificationQuestionSnapshot = readJsonObject(formData, "verificationQuestionSnapshot");
  const registrationAnswers = readRegistrationAnswers(formData);

  const validationError = validateRequired({
    fullName,
    email,
    phone,
    course,
    category,
    level,
    center,
    session,
    hostel,
    action,
  });

  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "A valid email address is required." }, { status: 400 });
  }

  if (!emailVerificationId) {
    return NextResponse.json({ message: "Please verify your email address before submitting." }, { status: 400 });
  }

  const verifiedEmail = await prisma.emailVerificationCode.findFirst({
    where: {
      id: emailVerificationId,
      email: email.toLowerCase(),
      verifiedAt: { not: null },
    },
    select: { id: true },
  });

  if (!verifiedEmail) {
    return NextResponse.json({ message: "Please verify your email address before submitting." }, { status: 400 });
  }

  const requiredVerificationValues = registrationAnswers.length > 0
    ? registrationAnswers.filter((answer) => answer.required && !answer.answer).map((answer) => answer.answer)
    : level === "Basic"
    ? [
      verificationAnswers.canReadAndWrite,
      verificationAnswers.newToField,
      verificationAnswers.reasonForCourse,
      verificationAnswers.availableForPracticalTraining,
      verificationAnswers.basicWriting,
    ]
    : level === "Intermediate"
      ? [
        verificationAnswers.priorExposure,
        verificationAnswers.completedBasicCourse,
        verificationAnswers.experienceDescription,
        verificationAnswers.availableForEntryReview,
      ]
      : [
        verificationAnswers.priorTraining,
        verificationAnswers.hasPreviousCertificate,
        verificationAnswers.practicalExperience,
        verificationAnswers.availableForAssessment,
    ];

  if (requiredVerificationValues.some((value) => !value)) {
    return NextResponse.json({ message: "Verification answers are required." }, { status: 400 });
  }

  const files = formData
    .getAll("evidenceFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  for (const file of files) {
    const fileError = validateEvidenceFile(file);
    if (fileError) {
      return NextResponse.json({ message: fileError }, { status: 400 });
    }
  }

  try {
    const normalizedFullName = normalizeDuplicateValue(fullName);
    const normalizedEmail = normalizeDuplicateValue(email);
    const normalizedCourse = normalizeDuplicateValue(course);
    const directEditRegistration = submittedRegistrationId
      ? await prisma.registration.findUnique({
        where: { id: submittedRegistrationId },
        select: {
          id: true,
          fullName: true,
          email: true,
          course: true,
          status: true,
          createdAt: true,
          originalSubmittedAt: true,
          editedAfterDecision: true,
          _count: { select: { files: true } },
        },
      })
      : null;
    const matchingEmailRegistrations = await prisma.registration.findMany({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        course: true,
        status: true,
        createdAt: true,
        originalSubmittedAt: true,
        editedAfterDecision: true,
        _count: { select: { files: true } },
      },
    });
    const duplicateRegistration = matchingEmailRegistrations.find((registration) => (
      normalizeDuplicateValue(registration.fullName) === normalizedFullName
      && normalizeDuplicateValue(registration.course) === normalizedCourse
    ));
    const safeDirectEditRegistration = directEditRegistration && normalizeDuplicateValue(directEditRegistration.email) === normalizedEmail
      ? directEditRegistration
      : null;
    const existingRegistration = safeDirectEditRegistration || duplicateRegistration;
    const isEditingExisting = Boolean(existingRegistration);
    const existingHasEvidence = (existingRegistration?._count.files ?? 0) > 0;

    if (level !== "Basic" && files.length === 0 && !existingHasEvidence) {
      return NextResponse.json({ message: "At least one evidence file is required." }, { status: 400 });
    }

    const now = new Date();
    const registration = existingRegistration
      ? await prisma.registration.update({
        where: { id: existingRegistration.id },
        data: {
          fullName,
          email: normalizedEmail,
          phone,
          course,
          category,
          level,
          center,
          session,
          hostel,
          action,
          receiveUpdates,
          verificationAnswers,
          verificationQuestionSnapshot,
          wasEdited: true,
          editCount: { increment: 1 },
          editedAt: now,
          originalSubmittedAt: existingRegistration.originalSubmittedAt || existingRegistration.createdAt,
          editedAfterDecision: finalDecisionStatuses.has(existingRegistration.status)
            ? true
            : existingRegistration.editedAfterDecision,
          needsAdminAttention: true,
        },
        select: {
          id: true,
          status: true,
          wasEdited: true,
          editCount: true,
          editedAt: true,
          editedAfterDecision: true,
        },
      })
      : await prisma.registration.create({
        data: {
          fullName,
          email: normalizedEmail,
          phone,
          course,
          category,
          level,
          center,
          session,
          hostel,
          action,
          receiveUpdates,
          verificationAnswers,
          verificationQuestionSnapshot,
          originalSubmittedAt: now,
          notifications: {
            create: [
              { targetRole: "SUPER_ADMIN" },
              { targetRole: "DIRECTOR" },
              { targetRole: "ADMISSION_OFFICIAL" },
              { targetRole: "CENTER_MANAGER", targetCenter: center },
            ],
          },
        },
        select: {
          id: true,
          status: true,
          wasEdited: true,
          editCount: true,
          editedAt: true,
          editedAfterDecision: true,
        },
      });

    if (registrationAnswers.length > 0) {
      await prisma.registrationAnswer.deleteMany({ where: { registrationId: registration.id } });
      await prisma.registrationAnswer.createMany({
        data: registrationAnswers.map((answer) => ({
          registrationId: registration.id,
          questionId: answer.questionId,
          questionKey: answer.questionKey,
          questionTextRendered: answer.questionTextRendered,
          questionType: answer.questionType,
          answer: answer.answer,
          sortOrder: answer.sortOrder,
        })),
      });
    }

    for (const file of files) {
      const storedFile = await storeEvidenceFile(registration.id, file);
      await prisma.registrationFile.create({
        data: {
          registrationId: registration.id,
          ...storedFile,
        },
      });
    }

    if (!isEditingExisting) {
      try {
        const internalRecipients = await prisma.adminUser.findMany({
          where: {
            active: true,
            OR: [
              { role: "DIRECTOR" },
              { role: "ADMISSION_OFFICIAL" },
              { role: "CENTER_MANAGER", center },
            ],
          },
          select: {
            name: true,
            email: true,
          },
        });

        const emailResults = await Promise.allSettled([
          ...internalRecipients.map((recipient) => sendInternalRegistrationEmail({
            to: recipient.email,
            recipientName: recipient.name,
            registrationId: registration.id,
            fullName,
            phone,
            email,
            course,
            category,
            level,
            center,
            status: registration.status,
          })),
          sendApplicantRegistrationReceivedEmail({
            to: email,
            fullName,
            course,
            center,
            level,
          }),
        ]);

        emailResults.forEach((result) => {
          if (result.status === "rejected") {
            console.error("Registration notification email failed", result.reason);
          }
        });
      } catch (emailError) {
        console.error("Registration notification email setup failed", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      id: registration.id,
      updated: isEditingExisting,
      wasEdited: registration.wasEdited,
      editCount: registration.editCount,
      editedAt: registration.editedAt,
      editedAfterDecision: registration.editedAfterDecision,
    });
  } catch (error) {
    console.error("Registration submission failed", error);
    return NextResponse.json(
      { message: "Registration could not be saved right now. Please try again." },
      { status: 500 },
    );
  }
}
