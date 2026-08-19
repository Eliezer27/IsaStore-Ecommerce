"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";

export default function AddToCartButton({
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
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="d-flex align-items-center gap-3 mt-3">
      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
        className="form-control"
        style={{ width: 90 }}
        aria-label="Cantidad"
      />
      <button
        type="button"
        className="btn btn-dark flex-grow-1"
        onClick={() => {
          addItem({ productId, name, slug, price, image }, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        {added ? "Agregado ✓" : "Agregar al carrito"}
      </button>
    </div>
  );
}
