/**
 * ItinerarioModal - Modal de itinerário da linha
 * Design System - Interno Rotas UFMG
 */

import { useMemo } from "react";
import { tv } from "tailwind-variants";
import { MapPin } from "lucide-react";
import { Modal } from "./Modal";
import type { Linha, Parada } from "../types/data.types";
import { buscarParadasPorIds } from "../../lib/utils";
import { calcularPrevisaoChegada } from "../hooks/usePrevisaoChegada";

// ============================================================================
// VARIANTS
// ============================================================================

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

export interface ItinerarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  paradas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal que exibe o itinerário de uma linha de ônibus.
 *
 * @example
 * ```tsx
 * <ItinerarioModal
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 *   linha={linhaData}
 *   paradas={paradasData}
 *   onParadaClick={(parada) => focusOnMap(parada)}
 * />
 * ```
 */
export function ItinerarioModal({
  isOpen,
  onClose,
  linha,
  paradas,
  onParadaClick,
}: ItinerarioModalProps) {
  // ⚡ Bolt: Memoize O(N*M) lookup para evitar recalculação em cada render
  // Buscar paradas do itinerário
  // ⚡ Bolt: Memoized the array mapping and lookup across the ID list
  const paradasDoItinerario = useMemo(() => {
    return buscarParadasPorIds(linha.itinerarioParadasIds, paradas);
  }, [linha.itinerarioParadasIds, paradas]);

  const handleParadaClick = (parada: Parada) => {
    onParadaClick(parada);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Itinerário - ${linha.nome}`}
      size="lg"
    >
      <div className="relative">
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
          <div className="py-8 text-center text-gray-400">
            <p>Nenhuma parada encontrada para este itinerário.</p>
          </div>
        )}
      </div>

      <div data-slot="tip" className={`mt-6 ${infoCardVariants()}`}>
        <p className="text-text-secondary">
          💡 Clique em uma parada para visualizá-la no mapa
        </p>
      </div>
    </Modal>
  );
}
