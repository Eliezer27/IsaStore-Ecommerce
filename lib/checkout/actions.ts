"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  generateOrderNumber,
  parseCartLines,
  persistOrder,
  priceCart,
} from "@/lib/checkout/order";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Estado que devuelve createOrder (para useActionState en
 * app/(site)/checkout/page.tsx): null antes de enviar, { error } si algo
 * falló, { success: true, orderNumber } si el pedido se creó — con eso se
 * muestra el popup de "pago exitoso" y se vacía el carrito.
 */
export type CheckoutFormState =
  | { error: string }
  | { success: true; orderNumber: string }
  | null;

// El checkout tiene dos métodos (ver app/(site)/checkout/page.tsx): "Efectivo
// en tienda" (esta server action) para quien compra en persona, y "PayPal"
// para compras a distancia (ese va por app/api/paypal/*, no por acá).
// "cash_in_store" es un valor libre en la columna payment_method (varchar, no
// un enum de Postgres), así que no requiere migración.
const PAYMENT_METHOD_MAP: Record<string, string> = {
  "efectivo-tienda": "cash_in_store",
};

// ------------------------------------------------------------------
// Crea el pedido pagado en efectivo en tienda. El precio de cada línea se
// recalcula en el servidor con lib/checkout/order.ts (nunca se confía en el
// precio que venga del carrito del cliente).
//
// "Efectivo en tienda" es un pago que ya pasó — la persona entrega el efectivo
// ahí mismo al hacer el pedido — así que el pedido queda con paymentStatus
// "paid" de una vez. (PayPal, en cambio, solo marca "paid" tras capturar el
// pago real; ver app/api/paypal/capture-order/route.ts.)
export async function createOrder(
  _prevState: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Tu sesión expiró. Iniciá sesión de nuevo para completar tu pedido." };
  }

  const cartLines = parseCartLines(str(formData, "cartLines"));
  if (cartLines.length === 0) {
    return { error: "Tu carrito está vacío." };
  }

  const paymentMethod = PAYMENT_METHOD_MAP[str(formData, "payment")];
  if (!paymentMethod) {
    return { error: "Elegí un método de pago válido." };
  }

  const priced = await priceCart(cartLines);
  if ("error" in priced) {
    return { error: priced.error };
  }

  try {
    const orderNumber = generateOrderNumber();
    await persistOrder({
      userId: user.id,
      orderNumber,
      priced,
      paymentMethod,
      paymentStatus: "paid",
      customerNotes: str(formData, "notas") || null,
      shipping: {
        firstName: str(formData, "nombre"),
        lastName: str(formData, "apellido"),
        country: str(formData, "pais") || "Nicaragua",
        city: str(formData, "ciudad"),
        postalCode: str(formData, "codigoPostal"),
        phone: str(formData, "telefono"),
        lat: num(formData, "lat"),
        lng: num(formData, "lng"),
      },
    });

    revalidatePath("/admin/ventas");
    revalidatePath("/admin/reportes");

    return { success: true, orderNumber };
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "No se pudo crear el pedido. Intentá de nuevo.",
    };
  }
}
