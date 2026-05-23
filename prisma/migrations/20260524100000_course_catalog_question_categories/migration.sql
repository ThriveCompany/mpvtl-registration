-- Course catalogue content fields for admin-managed public course descriptions.
ALTER TABLE "Course"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "duration" TEXT NOT NULL DEFAULT '',
ADD COLUMN "certificate" TEXT NOT NULL DEFAULT '',
ADD COLUMN "learn" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "careers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requirement" TEXT NOT NULL DEFAULT '',
ADD COLUMN "value" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contentBlocks" JSONB;

-- Questions now belong to categories, with legacy/global questions allowed as fallback.
ALTER TABLE "VerificationQuestion"
ADD COLUMN "categoryId" TEXT;

ALTER TABLE "VerificationQuestion"
DROP CONSTRAINT IF EXISTS "VerificationQuestion_level_key_key";

ALTER TABLE "VerificationQuestion"
ADD CONSTRAINT "VerificationQuestion_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "CourseCategory"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "VerificationQuestion_categoryId_level_key_key"
ON "VerificationQuestion"("categoryId", "level", "key");

CREATE INDEX "VerificationQuestion_categoryId_idx"
ON "VerificationQuestion"("categoryId");
