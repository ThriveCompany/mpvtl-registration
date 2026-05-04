import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { canViewCenter, getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId } = await context.params;
    const file = await prisma.registrationFile.findUnique({
      where: { id: fileId },
      include: {
        registration: {
          select: { center: true },
        },
      },
    });

    if (!file || !canViewCenter(admin, file.registration.center)) {
      return NextResponse.json({ message: "File not found." }, { status: 404 });
    }

    const data = await readFile(file.storagePath);

    return new Response(data, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.size),
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (error) {
    console.error("Could not load registration file", error);
    return NextResponse.json({ message: "Stored file is unavailable." }, { status: 404 });
  }
}
