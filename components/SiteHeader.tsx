"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useHasMounted } from "@/lib/use-has-mounted";
import type { Category } from "@/lib/categories";

// Header portado de la plantilla original (index-three.html, líneas
// ~190-1088): dos barras (header-middle con logo/búsqueda/iconos, y header
// con categorías + menú), usando las clases reales de main.css.
//
// Lo que main.js hacía con jQuery (togglear "active"/"d-none" al hacer
// click) se hace acá con useState — el resultado visual es el mismo, sin
// necesitar jQuery. Se quitaron los selectores de idioma/moneda (Eng/USD)
// del demo original, que no aplican a esta tienda.
//
// Las categorías ya no se importan estáticas: las resuelve el layout
// (app/(site)/layout.tsx) contra la base de datos y las pasa como prop, así
// el mega-menú refleja lo que haya en /admin/productos/categorias.
export default function SiteHeader({ categories }: { categories: Category[] }) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Qué categoría tiene su panel de subcategorías desplegado en el dropdown
  // "Todas las Categorias" (solo aplica en mobile, ver el onClick de abajo).
  const [openCategorySlug, setOpenCategorySlug] = useState<string | null>(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  // El carrito y el wishlist persisten en localStorage y se hidratan recién
  // después del mount, así que en el primer render del cliente estos totales
  // pueden diferir de lo que se renderizó en el servidor (siempre 0 ahí).
  // useHasMounted evita el hydration mismatch (ver lib/use-has-mounted.ts).
  const mounted = useHasMounted();
  const displayTotalItems = mounted ? totalItems : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  return (
    <>
      <header className="header-middle style-two bg-color-neutral">
        <div className="container container-lg">
          <nav className="header-inner flex-between">
            <div className="logo">
              <Link href="/" className="link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/logo/LogoIsa1.png" alt="IsaStore" />
              </Link>
            </div>

            <div className="flex-align gap-16">
              <form action="/shop" className="flex-align flex-wrap form-location-wrapper">
                <div className="search-category style-two d-flex h-48 search-form d-sm-flex d-none">
                  <select
                    name="categoria"
                    className="js-example-basic-single border border-gray-200 border-end-0 rounded-0 border-0"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Todas las Categorias
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="search-form__wrapper position-relative">
                    <input
                      type="text"
                      name="q"
                      className="search-form__input common-input py-13 ps-16 pe-18 rounded-0 border-0"
                      placeholder="Buscar Producto"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-main-two-600 flex-center text-xl text-white flex-shrink-0 w-48 hover-bg-main-two-700 d-lg-flex d-none"
                  >
                    <i className="ph ph-magnifying-glass" />
                  </button>
                </div>
              </form>
            </div>

            <div className="header-right flex-align d-lg-block d-none">
              <div className="header-two-activities flex-align flex-wrap gap-32">
                <Link href="/cuenta" className="flex-align flex-column gap-8 item-hover-two">
                  <span className="text-2xl text-white d-flex position-relative item-hover__text">
                    <i className="ph ph-user" />
                  </span>
                  <span className="text-md text-white item-hover__text d-none d-lg-flex">
                    Perfil
                  </span>
                </Link>
                <Link
                  href="/favoritos"
                  className="flex-align flex-column gap-8 item-hover-two"
                >
                  <span className="text-2xl text-white d-flex position-relative me-6 mt-6 item-hover__text">
                    <i className="ph ph-heart" />
                    {displayWishlistCount > 0 && (
                      <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                        {displayWishlistCount}
                      </span>
                    )}
                  </span>
                  <span className="text-md text-white item-hover__text d-none d-lg-flex">
                    Deseos
                  </span>
                </Link>
                <Link href="/carrito" className="flex-align flex-column gap-8 item-hover-two">
                  <span className="text-2xl text-white d-flex position-relative me-6 mt-6 item-hover__text">
                    <i className="ph ph-shopping-cart-simple" />
                    {displayTotalItems > 0 && (
                      <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                        {displayTotalItems}
                      </span>
                    )}
                  </span>
                  <span className="text-md text-white item-hover__text d-none d-lg-flex">
                    Carrito
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <header className="header bg-white border-bottom border-gray-100">
        <div className="container container-lg">
          <nav className="header-inner d-flex justify-content-between gap-8">
            <div className="flex-align menu-category-wrapper">
              <div
                className="category-two"
                onMouseEnter={() => {
                  // En escritorio (≥992px) el panel se comporta como el
                  // menú "Tienda": aparece al pasar el mouse encima y se
                  // cierra solo al salir, sin necesidad de click. En mobile
                  // no hay hover real, así que ahí se sigue abriendo/
                  // cerrando con click (ver el botón más abajo).
                  if (window.innerWidth >= 992) setCategoryOpen(true);
                }}
                onMouseLeave={() => {
                  if (window.innerWidth >= 992) {
                    setCategoryOpen(false);
                    setOpenCategorySlug(null);
                  }
                }}
              >
                <button
                  type="button"
                  className={`category__button flex-align gap-8 fw-medium bg-main-two-600 p-16 text-white${categoryOpen ? " active" : ""}`}
                  onClick={() => setCategoryOpen((v) => !v)}
                >
                  <span className="icon text-2xl d-xs-flex d-none">
                    <i className="ph ph-dots-nine" />
                  </span>
                  <span className="d-sm-flex d-none">Todas</span> las Categorias
                  <span className="arrow-icon text-xl d-flex">
                    <i className="ph ph-caret-down" />
                  </span>
                </button>

                <div
                  className={`responsive-dropdown common-dropdown nav-submenu p-0 submenus-submenu-wrapper shadow-none border border-gray-100${categoryOpen ? " active" : " d-none"}`}
                >
                  <button
                    type="button"
                    className="close-responsive-dropdown rounded-circle text-xl position-absolute inset-inline-end-0 inset-block-start-0 mt-4 me-8 d-flex"
                    onClick={() => setCategoryOpen(false)}
                    aria-label="Cerrar categorías"
                  >
                    <i className="ph ph-x" />
                  </button>

                  <div className="logo px-16 d-lg-none d-block">
                    <Link href="/" className="link">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/images/logo/logo.png" alt="IsaStore" />
                    </Link>
                  </div>

                  <ul className="scroll-sm p-0 py-8 overflow-y-auto">
                    {categories.map((cat) => {
                      const hasSubcategories = cat.subcategories.length > 0;
                      const isOpen = openCategorySlug === cat.slug;
                      return (
                        <li
                          key={cat.slug}
                          className={
                            hasSubcategories
                              ? `has-submenus-submenu${isOpen ? " active" : ""}`
                              : undefined
                          }
                        >
                          <Link
                            href={`/shop?categoria=${cat.slug}`}
                            className="text-gray-500 text-15 py-12 px-16 flex-align gap-8 rounded-0"
                            onClick={(e) => {
                              // En mobile (este dropdown responsive, <992px) el
                              // clic despliega/cierra el panel de subcategorías
                              // en vez de navegar de una — así se puede elegir
                              // una subcategoría antes de salir del menú. En
                              // escritorio no aplica: ahí el panel ya se ve al
                              // pasar el mouse (CSS :hover), así que el link
                              // navega directo como se espera.
                              if (hasSubcategories && window.innerWidth < 992) {
                                e.preventDefault();
                                setOpenCategorySlug((s) => (s === cat.slug ? null : cat.slug));
                              }
                            }}
                          >
                            <span>{cat.name}</span>
                            {hasSubcategories && (
                              <span className="icon text-md d-flex ms-auto">
                                <i className="ph ph-caret-right" />
                              </span>
                            )}
                          </Link>
                          {hasSubcategories && (
                            <div
                              className="submenus-submenu py-16"
                              style={isOpen ? { display: "block" } : undefined}
                            >
                              <Link
                                href={`/shop?categoria=${cat.slug}`}
                                className="text-lg px-16 submenus-submenu__title d-block"
                              >
                                {cat.name}
                              </Link>
                              <ul className="submenus-submenu__list max-h-300 overflow-y-auto scroll-sm">
                                {cat.subcategories.map((sub) => (
                                  <li key={sub.slug}>
                                    <Link
                                      href={`/shop?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                    >
                                      {sub.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className={`header-menu d-lg-block${mobileMenuOpen ? " d-block" : " d-none"}`}>
                <ul className="nav-menu flex-align flex-wrap">
                  <li className="nav-menu__item">
                    <Link href="/" className="nav-menu__link">
                      Inicio
                    </Link>
                  </li>
                  <li className="on-hover-item nav-menu__item has-submenu">
                    <Link href="/shop" className="nav-menu__link">
                      Tienda
                    </Link>
                    <ul className="on-hover-dropdown common-dropdown nav-submenu scroll-sm">
                      {categories.map((cat) => (
                        <li key={cat.slug} className="common-dropdown__item nav-submenu__item">
                          <Link
                            href={`/shop?categoria=${cat.slug}`}
                            className="common-dropdown__link nav-submenu__link hover-bg-neutral-100"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="nav-menu__item">
                    <Link href="/blog" className="nav-menu__link">
                      Blog
                    </Link>
                  </li>
                  <li className="nav-menu__item">
                    <Link href="/contacto" className="nav-menu__link">
                      Contáctanos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="header-right flex-align">
              <div className="d-lg-none d-flex">
                <div className="header-two-activities flex-align flex-wrap gap-32">
                  <Link href="/cuenta" className="flex-align flex-column gap-8 item-hover-two">
                    <span className="text-2xl text-gray-800 d-flex position-relative item-hover__text">
                      <i className="ph ph-user" />
                    </span>
                  </Link>
                  <Link
                    href="/favoritos"
                    className="flex-align flex-column gap-8 item-hover-two"
                  >
                    <span className="text-2xl text-gray-800 d-flex position-relative item-hover__text">
                      <i className="ph ph-heart" />
                      {displayWishlistCount > 0 && (
                        <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                          {displayWishlistCount}
                        </span>
                      )}
                    </span>
                  </Link>
                  <Link href="/carrito" className="flex-align flex-column gap-8 item-hover-two">
                    <span className="text-2xl text-gray-800 d-flex position-relative item-hover__text">
                      <i className="ph ph-shopping-cart-simple" />
                      {displayTotalItems > 0 && (
                        <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                          {displayTotalItems}
                        </span>
                      )}
                    </span>
                  </Link>
                </div>
              </div>
              <button
                type="button"
                className="toggle-mobileMenu d-lg-none ms-3n text-gray-800 text-4xl d-flex"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Abrir menú"
              >
                <i className={mobileMenuOpen ? "ph ph-x" : "ph ph-list"} />
              </button>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
