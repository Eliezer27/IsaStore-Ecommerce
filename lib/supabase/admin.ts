import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la Service Role Key: puede administrar usuarios de Auth
// (invitar, crear, borrar) vía supabase.auth.admin.* sin pasar por el login
// de nadie. Es la key más privilegiada del proyecto — por eso el import
// "server-only" de arriba: si algún día alguien la importa por accidente
// desde un componente de cliente, el build falla en vez de filtrar la key
// al bundle del navegador.
//
// Se usa solo desde lib/admin/actions.ts, para que el admin pueda crear
// cuentas de staff desde el dashboard (ver inviteStaffUser).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno " +
        "(revisa .env.local)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
