import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { parseCartLines, priceCart, generateOrderNumber } from "@/lib/checkout/order";
import { createPayPalOrder, nioToUsd, paypalConfigured } from "@/lib/paypal/client";

// POST /api/paypal/create-order
// Lo llama el botón de PayPal (createOrder callback) desde el checkout. Recibe
// las líneas del carrito, recalcula el total en el servidor (NIO), lo convierte
// a USD (PayPal no admite NIO) y crea la orden en PayPal. Devuelve el id de la
// orden de PayPal, que el botón usa para que el comprador apruebe el pago.
//
// Acá NO se crea nada en nuestra base todavía: el pedido se guarda recién
// cuando el pago se captura con éxito (app/api/paypal/capture-order).
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: "El pago con PayPal no está configurado." },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tu sesión expiró. Iniciá sesión de nuevo para completar tu pedido." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as { cartLines?: unknown } | null;
  const cartLines = parseCartLines(JSON.stringify(body?.cartLines ?? []));

  const priced = await priceCart(cartLines);
  if ("error" in priced) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  try {
    const amountUsd = nioToUsd(priced.subtotal);
    const order = await createPayPalOrder({
      amountUsd,
      orderNumber: generateOrderNumber(),
    });
    return NextResponse.json({ id: order.id });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error && err.message
            ? err.message
            : "No se pudo iniciar el pago con PayPal.",
      },
      { status: 502 }
    );
  }
}
