"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { notify } from "@/lib/toast-store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(price);
}

// Página de carrito portada de cart.html (líneas ~690-1046 del template
// original). Se conserva toda la lógica del store de Zustand (lines,
// setQuantity, removeItem, totalPrice); solo se reemplazó el JSX para usar
// el markup/clases reales del template (breadcrumb, tabla "style-three",
// caja de cupón, sidebar de totales y franja de "shipping").
export default function CartPage() {
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = useCartStore((state) => state.totalPrice());

  if (lines.length === 0) {
    return (
      <>
        <div className="breadcrumb mb-0 py-26 bg-main-two-50">
          <div className="container container-lg">
            <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
              <h6 className="mb-0">Carrito</h6>
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
                <li className="text-sm text-main-600"> Carrito de productos </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container container-lg py-80 text-center">
          <h6 className="mb-24">Tu carrito está vacío</h6>
          <Link href="/shop" className="btn btn-main py-18 px-40 rounded-8">
            Ir a la tienda
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ========================= Breadcrumb Start =============================== */}
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Carrito</h6>
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
              <li className="text-sm text-main-600"> Carrito de productos </li>
            </ul>
          </div>
        </div>
      </div>
      {/* ========================= Breadcrumb End =============================== */}

      {/* ================================ Cart Section Start ================================ */}
      <section className="cart py-80">
        <div className="container container-lg">
          <div className="row gy-4">
            <div className="col-xl-9 col-lg-8">
              <div className="cart-table border border-gray-100 rounded-8 px-40 py-48">
                <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                  <table className="table style-three">
                    <thead>
                      <tr>
                        <th className="h6 mb-0 text-lg fw-bold">Eliminar</th>
                        <th className="h6 mb-0 text-lg fw-bold">Nombre del Producto</th>
                        <th className="h6 mb-0 text-lg fw-bold">Precio</th>
                        <th className="h6 mb-0 text-lg fw-bold">Cantidad</th>
                        <th className="h6 mb-0 text-lg fw-bold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.productId}>
                          <td>
                            <button
                              type="button"
                              className="remove-tr-btn flex-align gap-12 hover-text-danger-600"
                              onClick={() => {
                                removeItem(line.productId);
                                notify(`${line.name} eliminado del carrito`, "info");
                              }}
                            >
                              <i className="ph ph-x-circle text-2xl d-flex" />
                              Eliminar
                            </button>
                          </td>
                          <td>
                            <div className="table-product d-flex align-items-center gap-24">
                              <Link
                                href={`/producto/${line.slug}`}
                                className="table-product__thumb border border-gray-100 rounded-8 flex-center"
                              >
                                {line.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={line.image} alt={line.name} />
                                )}
                              </Link>
                              <div className="table-product__content text-start">
                                <h6 className="title text-lg fw-semibold mb-8">
                                  <Link href={`/producto/${line.slug}`} className="link text-line-2" tabIndex={0}>
                                    {line.name}
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-lg h6 mb-0 fw-semibold">{formatPrice(line.price)}</span>
                          </td>
                          <td>
                            <div className="d-flex rounded-4 overflow-hidden">
                              <button
                                type="button"
                                className="quantity__minus border border-end border-gray-100 flex-shrink-0 h-48 w-48 text-neutral-600 flex-center hover-bg-main-600 hover-text-white"
                                onClick={() => setQuantity(line.productId, Math.max(1, line.quantity - 1))}
                              >
                                <i className="ph ph-minus" />
                              </button>
                              <input
                                type="number"
                                className="quantity__input flex-grow-1 border border-gray-100 border-start-0 border-end-0 text-center w-32 px-4"
                                value={line.quantity}
                                min={1}
                                onChange={(e) =>
                                  setQuantity(line.productId, Math.max(1, Number(e.target.value)))
                                }
                              />
                              <button
                                type="button"
                                className="quantity__plus border border-end border-gray-100 flex-shrink-0 h-48 w-48 text-neutral-600 flex-center hover-bg-main-600 hover-text-white"
                                onClick={() => setQuantity(line.productId, line.quantity + 1)}
                              >
                                <i className="ph ph-plus" />
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="text-lg h6 mb-0 fw-semibold">
                              {formatPrice(line.price * line.quantity)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4">
              <div className="cart-sidebar border border-gray-100 rounded-8 px-24 py-40">
                <h6 className="text-xl mb-32">Totales del Carrito</h6>
                <div className="bg-color-three rounded-8 p-24">
                  <div className="mb-32 flex-between gap-8">
                    <span className="text-gray-900 font-heading-two">Subtotal</span>
                    <span className="text-gray-900 fw-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="mb-0 flex-between gap-8">
                    <span className="text-gray-900 font-heading-two">Entrega Estimada</span>
                    <span className="text-gray-900 fw-semibold">Gratis</span>
                  </div>
                </div>
                <div className="bg-color-three rounded-8 p-24 mt-24">
                  <div className="flex-between gap-8">
                    <span className="text-gray-900 text-xl fw-semibold">Total</span>
                    <span className="text-gray-900 text-xl fw-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <Link href="/checkout" className="btn btn-main mt-40 py-18 w-100 rounded-8">
                  Proceder al Pago
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ================================ Cart Section End ================================ */}

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
                  <span className="text-sm text-heading">Envío gratuito en todo EE.UU.</span>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                  <i className="ph-fill ph-hand-heart" />
                </span>
                <div>
                  <h6 className="mb-0">100% Satisfacción</h6>
                  <span className="text-sm text-heading">Garantía en todo EE.UU.</span>
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
                  <span className="text-sm text-heading">Protección en cada transacción</span>
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
                  <span className="text-sm text-heading">Estamos aquí para ti siempre</span>
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
