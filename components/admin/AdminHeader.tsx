"use client";

import type { CurrentUser } from "@/lib/auth/session";

// Header simplificado respecto al original: se quitó el dropdown de
// "notificaciones" con actividad de ejemplo inventada (John Doe, Tarah
// Shropshire, etc.) — no hay un sistema de actividad real todavía, y dejar
// datos de mentira ahí sería engañoso. Se deja el logo, el buscador
// (decorativo, sin wiring todavía) y el menú de usuario con logout real.
//
// "use client" porque el buscador tiene un onSubmit inline (los Server
// Components no pueden pasar event handlers como props — Next lo detecta
// recién al pre-renderizar en build, no en dev, así que si esto falta el
// error solo aparece corriendo "next build").
export default function AdminHeader({ user }: { user: CurrentUser }) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Cuenta";
  const roleLabel = user.role === "admin" ? "Administrador" : "Staff";

  return (
    <>
      <div className="header">
        <div className="header-left active">
          <a href="/admin" className="logo">
            <img src="/admin-assets/img/icon/ICONO.png" alt="IsaStore Admin" />
          </a>
          <a href="/admin" className="logo-small">
            <img src="/admin-assets/img/icon/ICONO.png" alt="IsaStore Admin" />
          </a>
          <a id="toggle_btn" href="#" onClick={(e) => e.preventDefault()} />
        </div>

        <a id="mobile_btn" className="mobile_btn" href="#sidebar">
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </a>

        <ul className="nav user-menu">
        <li className="nav-item">
          <div className="top-nav-search">
            <form action="#" onSubmit={(e) => e.preventDefault()}>
              <div className="searchinputs">
                <input type="text" placeholder="Buscar..." />
                <div className="search-addon">
                  <span>
                    <img src="/admin-assets/img/icons/closes.svg" alt="" />
                  </span>
                </div>
              </div>
              <a className="btn" id="searchdiv">
                <img src="/admin-assets/img/icons/search.svg" alt="" />
              </a>
            </form>
          </div>
        </li>

        <li className="nav-item dropdown has-arrow main-drop">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="dropdown-toggle nav-link userset"
            data-bs-toggle="dropdown"
          >
            <span className="user-img">
              <img src="/admin-assets/img/icon/ICONO.png" alt="" />
              <span className="status online"></span>
            </span>
          </a>
          <div className="dropdown-menu dropdown-menu-end menu-drop-user">
            <div className="profilename">
              <div className="profileset">
                <span className="user-img">
                  <img src="/admin-assets/img/icon/ICONO.png" alt="" />
                  <span className="status online"></span>
                </span>
                <div className="profilesets">
                  <h6>{displayName}</h6>
                  <h5>{roleLabel}</h5>
                </div>
              </div>
              <hr className="m-0" />
              <form action="/api/auth/logout" method="POST">
                <input type="hidden" name="scope" value="admin" />
                <input type="hidden" name="redirect" value="/admin-login" />
                <button
                  type="submit"
                  className="dropdown-item logout pb-0 border-0 bg-transparent w-100 text-start"
                >
                  <img
                    src="/admin-assets/img/icons/log-out.svg"
                    className="me-2"
                    alt=""
                  />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </li>
        </ul>
      </div>

      {/* Botón flotante, fijo en la esquina inferior derecha de toda la
          pantalla (no forma parte del header/topbar) — abre la tienda en
          una pestaña aparte, logueado como el mismo staff (ver login en
          app/(admin)/admin-login/page.tsx: al entrar al panel también se
          firma la sesión de tienda con las mismas credenciales), para
          revisar cambios de productos sin tocar la sesión del panel en
          esta pestaña.

          Colores tomados del propio tema del panel (public/admin-assets/
          css/style.css): #FF92C2 es el mismo rosa que .btn-added y el item
          activo del sidebar; #988A82 es el hover real de .btn-added. No se
          reutiliza la clase .btn-added tal cual porque en el CSS del tema
          viene *scopeada* a ".page-header .btn-added" (fuera de esa
          ancestro no aplica ningún estilo) — acá se define standalone con
          styled-jsx para que se vea igual en cualquier página. */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="ver-tienda-fab"
        title="Abrir la tienda en una pestaña nueva, logueado como vos"
      >
        Ver tienda <span aria-hidden="true">↗</span>
      </a>
      <style jsx>{`
        .ver-tienda-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 1050;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ff92c2;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 5px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .ver-tienda-fab:hover {
          background: #988a82;
          color: #fff;
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
}
