import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultRegistrationCatalog } from "@/lib/registration-catalog-bootstrap";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDefaultRegistrationCatalog(prisma);

    const [courses, categories, questions] = await Promise.all([
      prisma.course.findMany({
        where: { active: true, category: { active: true } },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          active: true,
          levels: true,
          centerIds: true,
          description: true,
          duration: true,
          certificate: true,
          learn: true,
          skills: true,
          careers: true,
          requirement: true,
          value: true,
          contentBlocks: true,
          category: { select: { id: true, name: true, active: true } },
        },
      }),
      prisma.courseCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, active: true },
      }),
      prisma.verificationQuestion.findMany({
        where: { active: true },
        orderBy: [{ categoryId: "asc" }, { level: "asc" }, { sortOrder: "asc" }],
        select: { categoryId: true, level: true, key: true, questionText: true, format: true, sortOrder: true },
      }),
    ]);

    return NextResponse.json({
      courses,
      categories,
      questions,
    });
  } catch {
    return NextResponse.json({
      courses: [],
      categories: [],
      questions: [],
    });
  }
}
