/**
 * LineCard - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import React, { useMemo, type ComponentProps } from "react";
import { useMemo, type ComponentProps, type KeyboardEvent } from "react";
import { memo, useMemo, type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Bus, Clock, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { timeToMinutes, minutesToTime } from "../../lib/utils";
import { useAnalytics } from "../hooks/useAnalytics";
import { shouldDisableRegularSchedules } from "../config/specialPeriods";
import { LineStatusBadge, type LineStatusType } from "./ui/Badge";
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
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
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

export interface LineCardProps
  extends
    Omit<ComponentProps<"article">, "onClick" | "onSelect">,
    VariantProps<typeof lineCardVariants> {
  /** Dados da linha de ônibus */
  linha: Linha;
  /** @deprecated Use onSelect instead. Callback ao clicar no card */
  onClick?: () => void;
  /** Callback ao clicar no card, recebendo a linha */
  onSelect?: (linha: Linha) => void;
  /** @deprecated Use onDetails instead. Callback ao clicar em "Ver Detalhes" */
  onDetailsClick?: () => void;
  /** Callback ao clicar em "Ver Detalhes", recebendo a linha */
  onDetails?: (linha: Linha) => void;
  /** Callback ao clicar no card */
  onClick: (linha: Linha) => void;
  /** Callback ao clicar em "Ver Detalhes" */
  onDetailsClick: (linha: Linha) => void;
  /** Se o card está selecionado */
  isSelected?: boolean;
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

  // Próximo horário
  const next = schedulesInMinutes.find((schedule) => schedule > currentMinutes);
  if (next !== undefined) {
    nextSchedule = minutesToTime(next);
    const diffMinutes = next - currentMinutes;
    if (diffMinutes <= 15) {
      status = `Próximo às ${nextSchedule}`;
      statusType = "upcoming";
    } else {
      status = "Circulando";
      statusType = "running";
    }
  }

  // Último que partiu
  const previousSchedules = schedulesInMinutes.filter(
    (schedule) => schedule <= currentMinutes,
  );
  if (previousSchedules.length > 0) {
    previousSchedule = minutesToTime(Math.max(...previousSchedules));
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

function SuspendedNotice() {
  return (
    <div
      data-slot="notice"
      className="mb-4 rounded-lg border border-red-600/50 bg-red-900/20 p-3 text-center"
    >
      <p className="text-xs font-semibold text-red-300 md:text-sm">
        Linha suspensa durante férias
      </p>
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
 *   onSelect={handleSelect}
 *   onDetails={openDetails}
 *   onClick={handleSelect} // (linha) => void
 *   onDetailsClick={openDetails} // (linha) => void
 *   isSelected={selectedId === linha.idRota}
 * />
 * ```
 */
function LineCardComponent({
  linha,
  onClick,
  onSelect,
  onDetailsClick,
  onDetails,
  isSelected = false,
  className,
  ...props
}: LineCardProps) {
  const { trackEvent } = useAnalytics();

  // Verificar se é período de férias
  const isVacationLine = linha.categoriaDia === "feriasRecessos";
  const isInVacationPeriod = shouldDisableRegularSchedules();

  // Verificar se é fim de semana (sábado=6, domingo=0)
  const today = new Date().getDay();
  const isWeekend = today === 0 || today === 6;

  // Lógica de desabilitar horários durante férias:
  // - Linhas de sábado e dias úteis: SEMPRE desabilitadas durante férias
  // - Linhas de férias/recessos: desabilitadas apenas em fins de semana
  const shouldDisableSchedules =
    isInVacationPeriod && (!isVacationLine || isWeekend);

  // ⚡ Performance Optimization: Split schedule parsing from time check.
  // 1. Memoize sorted schedules (expensive parsing/sorting) - runs only when data changes
  // 1. Otimização: Memoizar o processamento pesado dos horários (parse + sort)
  // Isso evita re-ordenar o array em cada render
  const schedulesInMinutes = useMemo(() => {
    return parseSchedules(linha.horarios);
  }, [linha.horarios]);

  // 2. Calcular status baseado no tempo atual
  // Executado a cada render para garantir que o "Próximo em X min" esteja atualizado
  // quando o componente for re-renderizado por outras razões (ex: scroll, interação)
  /**
   * Performance Optimization: Memoize parsing of schedules.
   * Only re-calculate if the schedule list changes.
   * Sorting is included to be safe, although data is likely sorted.
   */
  const schedulesInMinutes = useMemo(() => {
    if (!linha.horarios || linha.horarios.length === 0) return [];
    return linha.horarios
      .filter((time) => time && time.includes(":"))
      .map(timeToMinutes)
      .sort((a, b) => a - b);
  }, [linha.horarios]);

  // 2. Calculate status (cheap time-dependent logic)
  // This runs on every render to ensure freshness, solving the stale data issue
  // Calculate status/next/prev on every render to ensure freshness
  // This is cheap (O(N) on small array) but ensures "currentMinutes" is always up to date
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
    if (schedulesInMinutes.length === 0) {
      return {
        nextSchedule: "--:--",
        previousSchedule: "--:--",
        status: "Sem Horários",
        statusType: "closed" as LineStatusType,
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextSchedule = "--:--";
    let previousSchedule = "--:--";
    let status = "Encerrado";
    let statusType: LineStatusType = "closed";

    // Próximo horário
    const next = schedulesInMinutes.find(
      (schedule) => schedule > currentMinutes,
    );
    const next = schedulesInMinutes.find((schedule) => schedule > currentMinutes);
    if (next !== undefined) {
      nextSchedule = minutesToTime(next);
      const diffMinutes = next - currentMinutes;
      if (diffMinutes <= 15) {
        status = `Próximo às ${nextSchedule}`;
        statusType = "upcoming";
      } else {
        status = "Circulando";
        statusType = "running";
      }
    }

    // Último que partiu
    const previousSchedules = schedulesInMinutes.filter(
      (schedule) => schedule <= currentMinutes,
    );
    if (previousSchedules.length > 0) {
      previousSchedule = minutesToTime(Math.max(...previousSchedules));
    }

    return { nextSchedule, previousSchedule, status, statusType };
  })();

  const handleCardClick = () => {
    onClick(linha);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(linha);
    } else if (onClick) {
      onClick();
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent({
      category: "Engajamento",
      action: "Abrir Card Detalhes",
      label: linha.nome,
    });

    if (onDetails) {
      onDetails(linha);
    } else if (onDetailsClick) {
      onDetailsClick();
    onDetailsClick(linha);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article
      tabIndex={0}
      aria-label={`Linha ${linha.nome}. Status: ${status}`}
      onKeyDown={handleKeyDown}
      data-slot="card"
      data-state={isSelected ? "selected" : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Selecionar linha ${linha.nome}`}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Selecionar linha ${linha.nome}`}
      className={cn(
        lineCardVariants({ selected: isSelected }),
        "mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
      aria-label={`Selecionar linha ${linha.nome}${linha.sublinha ? ` - ${linha.sublinha}` : ""}`}
      onClick={handleCardClick}
      className={cn(
        lineCardVariants({ selected: isSelected }),
        "mb-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <button
        type="button"
        data-slot="header"
        aria-pressed={isSelected}
        aria-label={`Selecionar linha ${linha.nome}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="relative w-full cursor-pointer rounded-lg p-4 pb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LineStatusBadge status={statusType} label={status} size="xs" />
            <ChevronRight className="size-5 shrink-0 text-text-secondary" />
          </div>
        </div>
      </button>

      {/* Body */}
      <div data-slot="body" className="px-4 pb-4">
        {shouldDisableSchedules ? (
          <SuspendedNotice />
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <ScheduleDisplay label="Último Partiu" time={previousSchedule} />
            <ScheduleDisplay label="Próximo" time={nextSchedule} highlight />
          </div>
        )}

        {/* Button */}
        <button
          aria-label={`Ver detalhes da linha ${linha.nome}`}
          data-slot="action"
          onClick={handleDetailsClick}
          className={detailsButtonVariants()}
          style={{ backgroundColor: linha.corHex }}
          aria-label={`Ver detalhes da linha ${linha.nome}`}
        >
          Ver Detalhes
        </button>
      </div>
    </article>
  );
}

export const LineCard = React.memo(LineCardComponent);
// Memoize the component to prevent re-renders when props are stable
export const LineCard = memo(LineCardComponent);
