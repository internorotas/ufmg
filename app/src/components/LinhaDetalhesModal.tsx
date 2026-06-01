/**
 * LinhaDetalhesModal - Modal de detalhes da linha
 * Design System - Interno Rotas UFMG
 */

import {
  AlertTriangle,
  Bell,
  BellRing,
  Bus,
  Clock,
  Map as MapIcon,
  MapPin,
  Route,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
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
import { FeedbackBanner } from './ui/FeedbackBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';

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

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords as [number, number][], { padding: [20, 20], maxZoom: 16, animate: false });
    }
  }, [map, coords]);
  return null;
}

function MiniRouteMap({ linha, paradas }: { linha: Linha; paradas: Parada[] }) {
  const { t } = useTranslation('line-details');
  const hasRoute = linha.coordenadasTrajeto && linha.coordenadasTrajeto.length > 1;

  if (!hasRoute) {
    return <FeedbackBanner message={t('miniMap.unavailable')} />;
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-card-border"
      role="img"
      aria-label="Mapa do itinerário da linha"
    >
      <MapContainer
        center={linha.coordenadasTrajeto[0]}
        zoom={15}
        className="h-52 w-full"
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds coords={linha.coordenadasTrajeto} />
        <Polyline
          positions={linha.coordenadasTrajeto}
          pathOptions={{ color: linha.corHex, weight: 3, opacity: 0.65 }}
        />
        {paradas.map((parada) => (
          <CircleMarker
            key={parada.idParada}
            center={parada.coordenadas}
            pathOptions={{ color: linha.corHex, fillColor: linha.corHex, fillOpacity: 0.9 }}
            radius={5}
          />
        ))}
      </MapContainer>
    </div>
  );
}

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
  const { t } = useTranslation('line-details');
  const { suportado, isAlarmado, toggleNotificacao } = useNotificacaoContext();
  const previsao = usePrevisaoChegada(linha, parada.idParada);

  const textoChegada = useMemo(() => {
    if (!previsao?.proximoOnibus) return null;
    const minutos = previsao.proximoOnibus.minutosFaltantes;
    if (minutos < 1) return t('itinerary.arrivesNow');
    if (minutos < 60) return `~${minutos} min · ${previsao.proximoOnibus.horarioChegada}`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m === 0
      ? `~${h}h · ${previsao.proximoOnibus.horarioChegada}`
      : `~${h}h ${m}min · ${previsao.proximoOnibus.horarioChegada}`;
  }, [previsao, t]);

  const textoHistorico = useMemo(() => {
    const segundos = previsao?.remoto?.historicalMedianDelaySeconds;
    if (segundos === null || segundos === undefined) {
      return null;
    }

    const minutos = Math.round(segundos / 60);
    const sinal = minutos > 0 ? '+' : '';
    return `histórico desta hora: ${sinal}${minutos} min`;
  }, [previsao?.remoto?.historicalMedianDelaySeconds]);

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
        aria-label={t('a11y.viewStopOnMap', { nome: parada.nome })}
        title={t('a11y.viewStopOnMap', { nome: parada.nome })}
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
            <p className="mt-0.5 text-xs text-text-secondary">{t('itinerary.originDestination')}</p>
          )}
          {!isFirst && !isLast && (
            <p className="mt-0.5 text-xs text-text-secondary">{t('itinerary.regularStop')}</p>
          )}

          {isFirst && (
            <span
              className="mt-1 inline-block px-0 text-xs font-semibold"
              style={{ color: linha.corHex }}
            >
              {t('itinerary.departure')}
            </span>
          )}
          {isLast && (
            <span
              className="mt-1 inline-block px-0 text-xs font-semibold"
              style={{ color: linha.corHex }}
            >
              {t('itinerary.arrival')}
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
                <span className="text-[11px] text-text-secondary">
                  {t('itinerary.lastPassed', { minutes: previsao.onibusAnterior.minutosQuePassou })}
                </span>
              )}
              {textoHistorico ? (
                <span className="text-[11px] text-text-secondary">{textoHistorico}</span>
              ) : null}
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
          aria-label={alarmado ? t('a11y.disableAlarm') : t('a11y.enableAlarm')}
          aria-pressed={alarmado}
          title={alarmado ? t('a11y.disableAlarm') : t('a11y.enableAlarm')}
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
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
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
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
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
  const { t } = useTranslation('line-details');
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

    return horariosDaLinha
      .map((horario, idx) => ({
        id: `${horario}-${idx}`,
        horario,
        minutos: timeToMinutes(horario),
      }))
      .sort((a, b) => a.minutos - b.minutos);
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
  const proximoHorario = proximos[0] ?? null;
  const horariosSeguintes = proximos.slice(1, 6);
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
      titleLabel={t('title.aria', { titleLabel })}
      description={t('title.description', { titleLabel })}
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
      <Tabs value={tabAtiva} onValueChange={(value) => handleTabChange(value as TabType)}>
        <TabsList
          variant="underline"
          className="mb-6"
          aria-label={t('title.description', { titleLabel })}
        >
          <TabsTrigger
            value="itinerario"
            className="min-h-11"
            style={{ '--line-color': linha.corHex } as React.CSSProperties}
          >
            <MapIcon size={20} aria-hidden="true" />
            {t('tabs.itinerary')}
          </TabsTrigger>
          <TabsTrigger
            value="horarios"
            className="min-h-11"
            style={{ '--line-color': linha.corHex } as React.CSSProperties}
          >
            <Clock size={20} aria-hidden="true" />
            {t('tabs.schedules')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itinerario" data-slot="itinerary-tab" className="relative">
          <section className="mb-4 space-y-2" aria-label="Mini-mapa do itinerário">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Route size={16} style={{ color: linha.corHex }} aria-hidden="true" />
              {t('miniMap.title')}
            </div>
            <MiniRouteMap linha={linha} paradas={paradasDoItinerario} />
          </section>

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
              <p>{t('itinerary.empty')}</p>
            </div>
          )}

          <div className={cn(infoCardVariants(), 'mt-6')}>
            <p className="text-text-secondary">{t('itinerary.tip')}</p>
          </div>
        </TabsContent>

        <TabsContent value="horarios" data-slot="schedules-tab" className="space-y-6">
          {/* Aviso quando a linha não está circulando */}
          {!isLineRunningToday && (
            <div
              data-slot="not-running-notice"
              className="rounded-lg border border-warning-border bg-warning-bg p-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="shrink-0 text-warning-text" />
                <p className="text-sm font-medium text-warning-text">
                  {t('lineNotRunning.warning', { text: statusLinha.texto })}
                </p>
              </div>
            </div>
          )}

          {isLineRunningToday && proximoHorario && (
            <section
              data-slot="next-schedule-highlight"
              className="rounded-xl border p-4"
              style={{ borderColor: hexToRgba(linha.corHex, 0.32) }}
            >
              <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                {t('schedules.nextHighlight')}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <span
                  className="font-bold text-[clamp(2.25rem,8vw,3rem)] leading-none tabular-nums"
                  style={{ color: linha.corHex }}
                >
                  {proximoHorario.horario}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: hexToRgba(linha.corHex, 0.12), color: linha.corHex }}
                >
                  {t('schedules.nextBadge')}
                </span>
              </div>
            </section>
          )}

          {isLineRunningToday && horariosSeguintes.length > 0 && (
            <section data-slot="next-schedules-list" aria-label={t('schedules.nextListTitle')}>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-primary">
                <Clock size={18} aria-hidden="true" style={{ color: linha.corHex }} />
                {t('schedules.nextListTitle')}
              </h3>
              <ul className="space-y-2">
                {horariosSeguintes.map(({ horario, id }) => (
                  <li key={`seguinte-${id}`}>
                    <button
                      type="button"
                      aria-label={t('a11y.nextTime', { horario })}
                      onClick={() => handleHorarioClick(horario)}
                      className="flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border px-3 py-2 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span className="text-sm text-text-secondary">
                        {t('schedules.departure')}
                      </span>
                      <span className="text-base font-semibold tabular-nums text-text-primary">
                        {horario}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isLineRunningToday && !proximoHorario && (
            <div className="rounded-xl border border-neutral-border bg-neutral-bg p-4 text-sm text-neutral-text">
              {t('schedules.noFuture')}
            </div>
          )}

          {/* Horários passados só aparecem quando a linha está vigente */}
          {isLineRunningToday && passados.length > 0 && (
            <div data-slot="passed-schedules">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                <Clock size={20} />
                {t('schedules.pastTitle', { count: passados.length })}
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {passados.map(({ horario, id }) => (
                  <button
                    type="button"
                    key={`passado-${id}`}
                    aria-label={t('a11y.pastTime', { horario })}
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
                {t('schedules.allTitle', { count: todos.length })}
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
            <p className="text-text-secondary">{t('schedules.summary', { count: todos.length })}</p>
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  );
}
