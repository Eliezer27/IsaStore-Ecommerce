"use client";

import Link from "next/link";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { notify } from "@/lib/toast-store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(price);
}

// Portado de wishlist.html (líneas ~687-895): breadcrumb + tabla de
// producto/precio/acción, misma estructura que carrito.html. Conectada al
// wishlist-store (localStorage, ver lib/wishlist-store.ts) — mismo patrón
// que app/(site)/carrito/page.tsx con el cart-store, sin necesitar login.
export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.remove);
  const addToCart = useCartStore((state) => state.addItem);

  return (
    <>
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Deseos</h6>
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
              <li className="text-sm text-main-600"> Deseos </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="cart py-80">
        <div className="container container-lg">
          <div className="row gy-4">
            <div className="col-lg-11">
              <div className="cart-table border border-gray-100 rounded-8">
                <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                  <table className="table rounded-8 overflow-hidden">
                    <thead>
                      <tr className="border-bottom border-neutral-100">
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100">
                          Eliminar
                        </th>
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100">
                          Nombre del producto
                        </th>
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100">
                          Precio Unitario
                        </th>
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-40 py-64 text-center">
                            <p className="text-gray-500 mb-16">
                              No tienes favoritos todavía. Explora la tienda y guarda los
                              productos que más te gusten.
                            </p>
                            <Link href="/shop" className="btn btn-main-two rounded-8 px-40">
                              Ir a la tienda
                            </Link>
                          </td>
                        </tr>
                      ) : (
                        items.map((item) => (
                          <tr key={item.productId} className="border-bottom border-neutral-100">
                            <td className="px-40 py-24 border-end border-neutral-100">
                              <button
                                type="button"
                                className="remove-tr-btn flex-align gap-12 hover-text-danger-600"
                                onClick={() => {
                                  removeItem(item.productId);
                                  notify(`${item.name} quitado de favoritos`, "info");
                                }}
                                aria-label={`Quitar ${item.name} de deseos`}
                              >
                                <i className="ph ph-x-circle text-2xl d-flex" />
                                Eliminar
                              </button>
                            </td>
                            <td className="px-40 py-24 border-end border-neutral-100">
                              <div className="table-product d-flex align-items-center gap-24">
                                <Link
                                  href={`/producto/${item.slug}`}
                                  className="table-product__thumb border border-gray-100 rounded-8 flex-center"
                                >
                                  {item.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image} alt={item.name} />
                                  )}
                                </Link>
                                <div className="table-product__content text-start">
                                  <h6 className="title text-lg fw-semibold mb-0">
                                    <Link href={`/producto/${item.slug}`} className="link text-line-2">
                                      {item.name}
                                    </Link>
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td className="px-40 py-24 border-end border-neutral-100">
                              <span className="text-lg h6 mb-0 fw-semibold">
                                {formatPrice(item.price)}
                              </span>
                            </td>
                            <td className="px-40 py-24">
                              <button
                                type="button"
                                className="btn btn-main rounded-8 px-24 py-11 flex-align gap-8"
                                onClick={() => {
                                  addToCart({
                                    productId: item.productId,
                                    name: item.name,
                                    slug: item.slug,
                                    price: item.price,
                                    image: item.image,
                                  });
                                  notify(`${item.name} añadido al carrito`);
                                }}
                              >
                                <i className="ph ph-shopping-cart" />
                                Agregar al carrito
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
