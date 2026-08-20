import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="main-wrapper">
      <AdminHeader />
      <AdminSidebar />
      <div className="page-wrapper">
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
