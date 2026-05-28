/**
 * PlannerResults — lista de itinerários multimodais calculados pelo backend.
 * Até 3 alternativas, com caminhada explícita em minutos/metros.
 */

import { Bus, Footprints, Map as MapIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';
import { usePlannerStore } from '../store/plannerStore';
import {
  ETA_SOURCE_LABEL,
  type PlannerBusLeg,
  type PlannerRoutesResponse,
  type PlannerWalkLeg,
} from '../types';

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

const resultsContainerVariants = tv({
  base: 'flex flex-col gap-2',
});

const alternativeCardVariants = tv({
  base: [
    'rounded-xl border bg-card p-4 transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
  ],
  variants: {
    selected: {
      true: 'border-2 border-internoRotas-azul-eletrico shadow-lg ring-1 ring-internoRotas-azul-eletrico/20',
      false: 'border-card-border shadow-sm hover:shadow-md cursor-pointer',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const etaBadgeVariants = tv({
  base: 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
  variants: {
    source: {
      live: 'bg-success-bg text-success-text',
      historical: 'bg-background-secondary text-text-secondary',
      scheduled: 'border border-card-border bg-transparent text-text-tertiary',
    },
  },
  defaultVariants: {
    source: 'scheduled',
  },
});

const legConnectorVariants = tv({
  base: 'mx-auto my-1 h-4 w-px',
  variants: {
    kind: {
      walk: 'border-l border-dashed border-text-tertiary',
      bus: 'border-l-2 border-solid',
    },
  },
  defaultVariants: {
    kind: 'walk',
  },
});

// ---------------------------------------------------------------------------
// WalkLegRow
// ---------------------------------------------------------------------------

function WalkLegRow({ leg }: { leg: PlannerWalkLeg }) {
  return (
    <div className="flex items-start gap-3 py-1.5" data-slot="walk-leg">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary">
        <Footprints size={14} className="text-text-secondary" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-text-primary">
          Caminhe {leg.minutes} min · {leg.distanceMeters} m
        </span>
        <span className="text-xs text-text-secondary">
          {leg.fromStopName} → {leg.toStopName}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BusLegRow
// ---------------------------------------------------------------------------

function BusLegRow({ leg }: { leg: PlannerBusLeg }) {
  const sourceBadgeLabel = ETA_SOURCE_LABEL[leg.eta.source];

  return (
    <div className="flex items-start gap-3 py-1.5" data-slot="bus-leg">
      {/* Indicador de cor da linha */}
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${leg.lineColorHex}20` }}
      >
        <Bus size={14} style={{ color: leg.lineColorHex }} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold" style={{ color: leg.lineColorHex }}>
            {leg.lineName}
          </span>
          <span className={etaBadgeVariants({ source: leg.eta.source })}>{sourceBadgeLabel}</span>
        </div>
        <span className="text-xs text-text-secondary">
          Embarque em <strong>{leg.fromStopName}</strong> · {leg.boardingTime}
        </span>
        <span className="text-xs text-text-secondary">
          Desça em <strong>{leg.toStopName}</strong> · {leg.arrivalTime}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlternativeCard
// ---------------------------------------------------------------------------

interface AlternativeCardProps {
  alternative: PlannerRoutesResponse['alternatives'][number];
  isSelected: boolean;
  onSelect: () => void;
}

function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const legList = alternative.legs;
  const hasLive = alternative.etaBadges.some((b) => b.source === 'live');
  const primaryBadge = hasLive
    ? 'live'
    : alternative.etaBadges.some((b) => b.source === 'historical')
      ? 'historical'
      : 'scheduled';

  return (
    <article
      data-slot="card"
      className={alternativeCardVariants({ selected: isSelected })}
      aria-label={`Itinerário: ${alternative.totalMinutes} min, chegada ${alternative.arrivalTime}`}
      data-selected={isSelected}
      onClick={isSelected ? undefined : onSelect}
      onKeyDown={(e) => {
        if (!isSelected && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={isSelected ? -1 : 0}
    >
      {/* Cabeçalho */}
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold tabular-nums text-text-primary">
            {alternative.totalMinutes} min
          </span>
          <span className="text-xs tabular-nums text-text-secondary">
            Chegada {alternative.arrivalTime} · {alternative.transferCount} troca
            {alternative.transferCount !== 1 ? 's' : ''} · {alternative.walkingMinutes} min a pé
          </span>
        </div>
        <span className={etaBadgeVariants({ source: primaryBadge })}>
          {ETA_SOURCE_LABEL[primaryBadge]}
        </span>
      </header>

      {/* Legs */}
      <ul className="flex flex-col" aria-label="Segmentos do itinerário">
        {legList.map((leg, idx) => {
          const legKey = `${alternative.routeId}:${leg.kind}:${leg.fromStopId}:${leg.toStopId}:${leg.pathStopIds.join('>')}`;

          return (
            <li key={legKey}>
              {leg.kind === 'walk' ? <WalkLegRow leg={leg} /> : <BusLegRow leg={leg} />}
              {idx < legList.length - 1 && (
                <div
                  className={legConnectorVariants({ kind: leg.kind })}
                  style={
                    leg.kind === 'bus'
                      ? { borderColor: (leg as PlannerBusLeg).lineColorHex }
                      : undefined
                  }
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <footer className="mt-3 flex gap-2 border-t border-card-border pt-3">
        {isSelected ? (
          <button
            type="button"
            className="flex min-h-9 items-center gap-1.5 rounded-lg bg-internoRotas-azul-eletrico px-3 py-1.5 text-sm font-semibold text-white hover:bg-internoRotas-azul-eletrico/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Ver rota selecionada no mapa"
          >
            <MapIcon size={14} aria-hidden="true" />
            Ver no mapa
          </button>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="flex min-h-9 items-center rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={`Comparar este itinerário: ${alternative.totalMinutes} min`}
          >
            Comparar
          </button>
        )}
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------------------
// PlannerResults
// ---------------------------------------------------------------------------

interface PlannerResultsProps {
  results: PlannerRoutesResponse;
}

export function PlannerResults({ results }: PlannerResultsProps) {
  const { selectedRouteId, setSelectedRouteId } = usePlannerStore();

  const alternatives = results.alternatives.slice(0, 3);

  const activeId = selectedRouteId ?? (alternatives.length > 0 ? alternatives[0].routeId : null);

  if (alternatives.length === 0) {
    return (
      <div className="rounded-lg border border-card-border bg-card p-4 text-sm text-text-secondary">
        <p className="font-semibold text-text-primary">Nenhuma rota encontrada</p>
        <p className="mt-1">
          Não encontramos uma combinação viável entre essas paradas no tenant ativo. Tente outra
          origem, destino ou uma parada intermediária próxima.
        </p>
      </div>
    );
  }

  return (
    <div
      className={resultsContainerVariants()}
      role="listbox"
      aria-label="Alternativas de rota"
      aria-live="polite"
    >
      {alternatives.map((alt) => (
        <AlternativeCard
          key={alt.routeId}
          alternative={alt}
          isSelected={alt.routeId === activeId}
          onSelect={() => setSelectedRouteId(alt.routeId)}
        />
      ))}
    </div>
  );
}
