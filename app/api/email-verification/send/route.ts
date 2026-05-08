import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRY_MINUTES = 10;

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
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  try {
    await prisma.emailVerificationCode.updateMany({
      where: {
        email,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
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
      message: "If the email address is valid, a verification code has been sent.",
    });
  } catch (error) {
    console.error("Email verification send failed", error);
    return NextResponse.json(
      { message: "We could not send the verification code right now. Please try again." },
      { status: 500 },
    );
  }
}
