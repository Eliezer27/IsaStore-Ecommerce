import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as ProductCardType } from "@/lib/types";

// Se re-renderiza en cada visita: el catálogo cambia seguido y todavía no
// hay una estrategia de revalidación/caché definida.
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "Ropa", slug: "ropa" },
  { name: "Cadenas y Llaveros", slug: "cadenas-y-llaveros" },
  { name: "Peluches y Juguetes", slug: "peluches-y-juguetes" },
  { name: "Collares", slug: "collares" },
  { name: "Maquillaje", slug: "maquillaje" },
  { name: "Accesorios", slug: "accesorios" },
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
  } catch {
    // Sin DATABASE_URL configurada (o base de datos aún vacía) esto falla;
    // se muestra la página igual, solo sin productos destacados.
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <section className="bg-light py-5">
        <div className="container text-center py-4">
          <h1 className="display-5 fw-bold">IsaStore</h1>
          <p className="lead text-secondary">
            Accesorios y regalos para cada ocasión: ropa, cadenas y llaveros,
            peluches, collares, maquillaje y más.
          </p>
          <Link href="/shop" className="btn btn-dark btn-lg mt-2">
            Ver catálogo
          </Link>
        </div>
      </section>

      <section className="container py-5">
        <h2 className="h4 mb-4">Categorías</h2>
        <div className="row g-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.slug} className="col-6 col-md-4 col-lg-2">
              <Link
                href={`/shop?categoria=${cat.slug}`}
                className="d-block border rounded p-3 text-center text-decoration-none text-dark h-100"
              >
                {cat.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5">
        <h2 className="h4 mb-4">Productos destacados</h2>
        {featured.length > 0 ? (
          <div className="row g-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-secondary">
            Todavía no hay productos destacados configurados (o la base de
            datos no está conectada). Ve a{" "}
            <Link href="/shop">/shop</Link> para el catálogo completo.
          </p>
        )}
      </section>
    </>
  );
}
