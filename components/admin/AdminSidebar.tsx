"use client";

import { usePathname } from "next/navigation";

// Nota sobre navegación: se usan <a> normales (no next/link) a propósito en
// todo el admin. La plantilla original es un sitio multi-página clásico
// (jQuery + script.js corriendo de nuevo en cada carga), y ese es justo el
// modelo con el que funciona bien acá: cada click hace una recarga completa,
// así que datatables/select2/sweetalert se inicializan limpios en
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
      {/* Sin la clase "slimscroll": ese plugin de jQuery envuelve este div
          en un wrapper nuevo (.slimScrollDiv) apenas carga la página, por
          fuera de React — cuando React intenta hidratar encima, el DOM ya
          cambió y tira "Hydration failed". overflow-y normal cumple la
          misma función (scroll del menú) sin pelearse con React. */}
      <div className="sidebar-inner" style={{ overflowY: "auto", height: "100%" }}>
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
                  {/* d-flex + marginLeft:auto en la flechita en vez del
                      ::before de Font Awesome que trae la plantilla: ese
                      ícono depende de position:absolute relativo al <a> y
                      de que la fuente de iconos cargue bien, y terminaba
                      renderizándose encimado con el texto. Con flexbox no
                      hay ambigüedad de posición. */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="d-flex align-items-center"
                  >
                    <img src={`/admin-assets/img/icons/${section.icon}`} alt="" />
                    <span> {section.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        marginLeft: "auto",
                        flexShrink: 0,
                        transform: sectionActive ? "rotate(90deg)" : undefined,
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
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
