import { useMemo } from "react";
import { Linha } from "../types/data.types";
import { IoTimeOutline, IoBusOutline } from "react-icons/io5";
import { timeToMinutes, minutesToTime } from "../../lib/utils";

interface LineCardProps {
  linha: Linha;
  onClick: () => void;
  onDetailsClick: () => void;
  isSelected?: boolean;
}

// Função para calcular próximo e anterior horário (REGRA DE NEGÓCIO CORRETA)
const calculateSchedules = (horarios: string[]) => {
  if (!horarios || horarios.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--", status: "Sem Horários" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const schedulesInMinutes = horarios
    .filter((time) => time && time.includes(":"))
    .map(timeToMinutes)
    .sort((a, b) => a - b);

  if (schedulesInMinutes.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--", status: "Sem Horários" };
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
    (schedule) => schedule <= currentMinutes
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
export function LineCard({ linha, onClick, onDetailsClick, isSelected = false }: LineCardProps) {
  const { nextSchedule, previousSchedule, status } = useMemo(
    () => calculateSchedules(linha.horarios),
    [linha.horarios]
  );

  // Definir cor do badge baseado no status
  const getBadgeColor = () => {
    if (status.includes("Próximo")) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (status === "Circulando") return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique propague para o card
    onDetailsClick();
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-card rounded-xl shadow-md hover:shadow-lg transition-all mb-3 overflow-hidden border cursor-pointer ${
        isSelected 
          ? 'border-2 border-blue-500 shadow-xl ring-2 ring-blue-200' 
          : 'border-card-border hover:border-blue-300'
      }`}
    >
      {/* Header com Badge */}
      <div className="p-4 pb-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: linha.corHex }}
            >
              <IoBusOutline size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary truncate">
                {linha.nome}
              </h3>
              {linha.sublinha && (
                <p className="text-sm text-text-secondary mt-0.5">{linha.sublinha}</p>
              )}
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${getBadgeColor()}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Corpo - Horários */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
              <IoTimeOutline size={14} />
              Último Partiu
            </p>
            <p className="text-lg font-bold text-text-primary">{previousSchedule}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1 flex items-center justify-center gap-1">
              <IoTimeOutline size={14} />
              Próximo
            </p>
            <p className="text-lg font-bold text-green-500">{nextSchedule}</p>
          </div>
        </div>

        {/* Botão Ver Detalhes */}
        <button
          onClick={handleDetailsClick}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: linha.corHex }}
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
