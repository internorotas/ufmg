import { useMemo } from "react";
import { Modal } from "./Modal";
import { IoTimeOutline, IoCheckmarkCircle } from "react-icons/io5";
import { Linha } from "../types/data.types";
import { timeToMinutes } from "../../lib/utils";
import { shouldDisableRegularSchedules } from "../config/specialPeriods";

interface HorariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
}

/**
 * Renderiza um modal que exibe os horários de uma linha de ônibus específica, separando os horários futuros e os que já passaram.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Um booleano que indica se o modal está aberto.
 * @param {() => void} props.onClose - Uma função para fechar o modal.
 * @param {Linha} props.linha - Um objeto contendo os dados da linha de ônibus.
 * @returns {JSX.Element} O componente de modal de horários renderizado.
 */
export function HorariosModal({ isOpen, onClose, linha }: HorariosModalProps) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Verificar se devemos desabilitar os horários
  const isVacationLine = linha.categoriaDia === "feriasRecessos";
  const isInVacationPeriod = shouldDisableRegularSchedules();
  const shouldDisableSchedules = !isVacationLine && isInVacationPeriod;

  const horariosOrganizados = useMemo(() => {
    return linha.horarios
      .filter((time) => time && time.includes(":"))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
        passou: timeToMinutes(horario) < currentMinutes,
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [linha.horarios, currentMinutes]);

  const proximos = horariosOrganizados.filter((h) => !h.passou);
  const passados = horariosOrganizados.filter((h) => h.passou);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Horários - ${linha.nome}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Aviso de Horários Suspensos */}
        {shouldDisableSchedules && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 text-center">
            <p className="text-yellow-300 font-semibold mb-2">
              ⚠️ Horários suspensos
            </p>
            <p className="text-sm text-yellow-200">
              Esta linha não está operando durante o período de férias e
              recessos. Utilize os horários de "Férias e Recessos".
            </p>
          </div>
        )}

        {/* Próximos Horários */}
        {!shouldDisableSchedules && proximos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <IoTimeOutline className="text-green-400" size={20} />
              Próximos Horários
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {proximos.map(({ horario }, index) => (
                <div
                  key={`proximo-${index}`}
                  className="bg-green-900/30 border border-green-600 rounded-lg p-3 text-center hover:bg-green-900/50 transition-colors"
                >
                  <p className="text-xl font-bold text-green-300">{horario}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Horários Passados */}
        {!shouldDisableSchedules && passados.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <IoCheckmarkCircle className="text-gray-500" size={20} />
              Horários Passados
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {passados.map(({ horario }, index) => (
                <div
                  key={`passado-${index}`}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center opacity-50"
                >
                  <p className="text-lg font-semibold text-gray-400">
                    {horario}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informação Extra */}
        {!shouldDisableSchedules && (
          <div className="bg-internoRotas-cinza-grafite rounded-lg p-4 text-sm">
            <p className="text-center text-gray-300">
              Total de {horariosOrganizados.length} horários •{" "}
              <span className="text-green-400">
                {proximos.length} restantes
              </span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
