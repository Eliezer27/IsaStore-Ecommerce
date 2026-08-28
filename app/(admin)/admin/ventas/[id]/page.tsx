import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning",
  paid: "bg-success",
  processing: "bg-info",
  shipped: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-danger",
  refunded: "bg-secondary",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Transferencia bancaria",
  check: "Cheque",
  cod: "Contra entrega",
  paypal: "PayPal",
  cash_in_store: "Efectivo en tienda",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "No pagado",
  paid: "Pagado",
  failed: "Fallido",
  refunded: "Reembolsado",
};

// "value" viene tipado como Prisma.Decimal en los campos numéricos del
// pedido (subtotal, total, etc.) — Number() lo convierte bien en runtime,
// pero TS no lo sabe si el parámetro está tipado como number|string, así
// que se tipa como unknown acá.
function money(currency: string, value: unknown) {
  return `${currency} ${Number(value).toFixed(2)}`;
}

// "Factura" de un pedido — vista de detalle a la que se llega haciendo clic
// en una fila de /admin/ventas. No genera un PDF: se apoya en el diálogo de
// impresión del navegador (PrintButton) y en las reglas @media print de
// acá abajo, que esconden el header/sidebar del admin para que lo impreso
// sea solo el contenido del pedido — suficiente para que el staff se lo
// muestre o entregue a alguien que retira y paga en efectivo en la tienda.
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order
    .findUnique({
      where: { id },
      include: {
        user: true,
        shippingAddress: true,
        billingAddress: true,
        items: true,
      },
    })
    .catch(() => null);

  if (!order) {
    notFound();
  }

  const customerName =
    [order.shippingAddress?.firstName, order.shippingAddress?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
    order.user?.email ||
    "Cliente invitado";

  const address = order.shippingAddress;

  return (
    <>
      {/* Reglas de impresión: solo para esta página (no afecta el resto
          del admin). "no-print" es la clase de escape para cualquier
          control que no deba salir en el papel (el botón de imprimir, el
          link de "Volver"). */}
      <style>{`
        @media print {
          .header, .sidebar, .no-print { display: none !important; }
          .page-wrapper { margin: 0 !important; }
          .content { padding: 0 !important; }
        }
      `}</style>

      <div className="page-header no-print">
        <div className="page-title">
          <h4>Pedido {order.orderNumber}</h4>
          <h6>Detalle / factura del pedido</h6>
        </div>
        <div className="page-btn d-flex align-items-center">
          <Link href="/admin/ventas" className="btn btn-cancel me-2">
            Volver a Ventas
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between flex-wrap gap-16 mb-32">
            <div>
              <h5 className="mb-4">Pedido {order.orderNumber}</h5>
              <span className="text-muted">
                {new Date(order.createdAt).toLocaleString("es-NI")}
              </span>
            </div>
            <div className="text-end">
              <span className={`badge ${STATUS_BADGE[order.status] ?? "bg-secondary"} mb-8 d-inline-block`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <div>
                <span className="text-muted">Pago: </span>
                <strong>{PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</strong>
                {" — "}
                <span
                  className={
                    order.paymentStatus === "paid" ? "text-success fw-semibold" : "text-muted"
                  }
                >
                  {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="row gy-4 mb-32">
            <div className="col-md-6">
              <h6 className="mb-8">Cliente</h6>
              <p className="mb-0">{customerName}</p>
              {address?.phone && <p className="mb-0">{address.phone}</p>}
              {order.user?.email && <p className="mb-0 text-muted">{order.user.email}</p>}
            </div>
            {address && (address.city || address.country || address.postalCode) && (
              <div className="col-md-6">
                <h6 className="mb-8">Dirección</h6>
                <p className="mb-0">
                  {[address.city, address.country].filter(Boolean).join(", ")}
                </p>
                {address.postalCode && <p className="mb-0">CP: {address.postalCode}</p>}
              </div>
            )}
          </div>

          {order.customerNotes && (
            <div className="mb-32">
              <h6 className="mb-8">Notas del cliente</h6>
              <p className="mb-0">{order.customerNotes}</p>
            </div>
          )}

          <div className="table-responsive mb-32">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-end">Precio unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{money(order.currency, item.unitPrice)}</td>
                    <td className="text-end">{money(order.currency, item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row justify-content-end">
            <div className="col-md-4">
              <div className="d-flex justify-content-between mb-8">
                <span>Subtotal</span>
                <span>{money(order.currency, order.subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-8">
                <span>Envío</span>
                <span>{money(order.currency, order.shippingTotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-8">
                <span>Impuestos</span>
                <span>{money(order.currency, order.taxTotal)}</span>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="d-flex justify-content-between mb-8">
                  <span>Descuento</span>
                  <span>-{money(order.currency, order.discountTotal)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between border-top pt-8 fw-bold">
                <span>Total</span>
                <span>{money(order.currency, order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
