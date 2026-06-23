/**
 * Handler de rotação e inclinação do mapa.
 *
 * Quando a bússola está habilitada:
 * - Aplica CSS perspective transform para inclinação oblíqua (pitch)
 * - Rotaciona o mapa via heading do dispositivo (se disponível)
 *
 * Quando desabilitada:
 * - Remove inclinação e rotação, voltando ao modo flat 2D
 *
 * Similar ao comportamento do MapLibre GL (Ctrl+arrastar inclina/gira)
 * mas controlado pelo botão de bússola.
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapRotationHandlerProps {
  heading: number | null;
  enabled: boolean;
}

export function MapRotationHandler({ heading, enabled }: MapRotationHandlerProps) {
  const map = useMap();

  // Garante que não há perspectiva CSS residual de sessões anteriores
  useEffect(() => {
    const container = map.getContainer();
    container.style.transform = '';
    container.style.transformOrigin = '';
    container.style.transition = '';
  }, [map]);

  // Rotaciona o mapa conforme o heading do dispositivo (leaflet-rotate)
  useEffect(() => {
    if (!enabled || heading === null) {
      if (!enabled) map.setBearing(0);
      return;
    }
    map.setBearing(heading);
  }, [map, heading, enabled]);

  return null;
}
