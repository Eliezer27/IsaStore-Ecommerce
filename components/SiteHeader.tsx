"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { CATEGORIES } from "@/lib/categories";

// Header portado de la plantilla original (index-three.html, líneas
// ~190-1088): dos barras (header-middle con logo/búsqueda/iconos, y header
// con categorías + menú), usando las clases reales de main.css.
//
// Lo que main.js hacía con jQuery (togglear "active"/"d-none" al hacer
// click) se hace acá con useState — el resultado visual es el mismo, sin
// necesitar jQuery. Se quitaron los selectores de idioma/moneda (Eng/USD)
// del demo original, que no aplican a esta tienda.
export default function SiteHeader() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

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
                    {CATEGORIES.map((cat) => (
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
                  </span>
                  <span className="text-md text-white item-hover__text d-none d-lg-flex">
                    Deseos
                  </span>
                </Link>
                <Link href="/carrito" className="flex-align flex-column gap-8 item-hover-two">
                  <span className="text-2xl text-white d-flex position-relative me-6 mt-6 item-hover__text">
                    <i className="ph ph-shopping-cart-simple" />
                    {totalItems > 0 && (
                      <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                        {totalItems}
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
              <div className="category-two">
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
                    {CATEGORIES.map((cat) => (
                      <li key={cat.slug} className="has-submenus-submenu">
                        <Link
                          href={`/shop?categoria=${cat.slug}`}
                          className="text-gray-500 text-15 py-12 px-16 flex-align gap-8 rounded-0"
                        >
                          <span>{cat.name}</span>
                          <span className="icon text-md d-flex ms-auto">
                            <i className="ph ph-caret-right" />
                          </span>
                        </Link>
                        <div className="submenus-submenu py-16">
                          <h6 className="text-lg px-16 submenus-submenu__title">
                            {cat.name}
                          </h6>
                          <ul className="submenus-submenu__list max-h-300 overflow-y-auto scroll-sm">
                            {cat.subcategories.map((sub) => (
                              <li key={sub}>
                                <Link href={`/shop?categoria=${cat.slug}`}>{sub}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
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
                      {CATEGORIES.map((cat) => (
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
                    </span>
                  </Link>
                  <Link href="/carrito" className="flex-align flex-column gap-8 item-hover-two">
                    <span className="text-2xl text-gray-800 d-flex position-relative item-hover__text">
                      <i className="ph ph-shopping-cart-simple" />
                      {totalItems > 0 && (
                        <span className="w-16 h-16 flex-center rounded-circle bg-main-two-600 text-white text-xs position-absolute top-n6 end-n4">
                          {totalItems}
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
