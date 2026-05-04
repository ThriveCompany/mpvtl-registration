import { NextResponse } from "next/server";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized", registration: null }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        files: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!registration || !canViewCenter(admin, registration.center)) {
      return NextResponse.json({ message: "Registration not found.", registration: null }, { status: 404 });
    }

    return NextResponse.json({
      registration: {
        ...registration,
        files: Array.isArray(registration.files) ? registration.files : [],
      },
    });
  } catch (error) {
    console.error("Could not load admin registration", error);
    return NextResponse.json(
      { message: "Could not load registration.", registration: null },
      { status: 500 },
    );
  }
}
