UPDATE "Registration"
SET "status" = 'VIEWED'
WHERE "status" = 'CONTACTED';

CREATE TYPE "RegistrationStatus_new" AS ENUM (
  'NEW',
  'VIEWED',
  'APPROVED',
  'UNAPPROVED',
  'NEEDS_FURTHER_REVIEW',
  'REJECTED'
);

ALTER TABLE "Registration"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Registration"
  ALTER COLUMN "status" TYPE "RegistrationStatus_new"
  USING ("status"::text::"RegistrationStatus_new");

ALTER TABLE "Registration"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "RegistrationStatus";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
