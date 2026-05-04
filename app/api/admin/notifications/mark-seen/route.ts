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

export async function PATCH() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized", success: false }, { status: 401 });
  }

  try {
    await prisma.registrationNotification.updateMany({
      where: notificationWhere(admin),
      data: { seen: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not mark notifications as seen", error);
    return NextResponse.json(
      { message: "Could not update notifications.", success: false },
      { status: 500 },
    );
  }
}
