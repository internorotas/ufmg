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
  base: "min-w-[220px] max-w-[330px]",
});

/**
 * Variantes do header do popup
 */
export const popupHeaderVariants = tv({
  base: "mb-2 flex items-start gap-2",
});

/**
 * Variantes da seção de linhas
 */
export const popupLinesSectionVariants = tv({
  base: "mt-2 border-t border-card-border pt-2",
});

/**
 * Variantes da badge de linha
 */
export const lineBadgeVariants = tv({
  base: [
    "inline-flex min-h-[2.5rem] w-full items-start rounded-md border px-2 py-1.5 text-[11px] font-semibold leading-tight",
    "border-card-border bg-card text-text-primary",
  ],
});

function normalizarNomeLinha(nomeLinha: string): string {
  return nomeLinha
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim()
    .toLowerCase();
}

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

  // Mapear nome de linha para lista de objetos Linha e suportar aliases como "(Todas)"
  const linhasPorNomeNormalizado = useMemo(() => {
    const mapa = new Map<string, Linha[]>();
    linhasData.categoriasDias.forEach((categoria) => {
      categoria.linhas.forEach((linha) => {
        const chave = normalizarNomeLinha(linha.nome);
        const linhas = mapa.get(chave) ?? [];
        linhas.push(linha);
        mapa.set(chave, linhas);
      });
    });
    return mapa;
  }, [linhasData]);

  const resolverLinhaPorNome = (
    nomeLinhaParada: string,
    idParadaAtual: string,
  ): Linha | null => {
    const chave = normalizarNomeLinha(nomeLinhaParada);
    const candidatas = linhasPorNomeNormalizado.get(chave) ?? [];
    if (candidatas.length === 0) return null;

    const comTrajetoNaParada = candidatas.find(
      (linha) =>
        Boolean(linha.trajetoDetalhado?.length) &&
        linha.itinerarioParadasIds.includes(idParadaAtual),
    );
    if (comTrajetoNaParada) return comTrajetoNaParada;

    const atendeParada = candidatas.find((linha) =>
      linha.itinerarioParadasIds.includes(idParadaAtual),
    );
    if (atendeParada) return atendeParada;

    const comTrajeto = candidatas.find((linha) =>
      Boolean(linha.trajetoDetalhado?.length),
    );
    if (comTrajeto) return comTrajeto;

    return candidatas[0] ?? null;
  };

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

        <div className="mt-1">
          <DisclaimerEstimativa />
        </div>

        {/* Linhas Atendidas */}
        {parada.linhasAtendidas && parada.linhasAtendidas.length > 0 && (
          <div
            data-slot="lines-section"
            className={popupLinesSectionVariants()}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <Bus className="text-internoRotas-azul-eletrico" size={16} />
              <p className="text-xs font-semibold text-text-primary">
                {parada.linhasAtendidas.length} linha
                {parada.linhasAtendidas.length !== 1 ? "s" : ""} atende
                {parada.linhasAtendidas.length === 1 ? "" : "m"} aqui:
              </p>
            </div>
            <div className="mb-1 grid grid-cols-[1fr_auto] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              <span>Linha</span>
              <span>Previsao</span>
            </div>
            <div className="space-y-1">
              {parada.linhasAtendidas.map((nomeLinha, index) => {
                const linha = resolverLinhaPorNome(nomeLinha, parada.idParada);
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-card-border/70 bg-background-secondary/40 px-2 py-1.5"
                  >
                    <span
                      className={lineBadgeVariants()}
                      title={nomeLinha}
                    >
                      <span className="whitespace-normal wrap-break-word text-left">
                        {nomeLinha}
                      </span>
                    </span>
                    {linha ? (
                      <PrevisaoBadge linha={linha} idParada={parada.idParada} />
                    ) : (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: "var(--neutral-bg)",
                          color: "var(--neutral-text)",
                        }}
                      >
                        Sem previsao
                      </span>
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
            className="mt-2 border-t border-card-border pt-2"
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
