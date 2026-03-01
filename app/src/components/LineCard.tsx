/**
 * LineCard - Card de linha de ônibus
 * Design System - Interno Rotas UFMG
 */

import { useMemo, type ComponentProps } from "react";
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

export interface LineCardProps
  extends
    Omit<ComponentProps<"article">, "onClick">,
    VariantProps<typeof lineCardVariants> {
  /** Dados da linha de ônibus */
  linha: Linha;
  /** Callback ao clicar no card */
  onClick: () => void;
  /** Callback ao clicar em "Ver Detalhes" */
  onDetailsClick: () => void;
  /** Se o card está selecionado */
  isSelected?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula os horários de próximo ônibus e último que partiu
 */
function calculateSchedules(horarios: string[]): ScheduleResult {
  if (!horarios || horarios.length === 0) {
    return {
      nextSchedule: "--:--",
      previousSchedule: "--:--",
      status: "Sem Horários",
      statusType: "closed",
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const schedulesInMinutes = horarios
    .filter((time) => time && time.includes(":"))
    .map(timeToMinutes)
    .sort((a, b) => a - b);

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
      <p className="mb-1 flex items-center justify-center gap-1 text-[10px] text-text-secondary md:text-xs">
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
 *
 * @example
 * ```tsx
 * <LineCard
 *   linha={linha}
 *   onClick={() => handleSelect(linha)}
 *   onDetailsClick={() => openDetails(linha)}
 *   isSelected={selectedId === linha.idRota}
 * />
 * ```
 */
export function LineCard({
  linha,
  onClick,
  onDetailsClick,
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

  // Calcular horários
  const { nextSchedule, previousSchedule, status, statusType } = useMemo(() => {
    if (shouldDisableSchedules) {
      return {
        nextSchedule: "Indisponível",
        previousSchedule: "Indisponível",
        status: "Não Circulando",
        statusType: "notRunning" as LineStatusType,
      };
    }
    return calculateSchedules(linha.horarios);
  }, [linha.horarios, shouldDisableSchedules]);

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent({
      category: "Engajamento",
      action: "Abrir Card Detalhes",
      label: linha.nome,
    });
    onDetailsClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article
      data-slot="card"
      data-state={isSelected ? "selected" : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Selecionar linha ${linha.nome}${linha.sublinha ? ` - ${linha.sublinha}` : ""}`}
      className={cn(
        lineCardVariants({ selected: isSelected }),
        "mb-3",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div data-slot="header" className="relative p-4 pb-3">
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
      </div>

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
          data-slot="action"
          onClick={handleDetailsClick}
          className={detailsButtonVariants()}
          style={{ backgroundColor: linha.corHex }}
        >
          Ver Detalhes
        </button>
      </div>
    </article>
  );
}
