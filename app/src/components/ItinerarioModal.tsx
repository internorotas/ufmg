/**
 * ItinerarioModal - Modal de itinerário da linha
 * Design System - Interno Rotas UFMG
 */

import { tv } from "tailwind-variants";
import { MapPin } from "lucide-react";
import { Modal } from "./Modal";
import type { Linha, Parada } from "../types/data.types";
import { buscarParadasPorIds } from "../../lib/utils";

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
  // Buscar paradas do itinerário
  const paradasDoItinerario = buscarParadasPorIds(
    linha.itinerarioParadasIds,
    paradas,
  );

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
            {paradasDoItinerario.map((parada, index) => {
              const isFirst = index === 0;
              const isLast = index === paradasDoItinerario.length - 1;

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
