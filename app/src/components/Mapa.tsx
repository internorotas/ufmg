/**
 * Componente principal do Mapa - Container limpo usando Composition Pattern.
 *
 * Este componente foi refatorado para delegar responsabilidades:
 * - MapMarkers: Renderização dos marcadores de paradas
 * - MapRoute: Renderização da rota animada
 * - MapControls: Controles de visualização (zoom, centralização)
 */

import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { Parada, Linha } from "../types/data.types";
import { useAnalytics } from "../hooks/useAnalytics";

// Componentes extraídos (Strategy/Composition Pattern)
import {
  MapMarkers,
  useMapMarkers,
  MapRoute,
  useRouteBounds,
  ChangeView,
  CenterOnParada,
} from "./map";

interface MapaProps {
  todasParadas: Parada[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
}

export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
}

/**
 * Configurações padrão do mapa
 */
const MAP_CONFIG = {
  center: [-19.87055, -43.96775] as [number, number],
  zoom: 15,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

/**
 * Renderiza um mapa interativo com as paradas e rotas de ônibus.
 * Componente container que orquestra os sub-componentes do mapa.
 */
export const Mapa = forwardRef<MapaRef, MapaProps>(
  ({ todasParadas, linhaSelecionada, paradaSelecionada }, ref) => {
    const { trackTiming } = useAnalytics();
    const mapLoadStartRef = useRef<number>(0);

    // Hook para gerenciar marcadores
    const { paradaDestacadaId, handleMarkerRef, destacarParada } = useMapMarkers();

    // Hook para calcular bounds da rota
    const bounds = useRouteBounds(linhaSelecionada);

    // Rastreia o tempo de carregamento do mapa
    useEffect(() => {
      if (mapLoadStartRef.current === 0) {
        mapLoadStartRef.current = Date.now();
      }
      const loadTime = Date.now() - mapLoadStartRef.current;
      trackTiming({
        name: "Map Load Time",
        value: loadTime,
        category: "Performance",
        label: "Initial Map Render",
      });
    }, [trackTiming]);

    // Expõe método para centralizar em uma parada
    useImperativeHandle(ref, () => ({
      centralizarParada: destacarParada,
    }));

    return (
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        className="h-full w-full"
        zoomControl={true}
        whenReady={() => {
          // Map is ready
        }}
      >
        {/* Camada de tiles */}
        <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} />

        {/* Controles de visualização */}
        <ChangeView bounds={bounds} />
        <CenterOnParada parada={paradaSelecionada} />

        {/* Rota animada da linha selecionada */}
        <MapRoute linha={linhaSelecionada} />

        {/* Marcadores de paradas */}
        <MapMarkers
          paradas={todasParadas}
          paradaDestacadaId={paradaDestacadaId}
          onMarkerRef={handleMarkerRef}
        />
      </MapContainer>
    );
  }
);

Mapa.displayName = "Mapa";
