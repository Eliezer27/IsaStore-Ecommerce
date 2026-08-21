"use client";

import { usePathname } from "next/navigation";

// Nota sobre navegación: se usan <a> normales (no next/link) a propósito en
// todo el admin. La plantilla original es un sitio multi-página clásico
// (jQuery + script.js corriendo de nuevo en cada carga), y ese es justo el
// modelo con el que funciona bien acá: cada click hace una recarga completa,
// así que datatables/select2/sweetalert/slimscroll se inicializan limpios en
// cada página, igual que en el HTML original. Si se usara next/link (SPA
// navigation) esos plugins de jQuery no se re-inicializarían al cambiar de
// página y todo se vería "muerto" a partir de la segunda navegación.

type NavLink = { href: string; label: string };
type NavSection = {
  label: string;
  icon: string;
  href?: string; // si tiene href, es un link directo (sin submenu)
  links?: NavLink[];
};

const NAV: NavSection[] = [
  { label: "Dashboard", icon: "dashboard.svg", href: "/admin" },
  {
    label: "Productos",
    icon: "product.svg",
    links: [
      { href: "/admin/productos", label: "Lista de productos" },
      { href: "/admin/productos/nuevo", label: "Agregar producto" },
      { href: "/admin/productos/categorias", label: "Categorías" },
    ],
  },
  {
    label: "Ventas",
    icon: "sales1.svg",
    href: "/admin/ventas",
  },
  {
    label: "Usuarios",
    icon: "users1.svg",
    links: [
      { href: "/admin/usuarios", label: "Lista de usuarios" },
      { href: "/admin/usuarios/nuevo", label: "Nuevo usuario" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu" className="sidebar-menu">
          <ul>
            {NAV.map((section) => {
              if (section.href) {
                const active = pathname === section.href;
                return (
                  <li key={section.label} className={active ? "active" : ""}>
                    <a href={section.href}>
                      <img src={`/admin-assets/img/icons/${section.icon}`} alt="" />
                      <span> {section.label}</span>
                    </a>
                  </li>
                );
              }

              const sectionActive = section.links?.some((l) => pathname.startsWith(l.href));
              return (
                <li key={section.label} className={`submenu ${sectionActive ? "active" : ""}`}>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    <img src={`/admin-assets/img/icons/${section.icon}`} alt="" />
                    <span> {section.label}</span>
                    <span className="menu-arrow" />
                  </a>
                  <ul style={sectionActive ? { display: "block" } : undefined}>
                    {section.links?.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className={pathname === link.href ? "active" : ""}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
