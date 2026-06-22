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

const OBLIQUE_ANGLE = 45;
const OBLIQUE_PERSPECTIVE = 800;

export function MapRotationHandler({ heading, enabled }: MapRotationHandlerProps) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    if (enabled) {
      container.style.transform = `perspective(${OBLIQUE_PERSPECTIVE}px) rotateX(${OBLIQUE_ANGLE}deg)`;
      container.style.transformOrigin = 'center bottom';
      container.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      container.style.transform = '';
      container.style.transformOrigin = '';
      container.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    return () => {
      container.style.transform = '';
      container.style.transformOrigin = '';
      container.style.transition = '';
    };
  }, [enabled, map]);

  useEffect(() => {
    if (!enabled || heading === null) {
      return;
    }
    map.setBearing(heading);
  }, [map, heading, enabled]);

  return null;
}
