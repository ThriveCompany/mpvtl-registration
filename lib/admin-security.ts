import bcrypt from "bcryptjs";
import type { SafeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function verifySuperAdminPassword(admin: SafeAdmin, password: string) {
  if (admin.role !== "SUPER_ADMIN") return false;
  if (!password) return false;

  const superAdmin = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: {
      passwordHash: true,
      role: true,
      active: true,
    },
  });

  if (!superAdmin?.active || superAdmin.role !== "SUPER_ADMIN") return false;

  return bcrypt.compare(password, superAdmin.passwordHash);
}
