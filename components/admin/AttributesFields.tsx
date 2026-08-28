"use client";

import { useState } from "react";

// Editor de pares clave/valor para Product.attributes (las
// "Especificaciones" que se muestran en la pestaña de descripción del
// producto — ver components/ProductTabs.tsx). Mismo patrón que
// SubcategoryFields.tsx: client component solo para poder agregar/quitar
// filas con useState; los inputs siguen siendo parte del <form action={...}>
// del padre (server action), así que llegan igual en el FormData al enviar.
//
// Se mandan como dos arrays paralelos (attributeKeys / attributeValues) en
// vez de nombres dinámicos tipo attributes[material] porque FormData no
// soporta bien claves anidadas — el server action (lib/admin/actions.ts)
// los zipea de vuelta a un objeto, descartando filas con la clave vacía.
export default function AttributesFields({
  initial,
}: {
  initial?: Record<string, unknown> | null;
}) {
  const initialEntries = Object.entries(initial ?? {});
  const [rows, setRows] = useState<{ id: number; key: string; value: string }[]>(
    initialEntries.length > 0
      ? initialEntries.map(([key, value], i) => ({ id: i, key, value: String(value) }))
      : [{ id: 0, key: "", value: "" }]
  );
  const [nextId, setNextId] = useState(rows.length);

  return (
    <div className="mb-3">
      <label className="form-label">
        Especificaciones <span className="text-muted">(opcional)</span>
      </label>
      {rows.map((row) => (
        <div key={row.id} className="row g-2 mb-2">
          <div className="col-5">
            <input
              type="text"
              name="attributeKeys"
              className="form-control"
              placeholder="Ej: material"
              defaultValue={row.key}
            />
          </div>
          <div className="col-6">
            <input
              type="text"
              name="attributeValues"
              className="form-control"
              placeholder="Ej: acero dorado"
              defaultValue={row.value}
            />
          </div>
          <div className="col-1">
            {rows.length > 1 && (
              <button
                type="button"
                className="btn btn-outline-danger"
                aria-label="Quitar especificación"
                onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => {
          setRows((r) => [...r, { id: nextId, key: "", value: "" }]);
          setNextId((n) => n + 1);
        }}
      >
        + Agregar especificación
      </button>
      <div className="form-text">
        Pares clave/valor que se muestran como lista en la ficha del producto (ej: material —
        acero dorado, protección — UV400). Déjalo vacío si no aplica.
      </div>
    </div>
  );
}
