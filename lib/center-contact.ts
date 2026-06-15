const defaultAssistanceMessage = "Hello MPVTL, I need assistance with my short course registration.";

const centerManagerNumbers: Record<string, string> = {
  sagamu: "08107231445",
  lagos: "09024208667",
  ibadan: "08036358220",
  abuja: "8023041736",
  atan: "08036545517",
  beauty: "08067228580",
  "beauty therapy": "08067228580",
  "beauty therapy centre": "08067228580",
  online: "09024208667",
};

function normalizeCenterName(center?: string | null) {
  const value = String(center || "").trim().toLowerCase();
  if (value.includes("beauty")) return "beauty";
  if (value.includes("sagamu")) return "sagamu";
  if (value.includes("lagos")) return "lagos";
  if (value.includes("ibadan")) return "ibadan";
  if (value.includes("abuja")) return "abuja";
  if (value.includes("atan")) return "atan";
  if (value.includes("online")) return "online";
  return value;
}

export function getCenterManagerPhone(center?: string | null) {
  return centerManagerNumbers[normalizeCenterName(center)] || centerManagerNumbers.lagos;
}

export function toWhatsAppNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export function getCenterManagerWhatsAppUrl(center?: string | null, message = defaultAssistanceMessage) {
  const phoneNumber = toWhatsAppNumber(getCenterManagerPhone(center));
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
