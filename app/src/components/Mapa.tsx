import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { PopupCustomizado } from "./PopupCustomizado";
import { AntPathComponent } from "./AntPathComponent";
import { Parada, Linha } from "../types/data.types";
import { useEffect, useImperativeHandle, forwardRef, useRef, useState, useMemo } from "react";

interface MapaProps {
  todasParadas: Parada[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
}

export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
}

const stationIcon = L.icon({
  iconUrl: "./marker.svg",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const highlightedIcon = L.icon({
  iconUrl: "./marker.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "marker-highlighted",
});

// Componente para ajustar o mapa quando uma rota é selecionada
const ChangeView = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

// Componente para centralizar em uma parada
const CenterOnParada = ({ parada }: { parada: Parada | null }) => {
  const map = useMap();
  useEffect(() => {
    if (parada) {
      map.setView(parada.coordenadas, 17, { animate: true, duration: 1 });
    }
  }, [parada, map]);
  return null;
};

export const Mapa = forwardRef<MapaRef, MapaProps>(
  ({ todasParadas, linhaSelecionada, paradaSelecionada }, ref) => {
    const markersRef = useRef<{ [key: string]: L.Marker }>({});
    const [paradaDestacada, setParadaDestacada] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      centralizarParada: (parada: Parada) => {
        setParadaDestacada(parada.idParada);
        
        // Abrir popup do marcador
        const marker = markersRef.current[parada.idParada];
        if (marker) {
          marker.openPopup();
        }

        // Resetar destaque após 3 segundos
        setTimeout(() => {
          setParadaDestacada(null);
        }, 3000);
      },
    }));

    // Filtrar paradas da linha selecionada dinamicamente usando os IDs
    const paradasVisiveis = useMemo(() => {
      if (!linhaSelecionada) {
        return todasParadas; // Mostrar todas se nenhuma linha selecionada
      }
      
      return linhaSelecionada.itinerarioParadasIds
        .map((idParada) => todasParadas.find((p) => p.idParada === idParada))
        .filter((p): p is Parada => p !== undefined);
    }, [linhaSelecionada, todasParadas]);

    // Calcular bounds baseado nas coordenadas do trajeto da linha
    const bounds = useMemo(() => {
      if (linhaSelecionada && linhaSelecionada.coordenadasTrajeto.length > 0) {
        return L.latLngBounds(linhaSelecionada.coordenadasTrajeto as L.LatLngExpression[]);
      }
      return null;
    }, [linhaSelecionada]);

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
        <CenterOnParada parada={paradaSelecionada} />

        {/* Desenhar rota animada da linha selecionada com AntPath */}
        {linhaSelecionada && linhaSelecionada.coordenadasTrajeto.length > 0 && (
          <AntPathComponent
            coordinates={linhaSelecionada.coordenadasTrajeto as L.LatLngExpression[]}
            options={{
              delay: 600,
              dashArray: [20, 100],
              weight: 8,
              color: linhaSelecionada.corHex,
              pulseColor: linhaSelecionada.corHex,
              paused: false,
              reverse: false,
              hardwareAccelerated: true,
            }}
          />
        )}

        {/* Renderizar apenas paradas da linha selecionada */}
        {paradasVisiveis.map((parada) => {
          const isDestacada = paradaDestacada === parada.idParada;
          return (
            <Marker
              key={parada.idParada}
              position={parada.coordenadas}
              icon={isDestacada ? highlightedIcon : stationIcon}
              ref={(markerRef) => {
                if (markerRef) {
                  markersRef.current[parada.idParada] = markerRef;
                }
              }}
            >
              <PopupCustomizado parada={parada} />
            </Marker>
          );
        })}
      </MapContainer>
    );
  }
);

Mapa.displayName = "Mapa";
