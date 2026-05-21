import { NextResponse } from "next/server";
import type { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminAuditLog, getRequestIp } from "@/lib/admin-audit";
import { CENTER_OPTIONS, formatCenter, formatRole, isOfficialEmail, USER_CREATABLE_ROLES } from "@/lib/admin-constants";
import { verifySuperAdminPassword } from "@/lib/admin-security";
import { sendAdminOnboardingEmail } from "@/lib/email";
import { generateTemporaryPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

const roles: AdminRole[] = [...USER_CREATABLE_ROLES];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden", users: [] }, { status: 403 });
  }
  if (admin.forcePasswordChange) {
    return NextResponse.json({ message: "Please change your password before continuing.", users: [] }, { status: 403 });
  }

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ users: Array.isArray(users) ? users : [] });
  } catch (error) {
    console.error("Could not load admin users", error);
    return NextResponse.json(
      { message: "Could not load users.", users: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (admin.forcePasswordChange) {
    return NextResponse.json({ message: "Please change your password before continuing." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    name?: string;
    email?: string;
    role?: AdminRole;
    center?: string;
    active?: boolean;
    superAdminPassword?: string;
  } | null;

  const name = body?.name?.trim() || "";
  const email = body?.email?.trim().toLowerCase() || "";
  const role = body?.role;
  const center = body?.center?.trim() || null;

  if (!name || !email || !role || !roles.includes(role)) {
    return NextResponse.json({ message: "Name, email, and role are required." }, { status: 400 });
  }

  if (!isOfficialEmail(email)) {
    return NextResponse.json(
      { message: "Official accounts must use an @moaetscandg.org.ng email address." },
      { status: 400 },
    );
  }

  if (role === "CENTER_MANAGER" && !center) {
    return NextResponse.json({ message: "Center is required for center managers." }, { status: 400 });
  }

  if (role === "CENTER_MANAGER" && !CENTER_OPTIONS.some((option) => option.value === center)) {
    return NextResponse.json({ message: "Please choose a valid centre." }, { status: 400 });
  }

  if (role === "SUPER_ADMIN" && !await verifySuperAdminPassword(admin, body?.superAdminPassword || "")) {
    return NextResponse.json({ message: "Security confirmation failed. Super Admin creation requires your password." }, { status: 403 });
  }

  try {
    if (role === "CENTER_MANAGER") {
      const existingManager = await prisma.adminUser.findFirst({
        where: {
          role: "CENTER_MANAGER",
          center,
          active: true,
        },
        select: { id: true },
      });

      if (existingManager) {
        return NextResponse.json(
          { message: "This center already has an active center manager." },
          { status: 400 },
        );
      }
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        center: role === "CENTER_MANAGER" ? center : null,
        active: body?.active ?? true,
        forcePasswordChange: true,
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
      action: "ACCOUNT_CREATED",
      targetUserId: user.id,
      ipAddress: await getRequestIp(),
    });

    let emailWarning = false;
    try {
      await sendAdminOnboardingEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        temporaryPassword,
        role: formatRole(user.role),
        center: user.center ? formatCenter(user.center) : null,
        loginUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "https://register.mpvtl.cloud").replace(/\/$/, "")}/admin/login`,
      });
    } catch (error) {
      emailWarning = true;
      console.error("Could not send admin onboarding email", error);
    }

    return NextResponse.json({ user, emailWarning });
  } catch {
    return NextResponse.json({ message: "Could not create user. The email may already exist." }, { status: 400 });
  }
}
