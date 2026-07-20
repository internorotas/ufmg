import {
  Check,
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { numLinha } from '@/features/gps/lib/markerUtils';
import type { Linha } from '@/types/data.types';

const STOP_CONFIRM_WINDOW_MS = 3000;

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

  const [stopArmed, setStopArmed] = useState(false);
  const stopArmedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (stopArmedTimeoutRef.current) clearTimeout(stopArmedTimeoutRef.current);
    },
    [],
  );

  const handleStopClick = useCallback(() => {
    if (stopArmed) {
      if (stopArmedTimeoutRef.current) clearTimeout(stopArmedTimeoutRef.current);
      setStopArmed(false);
      void stop('manual');
      return;
    }
    setStopArmed(true);
    stopArmedTimeoutRef.current = setTimeout(() => setStopArmed(false), STOP_CONFIRM_WINDOW_MS);
  }, [stopArmed, stop]);

  if (isMinimized) {
    return (
      <div className="pointer-events-auto absolute bottom-24 left-3 flex h-11 items-center gap-1 rounded surface-card bg-card px-2 md:bottom-6 md:left-[min(calc(50vw+1rem),29rem)]">
        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label="Expandir painel de rastreio"
          className="flex min-h-11 items-center gap-2 px-1"
        >
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-tiny font-bold tabular-nums" style={{ color: linha.corHex }}>
            {numLinha(linha)}
          </span>
          {!isStarting && (
            <span className="text-tiny tabular-nums text-text-secondary">
              {formatDuration(durationMs)}
            </span>
          )}
          <ChevronUp size={13} className="text-text-secondary" aria-hidden="true" />
        </button>
        <Link
          to="/"
          aria-label="Ver rota no mapa"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
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
      className="pointer-events-none absolute bottom-24 left-3 w-56 select-none surface-card bg-card md:bottom-6 md:left-[min(calc(50vw+1rem),29rem)]"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-1.5 p-2.5 pb-2">
        <div className="flex shrink-0 items-center gap-1">
          {isStarting ? (
            <Loader2
              size={11}
              className="animate-spin text-brand-primary dark:text-brand-accent"
              aria-hidden="true"
            />
          ) : (
            <span
              className="inline-block size-1.5 animate-pulse rounded-full bg-red-500"
              aria-hidden="true"
            />
          )}
          <span
            className={`text-micro font-bold uppercase tracking-widest ${
              isStarting ? 'text-brand-primary dark:text-brand-accent' : 'text-red-500'
            }`}
          >
            {isStarting ? 'Iniciando' : 'REC'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-micro font-bold tabular-nums"
              style={{ backgroundColor: `${linha.corHex}22`, color: linha.corHex }}
              aria-hidden="true"
            >
              {numLinha(linha)}
            </span>
            <p className="truncate text-micro font-semibold text-text-primary leading-tight">
              {linha.nome}
            </p>
          </div>
          {linha.sublinha && (
            <p className="truncate pl-5 text-micro text-text-tertiary leading-tight">
              {linha.sublinha}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label="Minimizar painel"
          className="pointer-events-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary active:scale-90"
        >
          <ChevronDown size={10} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleStopClick}
          aria-label={stopArmed ? 'Confirmar encerramento do rastreio' : 'Encerrar rastreio'}
          title={stopArmed ? 'Toque de novo para confirmar' : undefined}
          className={`pointer-events-auto flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary active:scale-90 ${
            stopArmed
              ? 'min-w-11 bg-warning-solid px-2 text-white hover:bg-warning-solid/90'
              : 'min-w-11 bg-warning-bg text-warning-text hover:bg-warning-bg/80'
          }`}
        >
          {stopArmed ? (
            <>
              <Check size={10} aria-hidden="true" />
              <span className="text-micro font-semibold">Confirmar</span>
            </>
          ) : (
            <Square size={10} fill="currentColor" aria-hidden="true" />
          )}
        </button>
      </div>
      {stopArmed && (
        <p role="status" aria-live="polite" className="sr-only">
          Toque novamente no botão de encerrar para confirmar. A confirmação expira em alguns
          segundos.
        </p>
      )}

      {!isStarting && (
        <>
          <div className="mx-2.5 h-px bg-card-border" />

          {/* Métricas linha 1: tempo + distância */}
          <div className="flex items-center justify-between gap-1 px-2.5 pt-2 text-micro">
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
          <div className="flex items-center justify-between gap-1 px-2.5 pb-2 pt-1 text-micro">
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
          <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 text-micro">
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
