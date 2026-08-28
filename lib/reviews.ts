import { prisma } from "@/lib/prisma";

/**
 * Recalcula Product.ratingAvg/ratingCount a partir de las reseñas de ese
 * producto. Se llama cada vez que se crea o se borra una reseña — es el
 * único lugar que toca esos dos campos.
 *
 * Compartido entre lib/actions.ts (createReview, público) y
 * lib/admin/actions.ts (deleteReview, admin) para no duplicar la lógica.
 * No tiene "use server" porque no es una Server Action en sí misma — es un
 * helper que las Server Actions de esos dos archivos llaman directamente.
 */
export async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}
