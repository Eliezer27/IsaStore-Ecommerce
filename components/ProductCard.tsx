import Link from "next/link";
import Image from "next/image";
import type { ProductCard as ProductCardType } from "@/lib/types";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export default function ProductCard({ product }: { product: ProductCardType }) {
  const onSale =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <div className="col-6 col-md-4 col-lg-3">
      <div className="card h-100 border-0 shadow-sm">
        <Link href={`/producto/${product.slug}`} className="text-decoration-none">
          <div className="ratio ratio-1x1 bg-light">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-secondary">
                Sin imagen
              </div>
            )}
          </div>
        </Link>
        <div className="card-body">
          <Link
            href={`/producto/${product.slug}`}
            className="text-decoration-none text-dark"
          >
            <h6 className="card-title mb-1">{product.name}</h6>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">
              {formatPrice(product.price, product.currency)}
            </span>
            {onSale && (
              <span className="text-secondary text-decoration-line-through small">
                {formatPrice(product.compareAtPrice as number, product.currency)}
              </span>
            )}
          </div>
          {product.ratingCount > 0 && (
            <small className="text-secondary">
              {product.ratingAvg.toFixed(1)} ★ ({product.ratingCount})
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
