import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

// Footer portado de la plantilla original (index-three.html, líneas
// ~8612-8814). Los links de "Sobre nosotros" / "Información" que en el demo
// apuntaban todos a shop.html (relleno) se dejan igual acá; los que sí
// tienen página real en este proyecto (cuenta, carrito, favoritos, contacto)
// quedan enlazados a su ruta real.
export default function SiteFooter() {
  return (
    <footer className="footer py-80 overflow-hidden">
      <div className="container container-lg">
        <div className="footer-item-two-wrapper d-flex align-items-start flex-wrap">
          <div className="footer-item max-w-275">
            <div className="footer-item__logo">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/logo/NavISA3.png" alt="IsaStore" />
              </Link>
            </div>
            <p className="mb-24">IsaStore Listos para ti</p>
            <div className="flex-align gap-16 mb-16">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-phone-call" />
              </span>
              <a href="tel:+00123456789" className="text-md text-gray-900 hover-text-main-600">
                +00 123 456 789
              </a>
            </div>
            <div className="flex-align gap-16 mb-16">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-envelope" />
              </span>
              <a href="mailto:isaSupport@gmail.com" className="text-md text-gray-900 hover-text-main-600">
                isaSupport@gmail.com
              </a>
            </div>
            <div className="flex-align gap-16 mb-16">
              <span className="w-32 h-32 flex-center rounded-circle border border-gray-100 text-main-two-600 text-md flex-shrink-0">
                <i className="ph-fill ph-map-pin" />
              </span>
              <span className="text-md text-gray-900">Nicaragua, Managua</span>
            </div>
          </div>

          <div className="footer-item">
            <h6 className="footer-item__title">Categorías</h6>
            <ul className="footer-menu">
              {CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat.slug} className="mb-16">
                  <Link
                    href={`/shop?categoria=${cat.slug}`}
                    className="text-gray-600 hover-text-main-600"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="mb-16">
                <Link href="/contacto" className="text-gray-600 hover-text-main-600">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-item">
            <h6 className="footer-item__title">Atención al cliente</h6>
            <ul className="footer-menu">
              <li className="mb-16">
                <Link href="/contacto" className="text-gray-600 hover-text-main-600">
                  Centro de Ayuda
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/contacto" className="text-gray-600 hover-text-main-600">
                  Contáctanos
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/shop" className="text-gray-600 hover-text-main-600">
                  Tarjetas de Regalo
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/shop" className="text-gray-600 hover-text-main-600">
                  Políticas y Normas
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/shop" className="text-gray-600 hover-text-main-600">
                  Compras en Línea
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-item">
            <h6 className="footer-item__title">Mi Cuenta</h6>
            <ul className="footer-menu">
              <li className="mb-16">
                <Link href="/cuenta" className="text-gray-600 hover-text-main-600">
                  Mi Cuenta
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/cuenta" className="text-gray-600 hover-text-main-600">
                  Historial de Pedidos
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/carrito" className="text-gray-600 hover-text-main-600">
                  Carrito de Compras
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/favoritos" className="text-gray-600 hover-text-main-600">
                  Lista de Deseos
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/contacto" className="text-gray-600 hover-text-main-600">
                  Soporte de Productos
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-item">
            <h6 className="footer-item__title">Información</h6>
            <ul className="footer-menu">
              <li className="mb-16">
                <Link href="/shop" className="text-gray-600 hover-text-main-600">
                  Política de Privacidad
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/shop" className="text-gray-600 hover-text-main-600">
                  Nuestros Proveedores
                </Link>
              </li>
              <li className="mb-16">
                <Link href="/blog" className="text-gray-600 hover-text-main-600">
                  Comunidad
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-item">
            <h6>Síguenos</h6>
            <p className="mb-16">IsaStore ya abierto</p>
            <ul className="flex-align gap-16">
              <li>
                <a
                  href="https://www.facebook.com"
                  className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                >
                  <i className="ph-fill ph-facebook-logo" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com"
                  className="w-44 h-44 flex-center bg-main-two-50 text-main-two-600 text-xl rounded-8 hover-bg-main-two-600 hover-text-white"
                >
                  <i className="ph-fill ph-instagram-logo" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
