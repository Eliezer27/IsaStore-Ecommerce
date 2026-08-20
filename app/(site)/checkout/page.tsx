"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(price);
}

type PaymentMethod = "transferencia" | "cheque" | "contra-entrega";

// Checkout portado de checkout.html (líneas ~687-906): breadcrumb, formulario
// de dirección de envío/facturación, resumen de la orden (leyendo el carrito
// real de lib/cart-store.ts) y selector de método de pago. El HTML original
// no incluye un botón de PayPal, así que no se agrega uno acá; cuando exista
// backend de órdenes se puede sumar @paypal/react-paypal-js como método
// adicional.
//
// El mapa para confirmar la dirección de entrega se agregó acá (y no en
// /contacto) porque tiene más sentido mostrarlo cuando el cliente ya está
// haciendo el pedido, no en la página de contacto.
export default function CheckoutPage() {
  const lines = useCartStore((state) => state.lines);
  const totalPrice = useCartStore((state) => state.totalPrice());

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia");
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    pais: "Nicaragua",
    ciudad: "",
    codigoPostal: "",
    telefono: "",
    email: "",
    notas: "",
  });

  function handleChange(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: conectar con la API de creación de orden cuando exista backend
    // (guardar dirección + método de pago + líneas del carrito, crear la
    // orden y redirigir a una página de confirmación).
  }

  if (lines.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">Tu carrito está vacío</h1>
        <p className="text-secondary">Agrega productos antes de continuar con el pago.</p>
        <Link href="/shop" className="btn btn-dark mt-3">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ========================= Breadcrumb Start =============================== */}
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Revisión</h6>
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
              <li className="text-sm text-main-600"> Revisión </li>
            </ul>
          </div>
        </div>
      </div>
      {/* ========================= Breadcrumb End =============================== */}

      {/* ================================= Checkout Page Start ===================================== */}
      <section className="checkout py-80">
        <div className="container container-lg">
          <div className="border border-gray-100 rounded-8 px-30 py-20 mb-40">
            <span>
              Tienes cupo?{" "}
              <Link
                href="/carrito"
                className="fw-semibold text-gray-900 hover-text-decoration-underline hover-text-main-600"
              >
                Click aqui para generar tu codigo
              </Link>{" "}
            </span>
          </div>
          <div className="row">
            <div className="col-xl-9 col-lg-8">
              <form id="checkout-form" onSubmit={handleSubmit} className="pe-xl-5">
                <div className="row gy-3">
                  <div className="col-sm-6 col-xs-6">
                    <input
                      type="text"
                      className="common-input border-gray-100"
                      placeholder="Nombre"
                      value={form.nombre}
                      onChange={handleChange("nombre")}
                    />
                  </div>
                  <div className="col-sm-6 col-xs-6">
                    <input
                      type="text"
                      className="common-input border-gray-100"
                      placeholder="Apellido"
                      value={form.apellido}
                      onChange={handleChange("apellido")}
                    />
                  </div>

                  <div className="col-12">
                    <input
                      type="text"
                      className="common-input border-gray-100"
                      placeholder="Nicaragua "
                      value={form.pais}
                      onChange={handleChange("pais")}
                    />
                  </div>

                  <div className="col-12">
                    <input
                      type="text"
                      className="common-input border-gray-100"
                      placeholder="Ciudad"
                      value={form.ciudad}
                      onChange={handleChange("ciudad")}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="common-input border-gray-100"
                      placeholder="Post Code"
                      value={form.codigoPostal}
                      onChange={handleChange("codigoPostal")}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="number"
                      className="common-input border-gray-100"
                      placeholder="Phone"
                      value={form.telefono}
                      onChange={handleChange("telefono")}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="email"
                      className="common-input border-gray-100"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={handleChange("email")}
                    />
                  </div>

                  {/* Mapa para confirmar la dirección de entrega. En
                      contact.html no había mapa embebido; tiene más sentido
                      acá, cuando el cliente ya está haciendo el pedido, que
                      en /contacto. */}
                  {/* TODO: integrar @react-google-maps/api con Places Autocomplete
                      aquí (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), para que el cliente
                      pueda buscar y confirmar su dirección en el mapa y esas
                      coordenadas se guarden en addresses.lat/lng. */}
                  <div className="col-12">
                    <div className="mb-8 mt-8">
                      <h6 className="text-lg mb-16">Confirma tu ubicación de entrega</h6>
                      <div
                        className="rounded-16 bg-gray-50 border border-gray-100 flex-center"
                        style={{ height: 320 }}
                      >
                        <div className="text-center">
                          <span className="text-4xl text-gray-400 d-block mb-8">
                            <i className="ph ph-map-trifold" />
                          </span>
                          <p className="text-gray-500 mb-0">Mapa próximamente</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="my-40">
                      <h6 className="text-lg mb-24">Informacion adicional</h6>
                      <input
                        type="text"
                        className="common-input border-gray-100"
                        placeholder="Notas sobre su pedido, por ejemplo, notas especiales para la entrega."
                        value={form.notas}
                        onChange={handleChange("notas")}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-xl-3 col-lg-4">
              <div className="checkout-sidebar">
                <div className="bg-color-three rounded-8 p-24 text-center">
                  <span className="text-gray-900 text-xl fw-semibold">Tu pedido</span>
                </div>

                <div className="border border-gray-100 rounded-8 px-24 py-40 mt-24">
                  <div className="mb-32 pb-32 border-bottom border-gray-100 flex-between gap-8">
                    <span className="text-gray-900 fw-medium text-xl font-heading-two">
                      Producto
                    </span>
                    <span className="text-gray-900 fw-medium text-xl font-heading-two">
                      Subtotal
                    </span>
                  </div>

                  {lines.map((line) => (
                    <div key={line.productId} className="flex-between gap-24 mb-32">
                      <div className="flex-align gap-12">
                        <span className="text-gray-900 fw-normal text-md font-heading-two w-144">
                          {line.name}
                        </span>
                        <span className="text-gray-900 fw-normal text-md font-heading-two">
                          <i className="ph-bold ph-x" />
                        </span>
                        <span className="text-gray-900 fw-semibold text-md font-heading-two">
                          {line.quantity}
                        </span>
                      </div>
                      <span className="text-gray-900 fw-bold text-md font-heading-two">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  ))}

                  <div className="border-top border-gray-100 pt-30 mt-30">
                    <div className="mb-32 flex-between gap-8">
                      <span className="text-gray-900 font-heading-two text-xl fw-semibold">
                        Subtotal
                      </span>
                      <span className="text-gray-900 font-heading-two text-md fw-bold">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <div className="mb-0 flex-between gap-8">
                      <span className="text-gray-900 font-heading-two text-xl fw-semibold">
                        Total
                      </span>
                      <span className="text-gray-900 font-heading-two text-md fw-bold">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-32">
                    <div className="payment-item">
                      <div className="form-check common-check common-radio py-16 mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment"
                          id="payment1"
                          checked={paymentMethod === "transferencia"}
                          onChange={() => setPaymentMethod("transferencia")}
                        />
                        <label
                          className="form-check-label fw-semibold text-neutral-600"
                          htmlFor="payment1"
                        >
                          Transferencia bancaria directa
                        </label>
                      </div>
                      <div className="payment-item__content px-16 py-24 rounded-8 bg-main-50 position-relative">
                        <p className="text-gray-800">
                          Realiza tu pago directamente en nuestra cuenta bancaria. Por favor,
                          usa tu ID de pedido como referencia de pago. Tu pedido no será
                          enviado hasta que los fondos hayan sido acreditados en nuestra
                          cuenta.
                        </p>
                      </div>
                    </div>
                    <div className="payment-item">
                      <div className="form-check common-check common-radio py-16 mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment"
                          id="payment2"
                          checked={paymentMethod === "cheque"}
                          onChange={() => setPaymentMethod("cheque")}
                        />
                        <label
                          className="form-check-label fw-semibold text-neutral-600"
                          htmlFor="payment2"
                        >
                          Pagos con cheque
                        </label>
                      </div>
                      <div className="payment-item__content px-16 py-24 rounded-8 bg-main-50 position-relative">
                        <p className="text-gray-800">
                          Realiza tu pago directamente en nuestra cuenta bancaria. Por favor,
                          usa tu ID de pedido como referencia de pago. Tu pedido no será
                          enviado hasta que los fondos hayan sido acreditados en nuestra
                          cuenta.
                        </p>
                      </div>
                    </div>
                    <div className="payment-item">
                      <div className="form-check common-check common-radio py-16 mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment"
                          id="payment3"
                          checked={paymentMethod === "contra-entrega"}
                          onChange={() => setPaymentMethod("contra-entrega")}
                        />
                        <label
                          className="form-check-label fw-semibold text-neutral-600"
                          htmlFor="payment3"
                        >
                          Pago contra entrega
                        </label>
                      </div>
                      <div className="payment-item__content px-16 py-24 rounded-8 bg-main-50 position-relative">
                        <p className="text-gray-800">
                          Realiza tu pago directamente en nuestra cuenta bancaria. Por favor,
                          usa tu ID de pedido como referencia de pago. Tu pedido no será
                          enviado hasta que los fondos hayan sido acreditados en nuestra
                          cuenta.
                        </p>
                      </div>
                    </div>
                    {/* TODO: integrar @paypal/react-paypal-js aquí cuando haya backend
                        de órdenes. El template original no trae un método de pago con
                        PayPal, pero la dependencia ya está instalada para cuando se
                        arme el flujo de creación/captura de la orden. */}
                  </div>

                  <div className="mt-32 pt-32 border-top border-gray-100">
                    <p className="text-gray-500">
                      Tus datos personales serán utilizados para procesar tu pedido, apoyar
                      tu experiencia a lo largo de este sitio web, y para otros propósitos
                      descritos en nuestra{" "}
                      <a href="#" className="text-main-600 text-decoration-underline">
                        política de privacidad
                      </a>
                      .
                    </p>
                  </div>

                  <button
                    type="submit"
                    form="checkout-form"
                    className="btn btn-main mt-40 py-18 w-100 rounded-8 mt-56"
                  >
                    Realizar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ================================= Checkout Page End ===================================== */}

      {/* ========================== Shipping Section Start ============================ */}
      <section className="shipping mb-24" id="shipping">
        <div className="container container-lg">
          <div className="row gy-4">
            <div className="col-xxl-3 col-sm-6">
              <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                  <i className="ph-fill ph-car-profile" />
                </span>
                <div>
                  <h6 className="mb-0">Envío Gratis</h6>
                  <span className="text-sm text-heading">Envío gratuito en toda Managua</span>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                  <i className="ph-fill ph-hand-heart" />
                </span>
                <div>
                  <h6 className="mb-0">Satisfacción 100%</h6>
                  <span className="text-sm text-heading">Envío gratuito en toda Managua</span>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                  <i className="ph-fill ph-credit-card" />
                </span>
                <div>
                  <h6 className="mb-0">Pagos Seguros</h6>
                  <span className="text-sm text-heading">Envío gratuito en toda Managua</span>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                  <i className="ph-fill ph-chats" />
                </span>
                <div>
                  <h6 className="mb-0">Soporte 24/7</h6>
                  <span className="text-sm text-heading">Envío gratuito en toda Managua</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================== Shipping Section End ============================ */}
    </>
  );
}
