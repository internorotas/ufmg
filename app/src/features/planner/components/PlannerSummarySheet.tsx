import { ArrowLeft, Bus, Clock, Footprints, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { tv } from 'tailwind-variants';
import { useSwipeToDismissSheet } from '@/hooks/useSwipeToDismissSheet';
import { formatMinutes, formatTimeSP } from '@/lib/formatters';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerBusLeg } from '../types';
import { ETA_SOURCE_LABEL } from '../types';
import { JourneyTimelineBar } from './JourneyTimelineBar';

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

const sheetVariants = tv({
  base: [
    'fixed bottom-0 left-0 right-0 z-(--z-sheet)',
    'max-h-[75vh] overflow-y-auto',
    'rounded-t-xl border-t border-card-border bg-modal',
    'focus-visible:outline-none',
    'shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
  ],
});

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

// ---------------------------------------------------------------------------
// Props e helpers
// ---------------------------------------------------------------------------

export interface PlannerSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToResults: () => void;
}

function formatarDistancia(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

// ---------------------------------------------------------------------------
// PlannerSummarySheet
// ---------------------------------------------------------------------------

export function PlannerSummarySheet({
  isOpen,
  onClose,
  onBackToResults,
}: PlannerSummarySheetProps) {
  const plannerResults = usePlannerStore((state) => state.plannerResults);
  const selectedRouteId = usePlannerStore((state) => state.selectedRouteId);
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useSwipeToDismissSheet(sheetRef, handleRef, onClose);

  const route =
    plannerResults && selectedRouteId
      ? (plannerResults.alternatives.find(
          (alternative) => alternative.routeId === selectedRouteId,
        ) ?? null)
      : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      sheetRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const element = sheetRef.current;
      if (!element) {
        return;
      }

      const focusable = Array.from(
        element.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        element.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!element.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !route) {
    return null;
  }

  const hasLive = route.etaBadges.some((badge) => badge.source === 'live');
  const primarySource = hasLive
    ? 'live'
    : route.etaBadges.some((badge) => badge.source === 'historical')
      ? 'historical'
      : 'scheduled';

  return createPortal(
    <div
      ref={sheetRef}
      data-slot="planner-summary-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Resumo da rota selecionada"
      tabIndex={-1}
      className={sheetVariants()}
    >
      {/* Handle — arraste para baixo para fechar */}
      <div ref={handleRef} className="flex touch-none justify-center pb-1 pt-3" aria-hidden="true">
        <div className="h-1 w-10 rounded-full bg-card-border" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
        <button
          type="button"
          data-slot="back-to-results"
          onClick={onBackToResults}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary dark:text-brand-accent hover:bg-brand-primary/10 dark:hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Voltar aos resultados"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar aos resultados
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-card-border hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Fechar resumo"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      {/* Resumo da rota */}
      <div className="border-t border-card-border px-4 pt-4 pb-2">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-3xl font-bold tabular-nums text-text-primary">
              {formatMinutes(route.totalMinutes)}
            </span>
            <span className="text-xs tabular-nums text-text-secondary">
              Chegada {formatTimeSP(route.arrivalTime)} · {route.transferCount} troca
              {route.transferCount !== 1 ? 's' : ''} · {route.walkingMinutes} min a pé
            </span>
          </div>
          <span className={etaBadgeVariants({ source: primarySource })}>
            <Clock size={11} aria-hidden="true" />
            {ETA_SOURCE_LABEL[primarySource]}
          </span>
        </div>

        {/* Timeline bar */}
        <JourneyTimelineBar legs={route.legs} totalMinutes={route.totalMinutes} />
      </div>

      {/* Legs com trilho vertical */}
      <div className="px-4 py-4">
        <ul className="relative flex flex-col" aria-label="Segmentos da rota">
          {/* Linha vertical de fundo */}
          <li
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-3.5 top-3.5 w-px bg-card-border"
          />

          {route.legs.map((leg, idx) => {
            const legKey = `${route.routeId}:${leg.kind}:${leg.fromStopId}:${leg.toStopId}:${leg.pathStopIds.join('>')}`;
            const isLast = idx === route.legs.length - 1;

            return (
              <li
                key={legKey}
                className={`relative flex items-start gap-3 ${isLast ? '' : 'pb-4'}`}
              >
                {/* Ícone / dot */}
                {leg.kind === 'walk' ? (
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary ring-2 ring-background">
                    <Footprints size={13} className="text-text-secondary" aria-hidden="true" />
                  </div>
                ) : (
                  <div
                    className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-background"
                    style={{ backgroundColor: `${(leg as PlannerBusLeg).lineColorHex}20` }}
                  >
                    <Bus
                      size={13}
                      style={{ color: (leg as PlannerBusLeg).lineColorHex }}
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* Conteúdo */}
                <div className="flex flex-col gap-0.5 pt-0.5">
                  {leg.kind === 'walk' ? (
                    <>
                      <span className="text-sm font-semibold text-text-primary">
                        Caminhe {leg.minutes} min · {formatarDistancia(leg.distanceMeters)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {leg.fromStopName} → {leg.toStopName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-sm font-bold"
                        style={{ color: (leg as PlannerBusLeg).lineColorHex }}
                      >
                        {(leg as PlannerBusLeg).lineName}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Embarque em <strong>{leg.fromStopName}</strong>
                        {' · '}
                        {formatTimeSP((leg as PlannerBusLeg).boardingTime)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Desça em <strong>{leg.toStopName}</strong>
                        {' · '}
                        {formatTimeSP((leg as PlannerBusLeg).arrivalTime)}
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="h-safe-area-inset-bottom" aria-hidden="true" />
    </div>,
    document.body,
  );
}
