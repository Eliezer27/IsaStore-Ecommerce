import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_AUTH_COOKIE, adminAuthToken, isValidAdminPassword } from "@/lib/admin-auth";

// Fuera de /admin (el middleware solo protege "/admin/:path*"), así que esta
// página en sí no requiere estar logueado — es donde uno se loguea.

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!isValidAdminPassword(password)) {
    redirect(`/admin-login?error=1&from=${encodeURIComponent(from)}`);
  }

  const store = await cookies();
  store.set(ADMIN_AUTH_COOKIE, adminAuthToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  redirect(from.startsWith("/admin") ? from : "/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
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
                  IsaStore — acceso restringido
                </p>

                {hasError && (
                  <div className="alert alert-danger" role="alert">
                    Contraseña incorrecta.
                  </div>
                )}

                <form action={login}>
                  <input type="hidden" name="from" value={from} />
                  <div className="input-block mb-3">
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      autoFocus
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
