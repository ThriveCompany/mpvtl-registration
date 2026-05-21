import { NextResponse } from "next/server";
import { getCurrentAdmin, registrationAccessWhere } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized", registrations: [] }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const includeArchived = admin.role === "SUPER_ADMIN" && url.searchParams.get("includeArchived") === "true";
    const registrations = await prisma.registration.findMany({
      where: {
        ...registrationAccessWhere(admin),
        ...(includeArchived ? {} : { archivedAsDuplicate: false }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        course: true,
        center: true,
        status: true,
        createdAt: true,
        wasEdited: true,
        editedAt: true,
        editedAfterDecision: true,
        needsAdminAttention: true,
        archivedAsDuplicate: true,
      },
      take: 200,
    });

    return NextResponse.json({ registrations: Array.isArray(registrations) ? registrations : [] });
  } catch (error) {
    console.error("Could not load admin registrations", error);
    return NextResponse.json(
      { message: "Could not load registrations.", registrations: [] },
      { status: 500 },
    );
  }
}
