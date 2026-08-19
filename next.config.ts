import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
