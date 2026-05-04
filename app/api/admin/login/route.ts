import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin?.active || !(await bcrypt.compare(password, admin.passwordHash))) {
      return NextResponse.json({ message: "Invalid login details." }, { status: 401 });
    }

    const response = NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        center: admin.center,
      },
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: signAdminSession(admin.id),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ message: "Login is temporarily unavailable." }, { status: 500 });
  }
}
