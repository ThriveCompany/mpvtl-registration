import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertSyntheticDatabase } from "./dev-safety.mjs";

assertSyntheticDatabase(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "development") throw new Error("Synthetic seed requires development mode");
const prisma = new PrismaClient();
try {
  const category = await prisma.courseCategory.upsert({ where: { name: "Synthetic field" }, update: {}, create: { name: "Synthetic field" } });
  const field = await prisma.courseField.upsert({ where: { name: "Synthetic field" }, update: {}, create: { name: "Synthetic field" } });
  const level = await prisma.courseLevel.upsert({ where: { name: "Basic" }, update: {}, create: { name: "Basic" } });
  await prisma.course.upsert({
    where: { name: "Synthetic demonstration course" }, update: {},
    create: { name: "Synthetic demonstration course", categoryId: category.id, fieldId: field.id, levelId: level.id, levels: ["Basic"], centerIds: ["lagos"] },
  });
  await prisma.verificationQuestion.upsert({
    where: { categoryId_level_key: { categoryId: category.id, level: "Basic", key: "synthetic" } }, update: {},
    create: { categoryId: category.id, level: "Basic", key: "synthetic", questionText: "Synthetic example question" },
  });
  await prisma.formQuestion.upsert({
    where: { id: "wo03-synthetic-question" }, update: {},
    create: { id: "wo03-synthetic-question", levelId: level.id, fieldId: field.id, questionText: "Synthetic example question", questionType: "open" },
  });
  await prisma.adminUser.upsert({
    where: { email: "admin@example.invalid" }, update: {},
    create: { name: "Synthetic Admin", email: "admin@example.invalid", passwordHash: await bcrypt.hash("Synthetic-Local-2026", 12), role: "SUPER_ADMIN" },
  });
  await prisma.registration.upsert({
    where: { id: "wo03-synthetic-registration" }, update: {},
    create: {
      id: "wo03-synthetic-registration", fullName: "Synthetic Applicant", email: "applicant@example.invalid", phone: "00000000000",
      course: "Synthetic demonstration course", category: "Synthetic field", level: "Basic", center: "lagos",
      session: "Synthetic session", hostel: "No", action: "Synthetic demonstration", verificationAnswers: {},
    },
  });
  console.log("Synthetic development fixtures ready. No email or payment was sent.");
} finally { await prisma.$disconnect(); }
