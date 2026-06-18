/**
 * Handler de rotação do mapa via bússola do dispositivo.
 *
 * Usa o heading (0-360°) do DeviceOrientationEvent para rotacionar
 * o mapa via leaflet-rotate. Só funciona quando a rotação está habilitada.
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapRotationHandlerProps {
  heading: number | null;
  enabled: boolean;
}

export function MapRotationHandler({ heading, enabled }: MapRotationHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || heading === null) {
      map.setBearing(0);
      return;
    }
    map.setBearing(heading);
  }, [map, heading, enabled]);

  useEffect(() => {
    if (!enabled) {
      map.setBearing(0);
    }
  }, [map, enabled]);

  return null;
}
