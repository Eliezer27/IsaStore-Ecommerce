import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "@/lib/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";
import SubcategoryFields from "@/components/admin/SubcategoryFields";

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    // Solo las de nivel superior en el nivel de arriba, con sus
    // subcategorías anidadas (parentId) — así la tabla las puede mostrar
    // agrupadas en vez de una lista plana.
    return await prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { products: true } },
        children: {
          include: { _count: { select: { products: true } } },
          orderBy: [{ position: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
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
          <h6>Organiza el catálogo por categoría y subcategoría</h6>
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
                <SubcategoryFields />
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
                  {/* Sin la clase "datanew": ese hook engancha esta tabla a
                      jQuery DataTables (script.js), que espera una fila con
                      el mismo número de columnas por <tr> y no soporta bien
                      filas "extra" como la del form de agregar subcategoría
                      (<td colSpan={4}>) — eso desincroniza el DOM que
                      DataTables manipula del que React espera y termina en
                      errores en cascada ("_DT_CellIndex", warnings de key).
                      Esta lista es corta, así que no hace falta paginación
                      ni buscador de DataTables acá. */}
                  <table className="table">
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
                        <Fragment key={c.id}>
                          <tr>
                            <td className="fw-semibold">{c.name}</td>
                            <td>{c.slug}</td>
                            <td>{c._count.products}</td>
                            <td>
                              <DeleteButton
                                id={c.id}
                                action={deleteCategory}
                                confirmLabel={
                                  c.children.length > 0
                                    ? `¿Eliminar la categoría "${c.name}"? Sus ${c.children.length} subcategoría(s) quedarán sin categoría padre, y los productos que la usaban quedarán sin categoría.`
                                    : `¿Eliminar la categoría "${c.name}"? Los productos que la usaban quedarán sin categoría.`
                                }
                              />
                            </td>
                          </tr>

                          {c.children.map((sub) => (
                            <tr key={sub.id}>
                              <td className="ps-4 text-muted">— {sub.name}</td>
                              <td>{sub.slug}</td>
                              <td>{sub._count.products}</td>
                              <td>
                                <DeleteButton
                                  id={sub.id}
                                  action={deleteCategory}
                                  confirmLabel={`¿Eliminar la subcategoría "${sub.name}"? Los productos que la usaban quedarán sin categoría.`}
                                />
                              </td>
                            </tr>
                          ))}

                          <tr key={`${c.id}-add`}>
                            <td colSpan={4} className="ps-4 pt-0">
                              <details>
                                <summary className="text-main-600" style={{ cursor: "pointer" }}>
                                  + Agregar subcategoría a &quot;{c.name}&quot;
                                </summary>
                                <form
                                  action={createCategory}
                                  className="d-flex gap-2 mt-2 flex-wrap"
                                >
                                  <input type="hidden" name="parentId" value={c.id} />
                                  <input
                                    type="text"
                                    name="name"
                                    className="form-control form-control-sm"
                                    style={{ maxWidth: 280 }}
                                    placeholder="Nombre de la subcategoría"
                                    required
                                  />
                                  <button type="submit" className="btn btn-sm btn-submit">
                                    Agregar
                                  </button>
                                </form>
                              </details>
                            </td>
                          </tr>
                        </Fragment>
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
