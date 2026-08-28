import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renombró "middleware.ts" a "proxy.ts" (y la función exportada
// "middleware" a "proxy"). El runtime ya es siempre "nodejs" en proxy.ts
// (no configurable).
//
// Reemplaza el gate de contraseña única que había antes (lib/admin-auth.ts
// y ADMIN_PASSWORD, ambos retirados) por sesiones reales de Supabase Auth.
// Dos cosas pasan acá en
// cada request:
//
// 1. Se refresca la sesión de Supabase (updateSession, patrón oficial de
//    Supabase para Next.js) — sin esto, la sesión de un usuario se puede
//    caer en silencio cuando el token expira y nadie lo renueva a tiempo.
//    Por eso el matcher de abajo corre en casi todas las rutas, no solo en
//    /admin.
// 2. Según la ruta, se decide si hay que redirigir:
//      - /admin/* : hay que estar logueado Y tener role "staff" o "admin"
//        (el rol viene de user.app_metadata, que el usuario no puede
//        falsificar por su cuenta — ver lib/auth/session.ts). Si no, a
//        /admin-login.
//      - /checkout : hay que estar logueado (cualquier rol). Si no, a
//        /cuenta con ?redirect=/checkout, para que ahí se muestre el aviso
//        de "inicia sesión para continuar tu compra" y, tras loguearse,
//        se regrese directo al checkout.
//    El resto del sitio (navegar la tienda, agregar al carrito/deseos) no
//    requiere sesión — se puede comprar como invitado hasta el momento de
//    pagar.
const STAFF_ROLES = new Set(["staff", "admin"]);

export async function proxy(req: NextRequest) {
  const { supabaseResponse, adminUser, customerUser } = await updateSession(req);
  const pathname = req.nextUrl.pathname;

  // /admin/* se gatea con la sesión de staff/admin (su propia cookie) — la
  // sesión de cliente (customerUser) es irrelevante acá, y loguearse en
  // /cuenta ya no afecta a adminUser en absoluto.
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute) {
    const role = adminUser?.app_metadata?.role as string | undefined;
    if (!adminUser || !STAFF_ROLES.has(role ?? "")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin-login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // /checkout es de la tienda — se gatea con la sesión de cliente, no la de
  // admin (un staff logueado en el panel no queda automáticamente "logueado
  // para comprar" solo por eso, salvo que también haya iniciado sesión de
  // cliente — ver app/(admin)/admin-login/page.tsx).
  if (pathname === "/checkout" && !customerUser) {
    const url = req.nextUrl.clone();
    url.pathname = "/cuenta";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Corre en todo excepto estáticos/imágenes (patrón recomendado por
  // Supabase) — así el refresco de sesión llega a todas las páginas reales.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
