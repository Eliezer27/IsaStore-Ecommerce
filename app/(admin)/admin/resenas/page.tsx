import { prisma } from "@/lib/prisma";
import { deleteReview } from "@/lib/admin/actions";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

// Las reseñas se publican solas en cuanto el cliente las envía (ver
// createReview en lib/actions.ts) — esta pantalla ya no modera qué se hace
// público. Es de solo lectura, para que el equipo vea qué calificaron y
// qué opinaron de cada producto y tome decisiones de mejora por fuera del
// sistema; la única acción disponible es borrar una reseña puntual si
// hace falta (spam, contenido ofensivo).
async function getReviews() {
  try {
    return await prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn(
      "[admin/resenas] no se pudo cargar la lista (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-warning-600" aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Reseñas</h4>
          <h6>
            Calificaciones y comentarios que dejan los clientes en cada producto —
            se publican solas, esta pantalla es solo para verlas y, si hace falta,
            borrar alguna.
          </h6>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {reviews.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">No hay reseñas todavía.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Calificación</th>
                    <th>Comentario</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.product ? (
                          <a href={`/producto/${r.product.slug}`} target="_blank" rel="noreferrer">
                            {r.product.name}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Stars rating={r.rating} />
                      </td>
                      <td style={{ maxWidth: 320 }}>{r.comment || "—"}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("es-NI")}</td>
                      <td>
                        <DeleteButton
                          id={r.id}
                          action={deleteReview}
                          confirmLabel={`¿Eliminar esta reseña${r.product ? ` de "${r.product.name}"` : ""}? Esta acción no se puede deshacer.`}
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
