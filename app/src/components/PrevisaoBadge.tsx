import { useEffect, useRef } from 'react';
import { isLineAvailableToday } from '../config/specialPeriods';
import { useAnalytics } from '../hooks/useAnalytics';
import { usePrevisaoChegada } from '../hooks/usePrevisaoChegada';
import type { Linha } from '../types/data.types';

interface PrevisaoBadgeProps {
  linha: Linha;
  idParada: string;
  compacto?: boolean;
}

function formatarDuracao(minutos: number): string {
  if (minutos <= 59) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${minutosRestantes}min`;
}

function formatarAtrasoHistorico(segundos: number | null | undefined): string | null {
  if (segundos === null || segundos === undefined) {
    return null;
  }

  const minutos = Math.round(segundos / 60);
  const sinal = minutos > 0 ? '+' : '';
  return `${sinal}${minutos} min`;
}

export function PrevisaoBadge({ linha, idParada, compacto = false }: PrevisaoBadgeProps) {
  const { trackEvent } = useAnalytics();
  const linhaVigente = isLineAvailableToday(linha.categoriaDia);
  const previsao = usePrevisaoChegada(linha, idParada);
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const next = previsao?.proximoOnibus;
    if (!next) return;

    const roundedBucket = Math.floor(next.minutosFaltantes / 5) * 5;
    const trackingKey = `${linha.idRota}:${idParada}:${roundedBucket}`;
    if (lastTrackedKeyRef.current === trackingKey) return;

    lastTrackedKeyRef.current = trackingKey;
    trackEvent({
      event: 'eta_viewed',
      category: 'engagement',
      action: 'eta_viewed',
      label: `${linha.idRota}:${idParada}`,
      value: next.minutosFaltantes,
    });
  }, [idParada, linha.idRota, previsao?.proximoOnibus, trackEvent]);

  if (!linhaVigente) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: 'var(--neutral-bg)',
          color: 'var(--neutral-text)',
        }}
      >
        Sem previsão
      </span>
    );
  }

  // previsao === null: dados insuficientes (trajeto ausente, parada fora da rota, etc.)
  // previsao.proximoOnibus === null: linha opera hoje, mas o último ônibus já passou
  if (!previsao || !previsao.proximoOnibus) {
    const texto = previsao ? 'Sem mais ônibus hoje' : 'Sem previsão';
    return (
      <span
        role="status"
        aria-live="polite"
        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: 'var(--neutral-bg)',
          color: 'var(--neutral-text)',
        }}
      >
        {texto}
      </span>
    );
  }

  const { proximoOnibus, onibusAnterior } = previsao;
  const atrasoHistorico = formatarAtrasoHistorico(previsao.remoto?.historicalMedianDelaySeconds);

  if (proximoOnibus.minutosFaltantes < 1) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex min-w-0 flex-col items-end gap-1"
      >
        <span
          className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-bold ${compacto ? 'max-w-42.5' : ''}`}
          style={{
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-text)',
          }}
        >
          <span className="inline-flex min-w-0 items-center gap-1">
            <span className={compacto ? 'truncate' : ''}>Chega agora</span>
          </span>
        </span>

        {onibusAnterior && !compacto ? (
          <span className="text-[11px] text-text-secondary">
            Último passou há {onibusAnterior.minutosQuePassou} min
          </span>
        ) : null}
      </div>
    );
  }

  const isUrgent = proximoOnibus.minutosFaltantes <= 15;
  const bgVar = isUrgent ? '--success-bg' : '--warning-bg';
  const textVar = isUrgent ? '--success-text' : '--warning-text';
  const textoPrevisao = compacto
    ? `Chega em ~${formatarDuracao(proximoOnibus.minutosFaltantes)}`
    : `Chega em aproximadamente ${formatarDuracao(proximoOnibus.minutosFaltantes)}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex min-w-0 flex-col items-end gap-1"
    >
      <span
        className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-bold ${compacto ? 'max-w-42.5' : ''}`}
        style={{
          backgroundColor: `var(${bgVar})`,
          color: `var(${textVar})`,
        }}
      >
        <span className="inline-flex min-w-0 items-center gap-1">
          <span className={compacto ? 'truncate' : ''}>{textoPrevisao}</span>
        </span>
      </span>

      {onibusAnterior && !compacto ? (
        <span className="text-[11px] text-text-secondary">
          Último passou há {onibusAnterior.minutosQuePassou} min
        </span>
      ) : null}
      {atrasoHistorico && !compacto ? (
        <span className="text-[11px] text-text-secondary">
          Histórico desta hora: {atrasoHistorico}
        </span>
      ) : null}
    </div>
  );
}
