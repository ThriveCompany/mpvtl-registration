import { NextResponse } from "next/server";
import type { RegistrationStatus } from "@prisma/client";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { FINAL_REGISTRATION_STATUSES, isFinalRegistrationStatus } from "@/lib/admin-constants";
import { sendApprovalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const allowedStatuses: RegistrationStatus[] = [
  "VIEWED",
  "APPROVED",
  "UNAPPROVED",
  "NEEDS_FURTHER_REVIEW",
  "REJECTED",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: RegistrationStatus; note?: string } | null;
  const nextStatus = body?.status;

  if (!nextStatus || !allowedStatuses.includes(nextStatus)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  try {
    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration || !canViewCenter(admin, registration.center)) {
      return NextResponse.json({ message: "Registration not found.", registration: null }, { status: 404 });
    }

    if (isFinalRegistrationStatus(registration.status)) {
      return NextResponse.json(
        { message: "A final decision has already been submitted for this applicant.", registration },
        { status: 409 },
      );
    }

    const isFinalDecision = (FINAL_REGISTRATION_STATUSES as readonly RegistrationStatus[]).includes(nextStatus);
    const now = new Date();
    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedAt: nextStatus === "APPROVED" ? now : registration.approvedAt,
        approvedById: nextStatus === "APPROVED" ? admin.id : registration.approvedById,
        reviewedAt: isFinalDecision ? now : registration.reviewedAt,
        reviewedById: isFinalDecision ? admin.id : registration.reviewedById,
        reviewedRole: isFinalDecision ? admin.role : registration.reviewedRole,
        reviewNote: isFinalDecision
          ? nextStatus === "NEEDS_FURTHER_REVIEW"
            ? body?.note?.trim() || null
            : null
          : registration.reviewNote,
      },
    });

    if (nextStatus === "APPROVED") {
      try {
        await sendApprovalEmail({
          to: updated.email,
          fullName: updated.fullName,
          course: updated.course,
          center: updated.center,
        });
      } catch (emailError) {
        console.error("Approval email failed", emailError);
      }
    }

    return NextResponse.json({ registration: updated });
  } catch (error) {
    console.error("Could not update registration status", error);
    return NextResponse.json(
      { message: "Could not update registration status.", registration: null },
      { status: 500 },
    );
  }
}
