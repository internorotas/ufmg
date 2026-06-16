import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Map as MapIcon,
  MapPin,
  Radio,
  Square,
  Timer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import type { Linha } from '@/types/data.types';

interface GpsTrackingCardProps {
  rastreio: GpsTrackingState;
  linha: Linha;
  speedKmh?: number;
  accuracyM?: number;
  isMinimized: boolean;
  onToggleMinimize: () => void;
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

function signalLabel(accuracyM: number | undefined): { label: string; ok: boolean } {
  if (accuracyM === undefined) return { label: '—', ok: true };
  if (accuracyM <= 20) return { label: 'Ótimo', ok: true };
  if (accuracyM <= 50) return { label: `±${Math.round(accuracyM)}m`, ok: true };
  return { label: `±${Math.round(accuracyM)}m`, ok: false };
}

export function GpsTrackingCard({
  rastreio,
  linha,
  speedKmh,
  accuracyM,
  isMinimized,
  onToggleMinimize,
}: GpsTrackingCardProps) {
  const { distanceKm, durationMs, snapshotsCount, queueSize, isSyncing, status, stop } = rastreio;
  const isStarting = status === 'starting';
  const pontosEstimados = Math.max(1, Math.floor(snapshotsCount / 2));
  const signal = signalLabel(accuracyM);
  const hasQueue = queueSize > 0;

  if (isMinimized) {
    return (
      <div className="pointer-events-auto absolute bottom-24 left-3 flex h-11 items-center gap-1 rounded neo-brutal bg-card px-2 md:bottom-6 md:left-4">
        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label="Expandir painel de rastreio"
          className="flex h-full items-center gap-2 px-1"
        >
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-[11px] font-bold tabular-nums" style={{ color: linha.corHex }}>
            {linha.linha}
          </span>
          <ChevronUp size={13} className="text-text-secondary" aria-hidden="true" />
        </button>
        <Link
          to="/"
          aria-label="Ver rota no mapa"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
        >
          <MapIcon size={13} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Rastreio colaborativo ativo"
      className="pointer-events-none absolute bottom-24 left-3 w-48 select-none neo-brutal bg-card md:bottom-6 md:left-4"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-1.5 p-2.5 pb-2">
        <div className="flex shrink-0 items-center gap-1">
          {isStarting ? (
            <Loader2 size={11} className="animate-spin text-brand-primary" aria-hidden="true" />
          ) : (
            <span
              className="inline-block size-1.5 animate-pulse rounded-full bg-red-500"
              aria-hidden="true"
            />
          )}
          <span
            className={`text-[9px] font-bold uppercase tracking-widest ${
              isStarting ? 'text-brand-primary' : 'text-red-500'
            }`}
          >
            {isStarting ? 'Iniciando' : 'REC'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold tabular-nums"
              style={{ backgroundColor: `${linha.corHex}22`, color: linha.corHex }}
              aria-hidden="true"
            >
              {linha.linha}
            </span>
            <p className="truncate text-[10px] font-semibold text-text-primary">{linha.nome}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label="Minimizar painel"
          className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary active:scale-90"
        >
          <ChevronDown size={10} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => void stop('manual')}
          aria-label="Encerrar rastreio"
          className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warning-bg text-warning-text transition-colors hover:bg-warning-bg/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary active:scale-90"
        >
          <Square size={10} fill="currentColor" aria-hidden="true" />
        </button>
      </div>

      {!isStarting && (
        <>
          <div className="mx-2.5 h-px bg-card-border" />

          {/* Métricas linha 1: tempo + distância */}
          <div className="flex items-center justify-between gap-1 px-2.5 pt-2 text-[10px]">
            <div className="flex items-center gap-0.5 text-text-secondary">
              <Timer size={9} aria-hidden="true" />
              <span className="tabular-nums">{formatDuration(durationMs)}</span>
            </div>
            <div className="flex items-center gap-0.5 text-text-secondary">
              <MapPin size={9} aria-hidden="true" />
              <span className="tabular-nums">{distanceKm.toFixed(2)} km</span>
            </div>
          </div>

          {/* Métricas linha 2: pontos + velocidade */}
          <div className="flex items-center justify-between gap-1 px-2.5 pb-2 pt-1 text-[10px]">
            <div
              className="flex items-center gap-0.5 text-text-secondary"
              title="Pontos estimados (sujeitos a validação)"
            >
              <Radio size={9} aria-hidden="true" />
              <span>~{pontosEstimados} pts</span>
            </div>
            {speedKmh !== undefined && speedKmh > 0.5 && (
              <div className="flex items-center gap-0.5 text-text-secondary">
                <span className="tabular-nums">{speedKmh.toFixed(0)} km/h</span>
              </div>
            )}
          </div>

          <div className="mx-2.5 h-px bg-card-border" />

          {/* Status: sinal GPS + sincronização */}
          <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 text-[10px]">
            <span
              className={signal.ok ? 'text-success-text' : 'text-warning-text'}
              title={`Precisão GPS: ${accuracyM !== undefined ? `±${Math.round(accuracyM)}m` : 'desconhecida'}`}
            >
              {signal.label}
            </span>

            {hasQueue || isSyncing ? (
              <div className="flex items-center gap-0.5 text-text-tertiary">
                {isSyncing ? (
                  <Loader2 size={8} className="animate-spin" aria-hidden="true" />
                ) : (
                  <WifiOff size={8} aria-hidden="true" />
                )}
                <span>{queueSize > 0 ? `${queueSize} fila` : 'enviando'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-success-text">
                <Wifi size={8} aria-hidden="true" />
                <span>em dia</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
