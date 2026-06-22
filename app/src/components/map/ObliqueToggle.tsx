/**
 * Toggle de visão oblíqua do mapa.
 *
 * Aplica uma transformação CSS perspective no container do mapa para criar
 * efeito de visão inclinada/oblíqua, similar ao modo 3D do site de referência.
 *
 * baseado na técnica usada por clubedosimoveis.com.br (MapLibre GL + CSS transforms)
 * e em plugins como leaflet-pitch.
 */

import { Layers2, Layers } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { cn } from '@/lib/utils';

interface ObliqueToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const OBLIQUE_ANGLE = 45;
const OBLIQUE_PERSPECTIVE = 800;

export function ObliqueToggle({ enabled, onToggle }: ObliqueToggleProps) {
  const map = useMap();
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = map.getContainer();
  }, [map]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

  const handleClick = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <div className="leaflet-control leaflet-bar absolute bottom-36 left-2 z-[1000]">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={enabled}
        aria-label={enabled ? 'Desativar visão oblíqua' : 'Ativar visão oblíqua'}
        title={enabled ? 'Visão oblíqua ativa' : 'Visão oblíqua'}
        className={cn(
          'pointer-events-auto flex h-8 w-8 items-center justify-center text-sm',
          'bg-card text-text-primary hover:bg-card-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          enabled && 'border-brand-primary bg-brand-primary/10 text-brand-primary',
        )}
      >
        {enabled ? (
          <Layers className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Layers2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
