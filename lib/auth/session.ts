import { redirect } from "next/navigation";
import { createClient, type SessionScope } from "@/lib/supabase/server";

export type Role = "customer" | "staff" | "admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  firstName: string | null;
  lastName: string | null;
};

function isRole(value: unknown): value is Role {
  return value === "customer" || value === "staff" || value === "admin";
}

// Admin y tienda ahora tienen sesiones independientes, cada una en su
// propia cookie (ver lib/supabase/server.ts) — por eso hay dos funciones
// públicas más abajo (getCurrentUser / getCurrentAdminUser) en vez de una
// sola. Esta es la implementación compartida por las dos.
//
// El rol se lee de user.app_metadata (NO de user_metadata): app_metadata
// solo lo puede escribir un llamado con la Service Role Key
// (lib/supabase/admin.ts), el usuario no puede editarlo por su cuenta. Ver
// el comentario largo en la migración de la base
// (prisma/migrations/20260827060011_supabase_auth_sync) para el porqué.
async function getUserForScope(scope: SessionScope): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient(scope);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const roleRaw = user.app_metadata?.role;
    const role: Role = isRole(roleRaw) ? roleRaw : "customer";

    return {
      id: user.id,
      email: user.email ?? null,
      role,
      firstName: (user.user_metadata?.first_name as string | undefined) ?? null,
      lastName: (user.user_metadata?.last_name as string | undefined) ?? null,
    };
  } catch (err) {
    console.warn(
      "[auth] no se pudo obtener la sesión (¿Supabase Auth configurado?):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Usuario autenticado actual de la TIENDA (/cuenta, checkout, reseñas) —
 * o null si no hay sesión ahí. No tiene nada que ver con si hay alguien
 * logueado en el panel de admin al mismo tiempo: son sesiones separadas. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getUserForScope("customer");
}

/** Usuario autenticado actual del PANEL (/admin) — o null si no hay sesión
 * de staff/admin ahí. Usar esta (no getCurrentUser) en cualquier página o
 * acción dentro de app/(admin). */
export async function getCurrentAdminUser(): Promise<CurrentUser | null> {
  return getUserForScope("admin");
}

/**
 * Para páginas del dashboard que solo un subconjunto de roles puede ver
 * (Reportes, Usuarios: solo admin). El middleware (proxy.ts) ya garantiza
 * que quien llega hasta acá es al menos staff o admin — esto es una segunda
 * capa (defensa en profundidad) por si alguien navega directo a la URL de
 * una sección que su rol no debería poder abrir.
 */
export async function requireRole(allowed: Role[]): Promise<CurrentUser> {
  const user = await getCurrentAdminUser();
  if (!user || !allowed.includes(user.role)) {
    redirect("/admin");
  }
  return user;
}
