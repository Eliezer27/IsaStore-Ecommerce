"use client";

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
export default function AdminHeader() {
  return (
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
          <div className="dropdown-menu menu-drop-user">
            <div className="profilename">
              <div className="profileset">
                <span className="user-img">
                  <img src="/admin-assets/img/profiles/avator1.jpg" alt="" />
                  <span className="status online"></span>
                </span>
                <div className="profilesets">
                  <h6>Admin</h6>
                  <h5>IsaStore</h5>
                </div>
              </div>
              <hr className="m-0" />
              <form action="/api/admin/logout" method="POST">
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
  );
}
