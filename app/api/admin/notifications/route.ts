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
    return NextResponse.json({ message: "Unauthorized", count: 0, notifications: [] }, { status: 401 });
  }

  try {
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

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    return NextResponse.json({
      count: safeNotifications.length,
      notifications: safeNotifications,
    });
  } catch (error) {
    console.error("Could not load notifications", error);
    return NextResponse.json(
      { message: "Could not load notifications.", count: 0, notifications: [] },
      { status: 500 },
    );
  }
}
