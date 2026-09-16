import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Dev/local implementation: writes into public/uploads so Next.js serves
// the files directly as static assets. For production, replace the body
// of `saveUploadedFile` with an S3-compatible client and return the
// object's public/CDN URL instead of a local path - callers only depend
// on getting back a servable `filePath`, so no other code needs to change.
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export interface SavedFile {
  filePath: string; // servable path, e.g. /uploads/photos/xyz.jpg
  fileName: string;
  fileSize: number;
  fileType: string;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
]);

export async function saveUploadedFile(file: File, subfolder: "photos" | "documents"): Promise<SavedFile> {
  if (file.size === 0) {
    throw new Error("Uploaded file is empty.");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Uploaded file exceeds the 25MB limit.");
  }
  if (subfolder === "photos" && !file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed for photos.");
  }
  if (subfolder === "documents" && file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not supported.`);
  }

  const dir = path.join(UPLOAD_ROOT, subfolder);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);

  return {
    filePath: `/uploads/${subfolder}/${safeName}`,
    fileName: file.name || safeName,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
  };
}
