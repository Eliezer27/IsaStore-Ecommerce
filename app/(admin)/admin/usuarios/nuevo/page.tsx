import { createUser } from "@/lib/admin/actions";

export default function NewUserPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Nuevo usuario</h4>
          <h6>Crear un cliente o administrador</h6>
        </div>
      </div>

      <div className="alert alert-info">
        Todavía no hay sistema de login real en el sitio (NextAuth no está
        instalado), así que este usuario se crea sin contraseña. Sirve para
        llevar el registro de clientes/administradores; el login vendrá
        después.
      </div>

      <div className="card">
        <div className="card-body">
          <form action={createUser}>
            <div className="row">
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" name="firstName" className="form-control" />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input type="text" name="lastName" className="form-control" />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" required />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input type="text" name="phone" className="form-control" />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Rol</label>
                  <select name="role" className="form-control form-select" defaultValue="customer">
                    <option value="customer">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="col-lg-6 col-12 d-flex align-items-end">
                <div className="common-check mb-3">
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      className="form-check-input"
                      defaultChecked
                    />{" "}
                    Activo
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-submit me-2">
              Crear usuario
            </button>
            <a href="/admin/usuarios" className="btn btn-cancel">
              Cancelar
            </a>
          </form>
        </div>
      </div>
    </>
  );
}
