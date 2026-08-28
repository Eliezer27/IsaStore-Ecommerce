import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { getCategoryTree } from "@/lib/categories";

export const dynamic = "force-dynamic";

// Devuelve los productos que cumplen categoría/subcategoría y precio (todo lo
// que se puede filtrar en la consulta a la base de datos). El filtro de
// rating se aplica después, en memoria, sobre este mismo resultado — así el
// sidebar puede mostrar cuántos productos hay por cada umbral de estrellas
// sin tener que repetir la consulta.
async function getProducts(opts: {
  categoria?: string;
  subcategoria?: string;
  precioMin?: number;
  precioMax?: number;
}): Promise<ProductCardType[]> {
  const { categoria, subcategoria, precioMin, precioMax } = opts;
  try {
    // Si viene subcategoría, se filtra por ese slug exacto (el producto
    // cuelga directo de esa subcategoría). Si solo viene la categoría
    // padre, se incluyen tanto los productos asignados directo a esa
    // categoría como los asignados a cualquiera de sus subcategorías
    // (category.parent.slug === categoria) — así "Ropa" muestra todo lo de
    // Camisas/Blusas, Pantalones, etc. sin tener que entrar a cada una.
    const categoryFilter = subcategoria
      ? { category: { slug: subcategoria } }
      : categoria
        ? { category: { OR: [{ slug: categoria }, { parent: { slug: categoria } }] } }
        : {};

    const priceFilter =
      precioMin !== undefined || precioMax !== undefined
        ? {
            price: {
              ...(precioMin !== undefined ? { gte: precioMin } : {}),
              ...(precioMax !== undefined ? { lte: precioMax } : {}),
            },
          }
        : {};

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...categoryFilter,
        ...priceFilter,
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

// Umbrales del filtro "N estrellas o más". El porcentaje/conteo que se
// muestra junto a cada uno se calcula en el componente a partir de los
// productos ya cargados (ver `ratingBuckets` más abajo) — antes eran
// números de ejemplo inventados que no correspondían a datos reales.
const RATING_THRESHOLDS = [5, 4, 3, 2, 1];

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
  const subcategoria =
    typeof params.subcategoria === "string" ? params.subcategoria : undefined;

  const parsePositiveNumber = (value: unknown) => {
    if (typeof value !== "string" || value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const precioMin = parsePositiveNumber(params.precioMin);
  const precioMax = parsePositiveNumber(params.precioMax);
  const ratingMinRaw = parsePositiveNumber(params.ratingMin);
  const ratingMin =
    ratingMinRaw !== undefined && ratingMinRaw >= 1 && ratingMinRaw <= 5
      ? ratingMinRaw
      : undefined;

  const [productsBeforeRating, categoryTree] = await Promise.all([
    getProducts({ categoria, subcategoria, precioMin, precioMax }),
    getCategoryTree(),
  ]);

  // El rating se filtra en memoria sobre lo que ya trajo la consulta
  // (categoría + precio), así el sidebar puede mostrar cuántos productos
  // caen en cada umbral de estrellas sin repetir el query a la base.
  const products =
    ratingMin !== undefined
      ? productsBeforeRating.filter((p) => p.ratingAvg >= ratingMin)
      : productsBeforeRating;

  const ratingBuckets = RATING_THRESHOLDS.map((stars) => {
    const count = productsBeforeRating.filter((p) => p.ratingAvg >= stars).length;
    const percent =
      productsBeforeRating.length > 0
        ? Math.round((count / productsBeforeRating.length) * 100)
        : 0;
    return { stars, count, percent };
  });

  const hasActiveFilters =
    precioMin !== undefined || precioMax !== undefined || ratingMin !== undefined;
  const clearFiltersHref = `/shop${
    categoria
      ? `?categoria=${categoria}${subcategoria ? `&subcategoria=${subcategoria}` : ""}`
      : ""
  }`;

  const categoriaActual = categoryTree.find((cat) => cat.slug === categoria);
  const subcategoriaActual = categoriaActual?.subcategories.find(
    (sub) => sub.slug === subcategoria
  );

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
              {categoriaActual && subcategoriaActual ? (
                <>
                  <li className="text-sm">
                    <Link
                      href={`/shop?categoria=${categoriaActual.slug}`}
                      className="text-gray-900 hover-text-main-600"
                    >
                      {categoriaActual.name}
                    </Link>
                  </li>
                  <li className="flex-align">
                    <i className="ph ph-caret-right" />
                  </li>
                  <li className="text-sm text-main-600">{subcategoriaActual.name}</li>
                </>
              ) : (
                <li className="text-sm text-main-600">
                  {categoriaActual ? categoriaActual.name : "Tienda"}
                </li>
              )}
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
                    {categoryTree.map((cat) => {
                      const isActiveCategory = categoria === cat.slug;
                      return (
                        <li key={cat.slug} className="mb-24">
                          <Link
                            href={`/shop?categoria=${cat.slug}`}
                            className={
                              isActiveCategory && !subcategoria
                                ? "text-main-600 fw-semibold"
                                : "text-gray-900 hover-text-main-600"
                            }
                          >
                            {cat.name}
                          </Link>
                          {/* Solo se listan las subcategorías de la categoría
                              activa, para no mostrar de una vez las de las 6
                              categorías juntas. */}
                          {isActiveCategory && cat.subcategories.length > 0 && (
                            <ul className="ps-16 mt-12">
                              {cat.subcategories.map((sub) => (
                                <li key={sub.slug} className="mb-12">
                                  <Link
                                    href={`/shop?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                    className={
                                      subcategoria === sub.slug
                                        ? "text-main-600 fw-semibold"
                                        : "text-gray-600 hover-text-main-600"
                                    }
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Un solo form GET cubre precio + rating: al enviar navega a
                    /shop con los query params correspondientes, siguiendo el
                    mismo patrón que categoría/subcategoría (filtrado real por
                    URL, sin depender de JS). Los hidden inputs conservan la
                    categoría/subcategoría actual para no perderla al filtrar. */}
                <form method="get" action="/shop">
                  {categoria && <input type="hidden" name="categoria" value={categoria} />}
                  {subcategoria && (
                    <input type="hidden" name="subcategoria" value={subcategoria} />
                  )}

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">
                      Filtrar por precio
                    </h6>
                    <div className="flex-align gap-12">
                      <input
                        type="number"
                        name="precioMin"
                        min={0}
                        step="1"
                        defaultValue={precioMin ?? ""}
                        placeholder="Mínimo"
                        aria-label="Precio mínimo"
                        className="common-input py-11 px-16"
                      />
                      <span className="text-gray-500">—</span>
                      <input
                        type="number"
                        name="precioMax"
                        min={0}
                        step="1"
                        defaultValue={precioMax ?? ""}
                        placeholder="Máximo"
                        aria-label="Precio máximo"
                        className="common-input py-11 px-16"
                      />
                    </div>
                  </div>

                  <div className="shop-sidebar__box border border-gray-100 rounded-8 p-32 mb-32">
                    <h6 className="text-xl border-bottom border-gray-100 pb-24 mb-24">
                      Filtrar Por raiting
                    </h6>
                    {ratingBuckets.map((bucket) => {
                      const id = `rating${bucket.stars}`;
                      return (
                        <div
                          key={id}
                          className="flex-align gap-8 position-relative mb-20"
                        >
                          <label
                            className="position-absolute w-100 h-100 cursor-pointer"
                            htmlFor={id}
                          >
                            {" "}
                          </label>
                          <div className="common-check common-radio mb-0">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="ratingMin"
                              id={id}
                              value={bucket.stars}
                              defaultChecked={ratingMin === bucket.stars}
                            />
                          </div>
                          <div
                            className="progress w-100 bg-gray-100 rounded-pill h-8"
                            role="progressbar"
                            aria-label={`${bucket.stars} estrellas o más`}
                            aria-valuenow={bucket.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="progress-bar bg-main-600 rounded-pill"
                              style={{ width: `${bucket.percent}%` }}
                            />
                          </div>
                          <div className="flex-align gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`text-xs fw-medium d-flex ${
                                  i < bucket.stars ? "text-warning-600" : "text-gray-400"
                                }`}
                              >
                                <i className="ph-fill ph-star" />
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-900 flex-shrink-0">
                            {bucket.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-align gap-16 flex-wrap mb-32">
                    <button type="submit" className="btn btn-main h-40 flex-align">
                      Filtrar
                    </button>
                    {hasActiveFilters && (
                      <Link href={clearFiltersHref} className="text-sm text-gray-500 hover-text-main-600">
                        Limpiar filtros
                      </Link>
                    )}
                  </div>
                </form>
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
              ) : hasActiveFilters ? (
                <p className="text-gray-500">
                  Ningún producto coincide con esos filtros.{" "}
                  <Link href={clearFiltersHref} className="text-main-600 fw-medium">
                    Quitar filtros
                  </Link>
                  .
                </p>
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
