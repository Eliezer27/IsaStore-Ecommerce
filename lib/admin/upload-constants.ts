// Límites y tipos permitidos para las imágenes que se suben desde el
// panel de admin (productos, categorías). Viven en un archivo aparte de
// lib/admin/upload.ts (que tiene `import "server-only"`) para poder
// importarlos también desde componentes de cliente — ej. ProductForm.tsx
// necesita el límite en MB para mostrarlo en el campo del formulario y
// validar el tamaño antes de enviar, sin arrastrar código server-only al
// bundle del navegador.

export const MAX_UPLOAD_FILE_SIZE_MB = 20;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;
