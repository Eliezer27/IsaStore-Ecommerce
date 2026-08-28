import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import AccountAuthForms from "@/components/AccountAuthForms";

// Portado de account.html (líneas ~687-834), ahora con autenticación real
// vía Supabase Auth. Antes era una maqueta pura (los dos forms solo hacían
// preventDefault) — ver AccountAuthForms.tsx para el login/registro
// conectados de verdad, y lib/actions.ts para signIn/signUp.
//
// "?redirect=" lo manda proxy.ts cuando alguien sin sesión intenta entrar a
// /checkout — acá se muestra el aviso y, tras loguearse/registrarse,
// AccountAuthForms devuelve directo a esa ruta.

const SHIPPING_ITEMS = [
  { icon: "ph-car-profile", title: "Envío Gratis" },
  { icon: "ph-hand-heart", title: "Satisfacción 100%" },
  { icon: "ph-credit-card", title: "Pagos Seguros" },
  { icon: "ph-chats", title: "Soporte 24/7" },
];

const ROLE_LABEL: Record<string, string> = {
  customer: "Cliente",
  staff: "Staff",
  admin: "Administrador",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const redirectTo = params.redirect?.startsWith("/") ? params.redirect : "/cuenta";
  const showRedirectBanner = !user && redirectTo !== "/cuenta";

  return (
    <>
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Mi cuenta</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link href="/" className="text-gray-900 flex-align gap-8 hover-text-main-600">
                  <i className="ph ph-house" />
                  Home
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right" />
              </li>
              <li className="text-sm text-main-600"> Cuenta </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="account py-80">
        <div className="container container-lg">
          {showRedirectBanner && (
            <div className="alert alert-info mb-32" role="status">
              Iniciá sesión o creá una cuenta para continuar tu compra.
            </div>
          )}

          {user ? (
            <div className="row">
              <div className="col-xl-6">
                <div className="border border-gray-100 rounded-16 px-24 py-40">
                  <h6 className="text-xl mb-32">Tu perfil</h6>
                  <div className="mb-16">
                    <span className="text-gray-500 text-sm d-block">Nombre</span>
                    <span className="text-gray-900">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                    </span>
                  </div>
                  <div className="mb-16">
                    <span className="text-gray-500 text-sm d-block">Correo</span>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                  <div className="mb-32">
                    <span className="text-gray-500 text-sm d-block">Tipo de cuenta</span>
                    <span className="text-gray-900">{ROLE_LABEL[user.role] ?? user.role}</span>
                  </div>
                  <form action="/api/auth/logout" method="POST">
                    <input type="hidden" name="redirect" value="/" />
                    <button type="submit" className="btn btn-main py-14 px-32">
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <AccountAuthForms redirectTo={redirectTo} />
          )}
        </div>
      </section>

      <section className="shipping mb-24" id="shipping">
        <div className="container container-lg">
          <div className="row gy-4">
            {SHIPPING_ITEMS.map((item) => (
              <div key={item.icon} className="col-xxl-3 col-sm-6">
                <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                  <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                    <i className={`ph-fill ${item.icon}`} />
                  </span>
                  <div>
                    <h6 className="mb-0">{item.title}</h6>
                    <span className="text-sm text-heading">Envío gratuito en toda Managua</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
