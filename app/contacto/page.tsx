"use client";

import type { FormEvent } from "react";
import Link from "next/link";

// Portado de contact.html (líneas ~687-827): breadcrumb + formulario de
// contacto ("Hacer una Solicitud Personalizada") + tarjeta de datos de
// contacto + sección de envío genérica.
//
// El mapa NO va en esta página: tiene más sentido mostrarlo en /checkout,
// cuando el cliente ya está confirmando su dirección de entrega, así que se
// movió para allá (ver app/checkout/page.tsx).
//
// TODO: falta la API route para procesar el formulario (envío de correo /
// guardado en base de datos); por ahora el submit solo hace preventDefault.
const SHIPPING_ITEMS = [
  { icon: "ph-car-profile", title: "Envío Gratis" },
  { icon: "ph-hand-heart", title: "Satisfacción 100%" },
  { icon: "ph-credit-card", title: "Pagos Seguros" },
  { icon: "ph-chats", title: "Soporte 24/7" },
];

export default function ContactPage() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: conectar a una API route real (envío de correo o guardado en BD)
  }

  return (
    <>
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Contacto</h6>
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
              <li className="text-sm text-main-600"> Contacto </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="contact py-80">
        <div className="container container-lg">
          <div className="row gy-5">
            <div className="col-lg-8">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <form onSubmit={handleSubmit}>
                  <h6 className="mb-32">Hacer una Solicitud Personalizada</h6>
                  <div className="row gy-4">
                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="name"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Nombre Completo <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input type="text" className="common-input px-16" id="name" placeholder="Nombre completo" />
                    </div>
                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="email"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Correo Electrónico <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="email"
                        className="common-input px-16"
                        id="email"
                        placeholder="Correo electrónico"
                      />
                    </div>
                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="phone"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Número de Teléfono <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input
                        type="number"
                        className="common-input px-16"
                        id="phone"
                        placeholder="Número de teléfono"
                      />
                    </div>
                    <div className="col-sm-6 col-xs-6">
                      <label
                        htmlFor="subject"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Asunto <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <input type="text" className="common-input px-16" id="subject" placeholder="Asunto" />
                    </div>
                    <div className="col-sm-12">
                      <label
                        htmlFor="message"
                        className="flex-align gap-4 text-sm font-heading-two text-gray-900 fw-semibold mb-4"
                      >
                        Mensaje <span className="text-danger text-xl line-height-1">*</span>
                      </label>
                      <textarea className="common-input px-16" id="message" placeholder="Escribe tu mensaje" />
                    </div>
                    <div className="col-sm-12 mt-32">
                      <button type="submit" className="btn btn-main py-18 px-32 rounded-8">
                        Solicitar Presupuesto
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="contact-box border border-gray-100 rounded-16 px-24 py-40">
                <h6 className="mb-48">Ponte en Contacto</h6>
                <div className="flex-align gap-16 mb-16">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-phone-call" />
                  </span>
                  <a href="tel:+00123456789" className="text-md text-gray-900 hover-text-main-600">
                    +00 123 456 789
                  </a>
                </div>
                <div className="flex-align gap-16 mb-16">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-envelope" />
                  </span>
                  <a href="mailto:support24@marketpro.com" className="text-md text-gray-900 hover-text-main-600">
                    support24@marketpro.com
                  </a>
                </div>
                <div className="flex-align gap-16 mb-0">
                  <span className="w-40 h-40 flex-center rounded-circle border border-gray-100 text-main-two-600 text-2xl flex-shrink-0">
                    <i className="ph-fill ph-map-pin" />
                  </span>
                  <span className="text-md text-gray-900">Nicaragua</span>
                </div>
              </div>
              <div className="mt-24 flex-align flex-wrap gap-16">
                <a
                  href="tel:+00123456789"
                  className="bg-neutral-600 hover-bg-main-600 rounded-8 p-10 px-16 flex-between flex-wrap gap-8 flex-grow-1"
                >
                  <span className="text-white fw-medium">Soporte Telefónico</span>
                  <span className="w-36 h-36 bg-main-600 rounded-8 flex-center text-xl text-white">
                    <i className="ph ph-headset" />
                  </span>
                </a>
                <Link
                  href="/checkout"
                  className="bg-neutral-600 hover-bg-main-600 rounded-8 p-10 px-16 flex-between flex-wrap gap-8 flex-grow-1"
                >
                  <span className="text-white fw-medium">Hacer un pedido</span>
                  <span className="w-36 h-36 bg-main-600 rounded-8 flex-center text-xl text-white">
                    <i className="ph ph-map-pin" />
                  </span>
                </Link>
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
