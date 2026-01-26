/**
 * Strategy/Composition Pattern - Componentes auxiliares do Mapa.
 *
 * Componentes utilitários para controle de visualização do mapa.
 */

import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Parada } from "../../types/data.types";

interface ChangeViewProps {
  bounds: L.LatLngBounds | null;
  padding?: [number, number];
}

/**
 * Componente para ajustar o mapa quando uma rota é selecionada.
 * Memoizado para evitar re-renderizações desnecessárias.
 */
export const ChangeView = React.memo(function ChangeView({
  bounds,
  padding = [50, 50],
}: ChangeViewProps) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding });
    }
  }, [bounds, map, padding]);

  return null;
});

interface CenterOnParadaProps {
  parada: Parada | null;
  zoom?: number;
  animate?: boolean;
  duration?: number;
}

/**
 * Componente para centralizar o mapa em uma parada específica.
 */
export const CenterOnParada = React.memo(function CenterOnParada({
  parada,
  zoom = 17,
  animate = true,
  duration = 1,
}: CenterOnParadaProps) {
  const map = useMap();

  useEffect(() => {
    if (parada && parada.coordenadas) {
      try {
        map.setView(parada.coordenadas, zoom, { animate, duration });
      } catch (e) {
        console.error("Erro ao centralizar no mapa:", e);
      }
    }
  }, [parada, map, zoom, animate, duration]);

  return null;
});
