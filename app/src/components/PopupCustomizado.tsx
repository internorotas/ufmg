/**
 * PopupCustomizado - Popup de parada de ônibus no mapa
 * Design System - Interno Rotas UFMG
 */

import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Popup } from "react-leaflet";
import { tv, type VariantProps } from "tailwind-variants";
import { Bus, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import type { Parada, Linha } from "../types/data.types";
import { DisclaimerEstimativa } from "./DisclaimerEstimativa";
import { PrevisaoBadge } from "./PrevisaoBadge";
import { useRotasData } from "../contexts/RotasContext";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do container do popup
 */
export const popupContainerVariants = tv({
  base: "min-w-[220px]",
});

/**
 * Variantes do header do popup
 */
export const popupHeaderVariants = tv({
  base: "mb-3 flex items-start gap-2",
});

/**
 * Variantes da seção de linhas
 */
export const popupLinesSectionVariants = tv({
  base: "mt-3 border-t border-card-border pt-3",
});

/**
 * Variantes da badge de linha
 */
export const lineBadgeVariants = tv({
  base: [
    "rounded px-2 py-1 text-xs font-medium",
    "bg-internoRotas-azul-eletrico text-white",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

export interface PopupCustomizadoProps
  extends
    Omit<ComponentProps<typeof Popup>, "children">,
    VariantProps<typeof popupContainerVariants> {
  parada: Parada;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Popup customizado para marcador de parada de ônibus no mapa.
 *
 * @example
 * ```tsx
 * <PopupCustomizado parada={paradaData} />
 * ```
 */
export function PopupCustomizado({
  parada,
  className,
  ...props
}: PopupCustomizadoProps) {
  const { linhasData } = useRotasData();

  // Mapear nome de linha para objeto Linha (memoizado)
  const linhasPorNome = useMemo(() => {
    const mapa = new Map<string, Linha>();
    linhasData.categoriasDias.forEach((categoria) => {
      categoria.linhas.forEach((linha) => {
        mapa.set(linha.nome, linha);
      });
    });
    return mapa;
  }, [linhasData]);

  return (
    <Popup
      className={cn("popup-customizado", className)}
      minWidth={220}
      {...props}
    >
      <div data-slot="container" className={popupContainerVariants()}>
        {/* Cabeçalho */}
        <div data-slot="header" className={popupHeaderVariants()}>
          <MapPin
            className="mt-1 shrink-0 text-internoRotas-laranja-ambar"
            size={22}
          />
          <div>
            <h3 className="text-base font-bold leading-tight text-text-primary">
              {parada.nome}
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              {parada.categoria}
            </p>
          </div>
        </div>

        <div className="mb-2 mt-2">
          <DisclaimerEstimativa />
        </div>

        {/* Linhas Atendidas */}
        {parada.linhasAtendidas && parada.linhasAtendidas.length > 0 && (
          <div
            data-slot="lines-section"
            className={popupLinesSectionVariants()}
          >
            <div className="mb-2 flex items-center gap-2">
              <Bus className="text-internoRotas-azul-eletrico" size={16} />
              <p className="text-xs font-semibold text-text-primary">
                {parada.linhasAtendidas.length} linha
                {parada.linhasAtendidas.length !== 1 ? "s" : ""} atende
                {parada.linhasAtendidas.length === 1 ? "" : "m"} aqui:
              </p>
            </div>
            <div className="space-y-1.5">
              {parada.linhasAtendidas.map((nomeLinha, index) => {
                const linha = linhasPorNome.get(nomeLinha);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className={lineBadgeVariants()}>{nomeLinha}</span>
                    {linha && (
                      <PrevisaoBadge linha={linha} idParada={parada.idParada} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Descrição */}
        {parada.descricao && parada.descricao !== parada.nome && (
          <div
            data-slot="description"
            className="mt-3 border-t border-card-border pt-3"
          >
            <p className="text-xs italic text-text-secondary">
              {parada.descricao}
            </p>
          </div>
        )}
      </div>
    </Popup>
  );
}
