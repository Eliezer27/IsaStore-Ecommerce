"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Botones de PayPal para el checkout. La lógica de cobro vive en el servidor
// (app/api/paypal/*): este componente solo llama a esos endpoints —
// createOrder pide crear la orden, onApprove pide capturarla. El pedido se
// guarda en nuestra base recién cuando la captura vuelve OK; ahí se dispara
// onSuccess para mostrar el modal de éxito y vaciar el carrito.
//
// Se cobra en USD (PayPal no admite NIO); la conversión del total NIO→USD la
// hace el servidor con la tasa fija de NIO_TO_USD_RATE.

type CartLine = { productId: string; quantity: number };

type Shipping = {
  nombre: string;
  apellido: string;
  pais: string;
  ciudad: string;
  codigoPostal: string;
  telefono: string;
  notas: string;
  lat?: number | null;
  lng?: number | null;
};

export default function PayPalCheckout({
  clientId,
  cartLines,
  shipping,
  onSuccess,
}: {
  clientId: string;
  cartLines: CartLine[];
  shipping: Shipping;
  onSuccess: (orderNumber: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function createOrder(): Promise<string> {
    setError(null);
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartLines }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      throw new Error(data?.error || "No se pudo iniciar el pago con PayPal.");
    }
    return data.id as string;
  }

  async function onApprove(data: { orderID: string }): Promise<void> {
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paypalOrderId: data.orderID, cartLines, shipping }),
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.success) {
      throw new Error(result?.error || "No se pudo completar el pago con PayPal.");
    }
    onSuccess(result.orderNumber as string);
  }

  return (
    <div className="mt-40">
      {error && (
        <div className="alert alert-danger mb-16" role="alert">
          {error}
        </div>
      )}
      <PayPalScriptProvider
        options={{ clientId, currency: "USD", intent: "capture" }}
      >
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            setError(
              err instanceof Error && err.message
                ? err.message
                : "Ocurrió un error con PayPal. Intentá de nuevo."
            );
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
