import { MapPin, Timer } from 'lucide-react';
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
  const { distanceKm, durationMs, snapshotsCount } = rastreio;
  const pontosEstimados = Math.max(1, Math.floor(snapshotsCount / 2));

  return (
    <div
      role="status"
      aria-label="Rastreio colaborativo ativo"
      className="pointer-events-none absolute bottom-20 right-3 z-[900] w-56 select-none rounded-xl border border-card-border bg-card p-3 shadow-lg sm:bottom-6 sm:right-4"
    >
      {/* Cabeçalho: dot piscando + linha */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <span className="inline-block size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">REC</span>
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
      </div>

      <div className="my-2.5 h-px bg-card-border" />

      {/* Métricas */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1 text-text-secondary">
          <Timer size={11} aria-hidden="true" />
          <span className="tabular-nums">{formatDuration(durationMs)}</span>
        </div>

        <div className="flex items-center gap-1 text-text-secondary">
          <MapPin size={11} aria-hidden="true" />
          <span className="tabular-nums">{distanceKm.toFixed(1)} km</span>
        </div>

        <div className="flex items-center gap-0.5 text-text-secondary" title="Estimativa sujeita à validação">
          <span>~{pontosEstimados} pts</span>
          <span className="text-[9px] text-text-tertiary">*</span>
        </div>
      </div>

      <p className="mt-1.5 text-[9px] leading-tight text-text-tertiary">
        * pontos sujeitos a validação
      </p>
    </div>
  );
}
