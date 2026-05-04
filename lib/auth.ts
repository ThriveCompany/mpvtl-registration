import type { AdminRole, AdminUser } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const ADMIN_SESSION_COOKIE = "mpvtl_admin_session";

type AdminSessionPayload = {
  adminId: string;
};

export type SafeAdmin = Pick<AdminUser, "id" | "name" | "email" | "role" | "center" | "active">;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }

  return secret || "mpvtl-development-secret";
}

export function signAdminSession(adminId: string) {
  return jwt.sign({ adminId } satisfies AdminSessionPayload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export async function getCurrentAdmin(): Promise<SafeAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AdminSessionPayload;
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        center: true,
        active: true,
      },
    });

    if (!admin?.active) return null;
    return admin;
  } catch {
    return null;
  }
}

export function canViewCenter(admin: SafeAdmin, center: string) {
  if (admin.role === "SUPER_ADMIN" || admin.role === "MARKETING_OFFICIAL") return true;
  return admin.role === "CENTER_MANAGER" && admin.center === center;
}

export function registrationAccessWhere(admin: SafeAdmin) {
  if (admin.role === "CENTER_MANAGER") {
    return { center: admin.center || "__NO_CENTER_ASSIGNED__" };
  }

  return {};
}

export function hasRole(admin: SafeAdmin, roles: AdminRole[]) {
  return roles.includes(admin.role);
}
