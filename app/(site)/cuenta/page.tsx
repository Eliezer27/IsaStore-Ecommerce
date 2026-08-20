"use client";

import type { FormEvent } from "react";
import Link from "next/link";

// Portado de account.html (líneas ~687-834): breadcrumb + sección de cuenta
// (tarjetas de login y registro lado a lado) + sección de envío genérica.
// Todavía no hay autenticación real conectada: los formularios solo hacen
// preventDefault. Se quitaron los data-aos (JS no cargado) y el toggle de
// mostrar/ocultar contraseña (dependía de main.js, que no se ejecuta aquí).

// Los 4 íconos de "envío" son contenido decorativo sin backend, así que se
// listan acá y se recorren con .map() en vez de copiar el bloque 4 veces.
const SHIPPING_ITEMS = [
  { icon: "ph-car-profile", title: "Envío Gratis" },
  { icon: "ph-hand-heart", title: "Satisfacción 100%" },
  { icon: "ph-credit-card", title: "Pagos Seguros" },
  { icon: "ph-chats", title: "Soporte 24/7" },
];

export default function AccountPage() {
  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: conectar autenticación real (Supabase Auth o NextAuth.js)
  }

  function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: conectar autenticación real (Supabase Auth o NextAuth.js)
  }

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
          <div className="row gy-4">
            <div className="col-xl-6 pe-xl-5">
              <div className="border border-gray-100 hover-border-main-600 transition-1 rounded-16 px-24 py-40 h-100">
                <h6 className="text-xl mb-32">Iniciar sesión</h6>
                <form onSubmit={handleLogin}>
                  <div className="mb-24">
                    <label htmlFor="username" className="text-neutral-900 text-lg mb-8 fw-medium">
                      Nombre de usuario o dirección de correo electrónico{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input type="text" className="common-input" id="username" placeholder="Primer Nombre" />
                  </div>
                  <div className="mb-24">
                    <label htmlFor="password" className="text-neutral-900 text-lg mb-8 fw-medium">
                      Contraseña
                    </label>
                    <div className="position-relative">
                      <input
                        type="password"
                        className="common-input"
                        id="password"
                        placeholder="Introducir Contraseña"
                      />
                      <span className="toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph ph-eye-slash" />
                    </div>
                  </div>
                  <div className="mb-24 mt-48">
                    <div className="flex-align gap-48 flex-wrap">
                      <button type="submit" className="btn btn-main py-18 px-40">
                        Iniciar sesión
                      </button>
                      <div className="form-check common-check">
                        <input className="form-check-input" type="checkbox" id="remember" />
                        <label className="form-check-label flex-grow-1" htmlFor="remember">
                          Recuérdame
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-48">
                    <a href="#" className="text-danger-600 text-sm fw-semibold hover-text-decoration-underline">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-xl-6">
              <div className="border border-gray-100 hover-border-main-600 transition-1 rounded-16 px-24 py-40">
                <h6 className="text-xl mb-32">Registrarse</h6>
                <form onSubmit={handleRegister}>
                  <div className="mb-24">
                    <label htmlFor="usernameTwo" className="text-neutral-900 text-lg mb-8 fw-medium">
                      Nombre de usuario <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="common-input"
                      id="usernameTwo"
                      placeholder="Escribe un nombre de usuario"
                    />
                  </div>
                  <div className="mb-24">
                    <label htmlFor="emailTwo" className="text-neutral-900 text-lg mb-8 fw-medium">
                      Dirección de correo electrónico <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="common-input"
                      id="emailTwo"
                      placeholder="Introduce la dirección de correo electrónico"
                    />
                  </div>
                  <div className="mb-24">
                    <label htmlFor="enter-password" className="text-neutral-900 text-lg mb-8 fw-medium">
                      Contraseña <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type="password"
                        className="common-input"
                        id="enter-password"
                        placeholder="Introduce la contraseña"
                      />
                      <span className="toggle-password position-absolute top-50 inset-inline-end-0 me-16 translate-middle-y ph ph-eye-slash" />
                    </div>
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
                    <button type="submit" className="btn btn-main py-18 px-40">
                      Registrar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
