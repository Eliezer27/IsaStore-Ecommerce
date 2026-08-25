import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "@/lib/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    return await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.warn(
      "[admin/categorias] no se pudo cargar la lista:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Categorías</h4>
          <h6>Organiza el catálogo por categoría</h6>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 col-12 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Nueva categoría</h6>
              <form action={createCategory}>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" name="name" className="form-control" required />
                </div>
                <button type="submit" className="btn btn-submit w-100">
                  Crear categoría
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8 col-12">
          <div className="card">
            <div className="card-body">
              {categories.length === 0 ? (
                <p className="text-center text-muted py-4 mb-0">No hay categorías todavía.</p>
              ) : (
              <div className="table-responsive">
                <table className="table datanew">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Slug</th>
                      <th># Productos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.slug}</td>
                        <td>{c._count.products}</td>
                        <td>
                          <DeleteButton
                            id={c.id}
                            action={deleteCategory}
                            confirmLabel={`¿Eliminar la categoría "${c.name}"? Los productos que la usaban quedarán sin categoría.`}
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
        </div>
      </div>
    </>
  );
}
