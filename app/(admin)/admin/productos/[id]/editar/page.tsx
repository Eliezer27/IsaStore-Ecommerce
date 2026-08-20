import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/admin/actions";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
  ]);

  if (!product) {
    notFound();
  }

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Editar producto</h4>
          <h6>{product.name}</h6>
        </div>
      </div>

      <ProductForm
        action={boundUpdate}
        categories={categories}
        submitLabel="Guardar cambios"
        initial={{
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          stock: product.stock,
          shortDescription: product.shortDescription,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          imageUrl: product.images[0]?.url ?? null,
        }}
      />
    </>
  );
}
