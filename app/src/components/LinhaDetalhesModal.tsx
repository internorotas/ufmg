/**
 * LinhaDetalhesModal - Modal de detalhes da linha
 * Design System - Interno Rotas UFMG
 */

import { AlertTriangle, Bell, BellRing, Bus, Clock, Map as MapIcon, MapPin } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';
import { useNotificacaoContext } from '../contexts/NotificacaoContext';
import { useAnalytics, useSessionTiming } from '../hooks/useAnalytics';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { usePrevisaoChegada } from '../hooks/usePrevisaoChegada';
import { getSaoPauloMinutesOfDay } from '../lib/time';
import {
  buscarParadasPorIds,
  cn,
  findScheduleIndex,
  hexToRgba,
  obterStatusLinha,
  timeToMinutes,
} from '../lib/utils';
import type { Linha, Parada } from '../types/data.types';
import { Modal } from './Modal';

/**
 * Variantes do container do título
 */
export const titleContainerVariants = tv({
  base: 'flex items-center gap-3',
});

/**
 * Variantes do ícone do título
 */
export const titleIconVariants = tv({
  base: ['flex size-12 shrink-0 items-center justify-center rounded-lg shadow-sm'],
});

/**
 * Variantes da tab
 */
export const tabVariants = tv({
  base: [
    'flex items-center gap-2 px-4 py-3 font-semibold transition-all duration-200 cursor-pointer',
    'hover:bg-card-hover/50 rounded-t-lg',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset',
  ],
  variants: {
    active: {
      true: 'border-b-2 text-text-primary',
      false: 'text-text-secondary hover:text-text-primary',
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
  base: 'group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left cursor-pointer transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
});

/**
 * Variantes do container do ícone de parada
 */
export const stopIconContainerVariants = tv({
  base: ['relative z-10 mt-0.5 shrink-0', 'flex size-6 items-center justify-center rounded-full'],
});

/**
 * Variantes do card de horário
 */
export const scheduleCardVariants = tv({
  base: 'rounded-lg border bg-card p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  variants: {
    status: {
      upcoming:
        'border-2 hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer focus-visible:ring-brand-primary',
      passed:
        'border border-card-border bg-card opacity-50 cursor-default focus-visible:ring-card-border',
    },
  },
  defaultVariants: {
    status: 'upcoming',
  },
});

/**
 * Variantes do card de informação
 */
export const infoCardVariants = tv({
  base: ['rounded-lg border p-4 text-center text-sm', 'border-card-border bg-card'],
});

export interface LinhaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  todasParadas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

type TabType = 'itinerario' | 'horarios';

/**
 * Linha do itinerário memoizada: cada parada só recalcula quando sua previsão muda.
 * Substitui o IIFE inline que executava calcularPrevisaoChegada sem cache a cada render.
 */
interface ParadaItinerarioRowProps {
  parada: Parada;
  linha: Linha;
  isFirst: boolean;
  isLast: boolean;
  onClick: (parada: Parada) => void;
}

const ParadaItinerarioRow = React.memo(function ParadaItinerarioRow({
  parada,
  linha,
  isFirst,
  isLast,
  onClick,
}: ParadaItinerarioRowProps) {
  const { suportado, isAlarmado, toggleNotificacao } = useNotificacaoContext();
  const previsao = usePrevisaoChegada(linha, parada.idParada);

  const textoChegada = useMemo(() => {
    if (!previsao?.proximoOnibus) return null;
    const minutos = previsao.proximoOnibus.minutosFaltantes;
    if (minutos < 1) return 'Chega agora';
    if (minutos < 60) return `~${minutos} min · ${previsao.proximoOnibus.horarioChegada}`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m === 0
      ? `~${h}h · ${previsao.proximoOnibus.horarioChegada}`
      : `~${h}h ${m}min · ${previsao.proximoOnibus.horarioChegada}`;
  }, [previsao]);

  const badgeStyle = useMemo(() => {
    if (!previsao?.proximoOnibus) return null;
    const minutos = previsao.proximoOnibus.minutosFaltantes;
    const isUrgent = minutos <= 15;
    const isNow = minutos < 1;
    return {
      backgroundColor: isNow || isUrgent ? 'var(--success-bg)' : 'var(--warning-bg)',
      color: isNow || isUrgent ? 'var(--success-text)' : 'var(--warning-text)',
    };
  }, [previsao]);

  const bellVisible = suportado && !!previsao?.proximoOnibus;
  const minutosFaltantes = previsao?.proximoOnibus?.minutosFaltantes ?? 0;
  const horarioChegada = previsao?.proximoOnibus?.horarioChegada ?? '';
  const alarmado = isAlarmado(linha.idRota, parada.idParada);

  return (
    <div className="flex w-full items-start">
      <button
        type="button"
        onClick={() => onClick(parada)}
        className={cn(stopButtonVariants(), 'mx-0 flex-1')}
        aria-label={`Ver localização da parada ${parada.nome} no mapa`}
        title={`Ver localização da parada ${parada.nome} no mapa`}
      >
        <div
          className={stopIconContainerVariants()}
          style={{ backgroundColor: hexToRgba(linha.corHex, 0.12) }}
        >
          <MapPin size={18} style={{ color: linha.corHex }} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="text-[15px] font-semibold leading-snug text-text-primary group-hover:underline">
            {parada.nome}
          </h4>

          {(isFirst || isLast) && (
            <p className="mt-0.5 text-xs text-text-secondary">Ponto de Origem/Destino</p>
          )}
          {!isFirst && !isLast && (
            <p className="mt-0.5 text-xs text-text-secondary">Parada Regular</p>
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

          {textoChegada && badgeStyle && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-1.5 flex flex-col gap-0.5"
            >
              <span
                className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={badgeStyle}
              >
                {textoChegada}
              </span>
              {previsao?.onibusAnterior && (
                <span className="text-[10px] text-text-tertiary">
                  Último passou há {previsao.onibusAnterior.minutosQuePassou} min
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Botão de alarme — mínimo 44px de touch target */}
      {bellVisible && (
        <button
          type="button"
          onClick={() => toggleNotificacao(linha, parada, minutosFaltantes, horarioChegada)}
          className={cn(
            'mt-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-90',
            alarmado ? 'bg-brand-accent/30 hover:bg-brand-accent/40' : 'hover:bg-card-hover',
          )}
          aria-label={alarmado ? 'Cancelar alarme de chegada' : 'Ativar alarme de chegada'}
          aria-pressed={alarmado}
          title={alarmado ? 'Cancelar alarme de chegada' : 'Avisar quando o ônibus chegar'}
        >
          {alarmado ? (
            <BellRing size={20} className="text-brand-accent" aria-hidden="true" />
          ) : (
            <Bell size={20} className="text-text-tertiary" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
});

function getAllLineSchedules(linha: Linha): string[] {
  const horariosRaw = linha.horarios as unknown;

  if (Array.isArray(horariosRaw)) {
    return horariosRaw
      .filter((h): h is string => typeof h === 'string' && h.includes(':'))
      .map((h) => ({ h, m: timeToMinutes(h) }))
      .sort((a, b) => a.m - b.m)
      .map((item) => item.h);
  }

  if (!horariosRaw || typeof horariosRaw !== 'object') {
    return [];
  }

  const horariosPorDia = horariosRaw as Partial<
    Record<'diasUteis' | 'sabados' | 'domingos', string[]>
  >;

  return Array.from(
    new Set([
      ...(horariosPorDia.diasUteis ?? []),
      ...(horariosPorDia.sabados ?? []),
      ...(horariosPorDia.domingos ?? []),
    ]),
  )
    .filter((h) => h.includes(':'))
    .map((h) => ({ h, m: timeToMinutes(h) }))
    .sort((a, b) => a.m - b.m)
    .map((item) => item.h);
}

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
  const [tabAtiva, setTabAtiva] = useState<TabType>('itinerario');
  const { trackEvent, trackPageView } = useAnalytics();

  useSessionTiming(`Linha: ${linha.nome}`, 'engagement');

  useEffect(() => {
    if (!isOpen) return;
    trackPageView(`/modal/linha-detalhes/${linha.idRota}`);
  }, [isOpen, linha.idRota, trackPageView]);

  const now = useCurrentTime();
  const currentMinutes = getSaoPauloMinutesOfDay(now);

  const paradasDoItinerario = useMemo(() => {
    return buscarParadasPorIds(linha.itinerarioParadasIds, todasParadas);
  }, [linha.itinerarioParadasIds, todasParadas]);

  const baseHorarios = useMemo(() => {
    const horariosDaLinha = getAllLineSchedules(linha);

    return horariosDaLinha.map((horario, idx) => ({
      id: `${horario}-${idx}`,
      horario,
      minutos: timeToMinutes(horario),
    }));
  }, [linha]);

  const schedulesInMinutes = useMemo(() => baseHorarios.map((h) => h.minutos), [baseHorarios]);
  const statusLinha = obterStatusLinha(linha, now, schedulesInMinutes);
  const isLineRunningToday = statusLinha.id !== 'NAO_CIRCULA_HOJE';

  const splitIndex = useMemo(() => {
    return findScheduleIndex(baseHorarios, currentMinutes - 1, (h) => h.minutos);
  }, [baseHorarios, currentMinutes]);

  const passados = baseHorarios.slice(0, splitIndex);
  const proximos = baseHorarios.slice(splitIndex);
  const todos = baseHorarios;
  const titleLabel = linha.sublinha ? `${linha.nome} - ${linha.sublinha}` : linha.nome;

  const handleTabChange = (tab: TabType) => {
    trackEvent({
      category: 'navigation',
      action: 'view_details_tab',
      label: `${tab === 'itinerario' ? 'Itinerário' : 'Todos os Horários'} - ${linha.nome}`,
    });
    setTabAtiva(tab);
  };

  const handleHorarioClick = (horario: string) => {
    trackEvent({
      category: 'engagement',
      action: 'select_specific_schedule',
      label: `${horario} - ${linha.nome}`,
    });
  };

  const handleParadaClick = useCallback(
    (parada: Parada) => {
      trackEvent({
        category: 'map_interaction',
        action: 'click_itinerary_stop',
        label: `${parada.nome} - ${linha.nome}`,
      });
      onParadaClick(parada);
      onClose();
    },
    [trackEvent, onParadaClick, onClose, linha.nome],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleLabel={`Detalhes da linha ${titleLabel}`}
      description={`Consulte o itinerário, horários e ações disponíveis para a linha ${titleLabel}.`}
      title={
        <div className={titleContainerVariants()}>
          <div
            className={cn(titleIconVariants(), 'border')}
            style={{
              backgroundColor: hexToRgba(linha.corHex, 0.12),
              borderColor: hexToRgba(linha.corHex, 0.24),
            }}
          >
            <Bus size={24} className="drop-shadow-sm" style={{ color: linha.corHex }} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold leading-tight text-text-primary">
              {linha.nome}
            </h2>
            {linha.sublinha && (
              <p className="mt-0.5 truncate text-xs text-text-secondary">{linha.sublinha}</p>
            )}
          </div>
        </div>
      }
      size="2xl"
    >
      <div
        data-slot="tabs"
        role="tablist"
        aria-label="Opções de visualização"
        className="mb-6 flex gap-2 border-b border-card-border"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tabAtiva === 'itinerario'}
          aria-controls="panel-itinerario"
          id="tab-itinerario"
          onClick={() => handleTabChange('itinerario')}
          aria-label="Ver itinerário da linha"
          title="Ver itinerário da linha"
          tabIndex={tabAtiva === 'itinerario' ? 0 : -1}
          className={tabVariants({ active: tabAtiva === 'itinerario' })}
          style={tabAtiva === 'itinerario' ? { borderColor: linha.corHex } : {}}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              handleTabChange('horarios');
            }
          }}
        >
          <MapIcon size={20} aria-hidden="true" />
          Itinerário
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tabAtiva === 'horarios'}
          aria-controls="panel-horarios"
          id="tab-horarios"
          onClick={() => handleTabChange('horarios')}
          aria-label="Ver todos os horários da linha"
          title="Ver todos os horários da linha"
          tabIndex={tabAtiva === 'horarios' ? 0 : -1}
          className={tabVariants({ active: tabAtiva === 'horarios' })}
          style={tabAtiva === 'horarios' ? { borderColor: linha.corHex } : {}}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              handleTabChange('itinerario');
            }
          }}
        >
          <Clock size={20} aria-hidden="true" />
          Todos os Horários
        </button>
      </div>

      {tabAtiva === 'itinerario' ? (
        <div
          role="tabpanel"
          id="panel-itinerario"
          aria-labelledby="tab-itinerario"
          data-slot="itinerary-tab"
          className="relative animate-in fade-in-0 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
        >
          {paradasDoItinerario.length > 0 ? (
            <div className="relative">
              {paradasDoItinerario.map((parada, idx) => {
                const isLast = idx === paradasDoItinerario.length - 1;
                return (
                  <div key={parada.idParada} className="relative flex">
                    {!isLast && (
                      <div
                        className="absolute left-5 top-7 h-full w-0.5"
                        style={{
                          backgroundColor: hexToRgba(linha.corHex, 0.25),
                          backgroundImage: `repeating-linear-gradient(0deg, ${hexToRgba(linha.corHex, 0.25)}, ${hexToRgba(linha.corHex, 0.25)} 6px, transparent 6px, transparent 12px)`,
                        }}
                      />
                    )}
                    <ParadaItinerarioRow
                      parada={parada}
                      linha={linha}
                      isFirst={idx === 0}
                      isLast={isLast}
                      onClick={handleParadaClick}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-text-secondary">
              <p>Nenhuma parada encontrada para este itinerário.</p>
            </div>
          )}

          <div className={cn(infoCardVariants(), 'mt-6')}>
            <p className="text-text-secondary">💡 Clique em uma parada para visualizá-la no mapa</p>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-horarios"
          aria-labelledby="tab-horarios"
          data-slot="schedules-tab"
          className="space-y-6 animate-in fade-in-0 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
        >
          {/* Aviso quando a linha não está circulando */}
          {!isLineRunningToday && (
            <div
              data-slot="not-running-notice"
              className="rounded-lg border border-warning-border bg-warning-bg p-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="shrink-0 text-warning-text" />
                <p className="text-sm font-medium text-warning-text">{statusLinha.texto}</p>
              </div>
            </div>
          )}

          {/* Próximos Horários - só mostra quando a linha está circulando */}
          {isLineRunningToday && proximos.length > 0 && (
            <div data-slot="upcoming-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
                <Clock size={20} aria-hidden="true" style={{ color: linha.corHex }} />
                Próximos Horários ({proximos.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {proximos.map(({ horario, id }, index) => (
                  <button
                    type="button"
                    key={`proximo-${id}`}
                    aria-label={`${index === 0 ? 'Próximo horário' : 'Horário futuro'} às ${horario}`}
                    onClick={() => handleHorarioClick(horario)}
                    className={scheduleCardVariants({ status: 'upcoming' })}
                    style={{
                      borderColor: index === 0 ? linha.corHex : hexToRgba(linha.corHex, 0.22),
                    }}
                  >
                    <p className="text-xl font-bold text-text-primary">{horario}</p>
                    {index === 0 ? (
                      <p className="mt-1 text-xs font-medium" style={{ color: linha.corHex }}>
                        Próxima saída
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium text-text-secondary">Saída futura</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Horários passados só aparecem quando a linha está vigente */}
          {isLineRunningToday && passados.length > 0 && (
            <div data-slot="passed-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                <Clock size={20} />
                Horários Passados ({passados.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {passados.map(({ horario, id }) => (
                  <button
                    type="button"
                    key={`passado-${id}`}
                    aria-label={`Horário passado às ${horario}`}
                    onClick={() => handleHorarioClick(horario)}
                    className={scheduleCardVariants({ status: 'passed' })}
                  >
                    <p className="text-lg font-semibold text-text-secondary">{horario}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linha não vigente hoje: exibe somente os horários da própria linha */}
          {!isLineRunningToday && (
            <div data-slot="all-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                <Clock size={20} />
                Todos os Horários ({todos.length})
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {todos.map(({ horario, id }) => (
                  <div key={`horario-${id}`} className={scheduleCardVariants({ status: 'passed' })}>
                    <p className="text-lg font-semibold text-text-secondary">{horario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div data-slot="summary" className={infoCardVariants()}>
            <p className="text-text-secondary">Total de {todos.length} horários</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
