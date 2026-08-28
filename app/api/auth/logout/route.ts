import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Logout unificado — reemplaza /api/admin/logout (que solo borraba la
// cookie del viejo gate de contraseña compartida, retirado). Sirve tanto
// para el panel de admin como para /cuenta, pero cada uno cierra SOLO su
// propia sesión (admin y tienda son cookies separadas — ver
// lib/supabase/server.ts): un input hidden "scope" en el <form> dice cuál.
// AdminHeader manda scope="admin"; el logout de /cuenta no manda nada, así
// que cae en el default "customer" — cerrar sesión en la tienda nunca debe
// sacar a nadie del panel de admin, y viceversa.
//
// El destino viene de un input hidden "redirect" en el mismo <form>
// (AdminHeader manda "/admin-login", /cuenta manda "/"). Si no viene nada,
// "/" es el default más seguro (nunca dejar a alguien varado en una ruta
// que ahora requiere sesión).
export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  const scope = formData?.get("scope") === "admin" ? "admin" : "customer";

  const supabase = await createClient(scope);
  await supabase.auth.signOut();

  const redirectTo = String(formData?.get("redirect") ?? "/");
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  return NextResponse.redirect(new URL(safeRedirect, req.url));
}
