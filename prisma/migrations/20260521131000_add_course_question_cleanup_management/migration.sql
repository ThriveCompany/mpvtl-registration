ALTER TABLE "Registration"
ADD COLUMN "needsAdminAttention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "archivedAsDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mergedIntoRegistrationId" TEXT,
ADD COLUMN "verificationQuestionSnapshot" JSONB;

CREATE INDEX "Registration_needsAdminAttention_idx" ON "Registration"("needsAdminAttention");
CREATE INDEX "Registration_archivedAsDuplicate_idx" ON "Registration"("archivedAsDuplicate");
CREATE INDEX "Registration_mergedIntoRegistrationId_idx" ON "Registration"("mergedIntoRegistrationId");

CREATE TABLE "CourseCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseCategory_name_key" ON "CourseCategory"("name");

CREATE TABLE "Course" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "levels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "centerIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");
CREATE INDEX "Course_active_idx" ON "Course"("active");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "VerificationQuestion" (
  "id" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VerificationQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationQuestion_level_key_key" ON "VerificationQuestion"("level", "key");
CREATE INDEX "VerificationQuestion_level_active_idx" ON "VerificationQuestion"("level", "active");
CREATE INDEX "VerificationQuestion_sortOrder_idx" ON "VerificationQuestion"("sortOrder");
