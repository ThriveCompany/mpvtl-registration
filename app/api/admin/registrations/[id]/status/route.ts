import { NextResponse } from "next/server";
import type { RegistrationStatus } from "@prisma/client";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { sendApprovalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const allowedStatuses: RegistrationStatus[] = ["VIEWED", "APPROVED", "REJECTED", "CONTACTED"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: RegistrationStatus } | null;
  const nextStatus = body?.status;

  if (!nextStatus || !allowedStatuses.includes(nextStatus)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  try {
    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration || !canViewCenter(admin, registration.center)) {
      return NextResponse.json({ message: "Registration not found.", registration: null }, { status: 404 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedAt: nextStatus === "APPROVED" ? new Date() : registration.approvedAt,
        approvedById: nextStatus === "APPROVED" ? admin.id : registration.approvedById,
      },
    });

    if (nextStatus === "APPROVED") {
      await sendApprovalEmail({
        to: updated.email,
        fullName: updated.fullName,
        course: updated.course,
        center: updated.center,
      });
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
