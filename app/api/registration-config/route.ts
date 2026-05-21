import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [courses, categories, questions] = await Promise.all([
      prisma.course.findMany({
        select: { name: true, active: true },
      }),
      prisma.courseCategory.findMany({
        select: { name: true, active: true },
      }),
      prisma.verificationQuestion.findMany({
        where: { active: true },
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
        select: { level: true, key: true, questionText: true, sortOrder: true },
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
