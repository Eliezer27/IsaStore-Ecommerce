import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ProductGallery from "@/components/ProductGallery";
import ProductTabs from "@/components/ProductTabs";

export const dynamic = "force-dynamic";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" } },
      },
    });
    return product;
  } catch (err) {
    console.warn(
      "[producto] no se pudo cargar el producto (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const mainImage = product.images[0]?.url ?? null;
  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const onSale = compareAtPrice !== null && compareAtPrice > price;
  const ratingAvg = Number(product.ratingAvg);
  const attributes = (product.attributes ?? {}) as unknown as Record<
    string,
    unknown
  >;

  return (
    <>
      {/* ===================== Breadcrumb ===================== */}
      <div className="breadcrumb mb-0 py-26 bg-color-one">
        <div className="container container-lg">
          <div className="breadcrumb-wrapper flex-between flex-wrap gap-16">
            <h6 className="mb-0">Detalle del producto</h6>
            <ul className="flex-align gap-8 flex-wrap">
              <li className="text-sm">
                <Link href="/" className="text-main-600 flex-align gap-8">
                  <i className="ph ph-house" />
                  Inicio
                </Link>
              </li>
              <li className="flex-align text-gray-500">
                <i className="ph ph-caret-right" />
              </li>
              <li className="text-sm">
                <Link href="/shop" className="text-main-600 flex-align gap-8">
                  Tienda
                </Link>
              </li>
              {product.category && (
                <>
                  <li className="flex-align text-gray-500">
                    <i className="ph ph-caret-right" />
                  </li>
                  <li className="text-sm">
                    <Link
                      href={`/shop?categoria=${product.category.slug}`}
                      className="text-main-600 flex-align gap-8"
                    >
                      {product.category.name}
                    </Link>
                  </li>
                </>
              )}
              <li className="flex-align text-gray-500">
                <i className="ph ph-caret-right" />
              </li>
              <li className="text-sm text-neutral-600">{product.name}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===================== Detalle del producto ===================== */}
      <section className="product-details py-80">
        <div className="container container-lg">
          <div className="row gy-4">
            <div className="col-lg-9">
              <div className="row gy-4">
                <div className="col-xl-6">
                  <ProductGallery
                    images={product.images.map((img) => ({
                      id: img.id,
                      url: img.url,
                      alt: img.alt,
                    }))}
                    productName={product.name}
                  />
                </div>
                <div className="col-xl-6">
                  <div className="product-details__content">
                    <h5 className="mb-12">{product.name}</h5>
                    <div className="flex-align flex-wrap gap-12">
                      <div className="flex-align gap-12 flex-wrap">
                        <div className="flex-align gap-8">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-15 fw-medium d-flex ${
                                i < Math.round(ratingAvg)
                                  ? "text-warning-600"
                                  : "text-gray-200"
                              }`}
                            >
                              <i className="ph-fill ph-star" />
                            </span>
                          ))}
                        </div>
                        <span className="text-sm fw-medium text-neutral-600">
                          {ratingAvg.toFixed(1)}
                        </span>
                        <span className="text-sm fw-medium text-gray-500">
                          ({product.ratingCount})
                        </span>
                      </div>
                      {product.sku && (
                        <>
                          <span className="text-sm fw-medium text-gray-500">
                            |
                          </span>
                          <span className="text-gray-900">
                            {" "}
                            <span className="text-gray-400">SKU:</span>
                            {product.sku}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="mt-32 pt-32 text-gray-700 border-top border-gray-100 d-block" />
                    {product.shortDescription && (
                      <p className="text-gray-700">
                        {product.shortDescription}
                      </p>
                    )}

                    <div className="mt-32 flex-align flex-wrap gap-32">
                      <div className="flex-align gap-8">
                        <h4 className="mb-0">
                          {formatPrice(price, product.currency)}
                        </h4>
                        {onSale && (
                          <span className="text-md text-gray-500 text-decoration-line-through">
                            {formatPrice(
                              compareAtPrice as number,
                              product.currency
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="mt-32 pt-32 text-gray-700 border-top border-gray-100 d-block" />

                    <p
                      className={`fw-medium ${
                        product.stock > 0 ? "text-success-600" : "text-danger-600"
                      }`}
                    >
                      {product.stock > 0
                        ? `En stock (${product.stock} disponibles)`
                        : "Agotado"}
                    </p>

                    <span className="text-gray-900 d-block mb-8">
                      Cantidad:
                    </span>
                    <div className="flex-between gap-16 flex-wrap">
                      <AddToCartButton
                        productId={product.id}
                        name={product.name}
                        slug={product.slug}
                        price={price}
                        image={mainImage}
                      />
                      <div className="flex-align gap-12">
                        <WishlistButton
                          productId={product.id}
                          name={product.name}
                          slug={product.slug}
                          price={price}
                          image={mainImage}
                        />
                      </div>
                    </div>

                    <span className="mt-32 pt-32 text-gray-700 border-top border-gray-100 d-block" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3">
              <div className="product-details__sidebar border border-gray-100 rounded-16 overflow-hidden">
                <div className="p-24 bg-color-one d-flex align-items-start gap-24 border-bottom border-gray-100">
                  <span className="w-44 h-44 bg-white text-main-600 rounded-circle flex-center text-2xl flex-shrink-0">
                    <i className="ph-fill ph-truck" />
                  </span>
                  <div>
                    <h6 className="text-sm mb-8">Entrega rápida</h6>
                    <p className="text-gray-700">
                      Envío garantizado dentro de Nicaragua.
                    </p>
                  </div>
                </div>
                <div className="p-24 bg-color-one d-flex align-items-start gap-24 border-bottom border-gray-100">
                  <span className="w-44 h-44 bg-white text-main-600 rounded-circle flex-center text-2xl flex-shrink-0">
                    <i className="ph-fill ph-arrow-u-up-left" />
                  </span>
                  <div>
                    <h6 className="text-sm mb-8">Cambios y devoluciones</h6>
                    <p className="text-gray-700">
                      Compra con confianza, cambios fáciles.
                    </p>
                  </div>
                </div>
                <div className="p-24 bg-color-one d-flex align-items-start gap-24">
                  <span className="w-44 h-44 bg-white text-main-600 rounded-circle flex-center text-2xl flex-shrink-0">
                    <i className="ph-fill ph-credit-card" />
                  </span>
                  <div>
                    <h6 className="text-sm mb-8">Pago</h6>
                    <p className="text-gray-700">
                      Pago contra entrega o transferencia bancaria.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ProductTabs
            productId={product.id}
            productSlug={product.slug}
            description={product.description}
            attributes={attributes}
            reviews={product.reviews}
            ratingAvg={ratingAvg}
            ratingCount={product.ratingCount}
          />
        </div>
      </section>

      {/*
        ===================== Productos relacionados =====================
        El template original (product-details.html líneas ~1360-1670) tenía
        un slider "You Might Also Like" con tarjetas de ejemplo hardcodeadas
        y un slider de Slick. Todavía no existe lógica de "productos
        relacionados" en Prisma (por ejemplo, por categoría o etiquetas), así
        que se deja fuera a propósito en vez de inventar una query nueva sin
        avisar. Cuando se defina esa lógica, esta sección puede reconstruirse
        reutilizando el markup "product-card" ya portado en /shop.
      */}
    </>
  );
}
