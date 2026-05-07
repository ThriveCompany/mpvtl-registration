-- Replace MARKETING_OFFICIAL with ADMISSION_OFFICIAL and add the new admin roles.
CREATE TYPE "AdminRole_new" AS ENUM ('SUPER_ADMIN', 'DIRECTOR', 'ADMISSION_OFFICIAL', 'CENTER_MANAGER');

ALTER TABLE "AdminUser"
  ALTER COLUMN "role" TYPE "AdminRole_new"
  USING (
    CASE "role"::text
      WHEN 'MARKETING_OFFICIAL' THEN 'ADMISSION_OFFICIAL'
      ELSE "role"::text
    END
  )::"AdminRole_new";

ALTER TABLE "RegistrationNotification"
  ALTER COLUMN "targetRole" TYPE "AdminRole_new"
  USING (
    CASE "targetRole"::text
      WHEN 'MARKETING_OFFICIAL' THEN 'ADMISSION_OFFICIAL'
      ELSE "targetRole"::text
    END
  )::"AdminRole_new";

DROP TYPE "AdminRole";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";

-- Add final decision statuses.
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'UNAPPROVED';
ALTER TYPE "RegistrationStatus" ADD VALUE IF NOT EXISTS 'NEEDS_FURTHER_REVIEW';

-- Track final review decisions.
ALTER TABLE "Registration"
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedRole" TEXT;

CREATE INDEX "Registration_reviewedById_idx" ON "Registration"("reviewedById");

ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
