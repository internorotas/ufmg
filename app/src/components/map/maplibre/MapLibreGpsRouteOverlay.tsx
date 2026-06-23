import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Linha } from '@/types/data.types';

interface MapLibreGpsRouteOverlayProps {
  linha: Linha;
}

export function MapLibreGpsRouteOverlay({ linha }: MapLibreGpsRouteOverlayProps) {
  const coords = linha.coordenadasTrajeto;

  const geojson = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      // [lat, lng] → [lng, lat]
      coordinates: (coords ?? []).map(([lat, lng]) => [lng, lat]),
    },
  }), [coords]);

  if (!coords || coords.length < 2) return null;

  return (
    <Source id="gps-route" type="geojson" data={geojson}>
      <Layer
        id="gps-route-halo"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.4 }}
      />
      <Layer
        id="gps-route-line"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': linha.corHex, 'line-width': 7, 'line-opacity': 0.9 }}
      />
    </Source>
  );
}
