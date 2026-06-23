import type { MapLayerMouseEvent } from 'maplibre-gl';
import React, { useCallback, useEffect, useState } from 'react';
import { Layer, Popup, Source, useMap } from 'react-map-gl/maplibre';

const MIN_ZOOM = 14;
const PITCH_EXTRUDE_THRESHOLD = 20;

// BASE_URL garante caminho correto independente do basePath do tenant (ex: '/ufmg/')
const PREDIOS_URL = `${import.meta.env.BASE_URL}data/ufmg-predios.geojson`;

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

  // Registra handlers de click/cursor nas layers
  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

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
  }, [mapRef, handleClick]);

  // Atualiza visibilidade diretamente via API do MapLibre (garantia além do layout prop)
  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    try {
      if (map.getLayer('predios-3d')) {
        map.setLayoutProperty('predios-3d', 'visibility', extruding ? 'visible' : 'none');
      }
      if (map.getLayer('predios-flat')) {
        map.setLayoutProperty('predios-flat', 'visibility', extruding ? 'none' : 'visible');
      }
    } catch {
      // layers ainda não prontas — o layout prop declarativo já cuida disso
    }
  }, [mapRef, extruding]);

  return (
    <>
      {/* Source com URL direta — MapLibre faz o fetch internamente, sem React Query */}
      <Source id="predios" type="geojson" data={PREDIOS_URL}>
        <Layer
          id="predios-3d"
          type="fill-extrusion"
          minzoom={MIN_ZOOM}
          layout={{ visibility: extruding ? 'visible' : 'none' }}
          paint={{
            'fill-extrusion-color': '#4a90d9',
            'fill-extrusion-height': 18,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75,
          }}
        />
        <Layer
          id="predios-flat"
          type="fill"
          minzoom={MIN_ZOOM}
          layout={{ visibility: extruding ? 'none' : 'visible' }}
          paint={{
            'fill-color': '#4a90d9',
            'fill-opacity': 0.18,
            'fill-outline-color': '#4a90d9',
          }}
        />
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
          <div className="flex flex-col gap-1 p-2 font-sans text-text-primary">
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
