import { Bell, BellRing, Bus, Heart, MapPin, Navigation } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import markerSvgUrl from '@/assets/marker.svg';
import { isLineAvailableToday } from '@/config/specialPeriods';
import { useNotificacaoContext } from '@/contexts/NotificacaoContext';
import { useRotasData, useRotasSelection } from '@/contexts/RotasContext';
import { calcularPrevisaoChegada } from '@/features/eta/domain/calculateEta';
import { usePlannerStore } from '@/features/planner/store/plannerStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { useParadasFavoritas } from '@/hooks/useParadasFavoritas';
import { cn, normalizarNomeLinha } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { DisclaimerEstimativa } from '../../DisclaimerEstimativa';
import { PrevisaoBadge } from '../../PrevisaoBadge';

const SUBLINHAS_CALENDARIO = ['Sábado', 'Férias e Recessos'];

function getNomeExibicao(linha: Linha | null, nomeLinha: string): string {
  if (!linha) return nomeLinha.replace(/\s*\(Todas\)\s*/gi, '').trim();
  if (linha.sublinha && !SUBLINHAS_CALENDARIO.includes(linha.sublinha)) {
    return `${linha.nome} · ${linha.sublinha}`;
  }
  return linha.nome;
}

interface ParadaClicada {
  parada: Parada;
  longitude: number;
  latitude: number;
}

interface MapLibreParadasLayerProps {
  paradas: Parada[];
  paradaDestacadaId: string | null;
  onParadaClicada?: (parada: Parada) => void;
}

export function MapLibreParadasLayer({
  paradas,
  paradaDestacadaId,
  onParadaClicada,
}: MapLibreParadasLayerProps) {
  const [paradaClicada, setParadaClicada] = useState<ParadaClicada | null>(null);

  return (
    <>
      {paradas.map((p) => {
        const destacada = p.idParada === paradaDestacadaId;
        const size = destacada ? 28 : 20;
        // marker.svg é 880×1255 — mantém proporção
        const height = Math.round((size / 880) * 1255);

        return (
          <Marker
            key={p.idParada}
            longitude={p.coordenadas[1]}
            latitude={p.coordenadas[0]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (onParadaClicada) {
                onParadaClicada(p);
              } else {
                setParadaClicada({
                  parada: p,
                  longitude: p.coordenadas[1],
                  latitude: p.coordenadas[0],
                });
              }
            }}
          >
            <img
              src={markerSvgUrl}
              width={size}
              height={height}
              alt=""
              aria-hidden="true"
              style={{
                cursor: 'pointer',
                filter: destacada ? 'drop-shadow(0 0 6px rgba(245,158,11,0.8))' : undefined,
              }}
            />
          </Marker>
        );
      })}

      {paradaClicada && (
        <Popup
          longitude={paradaClicada.longitude}
          latitude={paradaClicada.latitude}
          onClose={() => setParadaClicada(null)}
          closeButton
          closeOnClick={true}
          maxWidth="300px"
          offset={[0, -35] as [number, number]}
        >
          <ConteudoPopupParada
            parada={paradaClicada.parada}
            onClose={() => setParadaClicada(null)}
          />
        </Popup>
      )}
    </>
  );
}

interface ConteudoPopupParadaProps {
  parada: Parada;
  onClose: () => void;
}

export function ConteudoPopupParada({ parada, onClose }: ConteudoPopupParadaProps) {
  const analytics = useAnalytics();
  const { rotasService } = useRotasData();
  const { selecionarLinha } = useRotasSelection();
  const { suportado, isAlarmado, toggleNotificacao } = useNotificacaoContext();
  const { isFavorita, toggleFavorita } = useParadasFavoritas();
  const currentTime = useCurrentTime();

  const resolverLinhaPorNome = (nomeLinhaParada: string, idParadaAtual: string): Linha | null => {
    const porId = rotasService.getLinhaById(nomeLinhaParada);
    if (porId && isLineAvailableToday(porId.categoriaDia)) return porId;

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

    if (candidatasNaParada.length === 1) return candidatasNaParada[0];

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentTime é dependência reativa
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

  const linhasDisponiveis = useMemo(() => {
    const byNome = new Map<string, (typeof linhasResolvidas)[0]>();
    for (const entry of linhasResolvidas) {
      if (!entry.linha) continue;
      const key = entry.linha.nome;
      const existing = byNome.get(key);
      if (!existing) {
        byNome.set(key, entry);
        continue;
      }
      const thisMin = entry.minutosFaltantes;
      const prevMin = existing.minutosFaltantes;
      if (thisMin !== null && (prevMin === null || thisMin < prevMin)) {
        byNome.set(key, entry);
      }
    }
    return Array.from(byNome.values()).sort((a, b) => {
      if (a.minutosFaltantes === null && b.minutosFaltantes === null) return 0;
      if (a.minutosFaltantes === null) return 1;
      if (b.minutosFaltantes === null) return -1;
      return a.minutosFaltantes - b.minutosFaltantes;
    });
  }, [linhasResolvidas]);

  const totalLinhas = linhasDisponiveis.length;
  const headingId = `ml-popup-parada-${parada.idParada}`;
  const linhasLabelId = `ml-popup-parada-${parada.idParada}-linhas`;

  return (
    <section
      data-slot="container"
      aria-labelledby={headingId}
      className="flex w-full flex-col gap-3 p-3 pt-4 text-text-primary"
    >
      <header data-slot="header" className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white shadow-sm"
        >
          <MapPin size={20} />
        </span>
        <div className="min-w-0 flex-1">
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
        <button
          type="button"
          onClick={() => toggleFavorita(parada.idParada, parada.nome)}
          aria-label={
            isFavorita(parada.idParada)
              ? `Remover ${parada.nome} dos favoritos`
              : `Adicionar ${parada.nome} aos favoritos`
          }
          aria-pressed={isFavorita(parada.idParada)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Heart
            size={16}
            aria-hidden="true"
            className={
              isFavorita(parada.idParada)
                ? 'fill-brand-primary text-brand-primary'
                : 'text-text-secondary'
            }
          />
        </button>
      </header>

      <DisclaimerEstimativa />

      {totalLinhas > 0 ? (
        <section
          data-slot="lines-section"
          aria-labelledby={linhasLabelId}
          className="border-t border-card-border pt-3"
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
            {linhasDisponiveis.map(
              ({ nomeLinha, linha, minutosFaltantes, horarioChegada, minutosUltimoPassou }) => {
                const nomeExibicao = getNomeExibicao(linha, nomeLinha);
                const isAlarmAtivo =
                  linha && suportado ? isAlarmado(linha.idRota, parada.idParada) : false;
                const showBell = Boolean(linha) && suportado && minutosFaltantes !== null;

                return (
                  <li
                    key={nomeLinha}
                    className="rounded-(--shape-xs) border border-card-border bg-card p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="flex min-h-9 flex-1 items-center gap-1.5 truncate rounded px-1 py-0.5 text-left text-xs font-semibold leading-tight text-text-primary transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
                        title={nomeExibicao}
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
                        {linha && (
                          <span
                            className="mr-1 inline-block h-3.5 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: linha.corHex }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">{nomeExibicao}</span>
                      </button>

                      {showBell && linha && minutosFaltantes !== null ? (
                        <button
                          type="button"
                          onClick={() =>
                            toggleNotificacao(linha, parada, minutosFaltantes, horarioChegada)
                          }
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
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
                        >
                          {isAlarmAtivo ? (
                            <BellRing size={15} aria-hidden="true" />
                          ) : (
                            <Bell size={15} aria-hidden="true" />
                          )}
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      {linha ? (
                        <PrevisaoBadge linha={linha} idParada={parada.idParada} compacto />
                      ) : (
                        <span
                          className="rounded px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--neutral-bg)',
                            color: 'var(--neutral-text)',
                          }}
                        >
                          Sem previsão
                        </span>
                      )}
                      {minutosUltimoPassou !== null ? (
                        <p className="text-tiny text-text-secondary">
                          Último há {minutosUltimoPassou}min
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      ) : null}

      {parada.bhtransLinhas && parada.bhtransLinhas.length > 0 ? (
        <section data-slot="bhtrans-lines" className="border-t border-card-border pt-3">
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white shadow-sm"
            >
              <Bus size={14} />
            </span>
            <p className="text-xs font-semibold text-text-primary">Linhas BHTrans que param aqui</p>
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-label="Linhas BHTrans">
            {parada.bhtransLinhas.map((linha) => (
              <li key={linha}>
                <span className="rounded-full bg-brand-accent/20 px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
                  {linha}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {parada.descricao && parada.descricao !== parada.nome ? (
        <section data-slot="description" className="border-t border-card-border pt-3">
          <p className="text-xs italic text-text-secondary">{parada.descricao}</p>
        </section>
      ) : null}

      <MapLibrePlannerStopActions parada={parada} onClose={onClose} />
    </section>
  );
}

function MapLibrePlannerStopActions({ parada, onClose }: { parada: Parada; onClose: () => void }) {
  const { setOrigin, setDestination, openPlanner, openMenuFn, origin } = usePlannerStore();

  const handleUseAsOrigin = () => {
    setOrigin({ kind: 'stop', idParada: parada.idParada, nome: parada.nome });
    onClose();
  };

  const handleUseAsDestination = () => {
    setDestination({ kind: 'stop', idParada: parada.idParada, nome: parada.nome });
    onClose();
    if (origin) {
      openPlanner();
      openMenuFn?.();
    }
  };

  return (
    <fieldset data-slot="planner-actions" className="flex gap-2 border-t border-card-border pt-3">
      <legend className="sr-only">Usar esta parada no planejador</legend>
      <button
        type="button"
        onClick={handleUseAsOrigin}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-(--shape-sm) border border-card-border bg-background px-2 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Usar ${parada.nome} como origem no planejador`}
      >
        <Navigation size={14} aria-hidden="true" />
        Usar como origem
      </button>
      <button
        type="button"
        onClick={handleUseAsDestination}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-(--shape-sm) border border-card-border bg-background px-2 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Usar ${parada.nome} como destino no planejador`}
      >
        <MapPin size={14} aria-hidden="true" />
        Usar como destino
      </button>
    </fieldset>
  );
}
