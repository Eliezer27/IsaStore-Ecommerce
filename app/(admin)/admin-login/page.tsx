import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Fuera de /admin (proxy.ts solo protege "/admin/:path*"), así que esta
// página en sí no requiere estar logueado — es donde uno se loguea.
//
// Reemplaza el gate de una sola contraseña compartida (lib/admin-auth.ts,
// retirado) por Supabase Auth: cada persona del staff tiene su propia
// cuenta (el admin las crea desde /admin/usuarios, que le manda una
// contraseña fija que el admin le pasa por otro medio — ver createStaffUser
// en lib/admin/actions.ts).
//
// Aunque las credenciales sean correctas, si la cuenta es de un cliente
// normal (role "customer") NO se le deja entrar: se cierra esa sesión al
// toque y se manda de vuelta con un error. El middleware (proxy.ts) hace
// esta misma verificación de rol en cada request a /admin/*, así que esto
// es solo para dar un mensaje claro en el momento del login.
//
// El login de admin/staff usa el scope "admin" (su propia cookie,
// sb-admin-auth) — así que entrar acá ya NO afecta a una sesión de cliente
// que hubiera abierta en /cuenta en el mismo navegador, ni al revés.
//
// Aparte, si el login es válido, se firma TAMBIÉN la sesión de tienda
// (scope "customer") con las mismas credenciales. Esto es a propósito: es
// lo que hace que el botón "Ver tienda" del panel (AdminHeader) muestre al
// staff logueado como sí mismo en la tienda, para que pueda revisar sus
// cambios ahí. Como es un scope aparte, esto SOLO reemplaza la sesión de
// cliente de este navegador — si después el staff quiere probar la tienda
// como un cliente distinto, puede loguearse en /cuenta con esa otra cuenta
// sin que eso le cierre la sesión del panel.
async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const adminSupabase = await createClient("admin");
  const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/admin-login?error=credenciales&from=${encodeURIComponent(from)}`);
  }

  const role = data.user.app_metadata?.role;
  if (role !== "staff" && role !== "admin") {
    await adminSupabase.auth.signOut();
    redirect(`/admin-login?error=sin-acceso&from=${encodeURIComponent(from)}`);
  }

  const customerSupabase = await createClient("customer");
  await customerSupabase.auth.signInWithPassword({ email, password });

  redirect(from.startsWith("/admin") ? from : "/admin");
}

const ERROR_MESSAGES: Record<string, string> = {
  credenciales: "Correo o contraseña incorrectos.",
  "sin-acceso": "Esa cuenta no tiene acceso al panel de administración.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;
  const from = params.from ?? "/admin";

  return (
    <div className="account-page">
      <div className="main-wrapper">
        <div className="account-content">
          <div className="container">
            <div className="account-box">
              <div className="account-wrapper" style={{ maxWidth: 420, margin: "80px auto" }}>
                <h3 className="account-title mb-2">Panel de administración</h3>
                <p className="account-subtitle mb-4 text-muted">
                  IsaStore — acceso restringido al equipo
                </p>

                {errorMessage && (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                )}

                <form action={login}>
                  <input type="hidden" name="from" value={from} />
                  <div className="input-block mb-3">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Entrar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
