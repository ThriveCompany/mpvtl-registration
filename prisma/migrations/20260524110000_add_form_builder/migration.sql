CREATE TABLE "CourseLevel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseLevel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseLevel_name_key" ON "CourseLevel"("name");
CREATE INDEX "CourseLevel_active_idx" ON "CourseLevel"("active");
CREATE INDEX "CourseLevel_sortOrder_idx" ON "CourseLevel"("sortOrder");

CREATE TABLE "CourseField" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseField_name_key" ON "CourseField"("name");
CREATE INDEX "CourseField_active_idx" ON "CourseField"("active");
CREATE INDEX "CourseField_sortOrder_idx" ON "CourseField"("sortOrder");

ALTER TABLE "Course"
ADD COLUMN "levelId" TEXT,
ADD COLUMN "fieldId" TEXT;

CREATE INDEX "Course_levelId_idx" ON "Course"("levelId");
CREATE INDEX "Course_fieldId_idx" ON "Course"("fieldId");

CREATE TABLE "FormQuestion" (
  "id" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "questionType" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "levelId" TEXT,
  "fieldId" TEXT,
  "courseId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FormQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FormQuestion_levelId_idx" ON "FormQuestion"("levelId");
CREATE INDEX "FormQuestion_fieldId_idx" ON "FormQuestion"("fieldId");
CREATE INDEX "FormQuestion_courseId_idx" ON "FormQuestion"("courseId");
CREATE INDEX "FormQuestion_active_idx" ON "FormQuestion"("active");
CREATE INDEX "FormQuestion_sortOrder_idx" ON "FormQuestion"("sortOrder");

CREATE TABLE "FormQuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FormQuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FormQuestionOption_questionId_idx" ON "FormQuestionOption"("questionId");
CREATE INDEX "FormQuestionOption_sortOrder_idx" ON "FormQuestionOption"("sortOrder");

CREATE TABLE "FormQuestionCondition" (
  "id" TEXT NOT NULL,
  "sourceQuestionId" TEXT NOT NULL,
  "operator" TEXT NOT NULL DEFAULT 'equals',
  "value" TEXT NOT NULL,
  "targetQuestionId" TEXT NOT NULL,
  "action" TEXT NOT NULL DEFAULT 'show',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FormQuestionCondition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FormQuestionCondition_sourceQuestionId_idx" ON "FormQuestionCondition"("sourceQuestionId");
CREATE INDEX "FormQuestionCondition_targetQuestionId_idx" ON "FormQuestionCondition"("targetQuestionId");

CREATE TABLE "RegistrationAnswer" (
  "id" TEXT NOT NULL,
  "registrationId" TEXT NOT NULL,
  "questionId" TEXT,
  "questionKey" TEXT,
  "questionTextRendered" TEXT NOT NULL,
  "questionType" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistrationAnswer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationAnswer_registrationId_idx" ON "RegistrationAnswer"("registrationId");
CREATE INDEX "RegistrationAnswer_questionId_idx" ON "RegistrationAnswer"("questionId");

ALTER TABLE "Course"
ADD CONSTRAINT "Course_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "CourseLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Course_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CourseField"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FormQuestion"
ADD CONSTRAINT "FormQuestion_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "CourseLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "FormQuestion_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CourseField"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "FormQuestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FormQuestionOption"
ADD CONSTRAINT "FormQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FormQuestionCondition"
ADD CONSTRAINT "FormQuestionCondition_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "FormQuestionCondition_targetQuestionId_fkey" FOREIGN KEY ("targetQuestionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RegistrationAnswer"
ADD CONSTRAINT "RegistrationAnswer_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "RegistrationAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "CourseLevel" ("id", "name", "active", "sortOrder", "updatedAt")
VALUES
  ('level_basic', 'Basic', true, 1, CURRENT_TIMESTAMP),
  ('level_intermediate', 'Intermediate', true, 2, CURRENT_TIMESTAMP),
  ('level_advanced', 'Advanced', true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "CourseField" ("id", "name", "active", "sortOrder", "updatedAt")
SELECT
  concat('field_', substr(md5("name"), 1, 12)),
  "name",
  "active",
  row_number() OVER (ORDER BY "name"),
  CURRENT_TIMESTAMP
FROM "CourseCategory"
ON CONFLICT ("name") DO NOTHING;

UPDATE "Course"
SET "levelId" = CASE
  WHEN "levels"[1] = 'Intermediate' THEN 'level_intermediate'
  WHEN "levels"[1] = 'Advanced' THEN 'level_advanced'
  ELSE 'level_basic'
END
WHERE "levelId" IS NULL;

UPDATE "Course"
SET "fieldId" = "CourseField"."id"
FROM "CourseCategory", "CourseField"
WHERE "Course"."categoryId" = "CourseCategory"."id"
  AND "CourseCategory"."name" = "CourseField"."name"
  AND "Course"."fieldId" IS NULL;

INSERT INTO "FormQuestion" (
  "id",
  "questionText",
  "questionType",
  "required",
  "active",
  "sortOrder",
  "levelId",
  "fieldId",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('fq_', substr(md5(concat(coalesce(vq."categoryId", ''), ':', vq."level", ':', vq."key")), 1, 16)),
  vq."questionText",
  CASE
    WHEN vq."format" = 'open' THEN 'open'
    WHEN vq."key" IN ('canReadAndWrite', 'newToField', 'priorExposure', 'completedBasicCourse', 'priorTraining', 'hasPreviousCertificate') THEN 'yes_no'
    ELSE 'dropdown'
  END,
  true,
  vq."active",
  vq."sortOrder",
  CASE
    WHEN vq."level" = 'Intermediate' THEN 'level_intermediate'
    WHEN vq."level" = 'Advanced' THEN 'level_advanced'
    ELSE 'level_basic'
  END,
  cf."id",
  vq."createdAt",
  CURRENT_TIMESTAMP
FROM "VerificationQuestion" vq
LEFT JOIN "CourseCategory" cc ON cc."id" = vq."categoryId"
LEFT JOIN "CourseField" cf ON cf."name" = cc."name"
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Yes')), 1, 16)), fq."id", 'Yes', 1, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'yes_no'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':No')), 1, 16)), fq."id", 'No', 2, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'yes_no'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Other')), 1, 16)), fq."id", 'Other, please describe', 3, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'yes_no'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Maybe')), 1, 16)), fq."id", 'Maybe', 3, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown' AND fq."questionText" ILIKE '%available%'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Start a new skill or career')), 1, 16)), fq."id", 'Start a new skill or career', 1, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown' AND fq."questionText" ILIKE '%registering%'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Improve my current work')), 1, 16)), fq."id", 'Improve my current work', 2, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown' AND fq."questionText" ILIKE '%registering%'
ON CONFLICT DO NOTHING;

INSERT INTO "FormQuestionOption" ("id", "questionId", "value", "sortOrder", "updatedAt")
SELECT concat('fqo_', substr(md5(concat(fq."id", ':Other')), 1, 16)), fq."id", 'Other, please describe', 99, CURRENT_TIMESTAMP
FROM "FormQuestion" fq
WHERE fq."questionType" = 'dropdown'
ON CONFLICT DO NOTHING;
