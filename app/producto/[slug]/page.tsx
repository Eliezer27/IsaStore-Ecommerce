import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" } },
      },
    });
    return product;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const mainImage = product.images[0]?.url ?? null;
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const onSale = compareAtPrice !== null && compareAtPrice > price;

  return (
    <div className="container py-5">
      <div className="row g-5">
        <div className="col-md-6">
          <div className="ratio ratio-1x1 bg-light rounded overflow-hidden mb-3">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                priority
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-secondary">
                Sin imagen
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="d-flex gap-2">
              {product.images.slice(1, 5).map((img) => (
                <div
                  key={img.id}
                  className="ratio ratio-1x1 bg-light rounded overflow-hidden"
                  style={{ width: 80 }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6">
          {product.category && (
            <p className="text-secondary text-uppercase small mb-1">
              {product.category.name}
            </p>
          )}
          <h1 className="h3">{product.name}</h1>

          {product.ratingCount > 0 && (
            <p className="text-secondary mb-2">
              {Number(product.ratingAvg).toFixed(1)} ★ ({product.ratingCount}{" "}
              reseñas)
            </p>
          )}

          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="fs-4 fw-bold">
              {formatPrice(price, product.currency)}
            </span>
            {onSale && (
              <span className="text-secondary text-decoration-line-through">
                {formatPrice(compareAtPrice as number, product.currency)}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-secondary">{product.shortDescription}</p>
          )}

          <p
            className={`small ${product.stock > 0 ? "text-success" : "text-danger"}`}
          >
            {product.stock > 0
              ? `En stock (${product.stock} disponibles)`
              : "Agotado"}
          </p>

          <AddToCartButton
            productId={product.id}
            name={product.name}
            slug={product.slug}
            price={price}
            image={mainImage}
          />

          {product.description && (
            <div className="mt-4">
              <h6 className="fw-bold">Descripción</h6>
              <p className="text-secondary" style={{ whiteSpace: "pre-line" }}>
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {product.reviews.length > 0 && (
        <div className="row mt-5">
          <div className="col-lg-8">
            <h5 className="fw-bold mb-3">Reseñas</h5>
            {product.reviews.map((review) => (
              <div key={review.id} className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between">
                  <strong>{review.title ?? "Reseña"}</strong>
                  <span>{review.rating} ★</span>
                </div>
                {review.comment && (
                  <p className="text-secondary mb-0">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
