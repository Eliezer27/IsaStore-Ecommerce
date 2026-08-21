import { prisma } from "@/lib/prisma";
import { deleteProduct } from "@/lib/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

async function getProducts() {
  try {
    return await prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn(
      "[admin/productos] no se pudo cargar la lista (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Productos</h4>
          <h6>Gestiona el catálogo de la tienda</h6>
        </div>
        <div className="page-btn">
          <a href="/admin/productos/nuevo" className="btn btn-added">
            <img src="/admin-assets/img/icons/plus.svg" alt="" className="me-1" />
            Agregar producto
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {products.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">
              No hay productos todavía. Usa &ldquo;Agregar producto&rdquo; para crear el
              primero.
            </p>
          ) : (
          <div className="table-responsive">
            {/* Clase "datanew" solo con filas reales — con la tabla vacía,
                jQuery DataTables se cuelga ("_DT_CellIndex") al inicializarse
                sobre un colspan de placeholder. */}
            <table className="table datanew">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="productimgname">
                      <a href={`/producto/${p.slug}`} target="_blank" className="product-img">
                        {p.images[0]?.url ? (
                          <img src={p.images[0].url} alt={p.name} />
                        ) : (
                          <img src="/admin-assets/img/icon/ICONO.png" alt="" />
                        )}
                      </a>
                      <a href={`/producto/${p.slug}`} target="_blank">
                        {p.name}
                      </a>
                    </td>
                    <td>{p.sku ?? "—"}</td>
                    <td>{p.category?.name ?? "Sin categoría"}</td>
                    <td>
                      {p.currency} {Number(p.price).toFixed(2)}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`badge ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                        {p.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <a className="me-3" href={`/admin/productos/${p.id}/editar`}>
                        <img src="/admin-assets/img/icons/edit.svg" alt="Editar" />
                      </a>
                      <DeleteButton
                        id={p.id}
                        action={deleteProduct}
                        confirmLabel={`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`}
                      />
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
