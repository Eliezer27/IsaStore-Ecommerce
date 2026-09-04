import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Lógica compartida de checkout, usada por dos flujos distintos:
//   - lib/checkout/actions.ts  → "Efectivo en tienda" (server action)
//   - app/api/paypal/*         → PayPal (Orders API v2)
//
// El punto clave es que el precio de cada línea SIEMPRE se recalcula acá con
// lo que hay en la base de datos ahora mismo — nunca se confía en el precio
// que venga del carrito del cliente (vive en localStorage, podría estar
// desactualizado o manipulado). Así el total cobrado coincide con el catálogo
// real, sin importar por qué método se pague.

export type CartLineInput = { productId: string; quantity: number };

export function parseCartLines(raw: string): CartLineInput[] {
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

export function generateOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timePart}-${randomPart}`;
}

export type PricedOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PricedCart = { orderItemsData: PricedOrderItem[]; subtotal: number };

/** Toma las líneas del carrito, busca los productos activos en la base y
 * devuelve las líneas ya valoradas al precio actual más el subtotal (en NIO).
 * Devuelve { error } si el carrito quedó sin ningún producto válido. */
export async function priceCart(
  cartLines: CartLineInput[]
): Promise<PricedCart | { error: string }> {
  if (cartLines.length === 0) {
    return { error: "Tu carrito está vacío." };
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
    .filter((item): item is PricedOrderItem => item !== null);

  if (orderItemsData.length === 0) {
    return {
      error: "Ninguno de los productos de tu carrito está disponible. Actualizá tu carrito.",
    };
  }

  const subtotal = orderItemsData.reduce((sum, item) => sum + item.total, 0);
  return { orderItemsData, subtotal };
}

export type ShippingInput = {
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/** Registro de pago para la tabla Payment (solo pasarelas reales, ej. PayPal).
 * El monto va en la moneda con la que se cobró (USD para PayPal), que puede
 * diferir de la moneda del pedido (NIO). */
export type PaymentRecordInput = {
  provider: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  // Respuesta cruda de la pasarela (para auditoría). Se guarda tal cual en la
  // columna Json; el cast a InputJsonValue se hace al escribir, en persistOrder.
  rawResponse: unknown;
};

/** Persiste el pedido completo (dirección + orden + líneas y, opcionalmente,
 * el registro de pago) en una sola transacción. El total se guarda en NIO,
 * igual que el catálogo. */
export async function persistOrder(params: {
  userId: string;
  orderNumber: string;
  priced: PricedCart;
  paymentMethod: string;
  paymentStatus: string;
  customerNotes?: string | null;
  shipping: ShippingInput;
  payment?: PaymentRecordInput;
}): Promise<void> {
  const { userId, orderNumber, priced, paymentMethod, paymentStatus, shipping, payment } =
    params;

  await prisma.$transaction(async (tx) => {
    const address = await tx.address.create({
      data: {
        userId,
        firstName: shipping.firstName || null,
        lastName: shipping.lastName || null,
        country: shipping.country || "Nicaragua",
        city: shipping.city || null,
        postalCode: shipping.postalCode || null,
        phone: shipping.phone || null,
        lat: shipping.lat ?? null,
        lng: shipping.lng ?? null,
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: priced.subtotal,
        total: priced.subtotal,
        currency: "NIO",
        shippingAddressId: address.id,
        billingAddressId: address.id,
        paymentMethod,
        paymentStatus,
        customerNotes: params.customerNotes || null,
        items: { create: priced.orderItemsData },
      },
    });

    if (payment) {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          rawResponse: payment.rawResponse as Prisma.InputJsonValue,
        },
      });
    }
  });
}
