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
  useRouteAnimation('rota-line', active);

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
      {/* Sombra / contorno */}
      <Layer
        id="rota-casing"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': 'white',
          'line-width': 10,
          'line-opacity': 0.6,
        }}
      />
      {/* Linha principal */}
      <Layer
        id="rota-line"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': corHex,
          'line-width': 6,
          'line-dasharray': [1, 0],
        }}
      />
    </Source>
  );
});
