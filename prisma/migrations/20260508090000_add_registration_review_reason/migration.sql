-- Add structured decision reason fields for applicant review actions.
ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "reviewReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewReasonOther" TEXT;
