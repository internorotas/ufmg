import { useState } from "react";
import { Modal } from "./Modal";
import { Linha, Parada } from "../types/data.types";
import { IoTimeOutline, IoLocationSharp, IoMapOutline } from "react-icons/io5";

interface LinhaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  todasParadas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

type TabType = "itinerario" | "horarios";

export function LinhaDetalhesModal({
  isOpen,
  onClose,
  linha,
  todasParadas,
  onParadaClick,
}: LinhaDetalhesModalProps) {
  const [tabAtiva, setTabAtiva] = useState<TabType>("itinerario");

  // Buscar paradas do itinerário dinamicamente usando os IDs
  const paradasDoItinerario = linha.itinerarioParadasIds
    .map((idParada) => todasParadas.find((p) => p.idParada === idParada))
    .filter((p): p is Parada => p !== undefined);

  // Calcular horários passados e futuros
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

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

  const handleParadaClick = (parada: Parada) => {
    onParadaClick(parada);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={linha.nome} maxWidth="max-w-2xl">
      {/* Subtítulo */}
      {linha.sublinha && (
        <p className="text-text-secondary text-sm -mt-2 mb-4">{linha.sublinha}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-card-border">
        <button
          onClick={() => setTabAtiva("itinerario")}
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
          onClick={() => setTabAtiva("horarios")}
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
        <div className="space-y-2">
          {paradasDoItinerario.length > 0 ? (
            paradasDoItinerario.map((parada, index) => (
              <button
                key={parada.idParada}
                onClick={() => handleParadaClick(parada)}
                className="w-full text-left p-4 bg-card hover:bg-card-hover rounded-lg transition-all flex items-start gap-3 group border border-card-border"
                style={{
                  borderLeft: `4px solid ${linha.corHex}`,
                }}
              >
                <div className="flex-shrink-0 mt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: linha.corHex }}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <IoLocationSharp
                      className="mt-1 flex-shrink-0"
                      style={{ color: linha.corHex }}
                      size={18}
                    />
                    <div>
                      <h4 className="font-semibold text-base text-text-primary">{parada.nome}</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        {parada.categoria} • {parada.linhasAtendidas.length} linha
                        {parada.linhasAtendidas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
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
                {proximos.map(({ horario }, index) => (
                  <div
                    key={`proximo-${index}`}
                    className="border-2 rounded-lg p-3 text-center hover:bg-opacity-10 transition-colors"
                    style={{
                      borderColor: linha.corHex,
                      backgroundColor: `${linha.corHex}20`,
                    }}
                  >
                    <p className="text-xl font-bold" style={{ color: linha.corHex }}>
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
                {passados.map(({ horario }, index) => (
                  <div
                    key={`passado-${index}`}
                    className="bg-card border border-card-border rounded-lg p-3 text-center opacity-50"
                  >
                    <p className="text-lg font-semibold text-text-secondary">{horario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-card rounded-lg p-4 text-sm border border-card-border">
            <p className="text-center text-text-secondary">
              Total de {horariosOrganizados.length} horários •{" "}
              <span style={{ color: linha.corHex }}>{proximos.length} restantes</span>
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
