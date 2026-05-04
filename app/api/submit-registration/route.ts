import { NextResponse } from "next/server";

export const runtime = "nodejs";

const verificationAnswerKeys = [
  "priorExposure",
  "completedBasicCourse",
  "experienceDescription",
  "availableForScreening",
  "canReadAndWrite",
  "newToField",
  "reasonForCourse",
  "availableForPracticalTraining",
  "priorTraining",
  "hasPreviousCertificate",
  "practicalExperience",
  "availableForAssessment",
] as const;

type VerificationAnswerKey = (typeof verificationAnswerKeys)[number];
type StableVerificationAnswers = Record<VerificationAnswerKey, string>;

type RegistrationPayload = {
  course?: {
    id?: string;
    name?: string;
    category?: string;
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
  verificationAnswers?: Partial<Record<VerificationAnswerKey, string>>;
  priorExposure?: string;
  completedBasicCourse?: string;
  experienceDescription?: string;
  availableForScreening?: string;
  canReadAndWrite?: string;
  newToField?: string;
  reasonForCourse?: string;
  availableForPracticalTraining?: string;
  priorTraining?: string;
  hasPreviousCertificate?: string;
  practicalExperience?: string;
  availableForAssessment?: string;
  uploads?: UploadedFilePayload[];
  uploadedFileName?: string;
  uploadedFileType?: string;
  uploadedFileBase64?: string;
  basicDeclaration?: string;
  receiveUpdates?: boolean;
  finalAction?: string;
};

type UploadedFilePayload = {
  field?: string;
  uploadedFileName?: string;
  uploadedFileType?: string;
  uploadedFileBase64?: string;
  uploadedFileSize?: number;
};

function isRegistrationPayload(value: unknown): value is RegistrationPayload {
  return typeof value === "object" && value !== null;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function readAnswer(source: unknown, key: VerificationAnswerKey) {
  if (typeof source !== "object" || source === null) return "";
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function getStableVerificationAnswers(payload: RegistrationPayload): StableVerificationAnswers {
  const nestedAnswers = payload.verificationAnswers || payload.verification || {};

  return {
    priorExposure: payload.priorExposure?.trim() || readAnswer(nestedAnswers, "priorExposure"),
    completedBasicCourse: payload.completedBasicCourse?.trim() || readAnswer(nestedAnswers, "completedBasicCourse"),
    experienceDescription: payload.experienceDescription?.trim() || readAnswer(nestedAnswers, "experienceDescription"),
    availableForScreening: payload.availableForScreening?.trim() || readAnswer(nestedAnswers, "availableForScreening"),
    canReadAndWrite: payload.canReadAndWrite?.trim() || readAnswer(nestedAnswers, "canReadAndWrite"),
    newToField: payload.newToField?.trim() || readAnswer(nestedAnswers, "newToField"),
    reasonForCourse: payload.reasonForCourse?.trim() || readAnswer(nestedAnswers, "reasonForCourse"),
    availableForPracticalTraining: payload.availableForPracticalTraining?.trim() || readAnswer(nestedAnswers, "availableForPracticalTraining"),
    priorTraining: payload.priorTraining?.trim() || readAnswer(nestedAnswers, "priorTraining"),
    hasPreviousCertificate: payload.hasPreviousCertificate?.trim() || readAnswer(nestedAnswers, "hasPreviousCertificate"),
    practicalExperience: payload.practicalExperience?.trim() || readAnswer(nestedAnswers, "practicalExperience"),
    availableForAssessment: payload.availableForAssessment?.trim() || readAnswer(nestedAnswers, "availableForAssessment"),
  };
}

function getPrimaryUpload(payload: RegistrationPayload): UploadedFilePayload {
  return payload.uploads?.[0] ?? {
    uploadedFileName: payload.uploadedFileName,
    uploadedFileType: payload.uploadedFileType,
    uploadedFileBase64: payload.uploadedFileBase64,
  };
}

function validateRegistration(payload: RegistrationPayload) {
  const verificationAnswers = getStableVerificationAnswers(payload);

  if (!hasText(payload.course?.name)) return "Course is required.";
  if (!hasText(payload.course?.level)) return "Course level is required.";
  if (!hasText(payload.location?.name)) return "Centre or mode is required.";
  if (!hasText(payload.applicant?.fullName)) return "Full name is required.";
  if (!hasText(payload.applicant?.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.applicant?.email ?? "")) {
    return "A valid email address is required.";
  }
  if (!hasText(payload.applicant?.phone)) return "Phone number is required.";
  if (!hasText(payload.applicant?.hostel)) return "Hostel preference is required.";
  if (payload.course?.level === "Basic" && ![
    verificationAnswers.canReadAndWrite,
    verificationAnswers.newToField,
    verificationAnswers.reasonForCourse,
    verificationAnswers.availableForPracticalTraining,
  ].every(hasText)) {
    return "Verification answers are required.";
  }
  if (payload.course?.level === "Intermediate" && ![
    verificationAnswers.priorExposure,
    verificationAnswers.completedBasicCourse,
    verificationAnswers.experienceDescription,
    verificationAnswers.availableForScreening,
  ].every(hasText)) {
    return "Verification answers are required.";
  }
  if (payload.course?.level === "Advanced" && ![
    verificationAnswers.priorTraining,
    verificationAnswers.hasPreviousCertificate,
    verificationAnswers.practicalExperience,
    verificationAnswers.availableForAssessment,
  ].every(hasText)) {
    return "Verification answers are required.";
  }
  if (payload.course?.level === "Basic" && !hasText(payload.basicDeclaration)) {
    return "Applicant declaration is required.";
  }
  if (!hasText(payload.finalAction)) return "Final action is required.";
  if (payload.course?.level && payload.course.level !== "Basic" && !hasText(getPrimaryUpload(payload).uploadedFileBase64)) {
    return "Supporting upload is required.";
  }
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

  const webhookUrl =
    process.env.MAKE_WEBHOOK_URL ||
    process.env.POWER_AUTOMATE_WEBHOOK_URL ||
    "https://hook.eu1.make.com/cpyp3ci3c99mak45tayhle1u6yy4dca1";

  if (!webhookUrl) {
    return NextResponse.json(
      { message: "Submission service is not configured yet. Please contact MPVTL support." },
      { status: 500 },
    );
  }

  const primaryUpload = getPrimaryUpload(payload);
  const verificationAnswers = getStableVerificationAnswers(payload);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname: payload.applicant?.fullName || "",
        email: payload.applicant?.email || "",
        phone: payload.applicant?.phone || "",
        course: payload.course?.name || "",
        category: payload.course?.category || "",
        level: payload.course?.level || "",
        location: payload.location?.name || payload.location?.id || "",
        hostel: payload.applicant?.hostel === "Yes" ? "Yes" : "No",
        action: payload.finalAction || "Submit Registration",
        receiveUpdates: payload.receiveUpdates ?? true,
        uploadedFileName: primaryUpload.uploadedFileName || "",
        uploadedFileType: primaryUpload.uploadedFileType || "",
        uploadedFileBase64: primaryUpload.uploadedFileBase64 || "",
        verificationAnswers,
        ...verificationAnswers,
        uploadedFiles: payload.uploads || [],
        basicDeclaration: payload.basicDeclaration || "",
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "MPVTL could not receive the registration right now. Please try again." },
        { status: 502 },
      );
    }

    // Future phase: attach secure upload storage and operational follow-up here.
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Network issue while submitting. Please try again." },
      { status: 502 },
    );
  }
}
