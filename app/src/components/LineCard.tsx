import { useMemo } from "react";
import { Linha } from "../types/data.types";
import { IoTimeOutline, IoBusOutline, IoChevronForward } from "react-icons/io5";
import { timeToMinutes, minutesToTime } from "../../lib/utils";
import { useAnalytics } from "../hooks/useAnalytics";
import { shouldDisableRegularSchedules } from "../config/specialPeriods";

interface LineCardProps {
  linha: Linha;
  onClick: () => void;
  onDetailsClick: () => void;
  isSelected?: boolean;
}

// Função para calcular próximo e anterior horário (REGRA DE NEGÓCIO CORRETA)
const calculateSchedules = (horarios: string[]) => {
  if (!horarios || horarios.length === 0) {
    return {
      nextSchedule: "--:--",
      previousSchedule: "--:--",
      status: "Sem Horários",
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
    };
  }

  let nextSchedule = "--:--";
  let previousSchedule = "--:--";
  let status = "Encerrado";

  // PRÓXIMO: Primeiro horário posterior à hora atual
  const next = schedulesInMinutes.find((schedule) => schedule > currentMinutes);
  if (next !== undefined) {
    nextSchedule = minutesToTime(next);
    const diffMinutes = next - currentMinutes;
    if (diffMinutes <= 15) {
      status = "Próximo às " + nextSchedule;
    } else {
      status = "Circulando";
    }
  } else {
    // Todos os horários já passaram
    nextSchedule = "--:--";
    status = "Encerrado";
  }

  // ÚLTIMO PARTIU: Último horário anterior ou igual à hora atual
  const previousSchedules = schedulesInMinutes.filter(
    (schedule) => schedule <= currentMinutes,
  );
  if (previousSchedules.length > 0) {
    previousSchedule = minutesToTime(Math.max(...previousSchedules));
  } else {
    // Hora atual é anterior ao primeiro horário do dia
    previousSchedule = "--:--";
  }

  return { nextSchedule, previousSchedule, status };
};

/**
 * Renderiza um card que exibe informações sobre uma linha de ônibus, incluindo seu nome, horários e status.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Linha} props.linha - Um objeto contendo os dados da linha de ônibus.
 * @param {() => void} props.onClick - Uma função para lidar com cliques no card.
 * @param {() => void} props.onDetailsClick - Uma função para lidar com cliques no botão "Ver Detalhes".
 * @param {boolean} [props.isSelected=false] - Um booleano que indica se o card está selecionado.
 * @returns {JSX.Element} O componente de card de linha renderizado.
 */
export function LineCard({
  linha,
  onClick,
  onDetailsClick,
  isSelected = false,
}: LineCardProps) {
  const { trackEvent } = useAnalytics();
  
  // Verificar se é linha de férias ou período de férias
  const isVacationLine = linha.categoriaDia === "feriasRecessos";
  const isInVacationPeriod = shouldDisableRegularSchedules();
  const shouldDisableSchedules = !isVacationLine && isInVacationPeriod;
  
  const { nextSchedule, previousSchedule, status } = useMemo(() => {
    if (shouldDisableSchedules) {
      return {
        nextSchedule: "Indisponível",
        previousSchedule: "Indisponível",
        status: "Não Circulando",
      };
    }
    return calculateSchedules(linha.horarios);
  }, [linha.horarios, shouldDisableSchedules]);

  // Definir cor do badge baseado no status
  const getBadgeColor = () => {
    // "Não Circulando" -> Warning (Vermelho/Alerta)
    if (status === "Não Circulando")
      return "bg-red-900/30 text-red-300 border-red-600";
    // "Próximo" -> Success (Urgência positiva)
    if (status.includes("Próximo"))
      return "bg-success-bg text-success-text border-success-border";
    // "Circulando" -> Info (Informativo)
    if (status === "Circulando")
      return "bg-info-bg text-info-text border-info-border";
    // Default/Encerrado -> Neutral
    return "bg-neutral-bg text-neutral-text border-neutral-border";
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o card
    trackEvent({
      category: "Engajamento",
      action: "Abrir Card Detalhes",
      label: linha.nome,
    });
    onDetailsClick();
  };

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl shadow-sm hover:shadow-md transition-all mb-3 overflow-hidden border cursor-pointer ${
        isSelected
          ? "border-2 border-brand-primary shadow-lg ring-1 ring-brand-primary/20"
          : "border-card-border hover:border-info-border"
      }`}
    >
      {/* Header com Badge */}
      <div className="p-4 pb-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: linha.corHex }}
            >
              <IoBusOutline size={24} className="text-white drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-bold text-text-primary leading-tight">
                {linha.nome}
              </h3>
              {linha.sublinha && (
                <p className="text-xs md:text-sm text-text-secondary mt-0.5">
                  {linha.sublinha}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${getBadgeColor()}`}
            >
              {status}
            </span>
            <IoChevronForward size={20} className="text-text-secondary flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Corpo - Horários ou Aviso de Suspensão */}
      <div className="px-4 pb-4">
        {shouldDisableSchedules ? (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-600/50 text-center">
            <p className="text-xs md:text-sm text-red-300 font-semibold">
              Linha suspensa durante férias
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-background-secondary/50">
              <p className="text-[10px] md:text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
                <IoTimeOutline size={14} />
                Último Partiu
              </p>
              <p className="text-base md:text-lg font-bold text-text-primary">
                {previousSchedule}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background-secondary/50">
              <p className="text-[10px] md:text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
                <IoTimeOutline size={14} />
                Próximo
              </p>
              <p className="text-base md:text-lg font-bold text-success-text">
                {nextSchedule}
              </p>
            </div>
          </div>
        )}

        {/* Botão Ver Detalhes */}
        <button
          onClick={handleDetailsClick}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-xs md:text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          style={{ backgroundColor: linha.corHex }}
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
