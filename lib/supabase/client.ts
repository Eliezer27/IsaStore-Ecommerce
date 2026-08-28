"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para usar en componentes de cliente ("use client").
// Usa la anon key (segura para el navegador — la seguridad real vive en
// las políticas de la base y, en este proyecto, en que Prisma habla con
// Postgres directo por su cuenta; este cliente es solo para Auth).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
