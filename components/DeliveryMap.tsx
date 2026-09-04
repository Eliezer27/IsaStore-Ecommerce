"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "./DeliveryMapInner";

// Wrapper del mapa de entrega. Carga el mapa real (components/DeliveryMapInner)
// solo en el cliente con ssr:false, porque Leaflet no puede ejecutarse en el
// render del servidor. Mientras carga, muestra un placeholder del mismo alto
// para que el layout no salte.

const DeliveryMapInner = dynamic(() => import("./DeliveryMapInner"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-16 bg-gray-50 border border-gray-100 flex-center"
      style={{ height: 320 }}
    >
      <div className="text-center">
        <span className="text-4xl text-gray-400 d-block mb-8">
          <i className="ph ph-map-trifold" />
        </span>
        <p className="text-gray-500 mb-0">Cargando mapa…</p>
      </div>
    </div>
  ),
});

export default function DeliveryMap({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (c: LatLng) => void;
}) {
  return <DeliveryMapInner value={value} onChange={onChange} />;
}
