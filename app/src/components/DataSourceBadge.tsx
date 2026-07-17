import { Clock, Globe, Radio, Users } from 'lucide-react';
import { memo, useMemo } from 'react';
import type { PrevisaoChegadaComposta } from '@/hooks/usePrevisaoChegada';

interface DataSourceBadgeProps {
  previsao: PrevisaoChegadaComposta | null;
  className?: string;
}

function formatTimeAgo(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return null;
}

export const DataSourceBadge = memo(function DataSourceBadge({
  previsao,
  className,
}: DataSourceBadgeProps) {
  const badge = useMemo(() => {
    if (!previsao) {
      return {
        icon: Clock,
        label: 'Horário programado',
        tone: 'neutral' as const,
      };
    }

    const isRemote = previsao.fonte === 'realtime';
    const hasCollabData = isRemote && previsao.remoto && previsao.remoto.samples > 0;

    const isRecentCollab =
      hasCollabData &&
      previsao.remoto?.updatedAt &&
      Date.now() - new Date(previsao.remoto.updatedAt).getTime() < 10 * 60_000;

    if (isRecentCollab) {
      const timeAgo = formatTimeAgo(previsao.remoto?.updatedAt ?? null);
      return {
        icon: Users,
        label: 'Colaborativo',
        sublabel: timeAgo ? `Atualizado há ${timeAgo}` : null,
        tone: 'success' as const,
      };
    }

    if (isRemote && previsao.remoto?.samples && previsao.remoto.samples > 0) {
      const timeAgo = formatTimeAgo(previsao.remoto.updatedAt ?? null);
      return {
        icon: Radio,
        label: 'Estimativa calculada',
        sublabel: timeAgo ? `Dados de há ${timeAgo}` : null,
        tone: 'info' as const,
      };
    }

    if (isRemote) {
      return {
        icon: Globe,
        label: 'Estimativa calculada',
        tone: 'info' as const,
      };
    }

    return {
      icon: Clock,
      label: 'Horário programado',
      tone: 'neutral' as const,
    };
  }, [previsao]);

  const toneStyles = {
    neutral: 'bg-neutral-bg text-neutral-text border-neutral-border',
    success: 'bg-success-bg text-success-text border-success-border',
    info: 'bg-info-bg text-info-text border-info-border',
  } as const;

  const Icon = badge.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-tight ${toneStyles[badge.tone]} ${className ?? ''}`}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span>{badge.label}</span>
      {badge.sublabel ? <span className="opacity-70">· {badge.sublabel}</span> : null}
    </span>
  );
});
