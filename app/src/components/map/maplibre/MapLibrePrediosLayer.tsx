import type { FeatureCollection } from 'geojson';
import React from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useUfmPrediosQuery } from '@/features/transit-data/queries/useUfmPrediosQuery';

const MIN_ZOOM = 16;
const PITCH_EXTRUDE_THRESHOLD = 20;

interface MapLibrePrediosLayerProps {
  pitch: number;
}

export const MapLibrePrediosLayer = React.memo(function MapLibrePrediosLayer({
  pitch,
}: MapLibrePrediosLayerProps) {
  const { data } = useUfmPrediosQuery();

  if (!data || data.features.length === 0) return null;

  const extruding = pitch >= PITCH_EXTRUDE_THRESHOLD;

  return (
    <Source id="predios" type="geojson" data={data as unknown as FeatureCollection}>
      {extruding ? (
        <Layer
          id="predios-3d"
          type="fill-extrusion"
          minzoom={MIN_ZOOM}
          paint={{
            'fill-extrusion-color': '#4a90d9',
            'fill-extrusion-height': 18,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.7,
          }}
        />
      ) : (
        <Layer
          id="predios-flat"
          type="fill"
          minzoom={MIN_ZOOM}
          paint={{
            'fill-color': '#4a90d9',
            'fill-opacity': 0.15,
            'fill-outline-color': '#4a90d9',
          }}
        />
      )}
    </Source>
  );
});
