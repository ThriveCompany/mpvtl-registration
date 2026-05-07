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
