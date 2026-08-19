import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as ProductCardType } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "Ropa", slug: "ropa" },
  { name: "Cadenas y Llaveros", slug: "cadenas-y-llaveros" },
  { name: "Peluches y Juguetes", slug: "peluches-y-juguetes" },
  { name: "Collares", slug: "collares" },
  { name: "Maquillaje", slug: "maquillaje" },
  { name: "Accesorios", slug: "accesorios" },
];

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
  } catch {
    // Sin base de datos conectada todavía: se muestra el catálogo vacío en
    // vez de tumbar la página.
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: PageProps<"/shop">) {
  const params = await searchParams;
  const categoria =
    typeof params.categoria === "string" ? params.categoria : undefined;

  const products = await getProducts(categoria);

  return (
    <div className="container py-5">
      <div className="row">
        <aside className="col-lg-3 mb-4">
          <h6 className="fw-bold mb-3">Categorías</h6>
          <ul className="list-unstyled">
            <li className="mb-2">
              <Link
                href="/shop"
                className={`text-decoration-none ${!categoria ? "fw-bold text-dark" : "text-secondary"}`}
              >
                Todas
              </Link>
            </li>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug} className="mb-2">
                <Link
                  href={`/shop?categoria=${cat.slug}`}
                  className={`text-decoration-none ${categoria === cat.slug ? "fw-bold text-dark" : "text-secondary"}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h4 mb-0">Tienda</h1>
            <span className="text-secondary">{products.length} productos</span>
          </div>

          {products.length > 0 ? (
            <div className="row g-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-secondary">
              No hay productos {categoria ? "en esta categoría" : "todavía"}.
              Revisa que la base de datos esté conectada y tenga productos
              activos (<code>products.is_active = true</code>).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
