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
  sortOrder: number;
};

let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap(prisma: PrismaClient) {
  const [categoryCount, courseCount, categoryQuestionCount] = await Promise.all([
    prisma.courseCategory.count(),
    prisma.course.count(),
    prisma.verificationQuestion.count({ where: { categoryId: { not: null } } }),
  ]);

  const categoryByName = new Map<string, { id: string; name: string }>();

  if (categoryCount > 0 && courseCount > 0 && categoryQuestionCount > 0) return;

  try {
    for (const name of catalog.categories) {
      const category = await prisma.courseCategory.upsert({
        where: { name },
        update: {},
        create: { name, active: true },
        select: { id: true, name: true },
      });
      categoryByName.set(category.name, category);
    }
  } catch (error) {
    console.error("Default course category bootstrap failed", error);
    throw error;
  }

  if (courseCount === 0) {
    try {
      for (const course of catalog.courses as CatalogCourse[]) {
        const category = categoryByName.get(course.category);
        if (!category) continue;

        await prisma.course.upsert({
          where: { name: course.name },
          update: {},
          create: {
            name: course.name,
            categoryId: category.id,
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
}

export async function ensureDefaultRegistrationCatalog(prisma: PrismaClient) {
  bootstrapPromise ??= runBootstrap(prisma).finally(() => {
    bootstrapPromise = null;
  });

  await bootstrapPromise;
}
