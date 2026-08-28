import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/admin/actions";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    // Solo categorías de nivel superior, con sus subcategorías anidadas —
    // ProductForm arma un <select> con <optgroup> a partir de esto, para
    // poder asignar el producto a una categoría o a una subcategoría
    // específica sin que sea obligatorio.
    return await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: { orderBy: [{ position: "asc" }, { name: "asc" }] },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
  } catch {
    return [];
  }
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Agregar producto</h4>
          <h6>Crea un nuevo producto en el catálogo</h6>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="alert alert-warning">
          Todavía no tienes categorías. Puedes crear el producto sin
          categoría, o{" "}
          <a href="/admin/productos/categorias">crear una categoría primero</a>.
        </div>
      )}

      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Guardar producto"
      />
    </>
  );
}
