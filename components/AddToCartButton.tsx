"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";

// Control de cantidad + botón "Add To Cart" portado de product-details.html
// (líneas ~903-912): el quantity__minus/quantity__plus del template se
// manejaba con jQuery en main.js; acá se hace con useState. La firma de
// props y la llamada a addItem() se conservan tal cual venían.
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

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () => setQuantity((q) => q + 1);

  return (
    <div className="flex-align flex-wrap gap-16">
      <div className="border border-gray-100 rounded-pill py-9 px-16 flex-align">
        <button
          type="button"
          onClick={decrease}
          className="quantity__minus p-4 text-gray-700 hover-text-main-600 flex-center"
          aria-label="Disminuir cantidad"
        >
          <i className="ph ph-minus" />
        </button>
        <input
          type="number"
          className="quantity__input border-0 text-center w-32"
          value={quantity}
          min={1}
          onChange={(e) =>
            setQuantity(Math.max(1, Number(e.target.value) || 1))
          }
          aria-label="Cantidad"
        />
        <button
          type="button"
          onClick={increase}
          className="quantity__plus p-4 text-gray-700 hover-text-main-600 flex-center"
          aria-label="Aumentar cantidad"
        >
          <i className="ph ph-plus" />
        </button>
      </div>
      <button
        type="button"
        className="btn btn-main rounded-pill flex-align d-inline-flex gap-8 px-48"
        onClick={() => {
          addItem({ productId, name, slug, price, image }, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
      >
        <i className="ph ph-shopping-cart" />
        {added ? "Agregado" : "Agregar al carrito"}
      </button>
    </div>
  );
}
