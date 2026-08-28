"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
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

// Dos métodos en el checkout (ver app/(site)/checkout/page.tsx): "Efectivo
// en tienda" para quien compra en persona (activo, es el que queda
// seleccionado por default) y "PayPal" para compras a distancia (se
// muestra pero deshabilitado — "Próximamente" — hasta que haya
// credenciales reales en PAYPAL_CLIENT_ID/SECRET). "cash_in_store" es un
// valor nuevo que no estaba en el comentario original del schema
// (bank_transfer | check | cod | paypal) — la columna es un varchar libre,
// no un enum de Postgres, así que agregar un valor nuevo no requiere
// migración.
const PAYMENT_METHOD_MAP: Record<string, string> = {
  "efectivo-tienda": "cash_in_store",
  paypal: "paypal",
};

type CartLineInput = { productId: string; quantity: number };

function parseCartLines(raw: string): CartLineInput[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLineInput =>
          l &&
          typeof l.productId === "string" &&
          Number.isFinite(l.quantity) &&
          l.quantity > 0
      )
      .map((l) => ({ productId: l.productId, quantity: Math.floor(l.quantity) }));
  } catch {
    return [];
  }
}

function generateOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timePart}-${randomPart}`;
}

// ------------------------------------------------------------------
// Crea el pedido de verdad (antes /checkout no guardaba nada — el botón
// "Realizar Pedido" solo hacía preventDefault, por eso Ventas/Reportes en
// el admin estaban siempre vacíos). Los tres métodos de pago que tiene el
// checkout (transferencia, cheque, contra entrega) son todos "manuales": no
// hay pasarela de por medio, así que el pedido queda creado con
// payment_status "unpaid" — alguien del staff lo marca como pagado más
// adelante cuando confirme el depósito/cheque/entrega (todavía no hay UI
// para eso en /admin/ventas, es un paso futuro).
//
// El precio de cada línea se recalcula acá con lo que hay en la base de
// datos AHORA MISMO (no se confía en el precio que venga del carrito del
// cliente, que vive en localStorage y podría estar desactualizado o, en
// teoría, manipulado) — así el total cobrado siempre coincide con el
// catálogo real.
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

  const paymentMethodRaw = str(formData, "payment");
  const paymentMethod = PAYMENT_METHOD_MAP[paymentMethodRaw];
  if (!paymentMethod) {
    return { error: "Elegí un método de pago válido." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: cartLines.map((l) => l.productId) }, isActive: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const orderItemsData = cartLines
    .map((line) => {
      const product = productById.get(line.productId);
      if (!product) return null;
      const unitPrice = Number(product.price);
      return {
        productId: product.id,
        productName: product.name,
        quantity: line.quantity,
        unitPrice,
        total: unitPrice * line.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderItemsData.length === 0) {
    return {
      error: "Ninguno de los productos de tu carrito está disponible. Actualizá tu carrito.",
    };
  }

  const subtotal = orderItemsData.reduce((sum, item) => sum + item.total, 0);

  // "Efectivo en tienda" es un pago que ya pasó — la persona entrega el
  // efectivo ahí mismo al hacer el pedido, no es "págalo cuando te
  // entreguen" (eso sería más parecido a contra entrega, que no es una
  // opción hoy). Por eso el pedido queda con paymentStatus "paid" de una
  // vez. PayPal, en cambio, todavía no cobra nada de verdad (está
  // deshabilitado en la UI hasta tener credenciales reales), así que se
  // sigue creando como "unpaid".
  const paymentStatus = paymentMethod === "cash_in_store" ? "paid" : "unpaid";

  const firstName = str(formData, "nombre");
  const lastName = str(formData, "apellido");
  const country = str(formData, "pais") || "Nicaragua";
  const city = str(formData, "ciudad");
  const postalCode = str(formData, "codigoPostal");
  const phone = str(formData, "telefono");
  const customerNotes = str(formData, "notas");

  try {
    const orderNumber = generateOrderNumber();

    await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          userId: user.id,
          firstName: firstName || null,
          lastName: lastName || null,
          country,
          city: city || null,
          postalCode: postalCode || null,
          phone: phone || null,
        },
      });

      await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          subtotal,
          total: subtotal,
          currency: "NIO",
          shippingAddressId: address.id,
          billingAddressId: address.id,
          paymentMethod,
          paymentStatus,
          customerNotes: customerNotes || null,
          items: { create: orderItemsData },
        },
      });
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
