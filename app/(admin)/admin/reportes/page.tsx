import { prisma } from "@/lib/prisma";
import AdminSalesChart from "@/components/admin/AdminSalesChart";

export const dynamic = "force-dynamic";

// Bajo este stock (unidades) un producto activo se considera "stock bajo"
// y aparece en el reporte de inventario.
const LOW_STOCK_THRESHOLD = 5;

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning",
  paid: "bg-success",
  processing: "bg-info",
  shipped: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-danger",
  refunded: "bg-secondary",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Transferencia bancaria",
  check: "Cheque",
  cod: "Contra entrega",
  paypal: "PayPal",
};

const MES_LABEL = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Parsea "YYYY-MM-DD" como medianoche UTC, para no depender del huso
// horario del servidor al armar el filtro de fechas.
function parseISODate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type OrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: unknown;
  createdAt: Date;
};

type OrderItemRow = {
  productId: string | null;
  productName: string;
  quantity: number;
  total: unknown;
};

async function getReportData(desde: Date, hastaFin: Date) {
  try {
    const [orders, orderItems, lowStock, lowStockCount, outOfStockCount] =
      await Promise.all([
        prisma.order.findMany({
          where: { createdAt: { gte: desde, lte: hastaFin } },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            total: true,
            createdAt: true,
          },
          take: 5000,
        }),
        prisma.orderItem.findMany({
          where: {
            order: {
              createdAt: { gte: desde, lte: hastaFin },
              paymentStatus: "paid",
            },
          },
          select: { productId: true, productName: true, quantity: true, total: true },
          take: 5000,
        }),
        prisma.product.findMany({
          where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
          orderBy: { stock: "asc" },
          take: 20,
          select: { id: true, name: true, sku: true, stock: true },
        }),
        prisma.product.count({
          where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        }),
        prisma.product.count({ where: { isActive: true, stock: 0 } }),
      ]);

    return {
      ok: true as const,
      orders: orders as OrderRow[],
      orderItems: orderItems as OrderItemRow[],
      lowStock,
      lowStockCount,
      outOfStockCount,
    };
  } catch (err) {
    console.warn(
      "[admin/reportes] no se pudieron cargar los datos (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return {
      ok: false as const,
      orders: [] as OrderRow[],
      orderItems: [] as OrderItemRow[],
      lowStock: [] as { id: string; name: string; sku: string | null; stock: number }[],
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }
}

// Agrupa por día si el rango es corto (<= ~2 meses) y por mes si es largo,
// para que el gráfico y la tabla no terminen con cientos de barras/filas.
function buildBuckets(desde: Date, hasta: Date) {
  const spanDays = Math.max(
    0,
    Math.round((hasta.getTime() - desde.getTime()) / 86400000)
  );
  const groupBy: "day" | "month" = spanDays > 62 ? "month" : "day";

  const keyOf = (d: Date) =>
    groupBy === "day"
      ? toISODate(d)
      : `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

  const labelOf = (d: Date) =>
    groupBy === "day"
      ? d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", timeZone: "UTC" })
      : `${MES_LABEL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  const buckets: { key: string; label: string; orders: number; revenue: number }[] = [];
  const cursor = new Date(desde);
  while (cursor <= hasta) {
    buckets.push({ key: keyOf(cursor), label: labelOf(cursor), orders: 0, revenue: 0 });
    if (groupBy === "day") {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }
  }

  return { buckets, keyOf };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const params = await searchParams;

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const defaultDesde = new Date(todayUTC);
  defaultDesde.setUTCDate(defaultDesde.getUTCDate() - 29); // últimos 30 días, inclusive

  const desde = parseISODate(params.desde ?? "") ?? defaultDesde;
  const hasta = parseISODate(params.hasta ?? "") ?? todayUTC;
  const hastaFin = new Date(hasta);
  hastaFin.setUTCHours(23, 59, 59, 999);

  const data = await getReportData(desde, hastaFin);

  // --- Ventas por periodo -------------------------------------------------
  const { buckets, keyOf } = buildBuckets(desde, hasta);
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  let ingresosRango = 0;
  let pedidosPagadosRango = 0;
  for (const o of data.orders) {
    const bucket = bucketByKey.get(keyOf(new Date(o.createdAt)));
    if (bucket) bucket.orders += 1;
    if (o.paymentStatus === "paid") {
      const monto = Number(o.total);
      if (bucket) bucket.revenue += monto;
      ingresosRango += monto;
      pedidosPagadosRango += 1;
    }
  }
  const ticketPromedio = pedidosPagadosRango > 0 ? ingresosRango / pedidosPagadosRango : 0;

  // --- Productos más vendidos ----------------------------------------------
  const productAgg = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const item of data.orderItems) {
    const key = item.productId ?? item.productName;
    const entry = productAgg.get(key) ?? { name: item.productName, quantity: 0, revenue: 0 };
    entry.quantity += item.quantity;
    entry.revenue += Number(item.total);
    productAgg.set(key, entry);
  }
  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // --- Estado de pedidos y método de pago -----------------------------------
  const statusAgg = new Map<string, { count: number; revenue: number }>();
  const paymentAgg = new Map<string, number>();
  for (const o of data.orders) {
    const s = statusAgg.get(o.status) ?? { count: 0, revenue: 0 };
    s.count += 1;
    s.revenue += Number(o.total);
    statusAgg.set(o.status, s);

    paymentAgg.set(o.paymentMethod, (paymentAgg.get(o.paymentMethod) ?? 0) + 1);
  }
  const statusRows = [...statusAgg.entries()].sort((a, b) => b[1].count - a[1].count);
  const paymentRows = [...paymentAgg.entries()].sort((a, b) => b[1] - a[1]);
  const totalPedidosRango = data.orders.length;

  const kpis = [
    {
      icon: "dinero.svg",
      value: `C$${ingresosRango.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      label: "Ingresos (rango, pagados)",
    },
    { icon: "sales1.svg", value: totalPedidosRango, label: "Pedidos en el rango" },
    {
      icon: "dollar-square.svg",
      value: `C$${ticketPromedio.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      label: "Ticket promedio",
    },
    { icon: "purchase1.svg", value: data.lowStockCount, label: "Productos con stock bajo" },
  ];

  const quickRanges = [
    { label: "7 días", days: 6 },
    { label: "30 días", days: 29 },
    { label: "90 días", days: 89 },
  ].map((r) => {
    const d = new Date(todayUTC);
    d.setUTCDate(d.getUTCDate() - r.days);
    return { label: r.label, href: `/admin/reportes?desde=${toISODate(d)}&hasta=${toISODate(todayUTC)}` };
  });

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Reportes</h4>
          <h6>Ventas, productos, pedidos e inventario de IsaStore</h6>
        </div>
      </div>

      {!data.ok && (
        <div className="alert alert-warning">
          No se pudo conectar a la base de datos — se muestran ceros. Revisa{" "}
          <code>DATABASE_URL</code> en <code>.env.local</code>.
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">
          <form method="get" className="row align-items-end g-2">
            <div className="col-auto">
              <label className="form-label mb-1">Desde</label>
              <input
                type="date"
                name="desde"
                className="form-control"
                defaultValue={toISODate(desde)}
                max={toISODate(todayUTC)}
              />
            </div>
            <div className="col-auto">
              <label className="form-label mb-1">Hasta</label>
              <input
                type="date"
                name="hasta"
                className="form-control"
                defaultValue={toISODate(hasta)}
                max={toISODate(todayUTC)}
              />
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-submit">
                Filtrar
              </button>
            </div>
            <div className="col-auto ms-auto">
              {quickRanges.map((r) => (
                <a key={r.label} href={r.href} className="btn btn-cancel me-2">
                  {r.label}
                </a>
              ))}
            </div>
          </form>
        </div>
      </div>

      <div className="row">
        {kpis.map((card, i) => (
          <div className="col-lg-3 col-sm-6 col-12" key={card.label}>
            <div className={`dash-widget${i > 0 ? ` dash${i}` : ""}`}>
              <div className="dash-widgetimg">
                <span>
                  <img src={`/admin-assets/img/icons/${card.icon}`} alt="" />
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5>{card.value}</h5>
                <h6>{card.label}</h6>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0">
              <h5 className="card-title mb-0">Ventas por periodo</h5>
            </div>
            <div className="card-body">
              <AdminSalesChart
                labels={buckets.map((b) => b.label)}
                values={buckets.map((b) => Number(b.revenue.toFixed(2)))}
              />

              {buckets.length > 0 && (
                <div className="table-responsive dataview mt-3">
                  <table className={`table datanew${buckets.length > 1 ? " datatable" : ""}`}>
                    <thead>
                      <tr>
                        <th>Periodo</th>
                        <th># Pedidos</th>
                        <th>Ingresos pagados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buckets.map((b) => (
                        <tr key={b.key}>
                          <td>{b.label}</td>
                          <td>{b.orders}</td>
                          <td>C${b.revenue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0">
              <h5 className="card-title mb-0">Productos más vendidos</h5>
            </div>
            <div className="card-body">
              {topProducts.length === 0 ? (
                <p className="text-center text-muted py-3 mb-0">
                  Sin ventas pagadas en este rango.
                </p>
              ) : (
                <div className="table-responsive dataview">
                  <table className="table datatable">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Unidades</th>
                        <th>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={p.name + i}>
                          <td>{i + 1}</td>
                          <td>{p.name}</td>
                          <td>{p.quantity}</td>
                          <td>C${p.revenue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0">
              <h5 className="card-title mb-0">Pedidos por estado y método de pago</h5>
            </div>
            <div className="card-body">
              {statusRows.length === 0 ? (
                <p className="text-center text-muted py-3 mb-0">Sin pedidos en este rango.</p>
              ) : (
                <>
                  <div className="table-responsive dataview">
                    <table className="table datanew">
                      <thead>
                        <tr>
                          <th>Estado</th>
                          <th>Pedidos</th>
                          <th>% del total</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusRows.map(([status, s]) => (
                          <tr key={status}>
                            <td>
                              <span className={`badge ${STATUS_BADGE[status] ?? "bg-secondary"}`}>
                                {status}
                              </span>
                            </td>
                            <td>{s.count}</td>
                            <td>{((s.count / totalPedidosRango) * 100).toFixed(0)}%</td>
                            <td>C${s.revenue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-responsive dataview mt-3">
                    <table className="table datanew">
                      <thead>
                        <tr>
                          <th>Método de pago</th>
                          <th>Pedidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentRows.map(([method, count]) => (
                          <tr key={method}>
                            <td>{PAYMENT_METHOD_LABEL[method] ?? method}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0 d-flex justify-content-between align-items-center flex-wrap">
              <h5 className="card-title mb-0">Inventario — stock bajo</h5>
              <span className="text-muted">
                {data.outOfStockCount} producto(s) agotado(s) · umbral: {LOW_STOCK_THRESHOLD} unidades
              </span>
            </div>
            <div className="card-body">
              {data.lowStock.length === 0 ? (
                <p className="text-center text-muted py-3 mb-0">
                  Ningún producto activo está por debajo del umbral de stock.
                </p>
              ) : (
                <div className="table-responsive dataview">
                  <table className="table datatable">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStock.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.sku ?? "—"}</td>
                          <td>
                            <span className={`badge ${p.stock === 0 ? "bg-danger" : "bg-warning"}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td>
                            <a href={`/admin/productos/${p.id}/editar`} className="btn btn-cancel btn-sm">
                              Editar
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
