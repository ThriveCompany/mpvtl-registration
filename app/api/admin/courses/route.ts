import { NextResponse } from "next/server";
import { CENTER_OPTIONS } from "@/lib/admin-constants";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const levels = ["Basic", "Intermediate", "Advanced"];

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN" && !admin.forcePasswordChange ? admin : null;
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden", courses: [], categories: [] }, { status: 403 });

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({ orderBy: { name: "asc" }, include: { category: true } }),
    prisma.courseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ courses, categories });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as {
    action?: string;
    id?: string;
    name?: string;
    categoryId?: string;
    levels?: string[];
    centerIds?: string[];
    active?: boolean;
  } | null;

  const action = body?.action || "";
  const name = body?.name?.trim() || "";

  try {
    if (action === "create-category") {
      if (!name) return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      const category = await prisma.courseCategory.create({ data: { name, active: body?.active ?? true } });
      return NextResponse.json({ category });
    }

    if (action === "update-category") {
      if (!body?.id || !name) return NextResponse.json({ message: "Category name is required." }, { status: 400 });
      const category = await prisma.courseCategory.update({
        where: { id: body.id },
        data: { name, active: body.active ?? true },
      });
      return NextResponse.json({ category });
    }

    if (action === "delete-category") {
      if (!body?.id) return NextResponse.json({ message: "Category is required." }, { status: 400 });
      const category = await prisma.courseCategory.findUnique({ where: { id: body.id }, include: { _count: { select: { courses: true } } } });
      if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });
      if (category._count.courses > 0) {
        return NextResponse.json({ message: "This category is used by courses. Deactivate it instead." }, { status: 400 });
      }
      await prisma.courseCategory.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    }

    if (action === "create-course" || action === "update-course") {
      const categoryId = body?.categoryId || "";
      const selectedLevels = Array.isArray(body?.levels) ? body.levels.filter((level) => levels.includes(level)) : [];
      const selectedCenters = Array.isArray(body?.centerIds)
        ? body.centerIds.filter((center) => CENTER_OPTIONS.some((option) => option.value === center))
        : [];

      if (!name || !categoryId || selectedLevels.length === 0) {
        return NextResponse.json({ message: "Course name, category, and at least one level are required." }, { status: 400 });
      }

      const data = {
        name,
        categoryId,
        levels: selectedLevels,
        centerIds: selectedCenters,
        active: body?.active ?? true,
      };

      const course = action === "create-course"
        ? await prisma.course.create({ data })
        : await prisma.course.update({ where: { id: body?.id || "" }, data });
      return NextResponse.json({ course });
    }

    if (action === "delete-course") {
      if (!body?.id) return NextResponse.json({ message: "Course is required." }, { status: 400 });
      const course = await prisma.course.findUnique({ where: { id: body.id } });
      if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });
      const historyCount = await prisma.registration.count({
        where: { course: { equals: course.name, mode: "insensitive" } },
      });
      if (historyCount > 0) {
        return NextResponse.json({ message: "This course has registration history. Deactivate instead." }, { status: 400 });
      }
      await prisma.course.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Unsupported course action." }, { status: 400 });
  } catch (error) {
    console.error("Course management failed", error);
    return NextResponse.json({ message: "Course management action failed." }, { status: 400 });
  }
}
