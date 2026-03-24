/**
 * Strategy/Composition Pattern - Componente de Rota do Mapa.
 *
 * Extraído do Mapa.tsx para separação de responsabilidades.
 * Gerencia a renderização da rota animada (AntPath).
 */

import L from 'leaflet';
import React, { useMemo } from 'react';
import type { Linha } from '../../types/data.types';
import { AntPathComponent } from '../AntPathComponent';

interface MapRouteProps {
  linha: Linha | null;
}

/**
 * Opções padrão para o AntPath.
 */
const DEFAULT_ANT_PATH_OPTIONS = {
  delay: 600,
  dashArray: [20, 100],
  weight: 8,
  paused: false,
  reverse: false,
  hardwareAccelerated: true,
};

/**
 * Componente que renderiza a rota animada da linha selecionada.
 * Usa o AntPath para criar o efeito de "formigas marchando".
 */
export const MapRoute = React.memo(function MapRoute({ linha }: MapRouteProps) {
  // Coordenadas memoizadas
  const coordinates = useMemo(
    () => (linha?.coordenadasTrajeto as L.LatLngExpression[]) || [],
    [linha?.coordenadasTrajeto],
  );

  // Opções do AntPath com a cor da linha
  const options = useMemo(
    () => ({
      ...DEFAULT_ANT_PATH_OPTIONS,
      color: linha?.corHex || 'var(--color-brand-primary)',
      pulseColor: linha?.corHex || 'var(--color-brand-primary)',
    }),
    [linha?.corHex],
  );

  // Não renderiza se não há linha ou coordenadas
  if (!linha || coordinates.length === 0) {
    return null;
  }

  return <AntPathComponent coordinates={coordinates} options={options} />;
});

/**
 * Hook para calcular os bounds da rota.
 * Útil para ajustar o zoom do mapa quando uma linha é selecionada.
 */
export function useRouteBounds(linha: Linha | null): L.LatLngBounds | null {
  return useMemo(() => {
    if (linha?.coordenadasTrajeto && linha.coordenadasTrajeto.length > 0) {
      return L.latLngBounds(linha.coordenadasTrajeto as L.LatLngExpression[]);
    }
    return null;
  }, [linha]);
}
