"use client";

import { useWishlistStore } from "@/lib/wishlist-store";
import { useHasMounted } from "@/lib/use-has-mounted";

// Botón de "agregar a deseos" para la página de detalle de producto. Mismo
// patrón que AddToCartButton: componente cliente separado porque la página
// (app/(site)/producto/[slug]/page.tsx) es un Server Component que no puede
// usar hooks directamente.
export default function WishlistButton({
  productId,
  name,
  slug,
  price,
  image,
}: {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
}) {
  const toggle = useWishlistStore((state) => state.toggle);
  const wishlisted = useWishlistStore((state) =>
    state.items.some((i) => i.productId === productId)
  );

  // Igual que en ProductCard: el wishlist se hidrata desde localStorage
  // después del mount, así que se evita el hydration mismatch mostrando
  // "no marcado" hasta que el cliente termine de montar.
  const mounted = useHasMounted();
  const showWishlisted = mounted && wishlisted;

  return (
    <button
      type="button"
      aria-label={showWishlisted ? "Quitar de deseos" : "Agregar a deseos"}
      aria-pressed={showWishlisted}
      onClick={() => toggle({ productId, name, slug, price, image })}
      className={`w-52 h-52 text-xl flex-center rounded-circle transition-2 ${
        showWishlisted
          ? "bg-main-two-600 text-white"
          : "bg-main-50 text-main-600 hover-bg-main-600 hover-text-white"
      }`}
    >
      <i className={showWishlisted ? "ph-fill ph-heart" : "ph ph-heart"} />
    </button>
  );
}
