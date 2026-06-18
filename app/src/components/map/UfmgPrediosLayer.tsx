/**
 * Camada GeoJSON com os predios da UFMG.
 *
 * Poligonos dos edificios campus Pampulha, visiveis apenas em zoom >= 16
 * para nao poluir o mapa em niveis de zoom inferiores.
 *
 * Dados: backend /v1/map/ufmg-predios (fallback: public/data/ufmg-predios.geojson).
 */

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useUfmPrediosQuery } from '@/features/transit-data/queries/useUfmPrediosQuery';
import type { GeoJsonFeatureCollection } from '@/services/api/mapDataApi';

const MIN_ZOOM = 16;

const FILL_COLOR = '#4a90d9';
const STROKE_COLOR = '#4a90d9';
const FILL_OPACITY = 0.15;
const STROKE_OPACITY = 0.6;
const STROKE_WEIGHT = 1;

interface UfmgPrediosLayerProps {
  visible?: boolean;
}

export function UfmgPrediosLayer({ visible = true }: UfmgPrediosLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);
  const { data } = useUfmPrediosQuery();

  useEffect(() => {
    if (!data) return;
    updateLayerVisibility(map, layerRef, data, visible);
  }, [map, data, visible]);

  useEffect(() => {
    function onZoom() {
      if (data) {
        updateLayerVisibility(map, layerRef, data, visible);
      }
    }
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map, data, visible]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

function updateLayerVisibility(
  map: L.Map,
  layerRef: React.MutableRefObject<L.GeoJSON | null>,
  data: GeoJsonFeatureCollection,
  visible: boolean,
) {
  const zoom = map.getZoom();
  const shouldShow = visible && zoom >= MIN_ZOOM && data.features.length > 0;

  if (shouldShow && !layerRef.current) {
    const layer = L.geoJSON(data, {
      style: () => ({
        fillColor: FILL_COLOR,
        fillOpacity: FILL_OPACITY,
        color: STROKE_COLOR,
        opacity: STROKE_OPACITY,
        weight: STROKE_WEIGHT,
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties?.name) {
          layer.bindPopup(
            `<span style="font-weight:600;font-size:14px;">${feature.properties.name}</span>`,
            { className: 'ufmg-predio-popup' },
          );
        }
      },
    });
    layer.addTo(map);
    layerRef.current = layer;
  } else if (!shouldShow && layerRef.current) {
    map.removeLayer(layerRef.current);
    layerRef.current = null;
  }
}
