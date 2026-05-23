import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const levels = ["Basic", "Intermediate", "Advanced"];

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN" && !admin.forcePasswordChange ? admin : null;
}

function normalizeKey(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_ -]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden", questions: [], categories: [] }, { status: 403 });

  const [categories, questions] = await Promise.all([
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, active: true },
    }),
    prisma.verificationQuestion.findMany({
      orderBy: [{ categoryId: "asc" }, { level: "asc" }, { sortOrder: "asc" }],
      include: { category: { select: { id: true, name: true, active: true } } },
    }),
  ]);

  return NextResponse.json({ categories, questions });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as {
    action?: string;
    id?: string;
    categoryId?: string;
    level?: string;
    key?: string;
    questionText?: string;
    active?: boolean;
    sortOrder?: number;
    orderedIds?: string[];
  } | null;

  if (!body) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

  const action = body.action || "save-question";

  try {
    if (action === "toggle-question") {
      if (!body.id) return NextResponse.json({ message: "Question is required." }, { status: 400 });
      const question = await prisma.verificationQuestion.update({
        where: { id: body.id },
        data: { active: body.active ?? true },
      });
      return NextResponse.json({ question });
    }

    if (action === "reorder-questions") {
      const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.filter(Boolean) : [];
      if (orderedIds.length === 0) return NextResponse.json({ message: "No questions selected for reorder." }, { status: 400 });

      await prisma.$transaction(
        orderedIds.map((id, index) => prisma.verificationQuestion.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })),
      );
      return NextResponse.json({ success: true });
    }

    const categoryId = body.categoryId || "";
    const level = body.level || "";
    const key = normalizeKey(body.key || "");
    const questionText = body.questionText?.trim() || "";

    if (!categoryId || !levels.includes(level) || !key || !questionText) {
      return NextResponse.json({ message: "Category, level, key, and question text are required." }, { status: 400 });
    }

    const category = await prisma.courseCategory.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });

    const data = {
      categoryId,
      level,
      key,
      questionText,
      active: body.active ?? true,
      sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
    };

    const question = body.id
      ? await prisma.verificationQuestion.update({
        where: { id: body.id },
        data,
      })
      : await prisma.verificationQuestion.create({ data });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question management failed", error);
    return NextResponse.json({ message: "Question management action failed." }, { status: 400 });
  }
}
