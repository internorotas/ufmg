/**
 * PopupCustomizado - Popup de parada de ônibus no mapa
 * Design System - Interno Rotas UFMG
 */

import { Bell, BellRing, Bus, MapPin } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { tv, type VariantProps } from 'tailwind-variants';
import { isLineAvailableToday } from '../config/specialPeriods';
import { useNotificacaoContext } from '../contexts/NotificacaoContext';
import { useRotasData } from '../contexts/RotasContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { calcularPrevisaoChegada } from '../hooks/usePrevisaoChegada';
import { cn, normalizarNomeLinha } from '../lib/utils';
import type { Linha, Parada } from '../types/data.types';
import { DisclaimerEstimativa } from './DisclaimerEstimativa';
import { PrevisaoBadge } from './PrevisaoBadge';

/**
 * Variantes do container do popup
 */
export const popupContainerVariants = tv({
  base: 'min-w-[220px] max-w-[330px]',
});

/**
 * Variantes do header do popup
 */
export const popupHeaderVariants = tv({
  base: 'mb-2 flex items-start gap-2',
});

/**
 * Variantes da seção de linhas
 */
export const popupLinesSectionVariants = tv({
  base: 'mt-2 border-t border-card-border pt-2',
});

/**
 * Variantes da badge de linha
 */
export const lineBadgeVariants = tv({
  base: [
    'inline-flex min-h-[2.5rem] w-full items-center rounded-md border px-2 py-1.5 text-[11px] font-semibold leading-tight',
    'border-card-border bg-card text-text-primary',
  ],
});

// Sublinhas que indicam período de operação (não variante de rota)
const SUBLINHAS_CALENDARIO = ['Sábado', 'Férias e Recessos'];

/**
 * Retorna o nome de exibição da linha com a sublinha de rota (se houver),
 * ignorando sublinhas que indicam apenas o período do calendário.
 */
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

/**
 * Popup customizado para marcador de parada de ônibus no mapa.
 *
 * @example
 * ```tsx
 * <PopupCustomizado parada={paradaData} />
 * ```
 */
export function PopupCustomizado({ parada, className, ...props }: PopupCustomizadoProps) {
  const analytics = useAnalytics();
  const { rotasService } = useRotasData();
  const { suportado, isAlarmado, toggleNotificacao } = useNotificacaoContext();
  // Faz o popup re-renderizar a cada tick (30s) para que a seleção de subLinha
  // seja sempre reavaliada com o horário atual — evita que a escolha feita no
  // primeiro render fique obsoleta enquanto o PrevisaoBadge interno atualiza o
  // ETA do candidato errado.
  const currentTime = useCurrentTime();

  const resolverLinhaPorNome = (nomeLinhaParada: string, idParadaAtual: string): Linha | null => {
    const chave = normalizarNomeLinha(nomeLinhaParada);
    const candidatas = rotasService.getLinhasPorNomeNormalizado(chave);
    if (candidatas.length === 0) return null;

    // Considera apenas linhas vigentes hoje para evitar ETA indevida de linhas não circulantes.
    const candidatasDoDia = candidatas.filter((l) => isLineAvailableToday(l.categoriaDia));
    if (candidatasDoDia.length === 0) return null;

    // Candidatas que possuem esta parada no trajeto detalhado
    const candidatasNaParada = candidatasDoDia.filter(
      (linha) => linha.trajetoDetalhado?.some((t) => t.idParada === idParadaAtual) ?? false,
    );

    if (candidatasNaParada.length === 0) {
      // Fallback: parada no itinerário mas sem trajetoDetalhado
      const atendeParada = candidatasDoDia.find((linha) =>
        linha.itinerarioParadasIds.includes(idParadaAtual),
      );
      return atendeParada ?? candidatasDoDia[0] ?? null;
    }

    if (candidatasNaParada.length === 1) {
      return candidatasNaParada[0];
    }

    // Múltiplos sublinhas servem esta parada: escolhe o com chegada mais próxima.
    // Usa currentTime (mesmo tick do PrevisaoBadge) para comparação consistente.
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

  // Resolve todas as linhas de uma vez, memoizado por parada + tempo.
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
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parada.idParada, parada.linhasAtendidas, rotasService, currentTime],
  );

  return (
    <Popup className={cn('popup-customizado', className)} minWidth={220} {...props}>
      <div data-slot="container" className={popupContainerVariants()}>
        <div data-slot="header" className={popupHeaderVariants()}>
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-internoRotas-laranja-ambar/20">
            <MapPin className="text-internoRotas-laranja-ambar" size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight text-text-primary">{parada.nome}</h3>
            <p className="mt-1 text-xs text-text-secondary">{parada.categoria}</p>
          </div>
        </div>

        <div className="mt-1">
          <DisclaimerEstimativa />
        </div>

        {parada.linhasAtendidas && parada.linhasAtendidas.length > 0 && (
          <div data-slot="lines-section" className={popupLinesSectionVariants()}>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-internoRotas-azul-eletrico/50">
                <Bus className="text-internoRotas-bege-areia/40" size={13} />
              </div>
              <p className="text-xs font-semibold text-text-primary">
                {parada.linhasAtendidas.length} linha
                {parada.linhasAtendidas.length !== 1 ? 's' : ''} atende
                {parada.linhasAtendidas.length === 1 ? '' : 'm'} aqui:
              </p>
            </div>
            <div className="mb-1 grid grid-cols-[1fr_auto] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
              <span>Linha</span>
              <span>Previsão</span>
            </div>
            <div className="space-y-1">
              {linhasResolvidas.map(({ nomeLinha, linha, minutosFaltantes, horarioChegada }) => (
                <div
                  key={nomeLinha}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-card-border/70 bg-background-secondary/40 px-2 py-1.5"
                >
                  <span
                    className={cn(lineBadgeVariants(), 'border-l-[3px]')}
                    title={nomeLinha}
                    style={linha ? { borderLeftColor: linha.corHex } : undefined}
                  >
                    <button
                      type="button"
                      className="w-full whitespace-normal break-words text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                      aria-label={`Selecionar linha ${getNomeExibicao(linha, nomeLinha)}`}
                      onClick={() => {
                        if (!linha) return;
                        analytics.trackEvent({
                          category: 'map_interaction',
                          action: 'select_line',
                          label: `${parada.nome} -> ${linha.nome}`,
                        });
                      }}
                    >
                      {getNomeExibicao(linha, nomeLinha)}
                    </button>
                  </span>

                  {/* Coluna direita: badge de previsão + sino */}
                  {linha ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <PrevisaoBadge linha={linha} idParada={parada.idParada} compacto />
                      {suportado &&
                        minutosFaltantes !== null &&
                        (() => {
                          const alarmado = isAlarmado(linha.idRota, parada.idParada);
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                toggleNotificacao(linha, parada, minutosFaltantes, horarioChegada)
                              }
                              className={cn(
                                'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-90',
                                alarmado
                                  ? 'bg-brand-accent/30 hover:bg-brand-accent/40'
                                  : 'hover:bg-card-hover',
                              )}
                              aria-label={
                                alarmado ? 'Cancelar alarme de chegada' : 'Ativar alarme de chegada'
                              }
                              aria-pressed={alarmado}
                              title={
                                alarmado
                                  ? 'Cancelar alarme de chegada'
                                  : 'Avisar quando o ônibus chegar'
                              }
                            >
                              {alarmado ? (
                                <BellRing size={15} className="text-brand-secondary" />
                              ) : (
                                <Bell size={15} className="text-text-tertiary" />
                              )}
                            </button>
                          );
                        })()}
                    </div>
                  ) : (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--neutral-bg)',
                        color: 'var(--neutral-text)',
                      }}
                    >
                      Sem previsão
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {parada.descricao && parada.descricao !== parada.nome && (
          <div data-slot="description" className="mt-2 border-t border-card-border pt-2">
            <p className="text-xs italic text-text-secondary">{parada.descricao}</p>
          </div>
        )}
      </div>
    </Popup>
  );
}
