import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 30;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = normalizeEmail(body?.email);

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const code = createVerificationCode();
  const codeHash = await bcrypt.hash(code, 10);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MINUTES * 60 * 1000);

  try {
    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        verifiedAt: null,
        expiresAt: { gt: now },
        createdAt: { gt: new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (recentCode) {
      const elapsedSeconds = Math.floor((now.getTime() - recentCode.createdAt.getTime()) / 1000);
      const retryAfterSeconds = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      return NextResponse.json(
        {
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    await prisma.emailVerificationCode.updateMany({
      where: {
        email,
        verifiedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        expiresAt: now,
      },
    });

    await prisma.emailVerificationCode.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: "Verification code sent. Check your inbox and spam folder.",
      retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Email verification send failed", error);
    return NextResponse.json(
      { message: "We could not send the verification code right now. Please try again." },
      { status: 500 },
    );
  }
}
