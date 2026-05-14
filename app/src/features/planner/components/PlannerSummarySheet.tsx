/**
 * PlannerSummarySheet — resumo mobile do itinerário selecionado.
 */

import { ArrowLeft, Bus, Clock, Footprints, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { tv } from 'tailwind-variants';
import { usePlannerStore } from '../store/plannerStore';
import type { PlannerBusLeg } from '../types';
import { ETA_SOURCE_LABEL } from '../types';

const backdropVariants = tv({
  base: 'fixed inset-0 z-[1099] cursor-pointer bg-black/40',
});

const sheetVariants = tv({
  base: [
    'fixed bottom-0 left-0 right-0 z-[1100]',
    'max-h-[70vh] overflow-y-auto',
    'rounded-t-2xl border-t border-card-border bg-modal shadow-2xl',
    'focus-visible:outline-none',
  ],
});

export interface PlannerSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToResults: () => void;
}

export function PlannerSummarySheet({
  isOpen,
  onClose,
  onBackToResults,
}: PlannerSummarySheetProps) {
  const plannerResults = usePlannerStore((state) => state.plannerResults);
  const selectedRouteId = usePlannerStore((state) => state.selectedRouteId);
  const sheetRef = useRef<HTMLDivElement>(null);

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
    <>
      <button
        type="button"
        aria-label="Fechar resumo da rota"
        tabIndex={-1}
        className={backdropVariants()}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        data-slot="planner-summary-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Resumo da rota selecionada"
        tabIndex={-1}
        className={sheetVariants()}
      >
        <div className="flex justify-center pb-1 pt-3" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-card-border" />
        </div>

        <header className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
          <button
            type="button"
            data-slot="back-to-results"
            onClick={onBackToResults}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Voltar aos resultados"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar aos resultados
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-card-border hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Fechar resumo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="border-t border-card-border px-4 py-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold tabular-nums text-text-primary">
                {route.totalMinutes} min
              </span>
              <span className="text-xs tabular-nums text-text-secondary">
                Chegada {route.arrivalTime} · {route.transferCount} troca
                {route.transferCount !== 1 ? 's' : ''} · {route.walkingMinutes} min a pé
              </span>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-card-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              <Clock size={11} aria-hidden="true" />
              {ETA_SOURCE_LABEL[primarySource]}
            </span>
          </div>

          <ul className="flex flex-col gap-2" aria-label="Segmentos da rota">
            {route.legs.map((leg) => {
              const legKey = `${route.routeId}:${leg.kind}:${leg.fromStopId}:${leg.toStopId}:${leg.pathStopIds.join('>')}`;

              return (
                <li key={legKey} className="flex items-start gap-3">
                  {leg.kind === 'walk' ? (
                    <>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary">
                        <Footprints size={13} className="text-text-secondary" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <span className="text-sm font-semibold text-text-primary">
                          Caminhe {leg.minutes} min · {leg.distanceMeters} m
                        </span>
                        <span className="text-xs text-text-secondary">
                          {leg.fromStopName} → {leg.toStopName}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${(leg as PlannerBusLeg).lineColorHex}20` }}
                      >
                        <Bus
                          size={13}
                          style={{ color: (leg as PlannerBusLeg).lineColorHex }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <span
                          className="text-sm font-bold"
                          style={{ color: (leg as PlannerBusLeg).lineColorHex }}
                        >
                          {(leg as PlannerBusLeg).lineName}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Embarque em <strong>{leg.fromStopName}</strong>
                        </span>
                        <span className="text-xs text-text-secondary">
                          Desça em <strong>{leg.toStopName}</strong>
                        </span>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="h-safe-area-inset-bottom" aria-hidden="true" />
      </div>
    </>,
    document.body,
  );
}
