import nodemailer from "nodemailer";

export type ApprovalEmailInput = {
  to: string;
  fullName: string;
  course: string;
  center: string;
};

export type InternalRegistrationEmailInput = {
  to: string;
  recipientName: string;
  registrationId: string;
  fullName: string;
  phone: string;
  email: string;
  course: string;
  category: string;
  level: string;
  center: string;
  status: string;
};

export type ApplicantRegistrationEmailInput = {
  to: string;
  fullName: string;
  course: string;
};

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getMailFrom() {
  return process.env.SMTP_FROM || `MPVTL Registrations <${process.env.SMTP_USER || "info@moaetscandg.org.ng"}>`;
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://register.mpvtl.cloud").replace(/\/$/, "");
}

async function sendMail(input: MailInput) {
  if (!smtpConfigured()) {
    console.log("SMTP not configured. Email content:", {
      from: getMailFrom(),
      ...input,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: getMailFrom(),
    ...input,
  });
}

export async function sendInternalRegistrationEmail(input: InternalRegistrationEmailInput) {
  const subject = `New MPVTL Registration - ${input.course}`;
  const text = `Dear ${input.recipientName},

A new MPVTL short course registration has been submitted.

Applicant: ${input.fullName}
Phone: ${input.phone}
Email: ${input.email}
Course: ${input.course}
Category: ${input.category}
Level: ${input.level}
Center: ${input.center}
Status: ${input.status}

View the applicant profile:
${getAppUrl()}/admin/registrations/${input.registrationId}

MPVTL Registration System`;

  await sendMail({
    to: input.to,
    subject,
    text,
  });
}

export async function sendApplicantRegistrationReceivedEmail(input: ApplicantRegistrationEmailInput) {
  const subject = "MPVTL Registration Received";
  const text = `Dear ${input.fullName},

Thank you for registering for ${input.course} with MPVTL.

Your registration has been received and our team will review it shortly.

An MPVTL representative will contact you with the next steps.

Thank you,
MPVTL Registration Team`;

  await sendMail({
    to: input.to,
    subject,
    text,
  });
}

export async function sendApprovalEmail(input: ApprovalEmailInput) {
  const subject = "MPVTL Registration Approved";
  const text = `Dear ${input.fullName},

Your MPVTL registration for ${input.course} at ${input.center} has been approved.

An MPVTL representative will contact you with the next steps.

Thank you,
MPVTL Registration Team`;

  await sendMail({
    to: input.to,
    subject,
    text,
  });
}
