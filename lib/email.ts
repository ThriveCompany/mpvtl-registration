import nodemailer from "nodemailer";

export type ApprovalEmailInput = {
  to: string;
  fullName: string;
  course: string;
  center: string;
};

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

export async function sendApprovalEmail(input: ApprovalEmailInput) {
  const subject = "MPVTL Registration Approved";
  const text = `Dear ${input.fullName},

Your registration for ${input.course} at ${input.center} has been approved.

An MPVTL representative will contact you with the next steps.

Thank you,
MPVTL Registration Team`;

  if (!smtpConfigured()) {
    console.log("SMTP not configured. Approval email content:", {
      to: input.to,
      subject,
      text,
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
    from: process.env.SMTP_FROM,
    to: input.to,
    subject,
    text,
  });
}
