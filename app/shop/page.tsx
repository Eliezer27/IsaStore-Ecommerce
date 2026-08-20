import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

async function getProducts(categoria?: string): Promise<ProductCardType[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoria ? { category: { slug: categoria } } : {}),
      },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      currency: p.currency,
      image: p.images[0]?.url ?? null,
      ratingAvg: Number(p.ratingAvg),
      ratingCount: p.ratingCount,
    }));
  } catch (err) {
    // Sin base de datos conectada todavía: se muestra el catálogo vacío en
    // vez de tumbar la página.
    console.warn(
      "[shop] no se pudieron cargar productos (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

// Filtro de calificación de shop.html (líneas ~761-843): en la plantilla
// original eran 5 bloques casi idénticos con porcentajes y conteos de
// ejemplo inventados. Se resumen acá como datos para poder usar .map().
// Es un filtro puramente visual todavía: no hay agregación real de ratings
// por producto en la consulta, así que los radios no filtran nada (igual
// que en el HTML original, que tampoco tenía JS de filtrado real).
const RATING_FILTERS = [
  { id: "rating5", stars: 5, percent: 70, count: 124 },
  { id: "rating4", stars: 4, percent: 50, count: 52 },
  { id: "rating3", stars: 3, percent: 35, count: 12 },
  { id: "rating2", stars: 2, percent: 20, count: 5 },
  { id: "rating1", stars: 1, percent: 5, count: 2 },
];

// Sección de envíos/beneficios de shop.html (líneas ~1114-1145): 4 tarjetas
// casi idénticas, resumidas como datos para usar .map(). Se quitaron los
// atributos data-aos/data-aos-duration (AOS no está cargado en este proyecto).
const SHIPPING_ITEMS = [
  {
    icon: "ph-fill ph-car-profile",
    title: "Envío Gratis",
    text: "Envío gratuito en toda Managua",
  },
  {
    icon: "ph-fill ph-hand-heart",
    title: "Satisfacción 100%",
    text: "Envío gratuito en toda Managua",
  },
  {
    icon: "ph-fill ph-credit-card",
    title: "Pagos Seguros",
    text: "Envío gratuito en toda Managua",
  },
  {
    icon: "ph-fill ph-chats",
    title: "Soporte 24/7",
    text: "Envío gratuito en toda Managua",
  },
];

export default async function ShopPage({
  searchParams,
}: PageProps<"/shop">) {
  const params = await searchParams;
  const categoria =
    typeof params.categoria === "string" ? params.categoria : undefined;

  const products = await getProducts(categoria);
  const categoriaActual = CATEGORIES.find((cat) => cat.slug === categoria);

  return (
    <>
      {/* ========================= Breadcrumb ========================= */}
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Tienda</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link
                  href="/"
                  className="text-gray-900 flex-align gap-8 hover-text-main-600"
                >
                  <i className="ph ph-house" />
                  Inicio
                </Link>
              </li>
              <li className="flex-align">
                <i className="ph ph-caret-right" />
              </li>
              <li className="text-sm text-main-600">
                {categoriaActual ? categoriaActual.name : "Tienda"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* =============================== Shop Section =============================== */}
      <section className="shop py-80">
        <div className="container container-lg">
          <div className="row">
            {/* Sidebar Start */}
            {/* El botón móvil "shop-sidebar__close" y el botón "sidebar-btn" (para
                abrir/cerrar el sidebar en móvil) dependían de main.js/jQuery para
                togglear la clase .active; se omiten aquí (sin ese JS cargado, el
                sidebar simplemente se apila arriba del contenido en móvil, que es
                un fallback razonable). */}
            <div className="col-lg-3">
              <div className="shop-sidebar">
                <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                  <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">
                    Categoria de los productos
                  </h6>
                  <ul className="max-h-540 overflow-y-auto scroll-sm">
                    <li className="mb-24">
                      <Link
                        href="/shop"
                        className={
                          !categoria
                            ? "text-main-600 fw-semibold"
                            : "text-gray-900 hover-text-main-600"
                        }
                      >
                        Todas
                      </Link>
                    </li>
                    {CATEGORIES.map((cat) => (
                      <li key={cat.slug} className="mb-24">
                        <Link
                          href={`/shop?categoria=${cat.slug}`}
                          className={
                            categoria === cat.slug
                              ? "text-main-600 fw-semibold"
                              : "text-gray-900 hover-text-main-600"
                          }
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Filtro de precio: en el HTML original el slider lo maneja
                    jQuery UI (#slider-range), que no está cargado en este
                    proyecto. Se deja el bloque visual sin inicializar. */}
                <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                  <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">
                    Filtrar por precio
                  </h6>
                  <div className="custom--range">
                    <div id="slider-range" />
                    <div className="flex-between flex-wrap-reverse gap-8 mt-24">
                      <button type="button" className="btn btn-main h-40 flex-align">
                        Filtrar
                      </button>
                      <div className="custom--range__content flex-align gap-8">
                        <span className="text-gray-500 text-md flex-shrink-0">
                          Precio:
                        </span>
                        <input
                          type="text"
                          className="custom--range__prices text-neutral-600 text-start text-md fw-medium"
                          id="amount"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                  <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">
                    Filtrar Por raiting
                  </h6>
                  {RATING_FILTERS.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex-align gap-8 position-relative mb-20"
                    >
                      <label
                        className="position-absolute w-100 h-100 cursor-pointer"
                        htmlFor={filter.id}
                      >
                        {" "}
                      </label>
                      <div className="common-check common-radio mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="flexRadioDefault"
                          id={filter.id}
                        />
                      </div>
                      <div
                        className="progress w-100 bg-gray-100 rounded-pill h-8"
                        role="progressbar"
                        aria-label="Basic example"
                        aria-valuenow={filter.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="progress-bar bg-main-600 rounded-pill"
                          style={{ width: `${filter.percent}%` }}
                        />
                      </div>
                      <div className="flex-align gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs fw-medium d-flex ${
                              i < filter.stars ? "text-warning-600" : "text-gray-400"
                            }`}
                          >
                            <i className="ph-fill ph-star" />
                          </span>
                        ))}
                      </div>
                      <span className="text-gray-900 flex-shrink-0">
                        {filter.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Sidebar End */}

            {/* Content Start */}
            <div className="col-lg-9">
              {/* Top Start */}
              <div className="flex-between gap-16 flex-wrap mb-40">
                <span className="text-gray-900">
                  {products.length} producto{products.length === 1 ? "" : "s"}
                </span>
                <div className="position-relative flex-align gap-16 flex-wrap">
                  {/* Toggle grid/lista: en el HTML original main.js le cambiaba la
                      clase a .list-grid-wrapper por "list-view" al hacer click.
                      Se deja solo el botón de grid activo (vista por defecto),
                      sin lógica de toggle, para no depender de jQuery. */}
                  <div className="list-grid-btns flex-align gap-16">
                    <button
                      type="button"
                      className="w-44 h-44 flex-center border border-main-600 text-white bg-main-600 rounded-6 text-2xl grid-btn"
                    >
                      <i className="ph ph-squares-four" />
                    </button>
                  </div>
                  <div className="position-relative text-gray-500 flex-align gap-4 text-14">
                    <label htmlFor="sorting" className="text-inherit flex-shrink-0">
                      Ordenar por:{" "}
                    </label>
                    <select
                      className="form-control common-input px-14 py-14 text-inherit rounded-6 w-auto"
                      id="sorting"
                      defaultValue="1"
                    >
                      <option value="1">Populares</option>
                      <option value="2">Recientes</option>
                      <option value="3">Tendencia</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Top End */}

              {products.length > 0 ? (
                <div className="list-grid-wrapper">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No hay productos {categoria ? "en esta categoría" : "todavía"}.
                  Revisa que la base de datos esté conectada y tenga productos
                  activos (<code>products.is_active = true</code>).
                </p>
              )}
              {/* La paginación de shop.html era estática (números de página de
                  ejemplo sin lógica real). Se omite hasta que getProducts()
                  soporte paginación real, para no mostrar controles falsos. */}
            </div>
            {/* Content End */}
          </div>
        </div>
      </section>

      {/* ========================== Shipping Section ========================== */}
      <section className="shipping mb-24" id="shipping">
        <div className="container container-lg">
          <div className="row gy-4">
            {SHIPPING_ITEMS.map((item) => (
              <div key={item.title} className="col-xxl-3 col-sm-6">
                <div className="shipping-item flex-align gap-16 rounded-16 bg-main-50 hover-bg-main-100 transition-2">
                  <span className="w-56 h-56 flex-center rounded-circle bg-main-600 text-white text-32 flex-shrink-0">
                    <i className={item.icon} />
                  </span>
                  <div>
                    <h6 className="mb-0">{item.title}</h6>
                    <span className="text-sm text-heading">{item.text}</span>
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
