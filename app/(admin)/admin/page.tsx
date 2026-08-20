import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [products, orders, users, revenue] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "paid" },
      }),
    ]);
    return {
      products,
      orders,
      users,
      revenue: Number(revenue._sum.total ?? 0),
      ok: true as const,
    };
  } catch (err) {
    console.warn(
      "[admin/dashboard] no se pudieron cargar las estadísticas (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return { products: 0, orders: 0, users: 0, revenue: 0, ok: false as const };
  }
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
        {cards.map((card) => (
          <div className="col-lg-3 col-sm-6 col-12" key={card.label}>
            <div className="dash-widget">
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
    </>
  );
}
