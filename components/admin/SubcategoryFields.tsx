"use client";

import { useState } from "react";

// Lista de subcategorías opcionales para el form "Nueva categoría" de
// /admin/productos/categorias. Vive como client component solo para poder
// agregar/quitar filas de texto (useState); los <input name="subcategoryNames">
// que renderiza siguen siendo parte del <form action={createCategory}> del
// padre (server action), así que igual llegan en el FormData al enviar —
// no hace falta levantar estado hacia arriba.
export default function SubcategoryFields() {
  const [rows, setRows] = useState<number[]>([0]);
  const [nextId, setNextId] = useState(1);

  return (
    <div className="mb-3">
      <label className="form-label">
        Subcategorías <span className="text-muted">(opcional)</span>
      </label>
      {rows.map((rowId, i) => (
        <div key={rowId} className="d-flex gap-2 mb-2">
          <input
            type="text"
            name="subcategoryNames"
            className="form-control"
            placeholder={`Subcategoría ${i + 1} (opcional)`}
          />
          {rows.length > 1 && (
            <button
              type="button"
              className="btn btn-outline-danger"
              aria-label="Quitar subcategoría"
              onClick={() => setRows((r) => r.filter((id) => id !== rowId))}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => {
          setRows((r) => [...r, nextId]);
          setNextId((n) => n + 1);
        }}
      >
        + Agregar otra subcategoría
      </button>
      <div className="form-text">
        Déjalo vacío si todavía no quieres agregar subcategorías — se pueden agregar
        después desde la tabla de abajo.
      </div>
    </div>
  );
}
