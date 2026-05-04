import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function notificationWhere(admin: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>) {
  if (admin.role === "SUPER_ADMIN") {
    return { seen: false };
  }

  if (admin.role === "MARKETING_OFFICIAL") {
    return { seen: false, targetRole: "MARKETING_OFFICIAL" as const };
  }

  return {
    seen: false,
    targetRole: "CENTER_MANAGER" as const,
    targetCenter: admin.center || "__NO_CENTER_ASSIGNED__",
  };
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.registrationNotification.findMany({
    where: notificationWhere(admin),
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      registration: {
        select: {
          id: true,
          fullName: true,
          course: true,
          center: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    count: notifications.length,
    notifications,
  });
}
