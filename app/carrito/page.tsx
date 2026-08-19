"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(price);
}

export default function CartPage() {
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = useCartStore((state) => state.totalPrice());

  if (lines.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">Tu carrito está vacío</h1>
        <Link href="/shop" className="btn btn-dark mt-3">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="h4 mb-4">Carrito</h1>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.productId}>
                <td className="d-flex align-items-center gap-3">
                  {line.image && (
                    <div
                      className="ratio ratio-1x1 bg-light rounded overflow-hidden"
                      style={{ width: 60 }}
                    >
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="60px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <Link href={`/producto/${line.slug}`} className="text-dark">
                    {line.name}
                  </Link>
                </td>
                <td>{formatPrice(line.price)}</td>
                <td style={{ width: 100 }}>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setQuantity(line.productId, Math.max(1, Number(e.target.value)))
                    }
                    className="form-control"
                  />
                </td>
                <td>{formatPrice(line.price * line.quantity)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeItem(line.productId)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <div className="text-end" style={{ minWidth: 260 }}>
          <p className="fs-5">
            Total: <strong>{formatPrice(totalPrice)}</strong>
          </p>
          <Link href="/checkout" className="btn btn-dark btn-lg">
            Ir a pagar
          </Link>
        </div>
      </div>
    </div>
  );
}
