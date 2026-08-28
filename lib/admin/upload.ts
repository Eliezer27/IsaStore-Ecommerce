import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { MAX_UPLOAD_FILE_SIZE_BYTES, MAX_UPLOAD_FILE_SIZE_MB } from "./upload-constants";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Guarda un archivo de imagen subido desde el dispositivo en
 * /public/uploads/<subdir>/ y devuelve la ruta pública (ej. "/uploads/productos/abc123.jpg")
 * para guardarla en la base de datos igual que si fuera una URL externa.
 */
export async function saveUploadedImage(
  file: File,
  subdir: string
): Promise<string> {
  if (!file.type || !(file.type in ALLOWED_MIME_TO_EXT)) {
    throw new Error(
      "Formato de imagen no soportado. Usa JPG, PNG, WEBP, GIF o SVG."
    );
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new Error(
      `La imagen "${file.name}" pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB, ` +
        `y el máximo permitido es ${MAX_UPLOAD_FILE_SIZE_MB}MB. Elegí una imagen más liviana o comprimila antes de subirla.`
    );
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  return `/uploads/${subdir}/${fileName}`;
}

/** Devuelve true si el FormData trae un archivo con contenido para ese campo. */
export function hasUploadedFile(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value instanceof File && value.size > 0;
}
