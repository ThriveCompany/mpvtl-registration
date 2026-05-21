import { NextResponse } from "next/server";
import { FINAL_REGISTRATION_STATUSES } from "@/lib/admin-constants";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeDuplicateValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function duplicateKey(registration: { fullName: string; email: string; course: string }) {
  return [
    normalizeDuplicateValue(registration.fullName),
    normalizeDuplicateValue(registration.email),
    normalizeDuplicateValue(registration.course),
  ].join("|");
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden", groups: [] }, { status: 403 });
  }

  const registrations = await prisma.registration.findMany({
    where: { archivedAsDuplicate: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      course: true,
      center: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      editCount: true,
    },
  });

  const groups = new Map<string, typeof registrations>();
  for (const registration of registrations) {
    const key = duplicateKey(registration);
    groups.set(key, [...(groups.get(key) || []), registration]);
  }

  const duplicateGroups = Array.from(groups.values())
    .filter((items) => items.length > 1)
    .map((items) => {
      const sorted = [...items].sort((first, second) => (
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
      ));

      return {
        key: duplicateKey(sorted[0]),
        primary: sorted[0],
        archive: sorted.slice(1),
        count: sorted.length,
      };
    });

  return NextResponse.json({ groups: duplicateGroups });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { primaryId?: string; archiveIds?: string[] } | null;
  const primaryId = body?.primaryId || "";
  const archiveIds = Array.isArray(body?.archiveIds) ? body.archiveIds.filter(Boolean) : [];

  if (!primaryId || archiveIds.length === 0) {
    return NextResponse.json({ message: "Choose a duplicate group to merge." }, { status: 400 });
  }

  const records = await prisma.registration.findMany({
    where: { id: { in: [primaryId, ...archiveIds] } },
    include: { files: true, reviewedBy: true, approvedBy: true },
  });
  const primary = records.find((record) => record.id === primaryId);
  const archiveRecords = records.filter((record) => archiveIds.includes(record.id));

  if (!primary || archiveRecords.length !== archiveIds.length) {
    return NextResponse.json({ message: "Duplicate records could not be found." }, { status: 404 });
  }

  const primaryKey = duplicateKey(primary);
  if (archiveRecords.some((record) => duplicateKey(record) !== primaryKey)) {
    return NextResponse.json({ message: "Selected records are not the same applicant/course duplicate group." }, { status: 400 });
  }

  const primaryHasFinal = (FINAL_REGISTRATION_STATUSES as readonly string[]).includes(primary.status);
  const strongestFinal = primaryHasFinal
    ? null
    : archiveRecords.find((record) => (FINAL_REGISTRATION_STATUSES as readonly string[]).includes(record.status));

  await prisma.$transaction(async (tx) => {
    if (strongestFinal) {
      await tx.registration.update({
        where: { id: primary.id },
        data: {
          status: strongestFinal.status,
          approvedAt: strongestFinal.approvedAt,
          approvedById: strongestFinal.approvedById,
          reviewedAt: strongestFinal.reviewedAt,
          reviewedById: strongestFinal.reviewedById,
          reviewedRole: strongestFinal.reviewedRole,
          reviewNote: strongestFinal.reviewNote,
          reviewReason: strongestFinal.reviewReason,
          reviewReasonOther: strongestFinal.reviewReasonOther,
        },
      });
    }

    await tx.registrationFile.updateMany({
      where: { registrationId: { in: archiveIds } },
      data: { registrationId: primary.id },
    });

    await tx.registration.updateMany({
      where: { id: { in: archiveIds } },
      data: {
        archivedAsDuplicate: true,
        mergedIntoRegistrationId: primary.id,
        needsAdminAttention: false,
      },
    });
  });

  return NextResponse.json({ success: true, archived: archiveIds.length, primaryId: primary.id });
}
