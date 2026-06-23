import type { FeatureCollection } from 'geojson';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Popup, Source, useMap } from 'react-map-gl/maplibre';
import { useUfmPrediosQuery } from '@/features/transit-data/queries/useUfmPrediosQuery';

const MIN_ZOOM = 16;
const PITCH_EXTRUDE_THRESHOLD = 20;

const LAYER_IDS = ['predios-3d', 'predios-flat'] as const;

interface PredioClicado {
  nome: string;
  amenity?: string;
  longitude: number;
  latitude: number;
}

interface MapLibrePrediosLayerProps {
  pitch: number;
}

export const MapLibrePrediosLayer = React.memo(function MapLibrePrediosLayer({
  pitch,
}: MapLibrePrediosLayerProps) {
  const { data } = useUfmPrediosQuery();
  const { current: mapRef } = useMap();
  const [predioClicado, setPredioClicado] = useState<PredioClicado | null>(null);

  const extruding = pitch >= PITCH_EXTRUDE_THRESHOLD;

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const nome = feature.properties?.name as string | undefined;
    if (!nome) return;
    const amenity = feature.properties?.amenity as string | undefined;
    setPredioClicado({ nome, amenity: amenity || undefined, longitude: e.lngLat.lng, latitude: e.lngLat.lat });
  }, []);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !data) return;

    const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onLeave = () => { map.getCanvas().style.cursor = ''; };

    LAYER_IDS.forEach((id) => {
      map.on('click', id, handleClick);
      map.on('mouseenter', id, onEnter);
      map.on('mouseleave', id, onLeave);
    });

    return () => {
      LAYER_IDS.forEach((id) => {
        map.off('click', id, handleClick);
        map.off('mouseenter', id, onEnter);
        map.off('mouseleave', id, onLeave);
      });
    };
  }, [mapRef, handleClick, data]);

  if (!data || data.features.length === 0) return null;

  return (
    <>
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
              'fill-extrusion-opacity': 0.75,
            }}
          />
        ) : (
          <Layer
            id="predios-flat"
            type="fill"
            minzoom={MIN_ZOOM}
            paint={{
              'fill-color': '#4a90d9',
              'fill-opacity': 0.18,
              'fill-outline-color': '#4a90d9',
            }}
          />
        )}
      </Source>

      {predioClicado && (
        <Popup
          longitude={predioClicado.longitude}
          latitude={predioClicado.latitude}
          onClose={() => setPredioClicado(null)}
          closeButton
          closeOnClick={false}
          maxWidth="220px"
          offset={10}
        >
          <div className="flex flex-col gap-1 p-1 font-sans text-text-primary">
            <p className="text-sm font-bold leading-snug">{predioClicado.nome}</p>
            {predioClicado.amenity && (
              <p className="text-xs capitalize text-text-secondary">
                {predioClicado.amenity.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        </Popup>
      )}
    </>
  );
});
