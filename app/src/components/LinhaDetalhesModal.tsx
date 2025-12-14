import { useState } from "react";
import { Modal } from "./Modal";
import { Linha, Parada } from "../types/data.types";
import {
  IoTimeOutline,
  IoMapOutline,
  IoLocationOutline,
  IoBusOutline,
} from "react-icons/io5";
import { buscarParadasPorIds, timeToMinutes } from "../../lib/utils";
import { useAnalytics, useSessionTiming } from "../hooks/useAnalytics";

interface LinhaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  todasParadas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

type TabType = "itinerario" | "horarios";

/**
 * Renderiza um modal que exibe informações detalhadas sobre uma linha de ônibus, incluindo seu itinerário e horários.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Um booleano que indica se o modal está aberto.
 * @param {() => void} props.onClose - Uma função para fechar o modal.
 * @param {Linha} props.linha - Um objeto contendo os dados da linha de ônibus.
 * @param {Parada[]} props.todasParadas - Um array com todas as paradas de ônibus disponíveis.
 * @param {(parada: Parada) => void} props.onParadaClick - Uma função para lidar com cliques em uma parada de ônibus.
 * @returns {JSX.Element} O componente de modal de detalhes da linha renderizado.
 */
export function LinhaDetalhesModal({
  isOpen,
  onClose,
  linha,
  todasParadas,
  onParadaClick,
}: LinhaDetalhesModalProps) {
  const [tabAtiva, setTabAtiva] = useState<TabType>("itinerario");
  const { trackEvent } = useAnalytics();

  // Rastreia tempo que o usuário passa visualizando detalhes desta linha
  useSessionTiming(`Linha: ${linha.nome}`, "Engajamento Detalhes");

  // Buscar paradas do itinerário dinamicamente usando os IDs
  const paradasDoItinerario = buscarParadasPorIds(
    linha.itinerarioParadasIds,
    todasParadas,
  );

  // Calcular horários passados e futuros
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const horariosOrganizados = linha.horarios
    .filter((h) => h && h.includes(":"))
    .map((horario) => ({
      horario,
      minutos: timeToMinutes(horario),
      passou: timeToMinutes(horario) < currentMinutes,
    }))
    .sort((a, b) => a.minutos - b.minutos);

  const proximos = horariosOrganizados.filter((h) => !h.passou);
  const passados = horariosOrganizados.filter((h) => h.passou);

  const handleTabChange = (tab: TabType) => {
    trackEvent({
      category: "Navegação Detalhes",
      action: "Visualizar Aba",
      label: `${tab === "itinerario" ? "Itinerário" : "Todos os Horários"} - ${
        linha.nome
      }`,
    });
    setTabAtiva(tab);
  };

  const handleHorarioClick = (horario: string) => {
    trackEvent({
      category: "Horarios",
      action: "Clique Horario Especifico",
      label: `${horario} - ${linha.nome}`,
    });
  };

  const handleParadaClick = (parada: Parada) => {
    trackEvent({
      category: "Engajamento Detalhes",
      action: "Selecionar Parada Itinerario",
      label: `${parada.nome} - ${linha.nome}`,
    });
    onParadaClick(parada);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: linha.corHex }}
          >
            <IoBusOutline size={24} className="text-white drop-shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate leading-tight">
              {linha.nome}
            </h2>
            {linha.sublinha && (
              <p className="text-xs text-text-secondary mt-0.5 truncate">
                {linha.sublinha}
              </p>
            )}
          </div>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-card-border">
        <button
          onClick={() => handleTabChange("itinerario")}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all ${
            tabAtiva === "itinerario"
              ? "text-text-primary border-b-2"
              : "text-text-secondary hover:text-text-primary"
          }`}
          style={tabAtiva === "itinerario" ? { borderColor: linha.corHex } : {}}
        >
          <IoMapOutline size={20} />
          Itinerário
        </button>
        <button
          onClick={() => handleTabChange("horarios")}
          className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all ${
            tabAtiva === "horarios"
              ? "text-text-primary border-b-2"
              : "text-text-secondary hover:text-text-primary"
          }`}
          style={tabAtiva === "horarios" ? { borderColor: linha.corHex } : {}}
        >
          <IoTimeOutline size={20} />
          Todos os Horários
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {tabAtiva === "itinerario" ? (
        <div className="relative">
          {paradasDoItinerario.length > 0 ? (
            <div className="relative">
              {paradasDoItinerario.map((parada, index) => {
                const isFirst = index === 0;
                const isLast = index === paradasDoItinerario.length - 1;

                return (
                  <div
                    key={`${parada.idParada}-${index}`}
                    className="relative flex"
                  >
                    {/* Linha conectora vertical tracejada */}
                    {!isLast && (
                      <div
                        className="absolute left-[11px] top-[28px] w-[2px] h-full"
                        style={{
                          backgroundColor: `${linha.corHex}40`,
                          backgroundImage: `repeating-linear-gradient(0deg, ${linha.corHex}40, ${linha.corHex}40 6px, transparent 6px, transparent 12px)`,
                        }}
                      />
                    )}

                    <button
                      onClick={() => handleParadaClick(parada)}
                      className="w-full text-left py-2 flex items-start gap-3 group"
                    >
                      {/* Ícone de localização com círculo */}
                      <div className="flex-shrink-0 relative z-10 mt-0.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${linha.corHex}20` }}
                        >
                          <IoLocationOutline
                            size={18}
                            style={{ color: linha.corHex }}
                          />
                        </div>
                      </div>

                      {/* Conteúdo da parada */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="font-semibold text-[15px] text-text-primary leading-snug group-hover:underline">
                          {parada.nome}
                        </h4>

                        {isFirst && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            Ponto de Origem/Destino
                          </p>
                        )}
                        {!isFirst && !isLast && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            Parada Regular
                          </p>
                        )}

                        {isFirst && (
                          <span
                            className="inline-block text-xs font-semibold mt-1 px-0"
                            style={{ color: linha.corHex }}
                          >
                            Partida
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <p>Nenhuma parada encontrada para este itinerário.</p>
            </div>
          )}

          <div className="mt-6 bg-card rounded-lg p-4 text-sm text-center border border-card-border">
            <p className="text-text-secondary">
              💡 Clique em uma parada para visualizá-la no mapa
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Próximos Horários */}
          {proximos.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-3 flex items-center gap-2"
                style={{ color: linha.corHex }}
              >
                <IoTimeOutline size={20} />
                Próximos Horários ({proximos.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {proximos.map(({ horario, minutos }, index) => (
                  <div
                    key={`proximo-${minutos}-${index}`}
                    onClick={() => handleHorarioClick(horario)}
                    className="border-2 rounded-lg p-3 text-center hover:bg-opacity-10 transition-colors"
                    style={{
                      borderColor: linha.corHex,
                      backgroundColor: `${linha.corHex}20`,
                    }}
                  >
                    <p
                      className="text-xl font-bold"
                      style={{ color: linha.corHex }}
                    >
                      {horario}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Horários Passados */}
          {passados.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-text-secondary">
                <IoTimeOutline size={20} />
                Horários Passados ({passados.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {passados.map(({ horario, minutos }, index) => (
                  <div
                    key={`passado-${minutos}-${index}`}
                    onClick={() => handleHorarioClick(horario)}
                    className="bg-card border border-card-border rounded-lg p-3 text-center opacity-50"
                  >
                    <p className="text-lg font-semibold text-text-secondary">
                      {horario}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-card rounded-lg p-4 text-sm border border-card-border">
            <p className="text-center text-text-secondary">
              Total de {horariosOrganizados.length} horários •{" "}
              <span style={{ color: linha.corHex }}>
                {proximos.length} restantes
              </span>
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
