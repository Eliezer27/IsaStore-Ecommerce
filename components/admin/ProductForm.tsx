"use client";

import { useActionState, useState } from "react";
import type { ProductFormState } from "@/lib/admin/actions";
import { MAX_UPLOAD_FILE_SIZE_MB } from "@/lib/admin/upload-constants";
import AttributesFields from "./AttributesFields";

type Category = {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
};

export type ProductFormValues = {
  name?: string;
  sku?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  shortDescription?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
  categoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string | null;
};

export default function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => ProductFormState | Promise<ProductFormState>;
  categories: Category[];
  initial?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  // Validación del lado del cliente: avisa apenas se elige el archivo, sin
  // esperar el viaje al servidor. Si el archivo pesa de más, se limpia el
  // input para que no se pueda enviar por error.
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileWarning(null);
      return;
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024) {
      setFileWarning(
        `"${file.name}" pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB — el máximo ` +
          `permitido es ${MAX_UPLOAD_FILE_SIZE_MB}MB. Elegí una imagen más liviana.`
      );
      e.target.value = "";
    } else {
      setFileWarning(null);
    }
  }

  return (
    <form action={formAction} encType="multipart/form-data">
      {state?.error && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">Nombre del producto</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  defaultValue={initial?.name}
                  required
                />
              </div>
            </div>
            <div className="col-lg-6 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  name="sku"
                  className="form-control"
                  defaultValue={initial?.sku ?? ""}
                />
              </div>
            </div>

            <div className="col-lg-4 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  name="categoryId"
                  className="form-control form-select"
                  defaultValue={initial?.categoryId ?? ""}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) =>
                    c.children && c.children.length > 0 ? (
                      <optgroup key={c.id} label={c.name}>
                        {/* Opción para asignar el producto a la categoría
                            padre directamente, sin entrar a una subcategoría
                            específica (no es obligatorio elegir una). */}
                        <option value={c.id}>{c.name} (general)</option>
                        {c.children.map((sub) => (
                          // El label del <optgroup> ("Cadenas y Llaveros")
                          // solo se ve con el <select> abierto — una vez
                          // elegida la opción, el navegador solo muestra el
                          // texto de la opción misma. Por eso el nombre de la
                          // categoría va directo en el texto de la opción,
                          // para que se siga viendo a cuál categoría
                          // pertenece incluso con el menú cerrado.
                          <option key={sub.id} value={sub.id}>
                            {c.name} — {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  className="form-control"
                  defaultValue={initial?.price}
                  required
                />
              </div>
            </div>
            <div className="col-lg-4 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">
                  Precio tachado <span className="text-muted">(oferta, opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="compareAtPrice"
                  className="form-control"
                  defaultValue={initial?.compareAtPrice ?? ""}
                />
              </div>
            </div>

            <div className="col-lg-4 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  className="form-control"
                  defaultValue={initial?.stock ?? 0}
                  required
                />
              </div>
            </div>
            <div className="col-lg-8 col-sm-6 col-12">
              <div className="mb-3">
                <label className="form-label">
                  Imagen del producto <span className="text-muted">(opcional)</span>
                </label>
                {initial?.imageUrl ? (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={initial.imageUrl}
                      alt="Imagen actual"
                      style={{ maxHeight: 80, borderRadius: 6 }}
                    />
                  </div>
                ) : null}
                <div className="row g-2">
                  <div className="col-md-6">
                    <input
                      type="url"
                      name="imageUrl"
                      className="form-control"
                      placeholder="Pegar URL: https://..."
                      defaultValue={initial?.imageUrl ?? ""}
                    />
                    <div className="form-text">Opción A: pega una URL de imagen.</div>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="file"
                      name="imageFile"
                      className={`form-control${fileWarning ? " is-invalid" : ""}`}
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                    />
                    <div className="form-text">
                      Opción B: sube una imagen desde tu dispositivo (
                      <strong>máx. {MAX_UPLOAD_FILE_SIZE_MB}MB</strong>). Si subes un archivo,
                      este reemplaza a la URL de arriba.
                    </div>
                    {fileWarning && (
                      <div className="invalid-feedback d-block">{fileWarning}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="mb-3">
                <label className="form-label">
                  Descripción corta{" "}
                  <span className="text-muted">
                    (resumen de una línea, se usa en listados)
                  </span>
                </label>
                <textarea
                  name="shortDescription"
                  className="form-control"
                  rows={2}
                  defaultValue={initial?.shortDescription ?? ""}
                />
              </div>
            </div>

            <div className="col-12">
              <div className="mb-3">
                <label className="form-label">
                  Descripción del producto{" "}
                  <span className="text-muted">
                    (texto completo que ve el cliente en la pestaña &quot;Descripción&quot;
                    de la ficha del producto)
                  </span>
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={5}
                  defaultValue={initial?.description ?? ""}
                />
              </div>
            </div>

            <div className="col-12">
              <AttributesFields initial={initial?.attributes} />
            </div>

            <div className="col-lg-6 col-12">
              <div className="common-check mb-3">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="form-check-input"
                    defaultChecked={initial?.isActive ?? true}
                  />{" "}
                  Activo (visible en la tienda)
                </label>
              </div>
            </div>
            <div className="col-lg-6 col-12">
              <div className="common-check mb-3">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="form-check-input"
                    defaultChecked={initial?.isFeatured ?? false}
                  />{" "}
                  Destacado
                </label>
              </div>
            </div>
          </div>

          <div className="col-12 mt-3">
            <button type="submit" className="btn btn-submit me-2" disabled={pending}>
              {pending ? "Guardando..." : submitLabel}
            </button>
            <a href="/admin/productos" className="btn btn-cancel">
              Cancelar
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
