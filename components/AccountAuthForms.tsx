"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthFormState } from "@/lib/actions";

// Tarjetas de login/registro de /cuenta, ahora conectadas de verdad a
// Supabase Auth (antes eran dos <form onSubmit={preventDefault}> sin
// backend). "redirectTo" viene de la página (server component) — si
// alguien llegó acá porque /checkout lo mandó (ver proxy.ts), tras
// loguearse o registrarse vuelve directo ahí en vez de quedarse en /cuenta.
export default function AccountAuthForms({ redirectTo }: { redirectTo: string }) {
  const [loginState, loginAction, loginPending] = useActionState<AuthFormState, FormData>(
    signIn,
    null
  );
  const [registerState, registerAction, registerPending] = useActionState<
    AuthFormState,
    FormData
  >(signUp, null);

  return (
    <div className="row gy-4">
      <div className="col-xl-6 pe-xl-5">
        <div className="border border-gray-100 hover-border-main-600 transition-1 rounded-16 px-24 py-40 h-100">
          <h6 className="text-xl mb-32">Iniciar sesión</h6>

          {loginState && "error" in loginState && (
            <div className="alert alert-danger" role="alert">
              {loginState.error}
            </div>
          )}

          <form action={loginAction}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="mb-24">
              <label htmlFor="username" className="text-neutral-900 text-lg mb-8 fw-medium">
                Correo electrónico <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="common-input"
                id="username"
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div className="mb-24">
              <label htmlFor="password" className="text-neutral-900 text-lg mb-8 fw-medium">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                className="common-input"
                id="password"
                placeholder="Introducir contraseña"
                required
              />
            </div>
            <div className="mb-24 mt-48">
              <button type="submit" className="btn btn-main py-18 px-40" disabled={loginPending}>
                {loginPending ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="col-xl-6">
        <div className="border border-gray-100 hover-border-main-600 transition-1 rounded-16 px-24 py-40">
          <h6 className="text-xl mb-32">Registrarse</h6>

          {registerState && "success" in registerState && (
            <div className="alert alert-success" role="status">
              ¡Cuenta creada! Revisá tu correo para confirmarla antes de iniciar sesión.
            </div>
          )}
          {registerState && "error" in registerState && (
            <div className="alert alert-danger" role="alert">
              {registerState.error}
            </div>
          )}

          <form action={registerAction}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="mb-24">
              <label htmlFor="firstNameTwo" className="text-neutral-900 text-lg mb-8 fw-medium">
                Nombre
              </label>
              <input
                type="text"
                name="firstName"
                className="common-input"
                id="firstNameTwo"
                placeholder="Tu nombre"
              />
            </div>
            <div className="mb-24">
              <label htmlFor="emailTwo" className="text-neutral-900 text-lg mb-8 fw-medium">
                Dirección de correo electrónico <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="common-input"
                id="emailTwo"
                placeholder="Introduce la dirección de correo electrónico"
                required
              />
            </div>
            <div className="mb-24">
              <label htmlFor="enter-password" className="text-neutral-900 text-lg mb-8 fw-medium">
                Contraseña <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="common-input"
                id="enter-password"
                placeholder="Introduce la contraseña"
                required
                minLength={6}
              />
            </div>
            <div className="my-48">
              <p className="text-gray-500">
                Tus datos personales serán utilizados para procesar tu pedido, apoyar tu
                experiencia en este sitio web, y para otros fines descritos en nuestra{" "}
                <a href="#" className="text-main-600 text-decoration-underline">
                  política de privacidad
                </a>
                .
              </p>
            </div>
            <div className="mt-48">
              <button
                type="submit"
                className="btn btn-main py-18 px-40"
                disabled={registerPending}
              >
                {registerPending ? "Creando cuenta..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
