-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MARKETING_OFFICIAL', 'CENTER_MANAGER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('NEW', 'VIEWED', 'APPROVED', 'REJECTED', 'CONTACTED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "center" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "center" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "hostel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "receiveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'NEW',
    "verificationAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationFile" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationNotification" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "targetRole" "AdminRole" NOT NULL,
    "targetCenter" TEXT,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Registration_center_idx" ON "Registration"("center");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE INDEX "RegistrationFile_registrationId_idx" ON "RegistrationFile"("registrationId");

-- CreateIndex
CREATE INDEX "RegistrationNotification_targetRole_seen_idx" ON "RegistrationNotification"("targetRole", "seen");

-- CreateIndex
CREATE INDEX "RegistrationNotification_targetCenter_seen_idx" ON "RegistrationNotification"("targetCenter", "seen");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationFile" ADD CONSTRAINT "RegistrationFile_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationNotification" ADD CONSTRAINT "RegistrationNotification_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
