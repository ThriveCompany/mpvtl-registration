import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultRegistrationCatalog } from "@/lib/registration-catalog-bootstrap";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDefaultRegistrationCatalog(prisma);

    const [courses, categories, questions, formQuestions] = await Promise.all([
      prisma.course.findMany({
        where: {
          active: true,
          category: { active: true },
          OR: [
            { levelId: null },
            { level: { active: true } },
          ],
          AND: [
            {
              OR: [
                { fieldId: null },
                { field: { active: true } },
              ],
            },
          ],
        },
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
          level: { select: { id: true, name: true, active: true, sortOrder: true } },
          field: { select: { id: true, name: true, active: true, sortOrder: true } },
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
      prisma.formQuestion.findMany({
        where: {
          active: true,
          OR: [
            { level: { active: true } },
            { field: { active: true } },
            { course: { active: true } },
          ],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          questionText: true,
          questionType: true,
          required: true,
          sortOrder: true,
          levelId: true,
          fieldId: true,
          courseId: true,
          options: { orderBy: { sortOrder: "asc" }, select: { id: true, value: true, sortOrder: true } },
          targetRules: { select: { sourceQuestionId: true, operator: true, value: true, action: true } },
        },
      }),
    ]);

    return NextResponse.json({
      courses,
      categories,
      questions,
      formQuestions,
    });
  } catch {
    return NextResponse.json({
      courses: [],
      categories: [],
      questions: [],
      formQuestions: [],
    });
  }
}
