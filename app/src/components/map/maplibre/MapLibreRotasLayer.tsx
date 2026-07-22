import React, { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useOsrmRoute } from '@/hooks/useOsrmRoute';
import type { Linha } from '@/types/data.types';
import { useRouteAnimation } from './useRouteAnimation';

interface MapLibreRotasLayerProps {
  linha: Linha | null;
}

export const MapLibreRotasLayer = React.memo(function MapLibreRotasLayer({
  linha,
}: MapLibreRotasLayerProps) {
  const fallbackCoords = useMemo(
    () => (linha?.coordenadasTrajeto ?? []) as [number, number][],
    // idRota é string estável — evita recriar o array a cada re-render do pai
    [linha?.coordenadasTrajeto],
  );

  const snappedCoords = useOsrmRoute(linha?.idRota, fallbackCoords);

  const active = !!linha && snappedCoords.length >= 2;
  // Anima as dashes brancas (rota-ants) sobre a linha colorida de fundo
  useRouteAnimation('rota-ants', active);

  const corHex = linha?.corHex ?? '#2c0eeb';

  // Converte [lat, lng] do projeto para [lng, lat] do GeoJSON
  const geojson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        // Coordenadas vazias quando inativo evita que a linha fique visível
        coordinates: active ? snappedCoords.map(([lat, lng]) => [lng, lat]) : [],
      },
    }),
    [active, snappedCoords],
  );

  // Usa visibility: none em vez de return null — evita race condition no MapLibre
  // onde o Source pode não ser removido antes das layers filhas na desmontagem.
  const visibility = active ? ('visible' as const) : ('none' as const);

  return (
    <Source id="rota" type="geojson" data={geojson}>
      {/* Linha colorida sólida — mostra o trajeto completo */}
      <Layer
        id="rota-bg"
        type="line"
        layout={{ 'line-cap': 'butt', 'line-join': 'round', visibility }}
        paint={{
          'line-color': corHex,
          'line-width': 6,
          'line-opacity': 0.8,
        }}
      />
      {/* Dashes brancas marchando sobre a linha colorida — efeito ant-path */}
      <Layer
        id="rota-ants"
        type="line"
        layout={{ 'line-cap': 'butt', 'line-join': 'round', visibility }}
        paint={{
          'line-color': 'rgba(255,255,255,0.85)',
          'line-width': 3,
          'line-dasharray': [0, 4, 3],
        }}
      />
    </Source>
  );
});
