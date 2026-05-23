import { NextResponse } from "next/server";
import { CENTER_OPTIONS } from "@/lib/admin-constants";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const levelOptions = ["Basic", "Intermediate", "Advanced"];
const centreOptions = new Set<string>(CENTER_OPTIONS.map((center) => center.value));

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN" && !admin.forcePasswordChange ? admin : null;
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function cleanLevels(value: unknown) {
  return cleanStringArray(value).filter((level) => levelOptions.includes(level));
}

function cleanCenterIds(value: unknown) {
  return cleanStringArray(value).filter((centerId) => centreOptions.has(centerId));
}

function cleanBlocks(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      const item = block as { title?: unknown; body?: unknown };
      return {
        title: String(item?.title || "").trim(),
        body: String(item?.body || "").trim(),
      };
    })
    .filter((block) => block.title || block.body);
}

function readCoursePayload(body: Record<string, unknown>) {
  return {
    name: String(body.name || "").trim(),
    categoryId: String(body.categoryId || "").trim(),
    levels: cleanLevels(body.levels),
    centerIds: cleanCenterIds(body.centerIds),
    description: String(body.description || "").trim(),
    duration: String(body.duration || "").trim(),
    certificate: String(body.certificate || "").trim(),
    learn: cleanStringArray(body.learn),
    skills: cleanStringArray(body.skills),
    careers: cleanStringArray(body.careers),
    requirement: String(body.requirement || "").trim(),
    value: String(body.value || "").trim(),
    contentBlocks: cleanBlocks(body.contentBlocks),
    active: body.active !== false,
  };
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden", courses: [], categories: [] }, { status: 403 });
  }

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      include: { courses: { select: { id: true, name: true, active: true }, orderBy: { name: "asc" } } },
    }),
  ]);

  return NextResponse.json({ courses, categories });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action || "");

  if (!body) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

  try {
    if (action === "create-category") {
      const name = String(body.name || "").trim();
      if (!name) return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      const category = await prisma.courseCategory.create({
        data: { name, active: body.active !== false },
      });
      return NextResponse.json({ category });
    }

    if (action === "update-category") {
      const id = String(body.id || "");
      const name = String(body.name || "").trim();
      if (!id || !name) return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      const category = await prisma.courseCategory.update({
        where: { id },
        data: { name, active: body.active !== false },
      });
      return NextResponse.json({ category });
    }

    if (action === "delete-category") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ message: "Category is required." }, { status: 400 });
      const category = await prisma.courseCategory.findUnique({
        where: { id },
        include: { _count: { select: { courses: true } } },
      });
      if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });
      if (category._count.courses > 0) {
        return NextResponse.json({ message: "This category still has courses. Move or deactivate them first." }, { status: 400 });
      }
      await prisma.courseCategory.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === "move-courses") {
      const fromCategoryId = String(body.fromCategoryId || "");
      const toCategoryId = String(body.toCategoryId || "");
      if (!fromCategoryId || !toCategoryId || fromCategoryId === toCategoryId) {
        return NextResponse.json({ message: "Choose different source and destination categories." }, { status: 400 });
      }
      await prisma.course.updateMany({
        where: { categoryId: fromCategoryId },
        data: { categoryId: toCategoryId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "create-course" || action === "update-course") {
      const id = String(body.id || "");
      const payload = readCoursePayload(body);

      if (!payload.name || !payload.categoryId || payload.levels.length === 0) {
        return NextResponse.json({ message: "Course name, category, and at least one level are required." }, { status: 400 });
      }

      const data = {
        name: payload.name,
        categoryId: payload.categoryId,
        levels: payload.levels,
        centerIds: payload.centerIds,
        description: payload.description,
        duration: payload.duration,
        certificate: payload.certificate,
        learn: payload.learn,
        skills: payload.skills,
        careers: payload.careers,
        requirement: payload.requirement,
        value: payload.value,
        contentBlocks: payload.contentBlocks,
        active: payload.active,
      };

      const course = action === "create-course"
        ? await prisma.course.create({ data })
        : await prisma.course.update({ where: { id }, data });
      return NextResponse.json({ course });
    }

    if (action === "quick-update-course") {
      const id = String(body.id || "");
      const categoryId = String(body.categoryId || "");
      if (!id || !categoryId) return NextResponse.json({ message: "Course and category are required." }, { status: 400 });
      const course = await prisma.course.update({
        where: { id },
        data: {
          categoryId,
          active: body.active !== false,
          levels: cleanLevels(body.levels),
          centerIds: cleanCenterIds(body.centerIds),
        },
      });
      return NextResponse.json({ course });
    }

    if (action === "delete-course") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ message: "Course is required." }, { status: 400 });
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });
      const historyCount = await prisma.registration.count({
        where: { course: { equals: course.name, mode: "insensitive" } },
      });
      if (historyCount > 0) {
        return NextResponse.json({ message: "This course has registration history. Deactivate it instead." }, { status: 400 });
      }
      await prisma.course.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Unsupported course action." }, { status: 400 });
  } catch (error) {
    console.error("Course management failed", error);
    return NextResponse.json({ message: "Course management action failed." }, { status: 400 });
  }
}
