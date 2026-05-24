import type { PrismaClient } from "@prisma/client";
import catalog from "@/lib/default-registration-catalog.json";

type CatalogCourse = {
  name: string;
  category: string;
  levels: string[];
  centerIds: string[];
  duration: string;
  certificate: string;
  description: string;
  learn: string[];
  skills: string[];
  careers: string[];
  requirement: string;
  value: string;
};

type CatalogQuestion = {
  level: string;
  key: string;
  questionText: string;
  format?: string;
  sortOrder: number;
};

const defaultLevels = ["Basic", "Intermediate", "Advanced"];

function questionTypeFor(question: CatalogQuestion) {
  if (question.format === "open") return "open";
  if ([
    "canReadAndWrite",
    "newToField",
    "priorExposure",
    "completedBasicCourse",
    "priorTraining",
    "hasPreviousCertificate",
  ].includes(question.key)) return "yes_no";
  return "dropdown";
}

function defaultOptionsFor(question: CatalogQuestion) {
  const questionType = questionTypeFor(question);
  if (questionType === "open") return [];
  if (question.key === "reasonForCourse") {
    return [
      "Start a new skill or career",
      "Improve my current work",
      "Start or grow a business",
      "Prepare for employment",
      "Build personal confidence",
      "Other, please describe",
    ];
  }
  if (question.questionText.toLowerCase().includes("available")) return ["Yes", "No", "Maybe", "Other, please describe"];
  return ["Yes", "No", "Other, please describe"];
}

let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap(prisma: PrismaClient) {
  const [categoryCount, courseCount, categoryQuestionCount, levelCount, fieldCount, formQuestionCount] = await Promise.all([
    prisma.courseCategory.count(),
    prisma.course.count(),
    prisma.verificationQuestion.count({ where: { categoryId: { not: null } } }),
    prisma.courseLevel.count(),
    prisma.courseField.count(),
    prisma.formQuestion.count(),
  ]);

  const categoryByName = new Map<string, { id: string; name: string }>();
  const levelByName = new Map<string, { id: string; name: string }>();
  const fieldByName = new Map<string, { id: string; name: string }>();

  if (categoryCount > 0 && courseCount > 0 && categoryQuestionCount > 0 && levelCount > 0 && fieldCount > 0 && formQuestionCount > 0) return;

  try {
    for (const [index, name] of defaultLevels.entries()) {
      const level = await prisma.courseLevel.upsert({
        where: { name },
        update: {},
        create: { name, active: true, sortOrder: index + 1 },
        select: { id: true, name: true },
      });
      levelByName.set(level.name, level);
    }

    for (const name of catalog.categories) {
      const category = await prisma.courseCategory.upsert({
        where: { name },
        update: {},
        create: { name, active: true },
        select: { id: true, name: true },
      });
      categoryByName.set(category.name, category);

      const field = await prisma.courseField.upsert({
        where: { name },
        update: {},
        create: { name, active: true, sortOrder: categoryByName.size },
        select: { id: true, name: true },
      });
      fieldByName.set(field.name, field);
    }
  } catch (error) {
    console.error("Default course category bootstrap failed", error);
    throw error;
  }

  if (courseCount === 0) {
    try {
      for (const course of catalog.courses as CatalogCourse[]) {
        const category = categoryByName.get(course.category);
        const level = levelByName.get(course.levels[0] || "Basic");
        const field = fieldByName.get(course.category);
        if (!category) continue;

        await prisma.course.upsert({
          where: { name: course.name },
          update: {},
          create: {
            name: course.name,
            categoryId: category.id,
            levelId: level?.id,
            fieldId: field?.id,
            levels: course.levels,
            centerIds: course.centerIds,
            duration: course.duration,
            certificate: course.certificate,
            description: course.description,
            learn: course.learn,
            skills: course.skills,
            careers: course.careers,
            requirement: course.requirement,
            value: course.value,
            active: true,
          },
        });
      }
    } catch (error) {
      console.error("Default course catalog bootstrap failed", error);
      throw error;
    }
  }

  if (courseCount > 0) {
    for (const course of catalog.courses as CatalogCourse[]) {
      const level = levelByName.get(course.levels[0] || "Basic");
      const field = fieldByName.get(course.category);
      await prisma.course.updateMany({
        where: { name: course.name, OR: [{ levelId: null }, { fieldId: null }] },
        data: { levelId: level?.id, fieldId: field?.id },
      });
    }
  }

  if (categoryQuestionCount === 0) {
    try {
      for (const category of categoryByName.values()) {
        for (const question of catalog.questions as CatalogQuestion[]) {
          const existingQuestion = await prisma.verificationQuestion.findFirst({
            where: {
              categoryId: category.id,
              level: question.level,
              key: question.key,
            },
          });

          if (existingQuestion) continue;

          await prisma.verificationQuestion.create({
            data: {
              categoryId: category.id,
              level: question.level,
              key: question.key,
              questionText: question.questionText,
              format: question.format === "open" ? "open" : "closed",
              sortOrder: question.sortOrder,
              active: true,
            },
          });
        }
      }
    } catch (error) {
      // Question defaults should not block the course catalogue from loading.
      // Super Admins can still manage questions manually from /admin/questions.
      console.error("Default verification question bootstrap failed", error);
    }
  }

  if (formQuestionCount === 0) {
    try {
      for (const field of fieldByName.values()) {
        for (const question of catalog.questions as CatalogQuestion[]) {
          const level = levelByName.get(question.level);
          if (!level) continue;

          const savedQuestion = await prisma.formQuestion.create({
            data: {
              levelId: level.id,
              fieldId: field.id,
              questionText: question.questionText,
              questionType: questionTypeFor(question),
              required: true,
              active: true,
              sortOrder: question.sortOrder,
              options: {
                create: defaultOptionsFor(question).map((value, index) => ({
                  value,
                  sortOrder: index + 1,
                })),
              },
            },
            select: { id: true },
          });

          void savedQuestion;
        }
      }
    } catch (error) {
      console.error("Default form builder question bootstrap failed", error);
    }
  }
}

export async function ensureDefaultRegistrationCatalog(prisma: PrismaClient) {
  bootstrapPromise ??= runBootstrap(prisma).finally(() => {
    bootstrapPromise = null;
  });

  await bootstrapPromise;
}
