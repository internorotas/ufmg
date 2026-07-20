import { ArrowLeftRight, Bus, Footprints, Map as MapIcon } from 'lucide-react';
import { useEffect } from 'react';
import { tv } from 'tailwind-variants';
import { formatMinutes, formatTimeSP } from '@/lib/formatters';
import { usePlannerStore } from '../store/plannerStore';
import {
  ETA_SOURCE_LABEL,
  type PlannerBusLeg,
  type PlannerEtaSource,
  type PlannerRoutesResponse,
  type PlannerWalkLeg,
} from '../types';
import { JourneyTimelineBar } from './JourneyTimelineBar';

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

const etaBadgeVariants = tv({
  base: 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-tiny font-semibold',
  variants: {
    source: {
      live: 'bg-success-bg text-success-text',
      historical: 'bg-warning-bg text-warning-text',
      scheduled: 'border border-card-border bg-transparent text-text-tertiary',
    },
  },
  defaultVariants: { source: 'scheduled' },
});

const cardVariants = tv({
  base: [
    'rounded-(--shape-sm) bg-card p-4 transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
  ],
  variants: {
    selected: {
      true: 'border-2 border-internoRotas-azul-eletrico shadow-(--elevation-3)',
      false: 'surface-card cursor-pointer hover:bg-card-hover',
    },
  },
  defaultVariants: { selected: false },
});

const legConnectorVariants = tv({
  base: 'mx-auto my-1 h-4 w-px',
  variants: {
    kind: {
      walk: 'border-l border-dashed border-text-tertiary',
      bus: 'border-l-2 border-solid',
    },
  },
  defaultVariants: { kind: 'walk' },
});

// ---------------------------------------------------------------------------
// JourneyStatChips
// ---------------------------------------------------------------------------

function JourneyStatChips({
  walkingMinutes,
  transferCount,
  busCount,
}: {
  walkingMinutes: number;
  transferCount: number;
  busCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
      <span className="flex items-center gap-1">
        <Footprints size={11} aria-hidden="true" />
        {walkingMinutes} min a pé
      </span>
      <span className="flex items-center gap-1">
        <Bus size={11} aria-hidden="true" />
        {busCount} ônibus
      </span>
      {transferCount > 0 ? (
        <span className="flex items-center gap-1">
          <ArrowLeftRight size={11} aria-hidden="true" />
          {transferCount} troca{transferCount !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="font-medium text-success-text">Direto</span>
      )}
    </div>
  );
}

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
          Caminhe {leg.minutes} min · {Math.round(leg.distanceMeters)} m
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
          Embarque em <strong>{leg.fromStopName}</strong> · {formatTimeSP(leg.boardingTime)}
        </span>
        <span className="text-xs text-text-secondary">
          Desça em <strong>{leg.toStopName}</strong> · {formatTimeSP(leg.arrivalTime)}
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
  onViewOnMap: () => void;
}

function AlternativeCard({ alternative, isSelected, onSelect, onViewOnMap }: AlternativeCardProps) {
  const legList = alternative.legs;
  const busLegs = legList.filter((l): l is PlannerBusLeg => l.kind === 'bus');
  const hasLive = alternative.etaBadges.some((b) => b.source === 'live');
  const primaryBadge: PlannerEtaSource = hasLive
    ? 'live'
    : alternative.etaBadges.some((b) => b.source === 'historical')
      ? 'historical'
      : 'scheduled';

  return (
    <article
      data-slot="card"
      className={cardVariants({ selected: isSelected })}
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
          <span className="text-2xl font-bold tabular-nums text-text-primary">
            {formatMinutes(alternative.totalMinutes)}
          </span>
          <span className="text-xs tabular-nums text-text-secondary">
            Chegada {formatTimeSP(alternative.arrivalTime)}
          </span>
        </div>
        <span className={etaBadgeVariants({ source: primaryBadge })}>
          {primaryBadge === 'live' && (
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          )}
          {ETA_SOURCE_LABEL[primaryBadge]}
        </span>
      </header>

      {/* Barra de timeline proporcional */}
      <div className="mb-3">
        <JourneyTimelineBar legs={legList} totalMinutes={alternative.totalMinutes} />
      </div>

      {/* Chips de resumo */}
      <div className="mb-1">
        <JourneyStatChips
          walkingMinutes={alternative.walkingMinutes}
          transferCount={alternative.transferCount}
          busCount={busLegs.length}
        />
      </div>

      {/* Detalhes das legs — sempre no DOM, expandidas apenas quando selecionado */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isSelected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-card-border pt-3 mt-3">
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-3 flex gap-2 border-t border-card-border pt-3">
        {isSelected ? (
          <button
            type="button"
            onClick={onViewOnMap}
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-internoRotas-azul-eletrico px-3 py-1.5 text-sm font-semibold text-white hover:bg-internoRotas-azul-eletrico/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Ver rota selecionada no mapa"
          >
            <MapIcon size={14} aria-hidden="true" />
            Ver no mapa
          </button>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="surface-card-interactive flex min-h-11 items-center px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
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
  const { selectedRouteId, setSelectedRouteId, closePlanner } = usePlannerStore();

  const alternatives = results.alternatives.slice(0, 3);

  const activeId = selectedRouteId ?? (alternatives.length > 0 ? alternatives[0].routeId : null);

  useEffect(() => {
    if (!selectedRouteId && alternatives.length > 0 && alternatives[0]) {
      setSelectedRouteId(alternatives[0].routeId);
    }
  }, [alternatives, selectedRouteId, setSelectedRouteId]);

  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-(--shape-sm) border border-card-border bg-card px-4 py-8 text-center">
        <MapIcon size={32} className="text-text-tertiary" aria-hidden="true" />
        <p className="font-semibold text-text-primary">Nenhuma rota encontrada</p>
        <p className="max-w-xs text-sm text-text-secondary">
          Não encontramos combinação viável entre essas paradas. Tente outra origem, destino ou uma
          parada próxima.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2"
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
          onViewOnMap={() => {
            setSelectedRouteId(alt.routeId);
            closePlanner();
          }}
        />
      ))}
    </div>
  );
}
