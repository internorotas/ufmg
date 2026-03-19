/**
 * LineCard - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import React, { memo, useMemo, type KeyboardEvent } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Bus, Clock, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import {
  timeToMinutes,
  minutesToTime,
  findScheduleIndex,
} from "../../lib/utils";
import { useAnalytics } from "../hooks/useAnalytics";
import { shouldDisableRegularSchedules } from "../config/specialPeriods";
import { LineStatusBadge, type LineStatusType } from "./ui/Badge";
import { PrevisaoBadge } from "./PrevisaoBadge";
import type { Linha } from "../types/data.types";

// ============================================================================
// VARIANTS - Definição de estilos com tailwind-variants
// ============================================================================

/**
 * Variantes do card principal
 */
export const lineCardVariants = tv({
  base: [
    "relative overflow-hidden rounded-xl border bg-card shadow-sm",
    "cursor-pointer transition-all duration-200 ease-out",
    "hover:shadow-lg hover:-translate-y-0.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
  ],
  variants: {
    selected: {
      true: [
        "border-2 border-brand-primary shadow-lg",
        "ring-1 ring-brand-primary/20",
      ],
      false: ["border-card-border", "hover:border-info-border"],
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
    "w-full py-2.5 rounded-lg text-white font-semibold cursor-pointer",
    "text-xs md:text-sm shadow-sm",
    "hover:brightness-110 active:scale-[0.97] transition-all duration-150",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleResult {
  nextSchedule: string;
  previousSchedule: string;
  status: string;
  statusType: LineStatusType;
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

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Analisa e ordena os horários em minutos.
 * Esta operação é cara (O(N log N)) e deve ser memoizada.
 */
function parseSchedules(horarios: string[]): number[] {
  if (!horarios || horarios.length === 0) return [];

  return horarios
    .filter((time) => time && time.includes(":"))
    .map(timeToMinutes)
    .sort((a, b) => a - b);
}

/**
 * Calcula o status com base nos horários já processados e no tempo atual.
 * Esta operação é barata (O(N)) e pode rodar em cada render para garantir frescor.
 */
function calculateStatus(
  schedulesInMinutes: number[],
  currentMinutes: number,
): ScheduleResult {
  if (schedulesInMinutes.length === 0) {
    return {
      nextSchedule: "--:--",
      previousSchedule: "--:--",
      status: "Sem Horários",
      statusType: "closed",
    };
  }

  let nextSchedule = "--:--";
  let previousSchedule = "--:--";
  let status = "Encerrado";
  let statusType: LineStatusType = "closed";

  // Próximo horário usando Busca Binária O(log N)
  const nextIndex = findScheduleIndex(schedulesInMinutes, currentMinutes);

  if (nextIndex < schedulesInMinutes.length) {
    const next = schedulesInMinutes[nextIndex];
    nextSchedule = minutesToTime(next);
    const diffMinutes = next - currentMinutes;
    if (diffMinutes <= 15) {
      status = `Próximo às ${nextSchedule}`;
      statusType = "upcoming";
    } else {
      status = "Circulando";
      statusType = "running";
    }

    // Último que partiu
    let prevIndex = nextIndex - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] > currentMinutes) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    }
  } else {
    // Se não há próximo, o último que partiu é o último do array que seja menor ou igual ao tempo atual
    let prevIndex = schedulesInMinutes.length - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] > currentMinutes) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    }
  }

  return { nextSchedule, previousSchedule, status, statusType };
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

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
      <Bus className="size-6 text-white drop-shadow-sm" />
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
    <div
      data-slot="schedule"
      className="rounded-lg bg-background-secondary/50 p-2 text-center"
    >
      <p className="mb-1 flex items-center justify-center gap-1 text-xs text-text-secondary">
        <Clock className="size-3.5" />
        {label}
      </p>
      <p
        className={cn(
          "text-base font-bold md:text-lg",
          highlight ? "text-success-text" : "text-text-primary",
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
      className="mb-4 rounded-lg border border-red-600/50 bg-red-900/20 p-3 text-center"
    >
      <p className="text-xs font-semibold text-red-300 md:text-sm">{message}</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
}: LineCardProps) {
  const { trackEvent } = useAnalytics();

  // Verificar categoria da linha
  const isVacationLine = linha.categoriaDia === "feriasRecessos";
  const isSaturdayLine = linha.categoriaDia === "sabado";
  const isWeekdayLine = linha.categoriaDia === "diasUteis";

  // Verificar período atual
  const isInVacationPeriod = shouldDisableRegularSchedules();

  // Verificar dia da semana (domingo=0, sábado=6)
  const today = new Date().getDay();
  const isSaturday = today === 6;
  const isSunday = today === 0;
  const isWeekday = today >= 1 && today <= 5;

  // Lógica de quando cada categoria NÃO circula:
  // - Linhas de dias úteis: não circulam em fins de semana ou durante período de férias
  // - Linhas de sábado: não circulam fora do sábado ou durante período de férias
  // - Linhas de férias: não circulam fora do período de férias ou em fins de semana
  const shouldDisableSchedules =
    (isWeekdayLine && (!isWeekday || isInVacationPeriod)) ||
    (isSaturdayLine && (!isSaturday || isInVacationPeriod)) ||
    (isVacationLine && (!isInVacationPeriod || isSunday || isSaturday));

  // Determinar mensagem de suspensão baseada na categoria
  const getSuspendedMessage = (): string => {
    if (isWeekdayLine) {
      if (isInVacationPeriod) return "Linha suspensa durante férias";
      if (isSaturday) return "Linha não circula aos sábados";
      if (isSunday) return "Linha não circula aos domingos";
    }
    if (isSaturdayLine) {
      if (isInVacationPeriod) return "Linha suspensa durante férias";
      return "Linha circula apenas aos sábados";
    }
    if (isVacationLine) {
      if (!isInVacationPeriod) return "Linha circula apenas durante férias";
      if (isSaturday || isSunday) return "Linha não circula em fins de semana";
    }
    return "Linha não está circulando";
  };

  // Otimização: Memoizar o processamento pesado dos horários (parse + sort)
  const schedulesInMinutes = useMemo(() => {
    return parseSchedules(linha.horarios);
  }, [linha.horarios]);

  // Calcular status baseado no tempo atual
  const { nextSchedule, previousSchedule, status, statusType } = (() => {
    if (shouldDisableSchedules) {
      return {
        nextSchedule: "Indisponível",
        previousSchedule: "Indisponível",
        status: "Não Circulando",
        statusType: "notRunning" as LineStatusType,
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return calculateStatus(schedulesInMinutes, currentMinutes);
  })();

  const handleCardClick = () => {
    onClick(linha);
  };

  const handleDetailsClickInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent({
      category: "Engajamento",
      action: "Abrir Card Detalhes",
      label: linha.nome,
    });
    onDetailsClick(linha);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(linha);
    }
  };

  return (
    <article
      data-slot="card"
      data-state={isSelected ? "selected" : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Linha ${linha.nome}${linha.sublinha ? ` - ${linha.sublinha}` : ""}. Status: ${status}`}
      aria-pressed={isSelected}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        lineCardVariants({ selected: isSelected }),
        "mb-3",
        className,
      )}
    >
      {/* Header */}
      <div data-slot="header" className="relative w-full p-4 pb-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 items-start gap-3">
            <LineIcon color={linha.corHex} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold leading-tight text-text-primary md:text-base">
                {linha.nome}
              </h3>
              {linha.sublinha && (
                <p className="mt-0.5 text-xs text-text-secondary md:text-sm">
                  {linha.sublinha}
                </p>
              )}

              {idParada && linha.trajetoDetalhado?.length ? (
                <div className="mt-2">
                  <PrevisaoBadge linha={linha} idParada={idParada} />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LineStatusBadge status={statusType} label={status} size="xs" />
            <ChevronRight className="size-5 shrink-0 text-text-secondary" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div data-slot="body" className="px-4 pb-4">
        {shouldDisableSchedules ? (
          <SuspendedNotice message={getSuspendedMessage()} />
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <ScheduleDisplay label="Último Partiu" time={previousSchedule} />
            <ScheduleDisplay label="Próximo" time={nextSchedule} highlight />
          </div>
        )}

        {/* Button */}
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
