import { ChevronDown, ChevronUp } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { numLinha } from '@/features/gps/lib/markerUtils';
import { cn } from '@/lib/utils';
import type { Linha } from '@/types/data.types';
import { LineCard } from './LineCard';

interface LineGroupCardProps {
  linhas: Linha[];
  linhaPrincipal: Linha;
  onClick: (linha: Linha) => void;
  onDetailsClick: (linha: Linha) => void;
  selectedId?: string;
  isFavorita?: boolean;
  onToggleFavorita?: (idRota: string) => void;
}

function LineGroupCardComponent({
  linhas,
  linhaPrincipal,
  onClick,
  onDetailsClick,
  selectedId,
  isFavorita,
  onToggleFavorita,
}: LineGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasVariants = linhas.length > 1;

  const handleToggle = useCallback(() => setExpanded((v) => !v), []);

  if (!hasVariants) {
    return (
      <LineCard
        linha={linhaPrincipal}
        onClick={onClick}
        onDetailsClick={onDetailsClick}
        isSelected={selectedId === linhaPrincipal.idRota}
        isFavorita={isFavorita}
        onToggleFavorita={onToggleFavorita}
      />
    );
  }

  const numero = numLinha(linhaPrincipal);

  return (
    <div className="mb-3">
      <LineCard
        linha={linhaPrincipal}
        onClick={onClick}
        onDetailsClick={onDetailsClick}
        isSelected={selectedId === linhaPrincipal.idRota}
        isFavorita={isFavorita}
        onToggleFavorita={onToggleFavorita}
      />

      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex min-h-11 w-full items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-text-secondary transition-colors',
          'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
        )}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Ocultar' : 'Mostrar'} ${linhas.length - 1} variante${linhas.length - 1 > 1 ? 's' : ''} da linha ${numero}`}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>
          {linhas.length - 1} variante{linhas.length - 1 > 1 ? 's' : ''}
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <div
            className="mt-1 space-y-2 border-l-2 pl-3"
            style={{ borderColor: `${linhaPrincipal.corHex}40` }}
          >
            {linhas
              .filter((l) => l.idRota !== linhaPrincipal.idRota)
              .map((linha) => (
                <LineCard
                  key={linha.idRota}
                  linha={linha}
                  onClick={onClick}
                  onDetailsClick={onDetailsClick}
                  isSelected={selectedId === linha.idRota}
                  isFavorita={isFavorita}
                  onToggleFavorita={onToggleFavorita}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const LineGroupCard = memo(LineGroupCardComponent);
