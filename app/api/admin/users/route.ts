import { NextResponse } from "next/server";
import type { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles: AdminRole[] = ["SUPER_ADMIN", "MARKETING_OFFICIAL", "CENTER_MANAGER"];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden", users: [] }, { status: 403 });
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

  const body = await request.json().catch(() => null) as {
    name?: string;
    email?: string;
    password?: string;
    role?: AdminRole;
    center?: string;
    active?: boolean;
  } | null;

  const name = body?.name?.trim() || "";
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";
  const role = body?.role;
  const center = body?.center?.trim() || null;

  if (!name || !email || !password || !role || !roles.includes(role)) {
    return NextResponse.json({ message: "Name, email, password, and role are required." }, { status: 400 });
  }

  if (role === "CENTER_MANAGER" && !center) {
    return NextResponse.json({ message: "Center is required for center managers." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        center: role === "CENTER_MANAGER" ? center : null,
        active: body?.active ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        center: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: "Could not create user. The email may already exist." }, { status: 400 });
  }
}
