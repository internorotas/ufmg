import { Loader2, MapPin, Square, Timer } from 'lucide-react';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import type { Linha } from '@/types/data.types';

interface GpsTrackingCardProps {
  rastreio: GpsTrackingState;
  linha: Linha;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GpsTrackingCard({ rastreio, linha }: GpsTrackingCardProps) {
  const { distanceKm, durationMs, snapshotsCount, status, stop } = rastreio;
  const isStarting = status === 'starting';
  const pontosEstimados = Math.max(1, Math.floor(snapshotsCount / 2));

  return (
    <div
      role="status"
      aria-label="Rastreio colaborativo"
      className="pointer-events-none absolute bottom-20 left-1/2 z-900 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 select-none rounded-xl border border-card-border bg-card shadow-lg sm:bottom-6"
    >
      {/* Cabeçalho: indicador + linha + botão parar */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex shrink-0 items-center gap-1.5">
          {isStarting ? (
            <Loader2 size={12} className="animate-spin text-brand-primary" aria-hidden="true" />
          ) : (
            <span
              className="inline-block size-2 animate-pulse rounded-full bg-red-500"
              aria-hidden="true"
            />
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isStarting ? 'text-brand-primary' : 'text-red-500'
            }`}
          >
            {isStarting ? 'Iniciando' : 'REC'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums"
              style={{ backgroundColor: `${linha.corHex}22`, color: linha.corHex }}
              aria-hidden="true"
            >
              {linha.linha}
            </span>
            <p className="truncate text-xs font-semibold text-text-primary">{linha.nome}</p>
          </div>
          {linha.sublinha ? (
            <p className="truncate text-[10px] text-text-tertiary">{linha.sublinha}</p>
          ) : null}
        </div>

        {/* Botão parar — pointer-events-auto para ser clicável dentro do container none */}
        <button
          type="button"
          onClick={() => void stop('manual')}
          aria-label="Encerrar rastreio colaborativo"
          className="pointer-events-auto ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning-text transition-colors hover:bg-warning-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-90"
        >
          <Square size={13} fill="currentColor" aria-hidden="true" />
        </button>
      </div>

      {/* Métricas — visíveis só quando rastreio está ativo */}
      {!isStarting && (
        <>
          <div className="mx-3 h-px bg-card-border" />
          <div className="flex items-center justify-between gap-2 p-3 pt-2 text-[11px]">
            <div className="flex items-center gap-1 text-text-secondary">
              <Timer size={11} aria-hidden="true" />
              <span className="tabular-nums">{formatDuration(durationMs)}</span>
            </div>

            <div className="flex items-center gap-1 text-text-secondary">
              <MapPin size={11} aria-hidden="true" />
              <span className="tabular-nums">{distanceKm.toFixed(1)} km</span>
            </div>

            <div
              className="flex items-center gap-0.5 text-text-secondary"
              title="Estimativa sujeita à validação"
            >
              <span>~{pontosEstimados} pts</span>
              <span className="text-[9px] text-text-tertiary">*</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
