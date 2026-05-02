import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RegistrationPayload = {
  course?: {
    id?: string;
    name?: string;
    level?: string;
  };
  location?: {
    id?: string;
    name?: string;
  };
  applicant?: {
    fullName?: string;
    email?: string;
    phone?: string;
    hostel?: string;
  };
  verification?: Record<string, string>;
  basicDeclaration?: string;
  receiveUpdates?: boolean;
  finalAction?: string;
};

function isRegistrationPayload(value: unknown): value is RegistrationPayload {
  return typeof value === "object" && value !== null;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRegistration(payload: RegistrationPayload) {
  if (!hasText(payload.course?.name)) return "Course is required.";
  if (!hasText(payload.location?.name)) return "Centre or mode is required.";
  if (!hasText(payload.applicant?.fullName)) return "Full name is required.";
  if (!hasText(payload.applicant?.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.applicant?.email ?? "")) {
    return "A valid email address is required.";
  }
  if (!hasText(payload.applicant?.phone)) return "Phone number is required.";
  if (!hasText(payload.applicant?.hostel)) return "Hostel preference is required.";
  if (!payload.verification || Object.keys(payload.verification).length === 0) {
    return "Verification answers are required.";
  }
  if (payload.course?.level === "Basic" && !hasText(payload.basicDeclaration)) {
    return "Applicant declaration is required.";
  }
  if (!hasText(payload.finalAction)) return "Final action is required.";
  return "";
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid registration data." }, { status: 400 });
  }

  if (!isRegistrationPayload(payload)) {
    return NextResponse.json({ message: "Invalid registration data." }, { status: 400 });
  }

  const validationError = validateRegistration(payload);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { message: "Submission service is not configured yet. Please contact MPVTL support." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "MPVTL could not receive the registration right now. Please try again." },
        { status: 502 },
      );
    }

    // Future phase: attach secure upload storage and payment confirmation here.
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Network issue while submitting. Please try again." },
      { status: 502 },
    );
  }
}
