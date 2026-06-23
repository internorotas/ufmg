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
    [linha?.coordenadasTrajeto],
  );

  const snappedCoords = useOsrmRoute(linha?.idRota, fallbackCoords);

  const active = !!linha && snappedCoords.length >= 2;
  // Anima as dashes brancas (rota-ants) sobre a linha colorida de fundo
  useRouteAnimation('rota-ants', active);

  // Converte [lat, lng] do projeto para [lng, lat] do GeoJSON
  const geojson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: snappedCoords.map(([lat, lng]) => [lng, lat]),
      },
    }),
    [snappedCoords],
  );

  const corHex = linha?.corHex ?? '#2c0eeb';

  if (!active) return null;

  return (
    <Source id="rota" type="geojson" data={geojson}>
      {/* Linha colorida sólida — mostra o trajeto completo */}
      <Layer
        id="rota-bg"
        type="line"
        layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
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
        layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
        paint={{
          'line-color': 'rgba(255,255,255,0.85)',
          'line-width': 3,
          'line-dasharray': [0, 4, 3],
        }}
      />
    </Source>
  );
});
