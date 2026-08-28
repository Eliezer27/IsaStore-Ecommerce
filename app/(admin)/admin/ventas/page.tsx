import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

async function getOrders() {
  try {
    return await prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch (err) {
    console.warn(
      "[admin/ventas] no se pudo cargar la lista (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function AdminSalesPage() {
  const orders = await getOrders();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Ventas</h4>
          <h6>Pedidos realizados en la tienda</h6>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {orders.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">No hay pedidos todavía.</p>
          ) : (
          <div className="table-responsive">
            <table className="table datanew">
              <thead>
                <tr>
                  <th># Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>
                      {o.user
                        ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() ||
                          o.user.email
                        : "Invitado"}
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString("es-NI")}</td>
                    <td>
                      {o.currency} {Number(o.total).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          o.paymentStatus === "paid" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.status] ?? "bg-secondary"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/ventas/${o.id}`} title="Ver detalle / factura">
                        <img src="/admin-assets/img/icons/eye.svg" alt="Ver" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
