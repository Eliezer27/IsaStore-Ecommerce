import Link from "next/link";

// Portado de wishlist.html (líneas ~687-895): breadcrumb + sección "cart"
// (tabla de producto/precio/estado/acción, igual estructura que carrito.html).
// El HTML original trae 3 filas de productos de ejemplo hardcodeados; como
// todavía no hay wishlist real conectada, se muestra la tabla con su
// encabezado pero un estado vacío en vez de inventar filas de ejemplo.
//
// TODO: conectar a la tabla wishlists (requiere usuario logueado)
export default function WishlistPage() {
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
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100">
                          Estado de Stock
                        </th>
                        <th className="h6 mb-0 text-lg fw-bold px-40 py-32" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="px-40 py-64 text-center">
                          <p className="text-gray-500 mb-16">
                            No tienes favoritos todavía. Explora la tienda y guarda los
                            productos que más te gusten.
                          </p>
                          <Link href="/shop" className="btn btn-main-two rounded-8 px-40">
                            Ir a la tienda
                          </Link>
                        </td>
                      </tr>
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
