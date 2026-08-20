"use client";

import { useState } from "react";
import Image from "next/image";

// Galería de imágenes portada de product-details.html (líneas ~795-853):
// el template usaba dos sliders de Slick sincronizados (thumb-slider grande
// + images-slider de miniaturas). Como slick.min.js no está cargado en este
// proyecto, se reemplaza por un cambio de imagen simple con useState: click
// en una miniatura cambia la imagen grande.
export default function ProductGallery({
  images,
  productName,
}: {
  images: { id: string; url: string; alt: string | null }[];
  productName: string;
}) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="product-details__left">
        <div className="product-details__thumb-slider border border-gray-100 rounded-16">
          <div className="product-details__thumb flex-center h-100 text-gray-500 py-80">
            Sin imagen
          </div>
        </div>
      </div>
    );
  }

  const current = images[selected] ?? images[0];

  return (
    <div className="product-details__left">
      <div className="product-details__thumb-slider border border-gray-100 rounded-16">
        <div className="product-details__thumb flex-center h-100 position-relative">
          <Image
            src={current.url}
            alt={current.alt ?? productName}
            width={500}
            height={500}
            style={{ objectFit: "contain", width: "100%", height: "auto" }}
            priority
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-24">
          <div className="product-details__images-slider d-flex flex-wrap gap-16">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelected(index)}
                className={`max-w-120 max-h-120 h-100 flex-center border rounded-16 p-8 ${
                  index === selected ? "border-main-600" : "border-gray-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? productName}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain", width: "100%", height: "auto" }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
