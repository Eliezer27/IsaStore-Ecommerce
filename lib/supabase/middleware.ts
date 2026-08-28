import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES, type SessionScope } from "@/lib/supabase/server";

// Patrón oficial de Supabase para refrescar la sesión en proxy.ts (el
// middleware de Next 16). Importante (según su propia documentación): no
// meter lógica entre createServerClient() y el auth.getUser() de abajo, y
// no saltarse ese getUser() — sin él, la sesión se puede caer en silencio
// en producción (el token expira y nadie lo refresca a tiempo).
//
// Ahora hay DOS sesiones independientes por navegador (admin y customer,
// ver lib/supabase/server.ts) y hay que refrescar las dos en la misma
// pasada, porque proxy.ts necesita saber quién está logueado en cada scope
// para gatear /admin (con adminUser) y /checkout (con customerUser) por
// separado. A diferencia del patrón oficial de Supabase de un solo
// cliente —que recrea `supabaseResponse` dentro de setAll—, acá NO se
// recrea: si se recreara, el segundo scope pisaría (perdería) las cookies
// que ya había puesto el primero. En vez de eso, los dos scopes acumulan
// sus Set-Cookie sobre el mismo response.
async function getScopedUser(
  request: NextRequest,
  response: NextResponse,
  scope: SessionScope
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SESSION_COOKIE_NAMES[scope] },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

// Devuelve tanto la respuesta (con las cookies de las dos sesiones ya
// actualizadas, para que proxy.ts la use como base si no necesita
// redirigir) como los dos usuarios autenticados (o null cada uno), para
// que proxy.ts decida a partir de ahí si deja pasar la request o redirige.
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const [customerUser, adminUser] = await Promise.all([
    getScopedUser(request, supabaseResponse, "customer"),
    getScopedUser(request, supabaseResponse, "admin"),
  ]);

  return { supabaseResponse, customerUser, adminUser };
}
