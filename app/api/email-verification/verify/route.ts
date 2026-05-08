import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; code?: unknown } | null;
  const email = normalizeEmail(body?.email);
  const code = normalizeCode(body?.code);

  if (!EMAIL_REGEX.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Enter the 6-digit verification code sent to your email." }, { status: 400 });
  }

  try {
    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() },
        verifiedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json({ message: "The verification code is invalid or has expired." }, { status: 400 });
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ message: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    const codeMatches = await bcrypt.compare(code, verification.codeHash);
    if (!codeMatches) {
      await prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json({ message: "The verification code is incorrect." }, { status: 400 });
    }

    const updated = await prisma.emailVerificationCode.update({
      where: { id: verification.id },
      data: {
        verifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      verificationId: updated.id,
      email: updated.email,
      message: "Email verified.",
    });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json(
      { message: "We could not verify the code right now. Please try again." },
      { status: 500 },
    );
  }
}
