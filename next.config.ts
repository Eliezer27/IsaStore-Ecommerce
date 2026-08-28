import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 tiene un bug conocido generando .next/(dev/)types/validator.ts
  // cuando hay route groups (nuestro app/(site) + app/(admin) para aislar el
  // admin del resto de la tienda): ese archivo generado automáticamente
  // apunta a rutas tipo "app/blog/page.js" en vez de "app/(site)/blog/page.js",
  // así que el propio validador de Next falla aunque el código compile bien
  // ("Compiled successfully"). Ver https://github.com/vercel/next.js/issues/90332
  // (bug de la misma familia, ya arreglado una vez, reaparece en variantes).
  // Se ignoran los errores de build de TypeScript SOLO por esto — la
  // verificación real de tipos (`npx tsc --noEmit`) del código del proyecto
  // no tiene errores. Quitar esto cuando Next.js libere el fix.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Permite imágenes servidas desde Supabase Storage (o cualquier https)
    // mientras se define el dominio final de producción.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Prisma 7 + pg necesitan Node.js nativo (no bundlearse). Next.js ya los
  // trae en su lista por defecto, pero se declara explícito por si acaso —
  // si con Turbopack aparece "Cannot find module '.prisma/client/default'",
  // ver la nota en README sobre turbopack.resolveAlias.
  serverExternalPackages: ["@prisma/client", "pg"],
  experimental: {
    serverActions: {
      // Los formularios de producto/categoría suben imágenes como
      // multipart/form-data a través de Server Actions (createProduct,
      // updateProduct). El límite por defecto de Next.js para el body de
      // una Server Action es 1MB — sin este override, subir cualquier
      // imagen de tamaño normal tira "Body exceeded 1 MB limit.". Este
      // valor tiene que quedar por ENCIMA de MAX_UPLOAD_FILE_SIZE_MB
      // (lib/admin/upload-constants.ts, hoy 20MB): si se sube ese límite
      // de nuevo, hay que subir este también.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
