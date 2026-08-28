import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente de Supabase para Server Components, Server Actions y Route
// Handlers. Lee/escribe la sesión en las cookies de Next — patrón oficial
// de Supabase para el App Router (ver supabase.com/docs/guides/auth/server-side/nextjs).
//
// Dos "scopes" = dos sesiones independientes en el mismo navegador, cada
// una en su propia cookie: "admin" (panel /admin, cuenta de staff) y
// "customer" (tienda pública, /cuenta y checkout). Antes había un solo
// cliente/cookie para los dos — eso hacía que loguearse como cliente en
// /cuenta pisara la sesión de staff y te sacara del panel (y viceversa).
// Con cookies separadas, cada login solo toca su propia sesión.
export type SessionScope = "customer" | "admin";

export const SESSION_COOKIE_NAMES: Record<SessionScope, string> = {
  customer: "sb-customer-auth",
  admin: "sb-admin-auth",
};

// El try/catch de setAll existe porque un Server Component (a diferencia de
// una Server Action o un Route Handler) no puede escribir cookies — si este
// cliente se usa solo para LEER la sesión ahí (ej. una página que muestra
// "hola, fulano"), el intento de refrescar el token fallaría silenciosamente
// sin este catch. El refresco real de la sesión en cada request lo hace
// proxy.ts, así que no pasa nada si acá se ignora.
export async function createClient(scope: SessionScope = "customer") {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SESSION_COOKIE_NAMES[scope] },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component — está bien ignorarlo.
          }
        },
      },
    }
  );
}
