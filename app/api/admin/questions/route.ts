import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultQuestions = [
  ["Basic", "canReadAndWrite", "Can you read and write in English?", 1],
  ["Basic", "newToField", "Are you new to {course}?", 2],
  ["Basic", "reasonForCourse", "Why are you registering for {course}?", 3],
  ["Basic", "availableForPracticalTraining", "Are you available for practical training?", 4],
  ["Intermediate", "priorExposure", "Do you have basic knowledge or prior exposure to {course}?", 1],
  ["Intermediate", "completedBasicCourse", "Have you completed a basic course in {course} before?", 2],
  ["Intermediate", "experienceDescription", "Describe your experience with {course} briefly.", 3],
  ["Intermediate", "availableForEntryReview", "Are you available for entry review?", 4],
  ["Advanced", "priorTraining", "Do you have prior training or demonstrable experience in {course}?", 1],
  ["Advanced", "hasPreviousCertificate", "Do you have a previous certificate?", 2],
  ["Advanced", "practicalExperience", "Describe your practical experience with {course}.", 3],
  ["Advanced", "availableForAssessment", "Are you available for assessment or interview?", 4],
] as const;

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN" && !admin.forcePasswordChange ? admin : null;
}

async function ensureDefaults() {
  const count = await prisma.verificationQuestion.count();
  if (count > 0) return;

  await prisma.verificationQuestion.createMany({
    data: defaultQuestions.map(([level, key, questionText, sortOrder]) => ({
      level,
      key,
      questionText,
      sortOrder,
      active: true,
    })),
    skipDuplicates: true,
  });
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden", questions: [] }, { status: 403 });
  await ensureDefaults();
  const questions = await prisma.verificationQuestion.findMany({
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as {
    id?: string;
    level?: string;
    key?: string;
    questionText?: string;
    active?: boolean;
    sortOrder?: number;
  } | null;

  const level = body?.level || "";
  const key = body?.key?.trim() || "";
  const questionText = body?.questionText?.trim() || "";

  if (!body?.id && (!level || !key || !questionText)) {
    return NextResponse.json({ message: "Level, key, and question text are required." }, { status: 400 });
  }

  const question = body?.id
    ? await prisma.verificationQuestion.update({
      where: { id: body.id },
      data: {
        questionText,
        active: body.active ?? true,
        sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
      },
    })
    : await prisma.verificationQuestion.create({
      data: {
        level,
        key,
        questionText,
        active: body?.active ?? true,
        sortOrder: Number.isFinite(body?.sortOrder) ? Number(body?.sortOrder) : 0,
      },
    });

  return NextResponse.json({ question });
}
