import { NextResponse } from "next/server";
import { getCurrentAdmin, registrationAccessWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const registrations = await prisma.registration.findMany({
    where: registrationAccessWhere(admin),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      course: true,
      center: true,
      status: true,
      createdAt: true,
    },
    take: 200,
  });

  return NextResponse.json({ registrations });
}
