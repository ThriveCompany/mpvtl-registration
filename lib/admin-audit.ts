import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getRequestIp() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "";
}

export async function createAdminAuditLog({
  actorId,
  action,
  targetUserId,
  ipAddress,
}: {
  actorId?: string | null;
  action: string;
  targetUserId?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: actorId || null,
        action,
        targetUserId: targetUserId || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Could not write admin audit log", error);
  }
}
