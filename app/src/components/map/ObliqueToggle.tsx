/**
 * Toggle de visão oblíqua do mapa.
 *
 * Aplica uma transformação CSS perspective no container do mapa para criar
 * efeito de visão inclinada/oblíqua, similar ao modo 3D do site de referência.
 *
 * NOTA: Este componente NÃO deve ser filho de <MapContainer>.
 * Renderize-o como irmão do MapContainer para que o posicionamento
 * absolute funcione corretamente.
 */

import { Layers2, Layers } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ObliqueToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const OBLIQUE_ANGLE = 45;
const OBLIQUE_PERSPECTIVE = 800;

export function ObliqueToggle({ enabled, onToggle }: ObliqueToggleProps) {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('.leaflet-container');
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
  }, [enabled]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Desativar visão oblíqua' : 'Ativar visão oblíqua'}
      title={enabled ? 'Visão oblíqua ativa' : 'Visão oblíqua'}
      className={cn(
        'pointer-events-auto absolute bottom-2 left-2 z-[1000]',
        'flex h-9 w-9 items-center justify-center rounded-lg text-sm',
        'shadow-(--elevation-2) ring-1 ring-card-border',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        enabled
          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
          : 'bg-card text-text-primary hover:bg-card-hover',
      )}
    >
      {enabled ? (
        <Layers className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Layers2 className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
