import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  "priorTraining",
  "hasPreviousCertificate",
  "practicalExperience",
  "availableForAssessment",
] as const;

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
  );
}

function validateRequired(input: Record<string, string>) {
  const missing = Object.entries(input).find(([, value]) => !value);
  return missing ? `${missing[0]} is required.` : "";
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid registration form data." }, { status: 400 });
  }

  const fullName = readText(formData, "fullName");
  const email = readText(formData, "email");
  const phone = readText(formData, "phone");
  const course = readText(formData, "course");
  const category = readText(formData, "category");
  const level = readText(formData, "level");
  const center = readText(formData, "center") || readText(formData, "location");
  const session = readText(formData, "session") || readText(formData, "trainingSession");
  const hostel = readText(formData, "hostel") || "No";
  const action = readText(formData, "action") || "Submit Registration";
  const receiveUpdates = readBoolean(formData, "receiveUpdates");
  const verificationAnswers = getVerificationAnswers(formData);

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

  const requiredVerificationValues = level === "Basic"
    ? [
      verificationAnswers.canReadAndWrite,
      verificationAnswers.newToField,
      verificationAnswers.reasonForCourse,
      verificationAnswers.availableForPracticalTraining,
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

  if (level !== "Basic" && files.length === 0) {
    return NextResponse.json({ message: "At least one evidence file is required." }, { status: 400 });
  }

  for (const file of files) {
    const fileError = validateEvidenceFile(file);
    if (fileError) {
      return NextResponse.json({ message: fileError }, { status: 400 });
    }
  }

  try {
    const registration = await prisma.registration.create({
      data: {
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
        receiveUpdates,
        verificationAnswers,
        notifications: {
          create: [
            { targetRole: "MARKETING_OFFICIAL" },
            { targetRole: "CENTER_MANAGER", targetCenter: center },
          ],
        },
      },
      select: { id: true },
    });

    for (const file of files) {
      const storedFile = await storeEvidenceFile(registration.id, file);
      await prisma.registrationFile.create({
        data: {
          registrationId: registration.id,
          ...storedFile,
        },
      });
    }

    return NextResponse.json({ success: true, id: registration.id });
  } catch (error) {
    console.error("Registration submission failed", error);
    return NextResponse.json(
      { message: "Registration could not be saved right now. Please try again." },
      { status: 500 },
    );
  }
}
