"use client";

import Link from "next/link";
import type { ProductCard as ProductCardType } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useHasMounted } from "@/lib/use-has-mounted";
import { notify } from "@/lib/toast-store";

// Tarjeta de producto portada de shop.html (líneas ~929-960): el layout real
// es un div.product-card suelto (sin wrapper col-* de Bootstrap), porque
// .list-grid-wrapper en main.css ya es un CSS grid propio. Los contenedores
// que usan este componente (/shop, /) deben envolver el map() en un
// <div className="list-grid-wrapper"> (o similar), no en <div className="row">.
// La plantilla original traía una barra de progreso "Sold: X/35" con datos
// de ejemplo inventados; se omitió porque no hay ese dato real en Product.
function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export default function ProductCard({ product }: { product: ProductCardType }) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlisted = useWishlistStore((state) =>
    state.items.some((i) => i.productId === product.id)
  );
  const onSale =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  // El wishlist se hidrata desde localStorage recién después del mount, así
  // que en el primer render del cliente `wishlisted` puede diferir de lo que
  // se renderizó en el servidor (siempre false ahí); useHasMounted evita el
  // hydration mismatch (ver lib/use-has-mounted.ts).
  const mounted = useHasMounted();
  const showWishlisted = mounted && wishlisted;

  return (
    <div className="product-card h-100 p-16 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">
      <Link
        href={`/producto/${product.slug}`}
        className="product-card__thumb flex-center rounded-8 bg-gray-50 position-relative"
      >
        {onSale && (
          <span className="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white position-absolute inset-inline-start-0 inset-block-start-0">
            Oferta
          </span>
        )}
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-100 h-100 object-fit-contain"
          />
        ) : (
          <span className="text-gray-400 text-sm">Sin imagen</span>
        )}
      </Link>
      <button
        type="button"
        aria-label={showWishlisted ? "Quitar de deseos" : "Agregar a deseos"}
        aria-pressed={showWishlisted}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image,
          });
          notify(
            wishlisted
              ? `${product.name} quitado de favoritos`
              : `${product.name} agregado a favoritos`,
            "info"
          );
        }}
        className={`product-card__wishlist w-40 h-40 flex-center rounded-circle text-lg position-absolute inset-inline-end-0 inset-block-start-0 mt-16 me-16 transition-2 ${
          showWishlisted
            ? "bg-main-two-600 text-white"
            : "bg-white text-gray-600 hover-bg-main-two-600 hover-text-white"
        }`}
      >
        <i className={showWishlisted ? "ph-fill ph-heart" : "ph ph-heart"} />
      </button>
      <div className="product-card__content mt-16">
        <h6 className="title text-lg fw-semibold mt-12 mb-8">
          <Link href={`/producto/${product.slug}`} className="link text-line-2">
            {product.name}
          </Link>
        </h6>
        <div className="flex-align mb-20 mt-16 gap-6">
          <span className="text-xs fw-medium text-gray-500">
            {product.ratingAvg.toFixed(1)}
          </span>
          <span className="text-15 fw-medium text-warning-600 d-flex">
            <i className="ph-fill ph-star" />
          </span>
          <span className="text-xs fw-medium text-gray-500">
            ({product.ratingCount})
          </span>
        </div>

        <div className="product-card__price my-20">
          {onSale && (
            <span className="text-gray-400 text-md fw-semibold text-decoration-line-through">
              {" "}
              {formatPrice(product.compareAtPrice as number, product.currency)}
            </span>
          )}{" "}
          <span className="text-heading text-md fw-semibold">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            addItem({
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.image,
            });
            notify(`${product.name} añadido al carrito`);
          }}
          className="product-card__cart btn bg-gray-50 text-heading hover-bg-main-600 hover-text-white py-11 px-24 rounded-8 flex-center gap-8 fw-medium w-100 border-0"
        >
          Agregar al carrito <i className="ph ph-shopping-cart" />
        </button>
      </div>
    </div>
  );
}
