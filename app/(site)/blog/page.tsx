import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch (err) {
    console.warn(
      "[blog] no se pudieron cargar los artículos (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// El carrusel de Instagram (slick.js) del template no se inicializa acá; se
// deja como una fila estática de Bootstrap con las mismas imágenes.
const INSTAGRAM_IMAGES = [
  "/assets/images/thumbs/insta/pub1.jpg",
  "/assets/images/thumbs/insta/pub2.jpg",
  "/assets/images/thumbs/insta/pub3.jpg",
  "/assets/images/thumbs/insta/pub4.jpg",
  "/assets/images/thumbs/insta/pub5.jpg",
];

// Los 4 íconos de "envío" son contenido decorativo sin backend, así que se
// listan acá y se recorren con .map() en vez de copiar el bloque 4 veces.
const SHIPPING_ITEMS = [
  { icon: "ph-car-profile", title: "Envío Gratis" },
  { icon: "ph-hand-heart", title: "Satisfacción 100%" },
  { icon: "ph-credit-card", title: "Pagos Seguros" },
  { icon: "ph-chats", title: "Soporte 24/7" },
];

// Portado de blog.html (líneas ~687-832). Nota: el archivo original del
// template no trae una grilla de tarjetas de artículo (solo breadcrumb +
// slider de Instagram + sección de envío) — main.css solo define
// ".blog-item { margin-bottom: 48px }" sin markup de referencia. Se conservó
// la lógica de datos existente (getPosts/try-catch) y se armó la grilla de
// tarjetas con las clases del sistema de diseño ya usadas en otras páginas
// (border + rounded-16, como en account.html), mapeando sobre los posts
// reales de Prisma.
export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <div className="breadcrumb mb-0 py-26 bg-main-two-50">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Blog</h6>
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
              <li className="text-sm text-main-600"> Blog </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="blog py-80">
        <div className="container container-lg">
          {posts.length > 0 ? (
            <div className="row gy-4">
              {posts.map((post) => (
                <div key={post.id} className="col-md-6 col-lg-4">
                  <div className="blog-item h-100 border border-gray-100 hover-border-main-600 transition-1 rounded-16 overflow-hidden">
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-100"
                        style={{ height: 220, objectFit: "cover" }}
                      />
                    )}
                    <div className="p-24">
                      {post.publishedAt && (
                        <span className="text-sm text-gray-500 mb-8 d-block">
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                      <h6 className="text-lg fw-semibold mb-8">{post.title}</h6>
                      {post.excerpt && <p className="text-gray-500 mb-0">{post.excerpt}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">
              Todavía no hay artículos publicados (tabla <code>blog_posts</code>).
            </p>
          )}
        </div>
      </section>

      <section className="instagram py-12 overflow-hidden">
        <div className="container container-lg">
          <div className="section-heading">
            <div className="flex-between flex-wrap gap-8">
              <div>
                <h5 className="mb-0 text-uppercase">Instagram</h5>
                <p className="text-gray-500">Visita nuestras redes</p>
              </div>
              <Link
                href="/shop"
                className="text-sm fw-semibold text-gray-700 hover-text-main-600 hover-text-decoration-underline"
              >
                Ver todo
              </Link>
            </div>
          </div>

          <div className="row g-3">
            {INSTAGRAM_IMAGES.map((src) => (
              <div key={src} className="col-6 col-md-3 col-lg">
                <div className="instagram-item rounded-24 overflow-hidden position-relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-100" />
                  <a
                    href="https://www.instagram.com"
                    className="w-72 h-72 bg-black bg-opacity-50 text-white text-32 position-absolute top-50 start-50 translate-middle flex-center rounded-circle hover-bg-main-two-600 hover-text-white"
                  >
                    <i className="ph ph-instagram-logo" />
                  </a>
                </div>
              </div>
            ))}
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
