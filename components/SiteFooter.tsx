import Link from "next/link";

const CATEGORIES = [
  { name: "Ropa", slug: "ropa" },
  { name: "Cadenas y Llaveros", slug: "cadenas-y-llaveros" },
  { name: "Peluches y Juguetes", slug: "peluches-y-juguetes" },
  { name: "Collares", slug: "collares" },
  { name: "Maquillaje", slug: "maquillaje" },
  { name: "Accesorios", slug: "accesorios" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-dark text-light mt-auto pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-4">
            <h5 className="fw-bold">IsaStore</h5>
            <p className="text-secondary mb-0">
              Accesorios y regalos: ropa, cadenas y llaveros, peluches y
              juguetes, collares, maquillaje y accesorios. Nicaragua.
            </p>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold">Categorías</h6>
            <ul className="list-unstyled">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop?categoria=${cat.slug}`}
                    className="text-secondary text-decoration-none"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold">Newsletter</h6>
            <p className="text-secondary">
              Recibe nuestras ofertas y novedades.
            </p>
            {/* TODO: conectar a la tabla newsletter_subscribers vía una API route */}
            <form className="d-flex gap-2">
              <input
                type="email"
                className="form-control"
                placeholder="Tu correo"
                aria-label="Correo para newsletter"
              />
              <button type="submit" className="btn btn-light">
                Enviar
              </button>
            </form>
          </div>
        </div>

        <hr className="border-secondary my-4" />
        <p className="text-secondary text-center mb-0">
          &copy; {new Date().getFullYear()} IsaStore. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
