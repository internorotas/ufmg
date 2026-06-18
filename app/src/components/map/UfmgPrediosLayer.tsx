/**
 * Camada GeoJSON com os prédios da UFMG.
 *
 * Polígonos dos edifícios campus Pampulha, visíveis apenas em zoom ≥ 16
 * para não poluir o mapa em níveis de zoom inferiores.
 *
 * Dados geoespaciais: public/data/ufmg-predios.geojson (gerado via Overpass API).
 */

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const GEOJSON_URL = '/data/ufmg-predios.geojson';
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
  const dataRef = useRef<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSON.FeatureCollection) => {
        if (cancelled) return;
        dataRef.current = data;
        updateLayerVisibility(map, layerRef, data, visible);
      })
      .catch(() => {
        // Dados indisponíveis — camada simplemente não aparece
      });

    return () => {
      cancelled = true;
    };
  }, [map, visible]);

  useEffect(() => {
    if (dataRef.current) {
      updateLayerVisibility(map, layerRef, dataRef.current, visible);
    }
  }, [map, visible]);

  useEffect(() => {
    function onZoom() {
      if (dataRef.current) {
        updateLayerVisibility(map, layerRef, dataRef.current, visible);
      }
    }
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map, visible]);

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
  data: GeoJSON.FeatureCollection,
  visible: boolean,
) {
  const zoom = map.getZoom();
  const shouldShow = visible && zoom >= MIN_ZOOM;

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
