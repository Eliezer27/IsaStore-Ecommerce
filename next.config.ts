import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite imágenes servidas desde Supabase Storage (o cualquier https)
    // mientras se define el dominio final de producción.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
