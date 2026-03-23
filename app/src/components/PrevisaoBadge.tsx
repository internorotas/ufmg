import { useEffect, useRef } from 'react';
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

export function PrevisaoBadge({ linha, idParada, compacto = false }: PrevisaoBadgeProps) {
  const { trackEvent } = useAnalytics();
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

  if (!previsao || !previsao.proximoOnibus) {
    return (
      <span
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

  const { proximoOnibus, onibusAnterior } = previsao;

  if (proximoOnibus.minutosFaltantes < 1) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-1">
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

        {onibusAnterior ? (
          <span className="text-[10px] text-gray-500">
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
    <div className="flex min-w-0 flex-col items-end gap-1">
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

      {onibusAnterior ? (
        <span className="text-[10px] text-gray-500">
          Último passou há {onibusAnterior.minutosQuePassou} min
        </span>
      ) : null}
    </div>
  );
}
