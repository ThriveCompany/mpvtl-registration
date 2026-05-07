import type { AdminRole, RegistrationStatus } from "@prisma/client";

export const OFFICIAL_EMAIL_DOMAIN = "@moaetscandg.org.ng";

export const CENTER_OPTIONS = [
  { label: "Sagamu", value: "Sagamu" },
  { label: "Lagos", value: "Lagos" },
  { label: "Ibadan", value: "Ibadan" },
  { label: "Abuja", value: "Abuja" },
  { label: "Atan", value: "Atan" },
  { label: "Beauty", value: "Beauty Therapy Centre" },
] as const;

export const USER_CREATABLE_ROLES = [
  "DIRECTOR",
  "ADMISSION_OFFICIAL",
  "CENTER_MANAGER",
] as const satisfies readonly AdminRole[];

export const FINAL_REGISTRATION_STATUSES = [
  "APPROVED",
  "UNAPPROVED",
  "NEEDS_FURTHER_REVIEW",
] as const satisfies readonly RegistrationStatus[];

export function isOfficialEmail(email: string) {
  return email.trim().toLowerCase().endsWith(OFFICIAL_EMAIL_DOMAIN);
}

export function formatRole(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatCenter(center: string | null | undefined) {
  return CENTER_OPTIONS.find((option) => option.value === center)?.label || center || "";
}

export function formatRegistrationStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function isFinalRegistrationStatus(status: string) {
  return (FINAL_REGISTRATION_STATUSES as readonly string[]).includes(status);
}

export function getRegistrationStatusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "UNAPPROVED" || status === "REJECTED") return "bg-red-50 text-red-700 ring-red-200";
  if (status === "NEEDS_FURTHER_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "VIEWED") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}
