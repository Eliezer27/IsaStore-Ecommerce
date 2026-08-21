import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUsers() {
  try {
    return await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  } catch (err) {
    console.warn(
      "[admin/usuarios] no se pudo cargar la lista (¿DATABASE_URL conectada?):",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Usuarios</h4>
          <h6>Clientes y administradores registrados</h6>
        </div>
        <div className="page-btn">
          <a href="/admin/usuarios/nuevo" className="btn btn-added">
            <img src="/admin-assets/img/icons/plus.svg" alt="" className="me-1" />
            Nuevo usuario
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {users.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">No hay usuarios todavía.</p>
          ) : (
          <div className="table-responsive">
            <table className="table datanew">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone ?? "—"}</td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "bg-primary" : "bg-secondary"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}>
                        {u.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("es-NI")}</td>
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
