"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-ant-path";

const coresLinhas = [
  "#8A2BE2",
  "#B22222",
  "#006400",
  "#00008B",
  "#800020",
  "#4B0082",
  "#D2691E",
];

function CustomZoomControl() {
  const map = useMap();

  // Remove o controle de zoom padrão
  map.zoomControl.remove();

  // Adiciona o controle de zoom no lado direito
  L.control.zoom({ position: "topright" }).addTo(map);

  return null;
}

export default function Mapa() {
  return (
    <div className="w-full h-[100%] relative">
      <MapContainer
        center={[-19.8706, -43.9678]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} // Desativa o controle de zoom padrão
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CustomZoomControl />
      </MapContainer>
    </div>
  );
}
