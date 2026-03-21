/**
 * Strategy/Composition Pattern - Componente de Marcadores do Mapa.
 *
 * Extraído do Mapa.tsx para separação de responsabilidades.
 * Gerencia a renderização de todos os marcadores de paradas.
 */

import L from 'leaflet';
import React, { useCallback, useRef, useState } from 'react';
import { Marker } from 'react-leaflet';
import icon from '../../assets/marker.svg';
import type { Parada } from '../../types/data.types';
import { PopupCustomizado } from '../PopupCustomizado';

// Ícone padrão para paradas
const stationIcon = L.icon({
  iconUrl: icon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Ícone destacado (quando parada é selecionada)
const highlightedIcon = L.icon({
  iconUrl: icon,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'marker-highlighted',
});

interface MapMarkersProps {
  paradas: Parada[];
  paradaDestacadaId: string | null;
  onMarkerRef?: (id: string, marker: L.Marker | null) => void;
}

/**
 * Componente de Marcador Memoizado para evitar re-renderização de TODOS os marcadores
 * quando apenas UM muda de estado (destaque).
 */
const MemoizedMarker = React.memo(
  ({
    parada,
    isDestacada,
    setMarkerRef,
  }: {
    parada: Parada;
    isDestacada: boolean;
    setMarkerRef: (id: string, ref: L.Marker | null) => void;
  }) => {
    return (
      <Marker
        position={parada.coordenadas}
        icon={isDestacada ? highlightedIcon : stationIcon}
        ref={(ref) => setMarkerRef(parada.idParada, ref)}
      >
        <PopupCustomizado parada={parada} />
      </Marker>
    );
  },
  (prev, next) => {
    // Custom comparison: re-render only if highlight state changes
    return prev.isDestacada === next.isDestacada && prev.parada.idParada === next.parada.idParada;
  },
);

MemoizedMarker.displayName = 'MemoizedMarker';

/**
 * Componente que renderiza todos os marcadores de paradas no mapa.
 * Otimizado com memoização para evitar re-renders desnecessários.
 */
export const MapMarkers = React.memo(function MapMarkers({
  paradas,
  paradaDestacadaId,
  onMarkerRef,
}: MapMarkersProps) {
  // Callback ref para gerenciar referências de marcadores
  const handleSetMarkerRef = useCallback(
    (id: string, marker: L.Marker | null) => {
      onMarkerRef?.(id, marker);
    },
    [onMarkerRef],
  );

  return (
    <>
      {paradas.map((parada) => (
        <MemoizedMarker
          key={parada.idParada}
          parada={parada}
          isDestacada={paradaDestacadaId === parada.idParada}
          setMarkerRef={handleSetMarkerRef}
        />
      ))}
    </>
  );
});

/**
 * Hook para gerenciar o estado de destaque de paradas e referências de marcadores.
 * Use junto com MapMarkers para controle completo.
 */
export function useMapMarkers() {
  const markersRef = useRef<{ [key: string]: L.Marker | null }>({});
  const [paradaDestacadaId, setParadaDestacadaId] = useState<string | null>(null);

  const handleMarkerRef = useCallback((id: string, marker: L.Marker | null) => {
    if (marker) {
      markersRef.current[id] = marker;
    } else {
      delete markersRef.current[id];
    }
  }, []);

  const destacarParada = useCallback((parada: Parada) => {
    if (!parada || !parada.idParada) return;

    setParadaDestacadaId(parada.idParada);

    // Abrir popup do marcador
    const marker = markersRef.current[parada.idParada];
    if (marker) {
      marker.openPopup();
    }

    // Resetar destaque após 3 segundos
    setTimeout(() => {
      setParadaDestacadaId(null);
    }, 3000);
  }, []);

  return {
    markersRef,
    paradaDestacadaId,
    handleMarkerRef,
    destacarParada,
  };
}
