ALTER TABLE "VerificationQuestion"
ADD COLUMN "format" TEXT NOT NULL DEFAULT 'closed';

UPDATE "VerificationQuestion"
SET "format" = 'open'
WHERE "key" IN ('experienceDescription', 'practicalExperience');

