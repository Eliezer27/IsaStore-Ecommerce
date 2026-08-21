import { prisma } from "@/lib/prisma";
import AdminSalesChart from "@/components/admin/AdminSalesChart";
import DashIcon from "@/components/admin/DashIcon";

export const dynamic = "force-dynamic";

type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  currency: string;
  images: { url: string }[];
};

async function getStats() {
  try {
    const [
      products,
      orders,
      users,
      revenue,
      categories,
      pendingOrders,
      pendingReviews,
      newsletterSubs,
      recentProducts,
      paidOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid" } }),
      prisma.category.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.newsletterSubscriber.count(),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1, orderBy: { position: "asc" } } },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "paid" },
        select: { total: true, createdAt: true },
        take: 1000,
      }),
    ]);

    return {
      products,
      orders,
      users,
      revenue: Number(revenue._sum.total ?? 0),
      categories,
      pendingOrders,
      pendingReviews,
      newsletterSubs,
      recentProducts: recentProducts as RecentProduct[],
      paidOrders,
      ok: true as const,
    };
  } catch (err) {
    console.warn(
      "[admin/dashboard] no se pudieron cargar las estadísticas (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return {
      products: 0,
      orders: 0,
      users: 0,
      revenue: 0,
      categories: 0,
      pendingOrders: 0,
      pendingReviews: 0,
      newsletterSubs: 0,
      recentProducts: [] as RecentProduct[],
      paidOrders: [] as { total: unknown; createdAt: Date }[],
      ok: false as const,
    };
  }
}

const MES_LABEL = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// Últimos 6 meses (incluyendo el actual), con la suma real de pedidos
// pagados en cada uno. Se calcula en JS en vez de con SQL crudo para no
// depender de sintaxis específica de Postgres — con el volumen de una
// tienda como esta, agregarlo en memoria es más que suficiente.
function monthlySales(paidOrders: { total: unknown; createdAt: Date }[]) {
  const now = new Date();
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MES_LABEL[d.getMonth()],
      total: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const o of paidOrders) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.total += Number(o.total);
  }
  return months;
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { icon: "product.svg", value: stats.products, label: "Productos activos" },
    { icon: "sales1.svg", value: stats.orders, label: "Pedidos totales" },
    {
      icon: "dinero.svg",
      value: `C$${stats.revenue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      label: "Ventas pagadas",
    },
    { icon: "users1.svg", value: stats.users, label: "Usuarios registrados" },
  ];

  const quickCounts = [
    { modifier: "", icon: "grid", value: stats.categories, label: "Categorías" },
    { modifier: "das1", icon: "clock", value: stats.pendingOrders, label: "Pedidos pendientes" },
    { modifier: "das2", icon: "star", value: stats.pendingReviews, label: "Reseñas por aprobar" },
    { modifier: "das3", icon: "mail", value: stats.newsletterSubs, label: "Suscriptores newsletter" },
  ];

  const months = monthlySales(stats.paidOrders as { total: unknown; createdAt: Date }[]);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Dashboard</h4>
          <h6>Resumen general de IsaStore</h6>
        </div>
      </div>

      {!stats.ok && (
        <div className="alert alert-warning">
          No se pudo conectar a la base de datos — se muestran ceros. Revisa{" "}
          <code>DATABASE_URL</code> en <code>.env.local</code>.
        </div>
      )}

      <div className="row">
        {cards.map((card, i) => (
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
        {quickCounts.map((c) => (
          <div className="col-lg-3 col-sm-6 col-12 d-flex" key={c.label}>
            <div className={`dash-count ${c.modifier}`}>
              <div className="dash-counts">
                <h4>{c.value}</h4>
                <h5>{c.label}</h5>
              </div>
              <div className="dash-imgs">
                <DashIcon name={c.icon} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-7 col-sm-12 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0">
              <h5 className="card-title mb-0">Ventas por mes</h5>
            </div>
            <div className="card-body">
              <AdminSalesChart
                labels={months.map((m) => m.label)}
                values={months.map((m) => m.total)}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5 col-sm-12 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header pb-0">
              <h4 className="card-title mb-0">Productos recientes</h4>
            </div>
            <div className="card-body">
              {stats.recentProducts.length === 0 ? (
                <p className="text-center text-muted py-3 mb-0">Sin productos todavía.</p>
              ) : (
                <div className="table-responsive dataview">
                  {/* Clase "datatable" solo cuando hay filas reales: la
                      plantilla la inicializa con jQuery DataTables, que se
                      cuelga ("_DT_CellIndex") si la tabla no tiene más que
                      una fila vacía de placeholder. */}
                  <table className="table datatable">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentProducts.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td className="productimgname">
                            {p.images[0]?.url ? (
                              <a className="product-img" href={`/producto/${p.slug}`} target="_blank">
                                <img src={p.images[0].url} alt={p.name} />
                              </a>
                            ) : null}
                            <a href={`/admin/productos/${p.id}/editar`}>{p.name}</a>
                          </td>
                          <td>
                            {p.currency} {Number(p.price).toFixed(2)}
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
