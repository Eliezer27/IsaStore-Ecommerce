"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { createOrder, type CheckoutFormState } from "@/lib/checkout/actions";
import OrderSuccessModal from "@/components/OrderSuccessModal";
import PayPalCheckout from "@/components/PayPalCheckout";
import DeliveryMap from "@/components/DeliveryMap";
import { notify } from "@/lib/toast-store";

// Si hay un client id público de PayPal cargado, el checkout habilita el
// método PayPal y muestra sus botones; si no, el radio queda inactivo
// ("Próximamente"). El secreto NUNCA está acá — el cobro real lo hacen los
// endpoints de servidor (app/api/paypal/*).
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(price);
}

// Checkout portado de checkout.html (líneas ~687-906): breadcrumb, formulario
// de dirección de envío/facturación, resumen de la orden (leyendo el carrito
// real de lib/cart-store.ts) y método de pago.
//
// Los tres métodos manuales que traía la plantilla (transferencia, cheque,
// contra entrega) se quitaron a pedido — PayPal queda como único método.
// Todavía no hay credenciales reales de PayPal cargadas (PAYPAL_CLIENT_ID
// vacío en .env.local), así que el botón de PayPal se muestra inactivo
// ("Próximamente") en vez de simular una integración que no existe. El
// botón "Realizar Pedido" sí es funcional de verdad para poder probar el
// flujo completo mientras tanto: crea el pedido con payment_method="paypal"
// y payment_status="unpaid" (createOrder en lib/checkout/actions.ts) — el
// cobro real por PayPal se conecta después, cuando haya credenciales.
//
// El mapa para confirmar la dirección de entrega se agregó acá (y no en
// /contacto) porque tiene más sentido mostrarlo cuando el cliente ya está
// haciendo el pedido, no en la página de contacto.
type PaymentMethod = "efectivo-tienda" | "paypal";

export default function CheckoutPage() {
  const lines = useCartStore((state) => state.lines);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const clearCart = useCartStore((state) => state.clear);

  // Con "Efectivo en tienda" no hay envío (la persona retira en persona),
  // así que no tiene sentido pedirle ciudad/código postal ni mostrarle un
  // mapa de "confirma tu dirección de entrega" — se esconden esos campos
  // mientras ese sea el método elegido. Cuando PayPal esté activo de
  // verdad (hoy está deshabilitado, ver más abajo) sí va a implicar envío,
  // así que ahí se vuelven a mostrar.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo-tienda");
  const showShippingFields = paymentMethod !== "efectivo-tienda";
  const paypalEnabled = PAYPAL_CLIENT_ID.length > 0;

  // Éxito del pago con PayPal (flujo aparte del useActionState de efectivo):
  // el endpoint de captura devuelve el orderNumber, que guardamos acá para
  // mostrar el mismo OrderSuccessModal.
  const [paypalOrderNumber, setPaypalOrderNumber] = useState<string | null>(null);

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
  // Coordenadas elegidas en el mapa de Leaflet (DeliveryMap). Viajan al server
  // como campos ocultos del form para guardarse en addresses.lat/lng.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [state, formAction, pending] = useActionState<CheckoutFormState, FormData>(
    createOrder,
    null
  );
  // Una vez cerrado el modal de éxito, no se vuelve a mostrar (el carrito ya
  // quedó vacío).
  const [dismissed, setDismissed] = useState(false);

  const cashOrderNumber = state && "success" in state ? state.orderNumber : null;
  const successOrderNumber = paypalOrderNumber ?? cashOrderNumber;

  // El carrito se vacía cuando el pedido se crea con éxito (efectivo o PayPal).
  // Se hace en un effect (después del render), NO en el cuerpo del componente:
  // llamar a clearCart() durante el render actualizaba el store del carrito
  // mientras React renderizaba CheckoutPage, lo que dispara el error "Cannot
  // update a component (SiteHeader) while rendering CheckoutPage". clearCart es
  // una acción de un store externo (no un setState de este componente), así que
  // usarla en un effect es seguro.
  useEffect(() => {
    if (successOrderNumber) clearCart();
  }, [successOrderNumber, clearCart]);

  // Aviso flotante si el pedido falla (además del alert en línea de abajo).
  useEffect(() => {
    if (state && "error" in state) notify(state.error, "error");
  }, [state]);

  function handleChange(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handlePaypalSuccess(orderNumber: string) {
    setPaypalOrderNumber(orderNumber);
  }

  if (successOrderNumber && !dismissed) {
    return (
      <OrderSuccessModal
        orderNumber={successOrderNumber}
        onClose={() => setDismissed(true)}
      />
    );
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
              {state && "error" in state && (
                <div className="alert alert-danger mb-24" role="alert">
                  {state.error}
                </div>
              )}
              <form id="checkout-form" action={formAction} className="pe-xl-5">
                <input
                  type="hidden"
                  name="cartLines"
                  value={JSON.stringify(
                    lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))
                  )}
                />
                <div className="row gy-3">
                  <div className="col-sm-6 col-xs-6">
                    <input
                      type="text"
                      name="nombre"
                      className="common-input border-gray-100"
                      placeholder="Nombre"
                      value={form.nombre}
                      onChange={handleChange("nombre")}
                    />
                  </div>
                  <div className="col-sm-6 col-xs-6">
                    <input
                      type="text"
                      name="apellido"
                      className="common-input border-gray-100"
                      placeholder="Apellido"
                      value={form.apellido}
                      onChange={handleChange("apellido")}
                    />
                  </div>

                  <div className="col-12">
                    <input
                      type="text"
                      name="pais"
                      className="common-input border-gray-100"
                      placeholder="Nicaragua "
                      value={form.pais}
                      onChange={handleChange("pais")}
                    />
                  </div>

                  {showShippingFields && (
                    <>
                      <div className="col-12">
                        <input
                          type="text"
                          name="ciudad"
                          className="common-input border-gray-100"
                          placeholder="Ciudad"
                          value={form.ciudad}
                          onChange={handleChange("ciudad")}
                        />
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          name="codigoPostal"
                          className="common-input border-gray-100"
                          placeholder="Post Code"
                          value={form.codigoPostal}
                          onChange={handleChange("codigoPostal")}
                        />
                      </div>
                    </>
                  )}
                  <div className="col-12">
                    <input
                      type="number"
                      name="telefono"
                      className="common-input border-gray-100"
                      placeholder="Phone"
                      value={form.telefono}
                      onChange={handleChange("telefono")}
                    />
                  </div>
                  <div className="col-12">
                    <input
                      type="email"
                      name="email"
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
                  {/* Mapa interactivo (Leaflet, sin API key) para que el
                      cliente confirme el punto exacto de entrega. Las
                      coordenadas elegidas viajan al server en los campos
                      ocultos lat/lng y se guardan en addresses.lat/lng. */}
                  {showShippingFields && (
                    <div className="col-12">
                      <div className="mb-8 mt-8">
                        <h6 className="text-lg mb-16">Confirma tu ubicación de entrega</h6>
                        <DeliveryMap value={coords} onChange={setCoords} />
                        {coords && (
                          <>
                            <input type="hidden" name="lat" value={coords.lat} />
                            <input type="hidden" name="lng" value={coords.lng} />
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="my-40">
                      <h6 className="text-lg mb-24">Informacion adicional</h6>
                      <input
                        type="text"
                        name="notas"
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
                    {/* Nota sobre "form={"checkout-form"}": estos controles viven en la
                        barra lateral (checkout-sidebar), que está por fuera del <form>
                        de la izquierda — igual que el botón de "Realizar Pedido" más
                        abajo, necesitan asociarse al form por id explícitamente o su
                        valor nunca viaja en el submit. */}
                    <div className="payment-item">
                      <div className="form-check common-check common-radio py-16 mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment"
                          id="payment-efectivo"
                          value="efectivo-tienda"
                          form="checkout-form"
                          checked={paymentMethod === "efectivo-tienda"}
                          onChange={() => setPaymentMethod("efectivo-tienda")}
                        />
                        <label
                          className="form-check-label fw-semibold text-neutral-600"
                          htmlFor="payment-efectivo"
                        >
                          Efectivo en tienda
                        </label>
                      </div>
                      <div className="payment-item__content px-16 py-24 rounded-8 bg-main-50 position-relative">
                        <p className="text-gray-800 mb-0">
                          Pagás en efectivo cuando pasás a retirar tu pedido en la tienda. Tu
                          pedido queda registrado y te contactamos para coordinar la entrega.
                        </p>
                      </div>
                    </div>
                    <div className="payment-item">
                      <div className="form-check common-check common-radio py-16 mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment"
                          id="payment-paypal"
                          value="paypal"
                          form="checkout-form"
                          checked={paymentMethod === "paypal"}
                          onChange={() => setPaymentMethod("paypal")}
                          disabled={!paypalEnabled}
                        />
                        <label
                          className="form-check-label fw-semibold text-neutral-600 flex-align gap-8"
                          htmlFor="payment-paypal"
                        >
                          PayPal
                          {!paypalEnabled && (
                            <span className="badge bg-gray-100 text-gray-600 fw-medium">
                              Próximamente
                            </span>
                          )}
                        </label>
                      </div>
                      <div className="payment-item__content px-16 py-24 rounded-8 bg-main-50 position-relative">
                        <p className="text-gray-800 mb-0">
                          {paypalEnabled
                            ? "Pagá con tu cuenta de PayPal o tarjeta. El cobro se hace en dólares (USD)."
                            : "Todavía no está activo el cobro con PayPal. Por ahora elegí “Efectivo en tienda” si vas a pagar en persona."}
                        </p>
                      </div>
                    </div>
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

                  {paymentMethod === "paypal" && paypalEnabled ? (
                    <PayPalCheckout
                      clientId={PAYPAL_CLIENT_ID}
                      cartLines={lines.map((l) => ({
                        productId: l.productId,
                        quantity: l.quantity,
                      }))}
                      shipping={{ ...form, lat: coords?.lat ?? null, lng: coords?.lng ?? null }}
                      onSuccess={handlePaypalSuccess}
                    />
                  ) : (
                    <button
                      type="submit"
                      form="checkout-form"
                      className="btn btn-main mt-40 py-18 w-100 rounded-8 mt-56"
                      disabled={pending}
                    >
                      {pending ? "Procesando..." : "Realizar Pedido"}
                    </button>
                  )}
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
