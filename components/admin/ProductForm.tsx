type Category = { id: string; name: string };

export type ProductFormValues = {
  name?: string;
  sku?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  shortDescription?: string | null;
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
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  initial?: ProductFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action}>
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
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
                  URL de imagen <span className="text-muted">(opcional)</span>
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  className="form-control"
                  placeholder="https://..."
                  defaultValue={initial?.imageUrl ?? ""}
                />
              </div>
            </div>

            <div className="col-12">
              <div className="mb-3">
                <label className="form-label">Descripción corta</label>
                <textarea
                  name="shortDescription"
                  className="form-control"
                  rows={3}
                  defaultValue={initial?.shortDescription ?? ""}
                />
              </div>
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
            <button type="submit" className="btn btn-submit me-2">
              {submitLabel}
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
