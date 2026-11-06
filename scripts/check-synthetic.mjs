import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { assertSyntheticDatabase } from "./dev-safety.mjs";

assertSyntheticDatabase(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "development") throw new Error("Synthetic check requires development mode");
const prisma = new PrismaClient();
try {
  const counts = await Promise.all([
    prisma.courseCategory.count(), prisma.course.count(), prisma.verificationQuestion.count(),
    prisma.courseLevel.count(), prisma.courseField.count(), prisma.formQuestion.count(),
    prisma.adminUser.count(), prisma.registration.count(),
  ]);
  assert.deepEqual(counts, Array(8).fill(1), "Expected exactly the isolated synthetic fixtures");
  const applicant = await prisma.registration.findUnique({ where: { id: "wo03-synthetic-registration" } });
  assert.equal(applicant?.email, "applicant@example.invalid");
  assert.equal(applicant?.status, "NEW");
  const admin = await prisma.adminUser.findUnique({ where: { email: "admin@example.invalid" } });
  assert.equal(admin?.role, "SUPER_ADMIN");
  console.log("PASS: synthetic schema and idempotent fixtures; only aggregate results reported.");
} finally { await prisma.$disconnect(); }
