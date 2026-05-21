import { NextResponse } from "next/server";
import type { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminAuditLog, getRequestIp } from "@/lib/admin-audit";
import { CENTER_OPTIONS, formatCenter, formatRole, USER_CREATABLE_ROLES } from "@/lib/admin-constants";
import { verifySuperAdminPassword } from "@/lib/admin-security";
import { sendAdminPasswordResetEmail } from "@/lib/email";
import { generateTemporaryPassword, validatePasswordStrength } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const roles: AdminRole[] = [...USER_CREATABLE_ROLES];

function loginUrl() {
  return `${(process.env.NEXT_PUBLIC_APP_URL || "https://register.mpvtl.cloud").replace(/\/$/, "")}/admin/login`;
}

async function getTargetUser(id: string) {
  return prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      center: true,
      active: true,
    },
  });
}

async function emailTemporaryPassword(user: NonNullable<Awaited<ReturnType<typeof getTargetUser>>>, temporaryPassword: string) {
  await sendAdminPasswordResetEmail({
    to: user.email,
    name: user.name,
    email: user.email,
    temporaryPassword,
    role: formatRole(user.role),
    center: user.center ? formatCenter(user.center) : null,
    loginUrl: loginUrl(),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (admin.forcePasswordChange) {
    return NextResponse.json({ message: "Please change your password before continuing." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    action?: string;
    active?: boolean;
    center?: string | null;
    newPassword?: string;
    role?: AdminRole;
    superAdminPassword?: string;
  } | null;

  if (!await verifySuperAdminPassword(admin, body?.superAdminPassword || "")) {
    return NextResponse.json({ message: "Security confirmation failed." }, { status: 403 });
  }

  const targetUser = await getTargetUser(id);
  if (!targetUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const ipAddress = await getRequestIp();

  if (body?.action === "set-password" || body?.action === "generate-password") {
    const temporaryPassword = body.action === "generate-password"
      ? generateTemporaryPassword()
      : body.newPassword || "";

    const strengthError = validatePasswordStrength(temporaryPassword);
    if (strengthError) {
      return NextResponse.json({ message: strengthError }, { status: 400 });
    }

    await prisma.adminUser.update({
      where: { id: targetUser.id },
      data: {
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        forcePasswordChange: true,
      },
    });

    let emailWarning = false;
    try {
      await emailTemporaryPassword(targetUser, temporaryPassword);
    } catch (error) {
      emailWarning = true;
      console.error("Could not send admin password reset email", error);
    }

    await createAdminAuditLog({
      actorId: admin.id,
      action: body.action === "generate-password" ? "TEMPORARY_PASSWORD_GENERATED" : "PASSWORD_RESET",
      targetUserId: targetUser.id,
      ipAddress,
    });

    return NextResponse.json({ success: true, emailWarning });
  }

  if (body?.action === "set-active") {
    if (targetUser.id === admin.id && body.active === false) {
      return NextResponse.json({ message: "You cannot disable your own account." }, { status: 400 });
    }

    const user = await prisma.adminUser.update({
      where: { id: targetUser.id },
      data: { active: body.active === true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        center: true,
        active: true,
        forcePasswordChange: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await createAdminAuditLog({
      actorId: admin.id,
      action: user.active ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DISABLED",
      targetUserId: targetUser.id,
      ipAddress,
    });

    return NextResponse.json({ user });
  }

  if (body?.action === "update-role") {
    if (targetUser.id === admin.id) {
      return NextResponse.json({ message: "You cannot change your own role." }, { status: 400 });
    }

    const role = body.role;
    const center = body.center?.trim() || null;

    if (!role || !roles.includes(role)) {
      return NextResponse.json({ message: "Please choose a valid role." }, { status: 400 });
    }

    if (role === "CENTER_MANAGER" && !center) {
      return NextResponse.json({ message: "Center is required for center managers." }, { status: 400 });
    }

    if (role === "CENTER_MANAGER" && !CENTER_OPTIONS.some((option) => option.value === center)) {
      return NextResponse.json({ message: "Please choose a valid centre." }, { status: 400 });
    }

    if (role === "CENTER_MANAGER") {
      const existingManager = await prisma.adminUser.findFirst({
        where: {
          id: { not: targetUser.id },
          role: "CENTER_MANAGER",
          center,
          active: true,
        },
        select: { id: true },
      });

      if (existingManager) {
        return NextResponse.json({ message: "This center already has an active center manager." }, { status: 400 });
      }
    }

    const user = await prisma.adminUser.update({
      where: { id: targetUser.id },
      data: {
        role,
        center: role === "CENTER_MANAGER" ? center : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        center: true,
        active: true,
        forcePasswordChange: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await createAdminAuditLog({
      actorId: admin.id,
      action: "ROLE_CHANGED",
      targetUserId: targetUser.id,
      ipAddress,
    });

    return NextResponse.json({ user });
  }

  return NextResponse.json({ message: "Unsupported user action." }, { status: 400 });
}
