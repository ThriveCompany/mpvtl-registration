ALTER TABLE "Registration"
ADD COLUMN "wasEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "editCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "editedAt" TIMESTAMP(3),
ADD COLUMN "originalSubmittedAt" TIMESTAMP(3),
ADD COLUMN "editedAfterDecision" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Registration"
SET "originalSubmittedAt" = "createdAt"
WHERE "originalSubmittedAt" IS NULL;

CREATE INDEX "Registration_wasEdited_idx" ON "Registration"("wasEdited");
CREATE INDEX "Registration_editedAfterDecision_idx" ON "Registration"("editedAfterDecision");
