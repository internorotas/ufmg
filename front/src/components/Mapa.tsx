import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AntPathComponent } from "./AntPathComponent.tsx";
import { Rota, Parada } from "../types/data.types.ts";
import { useEffect } from "react";

interface MapaProps {
  paradas: Parada[];
  rotaSelecionada: Rota | null;
  coresLinhas: string[];
}

const stationIcon = L.icon({
  iconUrl: "./marker.svg",
  iconSize: [30, 30],
  iconAnchor: [20, 20],
  popupAnchor: [-5, -18],
});

// Componente para ajustar o mapa quando uma rota é selecionada
const ChangeView = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
};

export function Mapa({ paradas, rotaSelecionada, coresLinhas }: MapaProps) {
  const bounds = rotaSelecionada
    ? L.latLngBounds(rotaSelecionada.coordinates as L.LatLngExpression[])
    : null;

  return (
    <MapContainer
      center={[-19.87055, -43.96775]}
      zoom={15}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <ChangeView bounds={bounds} />

      {paradas.map((parada, index) => (
        <Marker key={index} position={parada.coordinates} icon={stationIcon}>
          <Popup>
            <div
              dangerouslySetInnerHTML={{
                __html: `<h4>${parada.nome}</h4>${parada.linhaAtendidas
                  .map((l) => `<p>${l}</p>`)
                  .join("")}`,
              }}
            />
          </Popup>
        </Marker>
      ))}

      {rotaSelecionada && (
        <AntPathComponent
          key={rotaSelecionada.linha + (rotaSelecionada.sublinha || "")}
          coordinates={rotaSelecionada.coordinates}
          options={{
            delay: 600,
            dashArray: [20, 100],
            weight: 8,
            color: coresLinhas[rotaSelecionada.linha - 1] || "#FF0000",
          }}
        />
      )}
    </MapContainer>
  );
}
