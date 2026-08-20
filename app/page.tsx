import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import type { ProductCard as ProductCardType } from "@/lib/types";

// Se re-renderiza en cada visita: el catálogo cambia seguido y todavía no
// hay una estrategia de revalidación/caché definida.
export const dynamic = "force-dynamic";

// ==========================================================================
// Datos de las secciones de relleno/marketing de index-three.html (banner,
// promos, categorías destacadas, marquee de texto y descuentos). Igual que
// en shop.html, se resumen bloques casi idénticos como arrays + .map() en
// vez de repetir el JSX a mano. Las imágenes ya viven en
// public/assets/images/thumbs/isa/ (copiadas junto con el resto de assets).
// ==========================================================================

// Banner Three (líneas ~1092-1298 del HTML original): un slider Slick de 3
// slides. Slick no está cargado en este proyecto, así que en vez de un
// carrusel deslizante se apilan las 3 variantes como bloques estáticos
// (mismo contenido que el original, solo cambia la imagen destacada).
const HERO_SLIDES = [
  {
    image: "/assets/images/thumbs/isa/collares.png",
    tag: "HASTA 50% DE DESCUENTO",
  },
  {
    image: "/assets/images/thumbs/isa/estante1.png",
    tag: "HASTA 50% DE DESCUENTO",
  },
  {
    image: "/assets/images/thumbs/isa/collar1.png",
    tag: "HASTA 50% DE DESCUENTO",
  },
];

// Promotional Banner Three (líneas ~1301-1363).
const PROMO_BANNERS = [
  {
    image: "/assets/images/thumbs/isa/Collar.png",
    eyebrow: "Envío gratis a partir de pedido $150",
    title: "Collar Blanco Colección",
    href: "/shop?categoria=collares",
  },
  {
    image: "/assets/images/thumbs/isa/maquillaje.png",
    eyebrow: "Maquillaje",
    title: "Nuevo Labial por 35% de descuento",
    href: "/shop?categoria=maquillaje",
  },
];

// Feature Three Section "Lo mas popular" (líneas ~1364-1509): en el HTML
// original era un slider Slick de 5 categorías genéricas de la tienda; acá
// se usan las 6 categorías reales de lib/categories.ts (se agregó "Ropa",
// que no aparecía en la plantilla original) y, al no haber slider, se
// muestran todas en una fila con flex-wrap.
const FEATURE_CATEGORIES = [
  {
    slug: "ropa",
    name: "Ropa",
    image: "/assets/images/thumbs/isa/estante2.png",
    bg: "bg-main-two-50",
    items: "150 Items",
  },
  {
    slug: "cadenas-y-llaveros",
    name: "Cadenas y Llaveros",
    image: "/assets/images/thumbs/isa/snoppy llavero.png",
    bg: "bg-danger-light",
    items: "220 Items",
  },
  {
    slug: "peluches-y-juguetes",
    name: "Peluches y Juguetes",
    image: "/assets/images/thumbs/isa/pou.png",
    bg: "bg-yellow-light",
    items: "180 Items",
  },
  {
    slug: "collares",
    name: "Collares",
    image: "/assets/images/thumbs/isa/collar1.png",
    bg: "bg-gray-50",
    items: "195 Items",
  },
  {
    slug: "maquillaje",
    name: "Maquillaje",
    image: "/assets/images/thumbs/isa/gloss.png",
    bg: "bg-success-light",
    items: "128 Items",
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    image: "/assets/images/thumbs/isa/accesorios.png",
    bg: "bg-purple-light",
    items: "205 Items",
  },
];

// Franja de texto en movimiento (líneas ~1511-1564): en el original es un
// marquee infinito por JS; sin ese script, se muestra como una fila con
// flex-wrap.
const MARQUEE_ITEMS = [
  "Ofertas en peluches",
  "Oferta más vendida",
  "Ofertas limitadas de ventas",
  "Colección de Pulseras",
  "Compra ya!!",
  "A sus servicios",
];

// Discount Three (líneas ~2489-2576).
const DISCOUNT_BANNERS = [
  {
    image: "/assets/images/thumbs/isa/patos.png",
    eyebrow: "35% de descuento en todo el pedido",
    title: "Colección de Primavera",
    href: "/shop",
  },
  {
    image: "/assets/images/thumbs/isa/estrellas.png",
    eyebrow: "35% de descuento en todo el pedido",
    title: "Colección de Primavera",
    href: "/shop",
  },
  {
    image: "/assets/images/thumbs/isa/pulseraAnime.png",
    eyebrow: "25% de descuento en todo el pedido",
    title: "Black Friday",
    href: "/shop?categoria=accesorios",
  },
];

// Shipping Section (compartida con /shop, líneas ~1114-1145 de shop.html /
// ~8364-8450 de index-three.html): mismo array que en app/shop/page.tsx.
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

async function getFeaturedProducts(): Promise<ProductCardType[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
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
    // Sin DATABASE_URL configurada (o base de datos aún vacía) esto falla;
    // se muestra la página igual, solo sin productos destacados.
    console.warn(
      "[home] no se pudieron cargar productos destacados (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* ==================== Banner Three ====================
          Slider real con flechas prev/next (ver components/HeroSlider.tsx):
          un slide visible a la vez, igual que el Slick original, en vez de
          los 3 banners apilados uno debajo del otro. */}
      <section className="banner-three bg-img position-relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/shape/star-shape.png"
          alt=""
          className="animation star-shape animation-rotate"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/shape/star-shape.png"
          alt=""
          className="animation star-shape style-two animation-rotate"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/shape/line-shape.png"
          alt=""
          className="animation line-shape opacity-75 animation-rotate"
        />

        <h1 className="display-200 text-white opacity-25 position-absolute inset-inline-end-0 inset-block-end-0 mb-0 line-height-73">
          IsaStore!
        </h1>

        <div className="container container-lg">
          <HeroSlider slides={HERO_SLIDES} />
        </div>
      </section>

      {/* ==================== Promotional Banner Three ==================== */}
      <section className="promo-three pt-120 overflow-hidden">
        <div className="container container-lg">
          <div className="row gy-4">
            {PROMO_BANNERS.map((promo) => (
              <div key={promo.title} className="col-sm-6">
                <div
                  className="promo-three-item bg-img rounded-16 overflow-hidden"
                  style={{ backgroundImage: `url(${promo.image})` }}
                >
                  <div className="text-start">
                    <span className="text-white mb-24">{promo.eyebrow}</span>
                    <h2 className="text-white fw-medium mb-0 max-w-375">
                      {promo.title}
                    </h2>
                    <Link
                      href={promo.href}
                      className="btn btn-outline-white d-inline-flex align-items-center rounded-pill gap-8 mt-48"
                    >
                      Explora ahora
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Feature Three Section "Lo mas popular" ====================
          Slider Slick original reemplazado por una fila con flex-wrap (ver
          comentario de FEATURE_CATEGORIES arriba). */}
      <div className="feature feature-three mt-0 py-120 overflow-hidden" id="featureSection">
        <div className="container container-lg">
          <div className="section-heading text-center">
            <h5 className="mb-0 text-uppercase">Lo mas popular</h5>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-32 mt-40">
            {FEATURE_CATEGORIES.map((cat) => (
              <div key={cat.slug} className="feature-item text-center">
                <div
                  className={`feature-item__thumb ${cat.bg} max-w-260 max-h-260 rounded-circle w-100 h-100`}
                >
                  <Link href={`/shop?categoria=${cat.slug}`} className="w-100 h-100 flex-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cat.image} alt={cat.name} />
                  </Link>
                </div>
                <div className="feature-item__content mt-20">
                  <h6 className="text-lg mb-8">
                    <Link href={`/shop?categoria=${cat.slug}`} className="text-inherit">
                      {cat.name}
                    </Link>
                  </h6>
                  <span className="text-sm text-gray-900">{cat.items}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== Franja de texto ====================
          Marquee JS original reemplazado por una fila estática con
          flex-wrap (ver comentario de MARQUEE_ITEMS arriba). */}
      <div className="text-slider-section overflow-hidden bg-neutral-600 py-28">
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-32">
          {MARQUEE_ITEMS.map((item) => (
            <div key={item} className="d-flex flex-nowrap flex-shrink-0 flx-align gap-16">
              <span className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/icon/star-color.png" alt="" />
              </span>
              <h4 className="text-white flex-grow-1 mb-0 fw-medium">{item}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== Discount Three ==================== */}
      <section className="discount-three overflow-hidden py-120">
        <div className="container container-lg">
          <div className="row gy-4">
            {DISCOUNT_BANNERS.map((discount, i) => (
              <div key={i} className="col-xl-4 col-sm-6">
                <div
                  className="discount-three-item bg-img rounded-16 overflow-hidden"
                  style={{ backgroundImage: `url(${discount.image})` }}
                >
                  <div className="text-start">
                    <span className="fw-medium text-neutral-600 mb-4 text-uppercase">
                      {discount.eyebrow}
                    </span>
                    <h6 className="fw-semibold mb-0 max-w-375">{discount.title}</h6>
                    <Link
                      href={discount.href}
                      className="btn btn-black rounded-pill gap-8 mt-32 flex-align d-inline-flex"
                    >
                      Comprar
                      <span className="text-xl d-flex">
                        <i className="ph ph-shopping-cart-simple" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Productos Destacados ====================
          Era "New Arrival Three" (líneas ~2579-7704 del HTML original): un
          bloque con tabs (Todo/Ropa/Collares) llenos de productos de
          ejemplo hardcodeados. Acá se reemplaza por los productos reales de
          getFeaturedProducts() (usando ProductCard) y se quitan las tabs,
          ya que todavía no hay una consulta separada por categoría para
          destacados; se conserva el banner promocional lateral y el
          contenedor real de la sección. */}
      <section className="new-arrival-three py-120 overflow-hidden">
        <div className="container container-lg">
          <div className="section-heading text-center">
            <h5 className="mb-0 text-uppercase">Productos Destacados</h5>
          </div>
          <div className="new-arrival-three-wrapper mt-40">
            <div className="row gy-4">
              <div className="col-xl-4">
                <div className="rounded-24 overflow-hidden border border-main-two-600 p-16 bg-color-three h-100">
                  <div
                    className="bg-img w-100 h-100 min-h-485 rounded-24 overflow-hidden"
                    style={{ backgroundImage: "url(/assets/images/thumbs/isa/labiales.png)" }}
                  >
                    <div className="py-32 pe-32 text-end">
                      <span className="text-uppercase fw-semibold text-neutral-600 text-md">
                        Ofertas navideñas
                      </span>
                      <h5 className="mb-0">Hasta 85% Off</h5>
                      <Link
                        href="/shop?categoria=maquillaje"
                        className="btn btn-black rounded-pill gap-8 mt-32 flex-align d-inline-flex"
                      >
                        Ver tienda
                        <span className="text-xl d-flex">
                          <i className="ph ph-shopping-cart-simple" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-8">
                {featured.length > 0 ? (
                  <div className="list-grid-wrapper">
                    {featured.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Todavía no hay productos destacados configurados (o la
                    base de datos no está conectada). Ve a{" "}
                    <Link href="/shop">/shop</Link> para el catálogo
                    completo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nota: se quitó la sección "Categorías" que iba acá — era una grilla
          genérica que quedó de antes de portar el diseño real, y era
          redundante con "Lo mas popular" (arriba), que ya muestra las mismas
          6 categorías con imagen. */}

      {/* ==================== Shipping Section ====================
          Idéntica a la de /shop (ver SHIPPING_ITEMS arriba). */}
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

      {/* Nota: en index-three.html las secciones "Trending Products",
          "Deals", "Popular Products Three", "Brand Three", "Testimonials" y
          "Newsletter-two" están comentadas (<!-- ... -->) en el HTML
          original, es decir, la plantilla nunca las muestra realmente. Por
          eso no se portan acá: no son contenido vivo del sitio. */}
    </>
  );
}
