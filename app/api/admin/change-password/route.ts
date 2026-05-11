import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminAuditLog, getRequestIp } from "@/lib/admin-audit";
import { validatePasswordStrength } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";
  const confirmPassword = body?.confirmPassword || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ message: "All password fields are required." }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "New password and confirmation must match." }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return NextResponse.json({ message: strengthError }, { status: 400 });
  }

  const adminRecord = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { passwordHash: true, active: true },
  });

  if (!adminRecord?.active) {
    return NextResponse.json({ message: "Your account has been disabled." }, { status: 403 });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, adminRecord.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      forcePasswordChange: false,
    },
  });

  await createAdminAuditLog({
    actorId: admin.id,
    action: "PASSWORD_CHANGED",
    targetUserId: admin.id,
    ipAddress: await getRequestIp(),
  });

  return NextResponse.json({ success: true });
}
