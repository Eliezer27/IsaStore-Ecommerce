import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getCurrentAdminUser } from "@/lib/auth/session";

// El proxy (proxy.ts) ya garantiza que quien llega hasta acá está logueado
// (en la sesión de admin/staff, separada de la de tienda — ver
// lib/supabase/server.ts) y tiene role "staff" o "admin" — así que
// getCurrentAdminUser() acá casi nunca debería devolver null. El "!" es
// seguro en ese sentido, pero por las dudas (ej. una sesión que expiró
// justo entre el middleware y el render) se usa un fallback de "invitado"
// en vez de tronar la página entera.
export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminUser();
  const safeUser = user ?? {
    id: "",
    email: null,
    role: "staff" as const,
    firstName: null,
    lastName: null,
  };

  return (
    <div className="main-wrapper">
      <AdminHeader user={safeUser} />
      <AdminSidebar role={safeUser.role} />
      <div className="page-wrapper">
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
