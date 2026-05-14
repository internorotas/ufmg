/**
 * LineCard - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import { Bus, ChevronRight, Clock, Star } from 'lucide-react';
import type React from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { tv, type VariantProps } from 'tailwind-variants';
import {
  cn,
  findScheduleIndex,
  hexToRgba,
  minutesToTime,
  obterHorariosLinhaNoDia,
  obterStatusLinha,
  timeToMinutes,
} from '@/lib/utils';
import type { Linha } from '@/types/data.types';
import { getLinhaNotRunningMessage, isLineAvailableToday } from '../config/specialPeriods';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { useFavoritos } from '../hooks/useFavoritos';
import { getSaoPauloMinutesOfDay } from '../lib/time';
import { PrevisaoBadge } from './PrevisaoBadge';
import { LineStatusBadge, type LineStatusType } from './ui/Badge';

/**
 * Variantes do card principal
 */
export const lineCardVariants = tv({
  base: [
    'relative overflow-hidden rounded-xl border bg-card shadow-sm',
    'transition-all duration-200 ease-out',
    'hover:shadow-lg hover:-translate-y-0.5',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2',
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
    'w-full rounded-lg border bg-background px-4 py-3 font-semibold cursor-pointer',
    'text-sm shadow-sm',
    'hover:bg-card-hover active:scale-[0.97] transition-all duration-150',
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
  /** Estado de favorito da linha (opcional para compatibilidade incremental) */
  isFavorita?: boolean;
  /** Callback de alternância de favorito (opcional para compatibilidade incremental) */
  onToggleFavorita?: (idRota: string) => void;
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
      className="flex size-12 shrink-0 items-center justify-center rounded-lg border shadow-sm"
      style={{
        backgroundColor: hexToRgba(color, 0.12),
        borderColor: hexToRgba(color, 0.24),
      }}
    >
      <Bus className="size-6 drop-shadow-sm" style={{ color }} aria-hidden="true" />
    </div>
  );
}

function getLineDescriptionId(idRota: string): string {
  return `line-card-description-${idRota}`;
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
  idParada,
  className,
  isFavorita,
  onToggleFavorita,
}: LineCardProps) {
  const { t } = useTranslation('line-card');
  const { trackEvent } = useAnalytics();
  const { isFavorito, toggleFavorito } = useFavoritos();
  const now = useCurrentTime();
  const favoritado = isFavorita ?? isFavorito(linha.idRota);

  const shouldDisableSchedules = !isLineAvailableToday(linha.categoriaDia);
  const getSuspendedMessage = () => getLinhaNotRunningMessage(linha.categoriaDia);

  const schedulesInMinutes = useMemo(() => {
    const horariosDoDia = obterHorariosLinhaNoDia(linha, now);
    return parseSchedules(horariosDoDia);
  }, [linha, now]);

  // Passa schedulesInMinutes para obterStatusLinha para evitar recálculo O(N log N)
  const statusLinha = obterStatusLinha(linha, now, schedulesInMinutes);

  const currentMinutes = getSaoPauloMinutesOfDay(now);
  const { nextSchedule, previousSchedule } = calculateSchedules(schedulesInMinutes, currentMinutes);

  const status =
    shouldDisableSchedules || statusLinha.id === 'NAO_CIRCULA_HOJE'
      ? t('status.notRunning')
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

  const handleFavoritoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorita) {
      trackEvent({
        category: 'engagement',
        action: favoritado ? 'unfavorite_line' : 'favorite_line',
        label: linha.nome,
      });

      onToggleFavorita(linha.idRota);
      return;
    }

    toggleFavorito(linha.idRota, linha.nome);
  };

  return (
    <article
      data-slot="card"
      data-state={isSelected ? 'selected' : undefined}
      className={cn(lineCardVariants({ selected: isSelected }), 'mb-3', className)}
      style={{ '--line-color': linha.corHex } as React.CSSProperties}
    >
      <button
        type="button"
        data-slot="select-line"
        onClick={handleCardClick}
        aria-pressed={isSelected}
        aria-describedby={getLineDescriptionId(linha.idRota)}
        className="w-full cursor-pointer text-left focus-visible:outline-none"
      >
        <div data-slot="header" className="relative w-full p-4 pb-3 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-1 items-start gap-3">
              <LineIcon color={linha.corHex} />
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5">
                <h3 className="text-base font-bold leading-tight text-text-primary md:text-lg">
                  {linha.nome}
                </h3>
                {linha.sublinha && (
                  <p className="col-span-2 text-sm text-text-secondary">{linha.sublinha}</p>
                )}
                <div className="col-start-2 row-start-1 flex items-center gap-2">
                  {favoritado && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        borderColor: hexToRgba(linha.corHex, 0.32),
                        backgroundColor: hexToRgba(linha.corHex, 0.12),
                        color: linha.corHex,
                      }}
                    >
                      <Star className="size-3 fill-current" aria-hidden="true" />
                      {t('favorite')}
                    </span>
                  )}
                  <LineStatusBadge status={statusType} label={status} size="xs" />
                  <ChevronRight
                    className="size-5 shrink-0 text-text-secondary"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div data-slot="body" className="px-4">
          {shouldDisableSchedules || statusLinha.id === 'NAO_CIRCULA_HOJE' ? (
            <SuspendedNotice
              message={shouldDisableSchedules ? getSuspendedMessage() : statusLinha.texto}
            />
          ) : (
            <div
              className="mb-4 rounded-xl border p-3"
              style={{ borderColor: hexToRgba(linha.corHex, 0.24) }}
            >
              <p className="mb-1 text-xs font-semibold tracking-wide text-text-secondary uppercase">
                {t('labels.nextDeparture')}
              </p>
              <p
                className="font-bold text-[clamp(1.5rem,5vw,2rem)] leading-none tabular-nums"
                style={{ color: linha.corHex }}
              >
                {nextSchedule}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ScheduleDisplay label={t('labels.last')} time={previousSchedule} />
                <ScheduleDisplay label={t('labels.following')} time={nextSchedule} highlight />
              </div>
            </div>
          )}

          {idParada ? (
            <div className="mt-1 flex justify-end">
              <PrevisaoBadge linha={linha} idParada={idParada} />
            </div>
          ) : null}

          <p id={getLineDescriptionId(linha.idRota)} className="sr-only">
            {t('description.sr', {
              nome: linha.nome,
              sublinha: linha.sublinha ? ` - ${linha.sublinha}` : '',
              status,
              nextSchedule,
            })}
          </p>
        </div>
      </button>

      <div data-slot="actions" className="grid grid-cols-[auto_1fr] gap-2 px-4 pb-4">
        <button
          type="button"
          data-slot="favorite-action"
          data-state={favoritado ? 'on' : 'off'}
          onClick={handleFavoritoClick}
          aria-label={
            favoritado
              ? t('favoriteAction.remove', { nome: linha.nome })
              : t('favoriteAction.add', { nome: linha.nome })
          }
          aria-pressed={favoritado}
          className={cn(
            'flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border p-3 transition-all duration-150 hover:bg-card-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            favoritado && 'shadow-sm',
          )}
          style={{
            borderColor: hexToRgba(linha.corHex, 0.35),
            color: linha.corHex,
          }}
        >
          <Star
            className={cn(
              'size-5 transition-transform duration-200',
              favoritado && 'motion-safe:animate-pop-in',
            )}
            aria-hidden="true"
            fill={favoritado ? linha.corHex : 'none'}
            stroke={linha.corHex}
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          aria-label={t('detailsAction.label', { nome: linha.nome })}
          data-slot="action"
          onClick={handleDetailsClickInternal}
          className={cn(detailsButtonVariants(), 'flex-1')}
          style={{
            borderColor: hexToRgba(linha.corHex, 0.35),
            color: linha.corHex,
            minHeight: '44px',
          }}
        >
          <span className="flex items-center justify-between gap-3">
            <span>{t('labels.details')}</span>
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: linha.corHex }}
            />
          </span>
        </button>
      </div>
    </article>
  );
}

export const LineCard = memo(LineCardComponent);
