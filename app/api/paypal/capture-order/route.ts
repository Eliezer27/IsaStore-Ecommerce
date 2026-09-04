import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  generateOrderNumber,
  parseCartLines,
  persistOrder,
  priceCart,
} from "@/lib/checkout/order";
import {
  capturePayPalOrder,
  nioToUsd,
  paypalConfigured,
  PAYPAL_CURRENCY,
} from "@/lib/paypal/client";

type ShippingBody = {
  nombre?: string;
  apellido?: string;
  pais?: string;
  ciudad?: string;
  codigoPostal?: string;
  telefono?: string;
  notas?: string;
  lat?: number | null;
  lng?: number | null;
};

// POST /api/paypal/capture-order
// Lo llama el botón de PayPal (onApprove callback) una vez que el comprador
// aprobó el pago. Captura (cobra) la orden en PayPal y, SOLO si la captura
// vuelve "COMPLETED", crea el pedido en nuestra base con su registro de pago.
//
// El total se vuelve a calcular en el servidor (no se confía en el cliente) y
// se compara contra lo que PayPal efectivamente cobró; el pedido queda
// marcado como pagado.
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

  const body = (await req.json().catch(() => null)) as
    | { paypalOrderId?: unknown; cartLines?: unknown; shipping?: ShippingBody }
    | null;

  const paypalOrderId =
    typeof body?.paypalOrderId === "string" ? body.paypalOrderId : "";
  if (!paypalOrderId) {
    return NextResponse.json({ error: "Falta el id de la orden de PayPal." }, { status: 400 });
  }

  const cartLines = parseCartLines(JSON.stringify(body?.cartLines ?? []));
  const priced = await priceCart(cartLines);
  if ("error" in priced) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }
  const expectedUsd = nioToUsd(priced.subtotal);

  try {
    const captured = await capturePayPalOrder(paypalOrderId);
    const capture = captured.purchase_units?.[0]?.payments?.captures?.[0];

    if (captured.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PayPal no confirmó el pago. No se cobró nada; intentá de nuevo." },
        { status: 402 }
      );
    }

    // Defensa: el monto cobrado debe coincidir con el total recalculado. Si no,
    // registramos igual el pago (el cliente ya pagó) pero dejamos rastro.
    const capturedUsd = capture.amount.value;
    if (capturedUsd !== expectedUsd) {
      console.warn(
        `[paypal] monto cobrado (${capturedUsd} ${capture.amount.currency_code}) != esperado (${expectedUsd} ${PAYPAL_CURRENCY}) — orden PayPal ${paypalOrderId}`
      );
    }

    const shipping = body?.shipping ?? {};
    const orderNumber = generateOrderNumber();
    await persistOrder({
      userId: user.id,
      orderNumber,
      priced,
      paymentMethod: "paypal",
      paymentStatus: "paid",
      customerNotes: shipping.notas || null,
      shipping: {
        firstName: shipping.nombre,
        lastName: shipping.apellido,
        country: shipping.pais || "Nicaragua",
        city: shipping.ciudad,
        postalCode: shipping.codigoPostal,
        phone: shipping.telefono,
        lat: typeof shipping.lat === "number" ? shipping.lat : null,
        lng: typeof shipping.lng === "number" ? shipping.lng : null,
      },
      payment: {
        provider: "paypal",
        providerPaymentId: capture.id,
        amount: Number(capturedUsd),
        currency: capture.amount.currency_code,
        status: "completed",
        rawResponse: captured,
      },
    });

    revalidatePath("/admin/ventas");
    revalidatePath("/admin/reportes");

    return NextResponse.json({ success: true, orderNumber });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error && err.message
            ? err.message
            : "No se pudo completar el pago con PayPal.",
      },
      { status: 502 }
    );
  }
}
