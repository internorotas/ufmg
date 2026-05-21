/**
 * PopupCustomizado - Popup de parada de ônibus no mapa
 * Design System - Interno Rotas UFMG
 */

import { Bell, BellRing, Bus, MapPin, Navigation } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Popup, useMap } from 'react-leaflet';
import { tv, type VariantProps } from 'tailwind-variants';
import { calcularPrevisaoChegada } from '@/features/eta/domain/calculateEta';
import { usePlannerStore } from '@/features/planner/store/plannerStore';
import { isLineAvailableToday } from '../config/specialPeriods';
import { useNotificacaoContext } from '../contexts/NotificacaoContext';
import { useRotasData, useRotasSelection } from '../contexts/RotasContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { cn, normalizarNomeLinha } from '../lib/utils';
import type { Linha, Parada } from '../types/data.types';
import { DisclaimerEstimativa } from './DisclaimerEstimativa';
import { PrevisaoBadge } from './PrevisaoBadge';

export const popupContainerVariants = tv({
  base: 'flex w-[min(17rem,76vw)] flex-col gap-3 text-text-primary',
});

export const popupHeaderVariants = tv({
  base: 'flex items-start gap-3',
});

export const popupSectionVariants = tv({
  base: 'border-t border-card-border pt-3',
});

export const lineButtonVariants = tv({
  base: [
    'group inline-flex min-h-11 w-full items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-xs font-semibold leading-tight',
    'border-card-border border-l-[3px] text-text-primary whitespace-normal break-words',
    'transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ],
});

const SUBLINHAS_CALENDARIO = ['Sábado', 'Férias e Recessos'];

function getNomeExibicao(linha: Linha | null, nomeLinha: string): string {
  if (!linha) return nomeLinha.replace(/\s*\(Todas\)\s*/gi, '').trim();
  if (linha.sublinha && !SUBLINHAS_CALENDARIO.includes(linha.sublinha)) {
    return `${linha.nome} · ${linha.sublinha}`;
  }
  return linha.nome;
}

export interface PopupCustomizadoProps
  extends Omit<ComponentProps<typeof Popup>, 'children'>,
    VariantProps<typeof popupContainerVariants> {
  parada: Parada;
}

export function PopupCustomizado({ parada, className, ...props }: PopupCustomizadoProps) {
  const analytics = useAnalytics();
  const { rotasService } = useRotasData();
  const { selecionarLinha } = useRotasSelection();
  const { suportado, isAlarmado, toggleNotificacao } = useNotificacaoContext();
  const currentTime = useCurrentTime();

  const resolverLinhaPorNome = (nomeLinhaParada: string, idParadaAtual: string): Linha | null => {
    const chave = normalizarNomeLinha(nomeLinhaParada);
    const candidatas = rotasService.getLinhasPorNomeNormalizado(chave);
    if (candidatas.length === 0) return null;

    const candidatasDoDia = candidatas.filter((l) => isLineAvailableToday(l.categoriaDia));
    if (candidatasDoDia.length === 0) return null;

    const candidatasNaParada = candidatasDoDia.filter(
      (linha) => linha.trajetoDetalhado?.some((t) => t.idParada === idParadaAtual) ?? false,
    );

    if (candidatasNaParada.length === 0) {
      const atendeParada = candidatasDoDia.find((linha) =>
        linha.itinerarioParadasIds.includes(idParadaAtual),
      );
      return atendeParada ?? candidatasDoDia[0] ?? null;
    }

    if (candidatasNaParada.length === 1) {
      return candidatasNaParada[0];
    }

    let melhor: Linha = candidatasNaParada[0];
    let melhorMinutos = Infinity;
    for (const candidata of candidatasNaParada) {
      const previsao = calcularPrevisaoChegada(candidata, idParadaAtual, currentTime);
      if (previsao?.proximoOnibus && previsao.proximoOnibus.minutosFaltantes < melhorMinutos) {
        melhorMinutos = previsao.proximoOnibus.minutosFaltantes;
        melhor = candidata;
      }
    }
    return melhor;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentTime é a dependência reativa propositalmente
  const linhasResolvidas = useMemo(
    () =>
      (parada.linhasAtendidas ?? []).map((nomeLinha) => {
        const linha = resolverLinhaPorNome(nomeLinha, parada.idParada);
        const previsao = linha
          ? calcularPrevisaoChegada(linha, parada.idParada, currentTime)
          : null;
        return {
          nomeLinha,
          linha,
          minutosFaltantes: previsao?.proximoOnibus?.minutosFaltantes ?? null,
          horarioChegada: previsao?.proximoOnibus?.horarioChegada ?? '',
          minutosUltimoPassou: previsao?.onibusAnterior?.minutosQuePassou ?? null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parada.idParada, parada.linhasAtendidas, rotasService, currentTime],
  );

  const totalLinhas = parada.linhasAtendidas?.length ?? 0;
  const headingId = `popup-parada-${parada.idParada}`;
  const linhasLabelId = `popup-parada-${parada.idParada}-linhas`;

  return (
    <Popup className={cn('popup-customizado', className)} minWidth={200} {...props}>
      <section
        data-slot="container"
        aria-labelledby={headingId}
        className={popupContainerVariants()}
      >
        <header data-slot="header" className={popupHeaderVariants()}>
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white shadow-sm"
          >
            <MapPin size={20} />
          </span>
          <div className="min-w-0">
            <h3
              id={headingId}
              className="text-sm font-bold leading-snug text-text-primary sm:text-base"
            >
              {parada.nome}
            </h3>
            {parada.categoria ? (
              <p className="mt-0.5 text-xs text-text-secondary">{parada.categoria}</p>
            ) : null}
          </div>
        </header>

        <DisclaimerEstimativa />

        {totalLinhas > 0 ? (
          <section
            data-slot="lines-section"
            aria-labelledby={linhasLabelId}
            className={popupSectionVariants()}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm"
              >
                <Bus size={14} />
              </span>
              <p id={linhasLabelId} className="text-xs font-semibold text-text-primary">
                {totalLinhas === 1 ? '1 linha atende aqui' : `${totalLinhas} linhas atendem aqui`}
              </p>
            </div>

            <ul
              className="max-h-44 space-y-1.5 overflow-y-auto"
              aria-label="Linhas com previsão de chegada"
            >
              {linhasResolvidas.map(
                ({ nomeLinha, linha, minutosFaltantes, horarioChegada, minutosUltimoPassou }) => {
                  const nomeExibicao = getNomeExibicao(linha, nomeLinha);
                  const isAlarmAtivo =
                    linha && suportado ? isAlarmado(linha.idRota, parada.idParada) : false;
                  const showBell = Boolean(linha) && suportado && minutosFaltantes !== null;

                  return (
                    <li
                      key={nomeLinha}
                      className="rounded-lg border border-card-border/70 bg-card p-2"
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <button
                          type="button"
                          className={lineButtonVariants()}
                          title={nomeExibicao}
                          style={linha ? { borderLeftColor: linha.corHex } : undefined}
                          disabled={!linha}
                          aria-label={
                            linha
                              ? `Ver linha ${nomeExibicao} no menu`
                              : `Linha ${nomeExibicao} sem dados detalhados`
                          }
                          onClick={() => {
                            if (!linha) return;
                            analytics.trackEvent({
                              category: 'map_interaction',
                              action: 'select_line_from_popup',
                              label: `${parada.nome} -> ${linha.nome}`,
                            });
                            selecionarLinha(linha);
                          }}
                        >
                          <span className="truncate">{nomeExibicao}</span>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          {linha ? (
                            <PrevisaoBadge linha={linha} idParada={parada.idParada} compacto />
                          ) : (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--neutral-bg)',
                                color: 'var(--neutral-text)',
                              }}
                            >
                              Sem previsão
                            </span>
                          )}

                          {showBell && linha && minutosFaltantes !== null ? (
                            <button
                              type="button"
                              onClick={() =>
                                toggleNotificacao(linha, parada, minutosFaltantes, horarioChegada)
                              }
                              className={cn(
                                'flex size-11 shrink-0 items-center justify-center rounded-full transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-95',
                                isAlarmAtivo
                                  ? 'bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30'
                                  : 'text-text-secondary hover:bg-card-hover hover:text-text-primary',
                              )}
                              aria-label={
                                isAlarmAtivo
                                  ? `Cancelar alarme de chegada para ${nomeExibicao}`
                                  : `Avisar quando ${nomeExibicao} chegar`
                              }
                              aria-pressed={isAlarmAtivo}
                              title={
                                isAlarmAtivo
                                  ? 'Cancelar alarme de chegada'
                                  : 'Avisar quando o ônibus chegar'
                              }
                            >
                              {isAlarmAtivo ? (
                                <BellRing size={18} aria-hidden="true" />
                              ) : (
                                <Bell size={18} aria-hidden="true" />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {minutosUltimoPassou !== null ? (
                        <p className="mt-1.5 border-t border-card-border/60 pt-1.5 text-[11px] text-text-secondary">
                          Último passou há {minutosUltimoPassou} min
                        </p>
                      ) : null}
                    </li>
                  );
                },
              )}
            </ul>
          </section>
        ) : null}

        {parada.descricao && parada.descricao !== parada.nome ? (
          <section data-slot="description" className={popupSectionVariants()}>
            <p className="text-xs italic text-text-secondary">{parada.descricao}</p>
          </section>
        ) : null}

        <PlannerStopActions parada={parada} />
      </section>
    </Popup>
  );
}

function PlannerStopActions({ parada }: { parada: Parada }) {
  const { setOrigin, setDestination } = usePlannerStore();
  const map = useMap();

  const handleUseAsOrigin = () => {
    setOrigin({ kind: 'stop', idParada: parada.idParada, nome: parada.nome });
    map.closePopup();
  };

  const handleUseAsDestination = () => {
    setDestination({ kind: 'stop', idParada: parada.idParada, nome: parada.nome });
    map.closePopup();
  };

  return (
    <fieldset data-slot="planner-actions" className="flex gap-2 border-t border-card-border pt-3">
      <legend className="sr-only">Usar esta parada no planejador</legend>
      <button
        type="button"
        onClick={handleUseAsOrigin}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Usar ${parada.nome} como origem no planejador`}
      >
        <Navigation size={14} aria-hidden="true" />
        Usar como origem
      </button>
      <button
        type="button"
        onClick={handleUseAsDestination}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-card-border bg-background px-2 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Usar ${parada.nome} como destino no planejador`}
      >
        <MapPin size={14} aria-hidden="true" />
        Usar como destino
      </button>
    </fieldset>
  );
}
