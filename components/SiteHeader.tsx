"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/shop", label: "Tienda" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

export default function SiteHeader() {
  // totalItems() lee del store; en el primer render de servidor esto es 0,
  // así que puede haber un pequeño "flash" hasta que hidrata en el cliente.
  const totalItems = useCartStore((state) => state.totalItems());

  return (
    <header className="border-bottom bg-white sticky-top">
      <nav className="navbar navbar-expand-lg container py-3">
        <Link href="/" className="navbar-brand fw-bold fs-4">
          IsaStore
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav mx-auto gap-lg-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="nav-item">
                <Link href={link.href} className="nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <Link href="/favoritos" className="nav-link" aria-label="Favoritos">
              Favoritos
            </Link>
            <Link href="/cuenta" className="nav-link" aria-label="Cuenta">
              Cuenta
            </Link>
            <Link href="/carrito" className="btn btn-dark position-relative">
              Carrito
              {totalItems > 0 && (
                <span className="badge bg-danger rounded-pill ms-2">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
