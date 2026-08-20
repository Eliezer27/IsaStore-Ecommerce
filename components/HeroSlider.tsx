"use client";

import { useState } from "react";
import Link from "next/link";

type Slide = {
  image: string;
  tag: string;
};

// El "Banner Three" del template original (index-three.html) es un slider
// real de Slick con flechas para pasar entre los 3 banners. La primera
// versión portada los apilaba estáticos uno debajo del otro; esto los
// convierte en un slider de verdad (un slide visible a la vez, con flechas
// prev/next y puntos), usando useState en vez de Slick/jQuery. Las clases
// (.slick-arrow, .slick-prev/.slick-next, .slick-dots, .arrow-center) son las
// mismas que usa main.css para el resto de sliders del sitio.
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="banner-three-slider arrow-center position-relative">
      <div className="row align-items-center gy-4 py-5">
        <div className="col-lg-6">
          <div className="span3">
            <span className="text-white mb-8 h6">{slide.tag}</span>
            <h1 className="text-white display-one">
              Nuevos{" "}
              <span className="fw-normal text-main-two-600 font-heading-four">
                Productos
              </span>{" "}
              Para ti.
            </h1>
            <p className="text-white max-w-472 text-2xl mb-24">
              Pareces ordinario si te vistes con sencillez. Estamos en
              condiciones de ayudarte.
            </p>
            <Link
              href="/shop"
              className="btn btn-outline-white d-inline-flex align-items-center rounded-pill gap-8 mt-lg-4 mt-sm-1"
            >
              Compra ahora
              <span className="icon text-xl d-flex">
                <i className="ph ph-shopping-cart-simple" />
              </span>
            </Link>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="d-flex justify-content-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt="" />
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Banner anterior"
            className="slick-arrow slick-prev bg-white rounded-circle flex-center text-xl border-0"
          >
            <i className="ph ph-caret-left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente banner"
            className="slick-arrow slick-next bg-white rounded-circle flex-center text-xl border-0"
          >
            <i className="ph ph-caret-right" />
          </button>

          <ul className="slick-dots">
            {slides.map((_, i) => (
              <li key={i} className={i === index ? "slick-active" : ""}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
