import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultRegistrationCatalog } from "@/lib/registration-catalog-bootstrap";

const questionTypes = ["open", "short_text", "dropdown", "yes_no"];

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN" && !admin.forcePasswordChange ? admin : null;
}

function text(value: unknown) {
  return String(value || "").trim();
}

function bool(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function cleanQuestionType(value: unknown) {
  const nextType = text(value);
  return questionTypes.includes(nextType) ? nextType : "open";
}

function cleanOptions(questionType: string, value: unknown) {
  if (questionType === "open" || questionType === "short_text") return [];
  if (questionType === "yes_no") return ["Yes", "No"];

  const options = stringArray(value);
  return options.length > 0 ? options : ["Yes", "No", "Other, please describe"];
}

function cleanBlocks(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      const item = block as { title?: unknown; body?: unknown };
      return { title: text(item.title), body: text(item.body) };
    })
    .filter((block) => block.title || block.body);
}

async function readBuilderData() {
  await ensureDefaultRegistrationCatalog(prisma);

  const [levels, fields, courses, questions] = await Promise.all([
    prisma.courseLevel.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.courseField.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.course.findMany({
      orderBy: { name: "asc" },
      include: { level: true, field: true, category: true },
    }),
    prisma.formQuestion.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        level: true,
        field: true,
        course: { select: { id: true, name: true } },
        options: { orderBy: { sortOrder: "asc" } },
        targetRules: {
          include: { sourceQuestion: { select: { id: true, questionText: true, questionType: true } } },
        },
      },
    }),
  ]);

  return { levels, fields, courses, questions };
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden", levels: [], fields: [], courses: [], questions: [] }, { status: 403 });
  }

  return NextResponse.json(await readBuilderData());
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

  const action = text(body.action);

  try {
    if (action === "save-level") {
      const id = text(body.id);
      const name = text(body.name);
      if (!name) return NextResponse.json({ message: "Level name is required." }, { status: 400 });
      const data = { name, active: bool(body.active), sortOrder: numberValue(body.sortOrder) };
      const level = id
        ? await prisma.courseLevel.update({ where: { id }, data })
        : await prisma.courseLevel.create({ data });
      return NextResponse.json({ level });
    }

    if (action === "save-field") {
      const id = text(body.id);
      const name = text(body.name);
      if (!name) return NextResponse.json({ message: "Field name is required." }, { status: 400 });
      const data = { name, active: bool(body.active), sortOrder: numberValue(body.sortOrder) };
      const field = id
        ? await prisma.courseField.update({ where: { id }, data })
        : await prisma.courseField.create({ data });

      const existingCategory = await prisma.courseCategory.findUnique({ where: { name } });
      if (!existingCategory) await prisma.courseCategory.create({ data: { name, active: data.active } });

      return NextResponse.json({ field });
    }

    if (action === "save-course") {
      const id = text(body.id);
      const name = text(body.name);
      const levelId = text(body.levelId);
      const fieldId = text(body.fieldId);
      if (!name || !levelId || !fieldId) {
        return NextResponse.json({ message: "Course name, level, and field are required." }, { status: 400 });
      }

      const [level, field] = await Promise.all([
        prisma.courseLevel.findUnique({ where: { id: levelId } }),
        prisma.courseField.findUnique({ where: { id: fieldId } }),
      ]);
      if (!level || !field) return NextResponse.json({ message: "Course level or field not found." }, { status: 404 });

      const category = await prisma.courseCategory.upsert({
        where: { name: field.name },
        update: { active: field.active },
        create: { name: field.name, active: field.active },
      });

      const data = {
        name,
        categoryId: category.id,
        levelId,
        fieldId,
        levels: [level.name],
        centerIds: stringArray(body.centerIds),
        description: text(body.description),
        duration: text(body.duration),
        certificate: text(body.certificate),
        learn: stringArray(body.learn),
        skills: stringArray(body.skills),
        careers: stringArray(body.careers),
        requirement: text(body.requirement),
        value: text(body.value),
        contentBlocks: cleanBlocks(body.contentBlocks),
        active: bool(body.active),
      };

      const course = id
        ? await prisma.course.update({ where: { id }, data })
        : await prisma.course.create({ data });
      return NextResponse.json({ course });
    }

    if (action === "delete-course") {
      const id = text(body.id);
      if (!id) return NextResponse.json({ message: "Course is required." }, { status: 400 });
      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });
      const registrationCount = await prisma.registration.count({
        where: { course: { equals: course.name, mode: "insensitive" } },
      });
      if (registrationCount > 0) {
        return NextResponse.json({ message: "This course has registration history. Deactivate it instead." }, { status: 400 });
      }
      await prisma.course.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === "save-question") {
      const id = text(body.id);
      const questionText = text(body.questionText);
      const questionType = cleanQuestionType(body.questionType);
      const attachTo = text(body.attachTo) || "level";
      const levelId = attachTo === "level" ? text(body.levelId) : "";
      const fieldId = attachTo === "field" ? text(body.fieldId) : "";
      const courseId = attachTo === "course" ? text(body.courseId) : "";

      if (!questionText) return NextResponse.json({ message: "Question text is required." }, { status: 400 });
      if (!levelId && !fieldId && !courseId) {
        return NextResponse.json({ message: "Attach the question to a level, field, or course." }, { status: 400 });
      }

      const options = cleanOptions(questionType, body.options);
      const condition = body.condition as Record<string, unknown> | undefined;

      const question = await prisma.$transaction(async (tx) => {
        const savedQuestion = id
          ? await tx.formQuestion.update({
            where: { id },
            data: {
              questionText,
              questionType,
              required: bool(body.required),
              active: bool(body.active),
              sortOrder: numberValue(body.sortOrder),
              levelId: levelId || null,
              fieldId: fieldId || null,
              courseId: courseId || null,
            },
          })
          : await tx.formQuestion.create({
            data: {
              questionText,
              questionType,
              required: bool(body.required),
              active: bool(body.active),
              sortOrder: numberValue(body.sortOrder),
              levelId: levelId || null,
              fieldId: fieldId || null,
              courseId: courseId || null,
            },
          });

        await tx.formQuestionOption.deleteMany({ where: { questionId: savedQuestion.id } });
        if (options.length > 0) {
          await tx.formQuestionOption.createMany({
            data: options.map((value, index) => ({
              questionId: savedQuestion.id,
              value,
              sortOrder: index + 1,
              updatedAt: new Date(),
            })),
          });
        }

        await tx.formQuestionCondition.deleteMany({ where: { targetQuestionId: savedQuestion.id } });
        const sourceQuestionId = text(condition?.sourceQuestionId);
        const conditionValue = text(condition?.value);
        const operator = text(condition?.operator) === "not_equals" ? "not_equals" : "equals";
        if (sourceQuestionId && conditionValue) {
          await tx.formQuestionCondition.create({
            data: {
              sourceQuestionId,
              operator,
              value: conditionValue,
              targetQuestionId: savedQuestion.id,
              action: "show",
            },
          });
        }

        return savedQuestion;
      });

      return NextResponse.json({ question });
    }

    if (action === "delete-question") {
      const id = text(body.id);
      if (!id) return NextResponse.json({ message: "Question is required." }, { status: 400 });
      await prisma.formQuestion.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Unsupported form builder action." }, { status: 400 });
  } catch (error) {
    console.error("Form builder action failed", error);
    return NextResponse.json({ message: "Form builder action failed." }, { status: 400 });
  }
}
