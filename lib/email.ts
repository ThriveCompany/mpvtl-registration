import nodemailer from "nodemailer";
import { getCenterManagerWhatsAppUrl } from "@/lib/center-contact";

export type ApprovalEmailInput = {
  to: string;
  fullName: string;
  course: string;
  center: string;
};

export type DecisionEmailInput = ApprovalEmailInput & {
  reviewReason: string;
  reviewReasonOther?: string | null;
};

export type RevisedDecisionEmailInput = DecisionEmailInput & {
  decisionLabel: string;
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
  center: string;
  level: string;
};

export type AdminAccessEmailInput = {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
  role: string;
  center?: string | null;
  loginUrl: string;
};

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type MailInput = RenderedEmail & {
  to: string;
};

type SmtpLikeError = {
  response?: unknown;
  responseCode?: unknown;
  code?: unknown;
};

const brand = {
  red: "#8f1d2c",
  redDark: "#6f1421",
  navy: "#061321",
  charcoal: "#1f2937",
  muted: "#64748b",
  background: "#f3f6fa",
  border: "#dbe3ee",
  softRed: "#fff1f3",
};

export function isSmtpConfigured() {
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

function isHighProbabilitySpamError(error: unknown) {
  const smtpError = error as SmtpLikeError;
  return (
    smtpError?.responseCode === 550 &&
    String(smtpError?.response || "").toLowerCase().includes("high-probability spam")
  );
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInfoRows(rows: Array<[string, string | number | null | undefined]>) {
  return rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 0;color:${brand.muted};font-size:13px;border-bottom:1px solid ${brand.border};">${escapeHtml(label)}</td>
        <td style="padding:10px 0;color:${brand.navy};font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid ${brand.border};">${escapeHtml(value)}</td>
      </tr>
    `)
    .join("");
}

function renderButton(label: string, href: string) {
  return `
    <div style="margin-top:24px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:${brand.red};color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:13px 20px;border-radius:14px;">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

export function renderBaseEmailTemplate({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${brand.background};font-family:Arial,Helvetica,sans-serif;color:${brand.charcoal};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.background};padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid ${brand.border};box-shadow:0 18px 60px rgba(6,19,33,0.08);">
            <tr>
              <td style="height:8px;background:${brand.red};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:26px 28px 18px;background:${brand.navy};">
                <div style="font-size:12px;line-height:18px;font-weight:800;letter-spacing:0.18em;color:#fecdd3;text-transform:uppercase;">MPVTL</div>
                <div style="margin-top:7px;font-size:20px;line-height:28px;font-weight:800;color:#ffffff;">MPVTL Registration System</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 28px;">
                <h1 style="margin:0 0 18px;color:${brand.navy};font-size:24px;line-height:32px;font-weight:800;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid ${brand.border};">
                <p style="margin:0;color:${brand.navy};font-size:13px;line-height:22px;font-weight:800;">MPVTL Registration Team</p>
                <p style="margin:3px 0 0;color:${brand.muted};font-size:12px;line-height:20px;">MOA Professional Vocational Training Limited</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function highlightBox(content: string) {
  return `
    <div style="margin:22px 0;padding:18px 20px;border-radius:18px;background:${brand.softRed};border:1px solid #fecdd3;color:${brand.navy};">
      ${content}
    </div>
  `;
}

export function renderVerificationEmail(code: string): RenderedEmail {
  const subject = "MPVTL Email Verification Code";
  const html = renderBaseEmailTemplate({
    title: "Verify Your Email Address",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Use the code below to verify your email address and continue your MPVTL short course registration.
      </p>
      ${highlightBox(`<div style="font-size:32px;letter-spacing:0.28em;font-weight:900;text-align:center;color:${brand.redDark};">${escapeHtml(code)}</div>`)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">This code expires in 10 minutes.</p>
      <p style="margin:10px 0 0;color:${brand.muted};font-size:13px;line-height:22px;">If you did not request this, please ignore this email.</p>
    `,
  });
  const text = `Dear Applicant,

Your MPVTL registration verification code is:

${code}

This code expires in 10 minutes.

If you did not request this, please ignore this email.

MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderAdminOnboardingEmail(input: AdminAccessEmailInput): RenderedEmail {
  const subject = "Your MPVTL Admin Account";
  const html = renderBaseEmailTemplate({
    title: "Admin Account Created",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.name)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Your MPVTL admin account has been created. Use the temporary password below to sign in, then change your password immediately.
      </p>
      ${highlightBox(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${renderInfoRows([
            ["Email", input.email],
            ["Temporary password", input.temporaryPassword],
            ["Role", input.role],
            ["Centre", input.center || "Not assigned"],
          ])}
        </table>
      `)}
      ${renderButton("Sign In to MPVTL Admin", input.loginUrl)}
      <p style="margin:20px 0 0;color:${brand.muted};font-size:13px;line-height:22px;">
        For security, this password must be changed after your first login.
      </p>
    `,
  });
  const text = `Dear ${input.name},

Your MPVTL admin account has been created.

Email: ${input.email}
Temporary password: ${input.temporaryPassword}
Role: ${input.role}
Centre: ${input.center || "Not assigned"}

Login URL:
${input.loginUrl}

Please change your password immediately after signing in.

MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderAdminPasswordResetEmail(input: AdminAccessEmailInput): RenderedEmail {
  const subject = "MPVTL Admin Password Reset";
  const html = renderBaseEmailTemplate({
    title: "Admin Password Reset",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.name)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Your MPVTL admin password has been reset. Use this temporary password to sign in, then create a new password immediately.
      </p>
      ${highlightBox(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${renderInfoRows([
            ["Email", input.email],
            ["Temporary password", input.temporaryPassword],
            ["Role", input.role],
            ["Centre", input.center || "Not assigned"],
          ])}
        </table>
      `)}
      ${renderButton("Sign In to MPVTL Admin", input.loginUrl)}
      <p style="margin:20px 0 0;color:${brand.muted};font-size:13px;line-height:22px;">
        If you did not expect this reset, contact the MPVTL system administrator immediately.
      </p>
    `,
  });
  const text = `Dear ${input.name},

Your MPVTL admin password has been reset.

Email: ${input.email}
Temporary password: ${input.temporaryPassword}
Role: ${input.role}
Centre: ${input.center || "Not assigned"}

Login URL:
${input.loginUrl}

Please change your password immediately after signing in.

MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderRegistrationReceivedEmail(input: ApplicantRegistrationEmailInput): RenderedEmail {
  const subject = "MPVTL Registration Received";
  const html = renderBaseEmailTemplate({
    title: "Registration Received",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.fullName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Thank you for registering for ${escapeHtml(input.course)} with MPVTL.
      </p>
      ${highlightBox(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${renderInfoRows([
            ["Course", input.course],
            ["Centre", input.center],
            ["Level", input.level],
          ])}
        </table>
      `)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">
        Our team will review your registration and contact you with the next steps.
      </p>
    `,
  });
  const text = `Dear ${input.fullName},

Thank you for registering for ${input.course} with MPVTL.

Course: ${input.course}
Centre: ${input.center}
Level: ${input.level}

Our team will review your registration and contact you with the next steps.

Thank you,
MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderNewRegistrationNotificationEmail(input: InternalRegistrationEmailInput): RenderedEmail {
  const profileUrl = `${getAppUrl()}/admin/registrations/${input.registrationId}`;
  const subject = `New MPVTL Registration - ${input.course}`;
  const html = renderBaseEmailTemplate({
    title: "New Registration Submitted",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.recipientName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        A new MPVTL short course registration has been submitted.
      </p>
      ${highlightBox(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${renderInfoRows([
            ["Name", input.fullName],
            ["Phone", input.phone],
            ["Email", input.email],
            ["Course", input.course],
            ["Category", input.category],
            ["Level", input.level],
            ["Centre", input.center],
            ["Status", input.status],
          ])}
        </table>
      `)}
      ${renderButton("View Applicant Profile", profileUrl)}
    `,
  });
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
${profileUrl}

MPVTL Registration System`;

  return { subject, html, text };
}

export function renderApprovalEmail(input: ApprovalEmailInput): RenderedEmail {
  const subject = "MPVTL Registration Approved";
  const html = renderBaseEmailTemplate({
    title: "Registration Approved",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.fullName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Your MPVTL registration for ${escapeHtml(input.course)} at ${escapeHtml(input.center)} has been approved.
      </p>
      ${highlightBox(`<div style="font-size:18px;line-height:26px;font-weight:900;color:${brand.navy};text-align:center;">Approved</div>`)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">
        An MPVTL representative will contact you with the next steps.
      </p>
    `,
  });
  const text = `Dear ${input.fullName},

Your MPVTL registration for ${input.course} at ${input.center} has been approved.

An MPVTL representative will contact you with the next steps.

Thank you,
MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderUnapprovalEmail(input: DecisionEmailInput): RenderedEmail {
  const subject = "MPVTL Registration Update";
  const additionalReason = input.reviewReasonOther ? `<p style="margin:8px 0 0;color:${brand.charcoal};font-size:14px;line-height:24px;">${escapeHtml(input.reviewReasonOther)}</p>` : "";
  const contactUrl = getCenterManagerWhatsAppUrl(
    input.center,
    `Hello MPVTL, I received a registration update for ${input.course} at ${input.center} and I need guidance.`,
  );
  const html = renderBaseEmailTemplate({
    title: "Registration Update",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.fullName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Thank you for your interest in ${escapeHtml(input.course)} at MPVTL.
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        After reviewing your registration, we are unable to approve it at this stage.
      </p>
      ${highlightBox(`<p style="margin:0;color:${brand.muted};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">Reason</p><p style="margin:8px 0 0;color:${brand.navy};font-size:15px;line-height:24px;font-weight:800;">${escapeHtml(input.reviewReason)}</p>${additionalReason}`)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">
        You may contact MPVTL for further guidance.
      </p>
      ${renderButton("Contact Centre Manager", contactUrl)}
    `,
  });
  const text = `Dear ${input.fullName},

Thank you for your interest in ${input.course} at MPVTL.

After reviewing your registration, we are unable to approve it at this stage.

Reason:
${input.reviewReason}
${input.reviewReasonOther || ""}

You may contact MPVTL for further guidance.

Contact Centre Manager:
${contactUrl}

Thank you,
MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderFurtherReviewEmail(input: DecisionEmailInput): RenderedEmail {
  const subject = "MPVTL Registration Requires Further Review";
  const additionalReason = input.reviewReasonOther ? `<p style="margin:8px 0 0;color:${brand.charcoal};font-size:14px;line-height:24px;">${escapeHtml(input.reviewReasonOther)}</p>` : "";
  const contactUrl = getCenterManagerWhatsAppUrl(
    input.center,
    `Hello MPVTL, my registration for ${input.course} at ${input.center} requires further review. Please assist me.`,
  );
  const html = renderBaseEmailTemplate({
    title: "Further Review Required",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.fullName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Your registration for ${escapeHtml(input.course)} requires further review before a final decision can be made.
      </p>
      ${highlightBox(`<p style="margin:0;color:${brand.muted};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">Reason</p><p style="margin:8px 0 0;color:${brand.navy};font-size:15px;line-height:24px;font-weight:800;">${escapeHtml(input.reviewReason)}</p>${additionalReason}`)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">
        An MPVTL representative may contact you for clarification or additional information.
      </p>
      ${renderButton("Contact Centre Manager", contactUrl)}
    `,
  });
  const text = `Dear ${input.fullName},

Your registration for ${input.course} at MPVTL requires further review before a final decision can be made.

Reason:
${input.reviewReason}
${input.reviewReasonOther || ""}

An MPVTL representative may contact you for clarification or additional information.

Contact Centre Manager:
${contactUrl}

Thank you,
MPVTL Registration Team`;

  return { subject, html, text };
}

export function renderRevisedDecisionEmail(input: RevisedDecisionEmailInput): RenderedEmail {
  const subject = "MPVTL Updated Response Reviewed";
  const additionalReason = input.reviewReasonOther ? `<p style="margin:8px 0 0;color:${brand.charcoal};font-size:14px;line-height:24px;">${escapeHtml(input.reviewReasonOther)}</p>` : "";
  const contactUrl = getCenterManagerWhatsAppUrl(
    input.center,
    `Hello MPVTL, my updated response for ${input.course} at ${input.center} has been reviewed. Please assist me with next steps.`,
  );
  const html = renderBaseEmailTemplate({
    title: "Updated Response Reviewed",
    body: `
      <p style="margin:0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Dear ${escapeHtml(input.fullName)},
      </p>
      <p style="margin:12px 0 0;color:${brand.charcoal};font-size:15px;line-height:26px;">
        Your updated response for ${escapeHtml(input.course)} at MPVTL has been reviewed.
      </p>
      ${highlightBox(`
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${renderInfoRows([
            ["Current decision", input.decisionLabel],
            ["Course", input.course],
            ["Centre", input.center],
            ["Reason", input.reviewReason],
          ])}
        </table>
        ${additionalReason}
      `)}
      <p style="margin:0;color:${brand.charcoal};font-size:14px;line-height:24px;">
        An MPVTL representative will contact you if any further action is required.
      </p>
      ${renderButton("Contact Centre Manager", contactUrl)}
    `,
  });
  const text = `Dear ${input.fullName},

Your updated response for ${input.course} at MPVTL has been reviewed.

Current decision: ${input.decisionLabel}
Course: ${input.course}
Centre: ${input.center}
Reason: ${input.reviewReason}
${input.reviewReasonOther || ""}

An MPVTL representative will contact you if any further action is required.

Contact Centre Manager:
${contactUrl}

Thank you,
MPVTL Registration Team`;

  return { subject, html, text };
}

async function sendMail(input: MailInput) {
  if (!isSmtpConfigured()) {
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

  const from = getMailFrom();

  try {
    await transporter.sendMail({
      from,
      ...input,
    });
  } catch (error) {
    if (!isHighProbabilitySpamError(error)) throw error;

    console.warn("SMTP rejected HTML email as high-probability spam. Retrying with plain text.", {
      to: input.to,
      subject: input.subject,
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  await sendMail({
    to,
    ...renderVerificationEmail(code),
  });
}

export async function sendAdminOnboardingEmail(input: AdminAccessEmailInput) {
  await sendMail({
    to: input.to,
    ...renderAdminOnboardingEmail(input),
  });
}

export async function sendAdminPasswordResetEmail(input: AdminAccessEmailInput) {
  await sendMail({
    to: input.to,
    ...renderAdminPasswordResetEmail(input),
  });
}

export async function sendInternalRegistrationEmail(input: InternalRegistrationEmailInput) {
  await sendMail({
    to: input.to,
    ...renderNewRegistrationNotificationEmail(input),
  });
}

export async function sendApplicantRegistrationReceivedEmail(input: ApplicantRegistrationEmailInput) {
  await sendMail({
    to: input.to,
    ...renderRegistrationReceivedEmail(input),
  });
}

export async function sendApprovalEmail(input: ApprovalEmailInput) {
  await sendMail({
    to: input.to,
    ...renderApprovalEmail(input),
  });
}

export async function sendUnapprovalEmail(input: DecisionEmailInput) {
  await sendMail({
    to: input.to,
    ...renderUnapprovalEmail(input),
  });
}

export async function sendFurtherReviewEmail(input: DecisionEmailInput) {
  await sendMail({
    to: input.to,
    ...renderFurtherReviewEmail(input),
  });
}

export async function sendRevisedDecisionEmail(input: RevisedDecisionEmailInput) {
  await sendMail({
    to: input.to,
    ...renderRevisedDecisionEmail(input),
  });
}
