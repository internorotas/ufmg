/**
 * LinhaDetalhesModal - Modal de detalhes da linha
 * Design System - Interno Rotas UFMG
 */

import { useState, useMemo } from "react";
import { tv } from "tailwind-variants";
import { Clock, Map, MapPin, Bus } from "lucide-react";
import { Modal } from "./Modal";
import type { Linha, Parada } from "../types/data.types";
import { buscarParadasPorIds, timeToMinutes } from "../../lib/utils";
import { useAnalytics, useSessionTiming } from "../hooks/useAnalytics";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do container do título
 */
export const titleContainerVariants = tv({
  base: "flex items-center gap-3",
});

/**
 * Variantes do ícone do título
 */
export const titleIconVariants = tv({
  base: [
    "flex size-12 shrink-0 items-center justify-center rounded-lg shadow-sm",
  ],
});

/**
 * Variantes da tab
 */
export const tabVariants = tv({
  base: [
    "flex items-center gap-2 px-4 py-3 font-semibold transition-all duration-200 cursor-pointer",
    "hover:bg-card-hover/50 rounded-t-lg",
  ],
  variants: {
    active: {
      true: "border-b-2 text-text-primary",
      false: "text-text-secondary hover:text-text-primary",
    },
  },
  defaultVariants: {
    active: false,
  },
});

/**
 * Variantes do botão de parada
 */
export const stopButtonVariants = tv({
  base: "group flex w-full items-start gap-3 py-2 text-left cursor-pointer transition-colors hover:bg-card-hover rounded-lg px-2 -mx-2",
});

/**
 * Variantes do container do ícone de parada
 */
export const stopIconContainerVariants = tv({
  base: [
    "relative z-10 mt-0.5 shrink-0",
    "flex size-6 items-center justify-center rounded-full",
  ],
});

/**
 * Variantes do card de horário
 */
export const scheduleCardVariants = tv({
  base: "rounded-lg border p-3 text-center transition-colors cursor-pointer",
  variants: {
    status: {
      upcoming: "border-2 hover:scale-105 hover:shadow-md active:scale-95",
      passed: "border border-card-border bg-card opacity-50 cursor-default",
    },
  },
  defaultVariants: {
    status: "upcoming",
  },
});

/**
 * Variantes do card de informação
 */
export const infoCardVariants = tv({
  base: [
    "rounded-lg border p-4 text-center text-sm",
    "border-card-border bg-card",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

export interface LinhaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  todasParadas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

type TabType = "itinerario" | "horarios";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal que exibe informações detalhadas sobre uma linha de ônibus.
 *
 * @example
 * ```tsx
 * <LinhaDetalhesModal
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   linha={linhaData}
 *   todasParadas={paradasData}
 *   onParadaClick={(parada) => focusOnMap(parada)}
 * />
 * ```
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
  // ⚡ Bolt: Memoizing O(N*M) lookup to prevent recalculation when switching modal tabs
  const paradasDoItinerario = useMemo(
    () => buscarParadasPorIds(linha.itinerarioParadasIds, todasParadas),
    [linha.itinerarioParadasIds, todasParadas],
  );

  // Calcular horários passados e futuros
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ⚡ Bolt: Memoizing expensive time parsing and array sorting to prevent re-execution on every render
  const horariosOrganizados = useMemo(() => {
    return linha.horarios
      .filter((h) => h && h.includes(":"))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
        passou: timeToMinutes(horario) < currentMinutes,
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [linha.horarios, currentMinutes]);

  // ⚡ Bolt: Memoizing the derived filtered lists
  const proximos = useMemo(
    () => horariosOrganizados.filter((h) => !h.passou),
    [horariosOrganizados],
  );
  const passados = useMemo(
    () => horariosOrganizados.filter((h) => h.passou),
    [horariosOrganizados],
  );

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
        <div className={titleContainerVariants()}>
          <div
            className={titleIconVariants()}
            style={{ backgroundColor: linha.corHex }}
          >
            <Bus size={24} className="text-white drop-shadow-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold leading-tight text-text-primary">
              {linha.nome}
            </h2>
            {linha.sublinha && (
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {linha.sublinha}
              </p>
            )}
          </div>
        </div>
      }
      size="2xl"
    >
      {/* Tabs */}
      <div
        data-slot="tabs"
        role="tablist"
        aria-label="Opções de visualização"
        className="mb-6 flex gap-2 border-b border-card-border"
      >
        <button
          role="tab"
          aria-selected={tabAtiva === "itinerario"}
          aria-controls="panel-itinerario"
          id="tab-itinerario"
          onClick={() => handleTabChange("itinerario")}
          className={tabVariants({ active: tabAtiva === "itinerario" })}
          style={tabAtiva === "itinerario" ? { borderColor: linha.corHex } : {}}
        >
          <Map size={20} />
          Itinerário
        </button>
        <button
          role="tab"
          aria-selected={tabAtiva === "horarios"}
          aria-controls="panel-horarios"
          id="tab-horarios"
          onClick={() => handleTabChange("horarios")}
          className={tabVariants({ active: tabAtiva === "horarios" })}
          style={tabAtiva === "horarios" ? { borderColor: linha.corHex } : {}}
        >
          <Clock size={20} />
          Todos os Horários
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {tabAtiva === "itinerario" ? (
        <div
          role="tabpanel"
          id="panel-itinerario"
          aria-labelledby="tab-itinerario"
          tabIndex={0}
          data-slot="itinerary-tab"
          className="relative animate-in fade-in-0 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
        >
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
                        className="absolute left-2.75 top-7 h-full w-0.5"
                        style={{
                          backgroundColor: `${linha.corHex}40`,
                          backgroundImage: `repeating-linear-gradient(0deg, ${linha.corHex}40, ${linha.corHex}40 6px, transparent 6px, transparent 12px)`,
                        }}
                      />
                    )}

                    <button
                      onClick={() => handleParadaClick(parada)}
                      className={stopButtonVariants()}
                    >
                      {/* Ícone de localização com círculo */}
                      <div
                        className={stopIconContainerVariants()}
                        style={{ backgroundColor: `${linha.corHex}20` }}
                      >
                        <MapPin size={18} style={{ color: linha.corHex }} />
                      </div>

                      {/* Conteúdo da parada */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h4 className="text-[15px] font-semibold leading-snug text-text-primary group-hover:underline">
                          {parada.nome}
                        </h4>

                        {isFirst && (
                          <p className="mt-0.5 text-xs text-text-secondary">
                            Ponto de Origem/Destino
                          </p>
                        )}
                        {!isFirst && !isLast && (
                          <p className="mt-0.5 text-xs text-text-secondary">
                            Parada Regular
                          </p>
                        )}

                        {isFirst && (
                          <span
                            className="mt-1 inline-block px-0 text-xs font-semibold"
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
            <div className="py-8 text-center text-text-secondary">
              <p>Nenhuma parada encontrada para este itinerário.</p>
            </div>
          )}

          <div className={`mt-6 ${infoCardVariants()}`}>
            <p className="text-text-secondary">
              💡 Clique em uma parada para visualizá-la no mapa
            </p>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-horarios"
          aria-labelledby="tab-horarios"
          tabIndex={0}
          data-slot="schedules-tab"
          className="space-y-6 animate-in fade-in-0 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
        >
          {/* Próximos Horários */}
          {proximos.length > 0 && (
            <div data-slot="upcoming-schedules">
              <h3
                className="mb-3 flex items-center gap-2 text-lg font-semibold"
                style={{ color: linha.corHex }}
              >
                <Clock size={20} />
                Próximos Horários ({proximos.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {proximos.map(({ horario, minutos }, index) => (
                  <div
                    key={`proximo-${minutos}-${index}`}
                    onClick={() => handleHorarioClick(horario)}
                    className={scheduleCardVariants({ status: "upcoming" })}
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
            <div data-slot="passed-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                <Clock size={20} />
                Horários Passados ({passados.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {passados.map(({ horario, minutos }, index) => (
                  <div
                    key={`passado-${minutos}-${index}`}
                    onClick={() => handleHorarioClick(horario)}
                    className={scheduleCardVariants({ status: "passed" })}
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
          <div data-slot="summary" className={infoCardVariants()}>
            <p className="text-text-secondary">
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
