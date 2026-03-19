/**
 * LinhaDetalhesModal - Modal de detalhes da linha
 * Design System - Interno Rotas UFMG
 */

import { useState, useMemo } from "react";
import { tv } from "tailwind-variants";
import { Clock, Map, MapPin, Bus, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import type { Linha, Parada } from "../types/data.types";
import {
  buscarParadasPorIds,
  timeToMinutes,
  findScheduleIndex,
} from "../../lib/utils";
import { useAnalytics, useSessionTiming } from "../hooks/useAnalytics";
import {
  isLineAvailableToday,
  getLinhaNotRunningMessage,
} from "../config/specialPeriods";
import { calcularPrevisaoChegada } from "../hooks/usePrevisaoChegada";

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
  base: "rounded-lg border p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  variants: {
    status: {
      upcoming:
        "border-2 hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer focus-visible:ring-brand-primary",
      passed:
        "border border-card-border bg-card opacity-50 cursor-default focus-visible:ring-card-border",
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

  const isLineRunningToday = isLineAvailableToday(linha.categoriaDia);
  const getNotRunningMessage = () =>
    getLinhaNotRunningMessage(linha.categoriaDia);

  // Buscar paradas do itinerário dinamicamente usando os IDs com memoização
  const paradasDoItinerario = useMemo(() => {
    return buscarParadasPorIds(linha.itinerarioParadasIds, todasParadas);
  }, [linha.itinerarioParadasIds, todasParadas]);

  // Calcular horários passados e futuros
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ⚡ Bolt: Separar parsing e ordenação (O(N log N)) custosos em um useMemo independente
  // Isso evita re-ordenar os horários a cada renderização quando o tempo muda
  const baseHorarios = useMemo(() => {
    return linha.horarios
      .filter((h) => h && h.includes(":"))
      .map((horario) => ({
        horario,
        minutos: timeToMinutes(horario),
      }))
      .sort((a, b) => a.minutos - b.minutos);
  }, [linha.horarios]);

  // ⚡ Bolt: Usar busca binária O(log N) e fatiamento virtual (slice) em vez de iterar com map/filter O(N)
  // Isso evita criar novos arrays/objetos base em cada renderização (a cada minuto que o relógio muda).
  // Separamos os componentes "passado" e "futuro" para evitar realocação dos itens O(N)
  const splitIndex = useMemo(() => {
    // Busca binária para achar onde dividir usando um getter para evitar o .map() inicial.
    // Usamos currentMinutes - 1 pois currentMinutes (agora) deve ser considerado 'proximo'
    return findScheduleIndex(
      baseHorarios,
      currentMinutes - 1,
      (h) => h.minutos,
    );
  }, [baseHorarios, currentMinutes]);

  // Zero-allocation das sublistas virtuais
  const passados = baseHorarios.slice(0, splitIndex);
  const proximos = baseHorarios.slice(splitIndex);
  const todos = baseHorarios;

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
              {paradasDoItinerario.map((parada) => {
                const isFirst =
                  parada.idParada === paradasDoItinerario[0]?.idParada;
                const isLast =
                  parada.idParada ===
                  paradasDoItinerario[paradasDoItinerario.length - 1]?.idParada;

                return (
                  <div key={parada.idParada} className="relative flex">
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
                      aria-label={`Ver localização da parada ${parada.nome} no mapa`}
                      title={`Ver localização da parada ${parada.nome} no mapa`}
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

                        {(isFirst || isLast) && (
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

                        {isLast && (
                          <span
                            className="mt-1 inline-block px-0 text-xs font-semibold"
                            style={{ color: linha.corHex }}
                          >
                            Chegada
                          </span>
                        )}

                        {/* Previsão de chegada nesta parada */}
                        {(() => {
                          const previsao = calcularPrevisaoChegada(
                            linha,
                            parada.idParada,
                          );
                          if (!previsao || !previsao.proximoOnibus) return null;
                          const {
                            proximoOnibus,
                            onibusAnterior,
                            isTrafegoIntenso,
                          } = previsao;
                          const minutos = proximoOnibus.minutosFaltantes;

                          const badgeBg =
                            minutos < 1
                              ? "var(--success-bg)"
                              : isTrafegoIntenso
                                ? "var(--warning-bg)"
                                : minutos <= 15
                                  ? "var(--success-bg)"
                                  : "var(--warning-bg)";

                          const badgeText =
                            minutos < 1
                              ? "var(--success-text)"
                              : isTrafegoIntenso
                                ? "#d97706"
                                : minutos <= 15
                                  ? "var(--success-text)"
                                  : "var(--warning-text)";

                          const textoChegada =
                            minutos < 1
                              ? "Chega agora"
                              : minutos < 60
                                ? `~${minutos} min · ${proximoOnibus.horarioChegada}`
                                : (() => {
                                    const h = Math.floor(minutos / 60);
                                    const m = minutos % 60;
                                    return m === 0
                                      ? `~${h}h · ${proximoOnibus.horarioChegada}`
                                      : `~${h}h ${m}min · ${proximoOnibus.horarioChegada}`;
                                  })();

                          return (
                            <div className="mt-1.5 flex flex-col gap-0.5">
                              <span
                                className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                                style={{
                                  backgroundColor: badgeBg,
                                  color: badgeText,
                                }}
                              >
                                {textoChegada}
                              </span>
                              {onibusAnterior && (
                                <span className="text-[10px] text-text-tertiary">
                                  Último passou há{" "}
                                  {onibusAnterior.minutosQuePassou} min
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
          {/* Aviso quando a linha não está circulando */}
          {!isLineRunningToday && (
            <div
              data-slot="not-running-notice"
              className="rounded-lg border border-amber-600/50 bg-amber-900/20 p-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="shrink-0 text-amber-400" />
                <p className="text-sm font-medium text-amber-300">
                  {getNotRunningMessage()}
                </p>
              </div>
            </div>
          )}

          {/* Próximos Horários - só mostra quando a linha está circulando */}
          {isLineRunningToday && proximos.length > 0 && (
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Próximo horário às ${horario}`}
                    onClick={() => handleHorarioClick(horario)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleHorarioClick(horario);
                      }
                    }}
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

          {/* Horários (todos quando não está circulando, ou apenas passados quando está) */}
          {!isLineRunningToday ? (
            <div data-slot="all-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                <Clock size={20} />
                Todos os Horários ({todos.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {todos.map(({ horario, minutos }, index) => (
                  <div
                    key={`horario-${minutos}-${index}`}
                    className={scheduleCardVariants({ status: "passed" })}
                  >
                    <p className="text-lg font-semibold text-text-secondary">
                      {horario}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            passados.length > 0 && (
              <div data-slot="passed-schedules">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                  <Clock size={20} />
                  Horários Passados ({passados.length})
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {passados.map(({ horario, minutos }, index) => (
                    <div
                      key={`passado-${minutos}-${index}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Horário passado às ${horario}`}
                      onClick={() => handleHorarioClick(horario)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleHorarioClick(horario);
                        }
                      }}
                      className={scheduleCardVariants({ status: "passed" })}
                    >
                      <p className="text-lg font-semibold text-text-secondary">
                        {horario}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Resumo */}
          <div data-slot="summary" className={infoCardVariants()}>
            <p className="text-text-secondary">
              Total de {todos.length} horários
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
