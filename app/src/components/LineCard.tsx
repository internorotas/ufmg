/**
 * LineCard - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import { Bus, ChevronRight, Clock } from 'lucide-react';
import type React from 'react';
import { memo, useMemo } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { getLinhaNotRunningMessage, isLineAvailableToday } from '../config/specialPeriods';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import {
  cn,
  findScheduleIndex,
  minutesToTime,
  obterHorariosLinhaNoDia,
  obterStatusLinha,
  timeToMinutes,
} from '../lib/utils';
import type { Linha } from '../types/data.types';
import { LineStatusBadge, type LineStatusType } from './ui/Badge';

/**
 * Variantes do card principal
 */
export const lineCardVariants = tv({
  base: [
    'relative overflow-hidden rounded-xl border bg-card shadow-sm',
    'cursor-pointer transition-all duration-200 ease-out',
    'hover:shadow-lg hover:-translate-y-0.5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
  ],
  variants: {
    selected: {
      true: ['border-2 border-brand-primary shadow-lg', 'ring-1 ring-brand-primary/20'],
      false: ['border-card-border', 'hover:border-info-border'],
    },
  },
  defaultVariants: {
    selected: false,
  },
});

/**
 * Variantes do botão de detalhes
 */
export const detailsButtonVariants = tv({
  base: [
    'w-full py-2.5 rounded-lg text-white font-semibold cursor-pointer',
    'text-xs md:text-sm shadow-sm',
    'hover:brightness-110 active:scale-[0.97] transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary',
  ],
});

interface ScheduleResult {
  nextSchedule: string;
  previousSchedule: string;
}

export interface LineCardProps extends VariantProps<typeof lineCardVariants> {
  /** Dados da linha de ônibus */
  linha: Linha;
  /** Callback ao clicar no card */
  onClick: (linha: Linha) => void;
  /** Callback ao clicar em "Ver Detalhes" */
  onDetailsClick: (linha: Linha) => void;
  /** Se o card está selecionado */
  isSelected?: boolean;
  /** Parada selecionada para calculo de ETA */
  idParada?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Analisa e ordena os horários em minutos.
 * Esta operação é cara (O(N log N)) e deve ser memoizada.
 */
function parseSchedules(horarios: string[]): number[] {
  if (!horarios || horarios.length === 0) return [];

  return horarios
    .filter((time) => time?.includes(':'))
    .map(timeToMinutes)
    .sort((a, b) => a - b);
}

function calculateSchedules(schedulesInMinutes: number[], currentMinutes: number): ScheduleResult {
  if (schedulesInMinutes.length === 0) {
    return {
      nextSchedule: '--:--',
      previousSchedule: '--:--',
    };
  }

  let nextSchedule = '--:--';
  let previousSchedule = '--:--';

  const nextIndex = findScheduleIndex(schedulesInMinutes, currentMinutes);

  if (nextIndex < schedulesInMinutes.length) {
    nextSchedule = minutesToTime(schedulesInMinutes[nextIndex]);
  }

  const prevIndex = nextIndex - 1;
  if (prevIndex >= 0 && prevIndex < schedulesInMinutes.length) {
    previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
  }

  return { nextSchedule, previousSchedule };
}

interface LineIconProps {
  color: string;
}

function LineIcon({ color }: LineIconProps) {
  return (
    <div
      data-slot="icon"
      className="flex size-12 shrink-0 items-center justify-center rounded-lg shadow-sm"
      style={{ backgroundColor: color }}
    >
      <Bus className="size-6 text-white drop-shadow-sm" aria-hidden="true" />
    </div>
  );
}

interface ScheduleDisplayProps {
  label: string;
  time: string;
  highlight?: boolean;
}

function ScheduleDisplay({ label, time, highlight }: ScheduleDisplayProps) {
  return (
    <div data-slot="schedule" className="rounded-lg bg-background-secondary/50 p-2 text-center">
      <p className="mb-1 flex items-center justify-center gap-1 text-xs text-text-secondary">
        <Clock className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p
        className={cn(
          'text-base font-bold md:text-lg',
          highlight ? 'text-success-text' : 'text-text-primary',
        )}
      >
        {time}
      </p>
    </div>
  );
}

interface SuspendedNoticeProps {
  message: string;
}

function SuspendedNotice({ message }: SuspendedNoticeProps) {
  return (
    <div
      data-slot="notice"
      role="alert"
      aria-live="polite"
      className="mb-4 rounded-lg border border-warning-border bg-warning-bg p-3 text-center"
    >
      <p className="text-xs font-semibold text-warning-text md:text-sm">{message}</p>
    </div>
  );
}

/**
 * Card que exibe informações sobre uma linha de ônibus.
 * Otimizado com React.memo para evitar re-renderizações desnecessárias.
 *
 * @example
 * ```tsx
 * <LineCard
 *   linha={linha}
 *   onClick={handleSelect}
 *   onDetailsClick={openDetails}
 *   isSelected={selectedId === linha.idRota}
 * />
 * ```
 */
function LineCardComponent({
  linha,
  onClick,
  onDetailsClick,
  isSelected = false,
  className,
}: LineCardProps) {
  const { trackEvent } = useAnalytics();
  const now = useCurrentTime();

  const shouldDisableSchedules = !isLineAvailableToday(linha.categoriaDia);
  const getSuspendedMessage = () => getLinhaNotRunningMessage(linha.categoriaDia);

  const schedulesInMinutes = useMemo(() => {
    const horariosDoDia = obterHorariosLinhaNoDia(linha, now);
    return parseSchedules(horariosDoDia);
  }, [linha, now]);

  // Passa schedulesInMinutes para obterStatusLinha para evitar recálculo O(N log N)
  const statusLinha = obterStatusLinha(linha, now, schedulesInMinutes);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const { nextSchedule, previousSchedule } = calculateSchedules(schedulesInMinutes, currentMinutes);

  const status =
    shouldDisableSchedules || statusLinha.id === 'NAO_CIRCULA_HOJE'
      ? 'Não Circulando'
      : statusLinha.texto;

  const statusType: LineStatusType = (() => {
    if (shouldDisableSchedules || statusLinha.id === 'NAO_CIRCULA_HOJE') {
      return 'notRunning';
    }
    if (statusLinha.id === 'AGUARDANDO_PRIMEIRA_SAIDA') {
      return 'upcoming';
    }
    if (statusLinha.id === 'CIRCULANDO') {
      return 'running';
    }
    return 'closed';
  })();

  const handleCardClick = () => {
    trackEvent({
      category: 'engagement',
      action: 'click_line_card',
      label: `${linha.nome} | status=${statusLinha.id} | prox=${nextSchedule}`,
    });
    onClick(linha);
  };

  const handleDetailsClickInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent({
      category: 'navigation',
      action: 'open_line_details',
      label: linha.nome,
    });
    onDetailsClick(linha);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(linha);
    }
  };

  return (
    <article
      data-slot="card"
      data-state={isSelected ? 'selected' : undefined}
      aria-label={`Linha ${linha.nome}${linha.sublinha ? ` - ${linha.sublinha}` : ''}. Status: ${status}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Card contains interactive elements and must be focusable via tabIndex instead of role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(lineCardVariants({ selected: isSelected }), 'mb-3', className)}
    >
      <div data-slot="header" className="relative w-full p-4 pb-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 items-start gap-3">
            <LineIcon color={linha.corHex} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold leading-tight text-text-primary md:text-base">
                {linha.nome}
              </h3>
              {linha.sublinha && (
                <p className="mt-0.5 text-xs text-text-secondary md:text-sm">{linha.sublinha}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LineStatusBadge status={statusType} label={status} size="xs" />
            <ChevronRight className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div data-slot="body" className="px-4 pb-4">
        {shouldDisableSchedules || statusLinha.id === 'NAO_CIRCULA_HOJE' ? (
          <SuspendedNotice
            message={shouldDisableSchedules ? getSuspendedMessage() : statusLinha.texto}
          />
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <ScheduleDisplay label="Último Partiu" time={previousSchedule} />
            <ScheduleDisplay label="Próximo" time={nextSchedule} highlight />
          </div>
        )}

        <button
          type="button"
          aria-label={`Ver detalhes da linha ${linha.nome}`}
          data-slot="action"
          onClick={handleDetailsClickInternal}
          className={detailsButtonVariants()}
          style={{ backgroundColor: linha.corHex }}
        >
          Ver Detalhes
        </button>
      </div>
    </article>
  );
}

export const LineCard = memo(LineCardComponent);
