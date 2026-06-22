/**
 * Handler de rotação do mapa via bússola do dispositivo.
 *
 * Usa o heading (0-360°) do DeviceOrientationEvent para rotacionar
 * o mapa via leaflet-rotate. Quando a bússola está desabilitada,
 * NÃO reseta o bearing — permite rotação manual via shift+scroll.
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
      return;
    }
    map.setBearing(heading);
  }, [map, heading, enabled]);

  return null;
}
