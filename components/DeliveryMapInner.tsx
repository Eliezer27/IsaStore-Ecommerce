"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Mapa interactivo con Leaflet + OpenStreetMap (gratis, sin API key). Este
// archivo importa Leaflet directamente, por eso SOLO se carga en el cliente:
// Leaflet toca `window`/`document` al importarse y rompería en el render del
// servidor. El wrapper components/DeliveryMap.tsx lo trae con
// next/dynamic({ ssr: false }).

export type LatLng = { lat: number; lng: number };

// Los íconos por defecto de Leaflet se sirven como imágenes relativas al CSS y
// se rompen con los bundlers (Turbopack/Webpack). Se apuntan al CDN de
// unpkg — funciona sin problemas en localhost/producción (no hay CSP como en
// los Artifacts).
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Centro por defecto: Managua, Nicaragua (mercado principal de IsaStore).
const MANAGUA: LatLng = { lat: 12.115, lng: -86.2362 };

function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (c: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!value) return null;
  return (
    <Marker
      position={[value.lat, value.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const p = e.target.getLatLng();
          onChange({ lat: p.lat, lng: p.lng });
        },
      }}
    />
  );
}

export default function DeliveryMapInner({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (c: LatLng) => void;
}) {
  const center = value ?? MANAGUA;

  return (
    <>
      <div
        className="rounded-16 overflow-hidden border border-gray-100"
        style={{ height: 320 }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationPicker value={value} onChange={onChange} />
        </MapContainer>
      </div>
      <p className="text-sm text-gray-500 mt-8 mb-0">
        {value ? (
          <>
            <i className="ph ph-map-pin text-main-600" /> Ubicación marcada:{" "}
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)} — arrastrá el pin para
            ajustar.
          </>
        ) : (
          "Tocá el mapa para marcar el punto exacto de tu entrega."
        )}
      </p>
    </>
  );
}
