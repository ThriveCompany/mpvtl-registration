import { randomInt } from "crypto";

const temporaryPasswordWords = [
  "Access",
  "Portal",
  "Secure",
  "Review",
  "Verify",
  "Centre",
  "Course",
  "Entry",
];

export function generateTemporaryPassword() {
  const number = randomInt(1000, 10000);
  const word = temporaryPasswordWords[randomInt(0, temporaryPasswordWords.length)];
  return `MPVTL-${number}-${word}`;
}

export function validatePasswordStrength(password: string) {
  const value = password || "";

  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(value)) return "Password must include at least one number.";

  return "";
}
