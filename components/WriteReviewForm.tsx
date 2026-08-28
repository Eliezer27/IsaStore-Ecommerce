"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createReview, type ReviewFormState } from "@/lib/actions";

// Formulario "Escribir una reseña" de la pestaña de reseñas del producto
// (ver ProductTabs.tsx). El template original (product-details.html) traía
// este formulario pero sin backend detrás; ahora sí guarda de verdad vía
// createReview() (lib/actions.ts) — la reseña queda pendiente de aprobación
// en /admin/resenas antes de aparecer públicamente y de contar para el
// rating del producto.
export default function WriteReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const action = createReview.bind(null, productId, productSlug);
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    action,
    null
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Al enviarse con éxito, se limpian las estrellas. Esto se ajusta durante
  // el render (comparando contra el último `state` ya manejado) en vez de
  // en un useEffect con setState adentro, que es el patrón que React
  // desaconseja (dispara el lint rule react-hooks/set-state-in-effect).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "success" in state) {
      setRating(0);
      setHoverRating(0);
    }
  }

  // El reset de los campos de texto no controlados (título/comentario) sí
  // necesita tocar el DOM directamente, así que ese sigue en un efecto —
  // pero sin llamar a ningún setState ahí adentro.
  useEffect(() => {
    if (state && "success" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  const displayRating = hoverRating || rating;

  return (
    <div className="mt-40 pt-40 border-top border-gray-100">
      <h6 className="mb-24">Escribir una reseña</h6>

      {state && "success" in state && (
        <div className="alert alert-success" role="status">
          ¡Gracias por tu reseña! Quedará visible en cuanto la revisemos.
        </div>
      )}
      {state && "error" in state && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={formAction}>
        <input type="hidden" name="rating" value={rating} />

        <div className="mb-16">
          <span className="d-block mb-8 text-gray-900">Tu calificación</span>
          <div className="flex-align gap-4" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = value <= displayRating;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} estrella${value === 1 ? "" : "s"}`}
                  className={`text-2xl d-flex border-0 bg-transparent p-0 ${
                    filled ? "text-warning-600" : "text-gray-300"
                  }`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <i className={filled ? "ph-fill ph-star" : "ph ph-star"} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <label className="d-block mb-8 text-gray-900" htmlFor="review-comment">
            Comentario <span className="text-gray-500">(opcional)</span>
          </label>
          <textarea
            id="review-comment"
            name="comment"
            className="common-input"
            rows={4}
            placeholder="Contanos qué te pareció el producto"
          />
        </div>

        <button type="submit" className="btn btn-main rounded-8 px-32" disabled={pending}>
          {pending ? "Enviando..." : "Enviar reseña"}
        </button>
      </form>
    </div>
  );
}
