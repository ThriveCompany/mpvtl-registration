import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function getUploadRoot() {
  return path.join(process.cwd(), "uploads", "registrations");
}

export function validateEvidenceFile(file: File) {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and PDF files are accepted.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "Each evidence file must be 5MB or smaller.";
  }

  return "";
}

export async function storeEvidenceFile(registrationId: string, file: File) {
  const extension = path.extname(file.name).toLowerCase();
  const fileName = `${randomUUID()}${extension}`;
  const directory = path.join(getUploadRoot(), registrationId);
  const storagePath = path.join(directory, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(directory, { recursive: true });
  await writeFile(storagePath, bytes);

  return {
    fileName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    storagePath,
  };
}
