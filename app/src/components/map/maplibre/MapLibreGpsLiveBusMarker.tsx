import { AlertTriangle, Bus, Clock, Radar, Target } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { Popup, useMap } from 'react-map-gl/maplibre';
import { useBusPosition } from '@/features/gps/hooks/useBusPosition';
import {
  type LiveLocationPayload,
  useGpsLiveTracking,
} from '@/features/gps/hooks/useGpsLiveTracking';
import { numLinha } from '@/features/gps/lib/markerUtils';
import { calcularPosicaoTeorica } from '@/lib/busPosition';
import { hexToRgba } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';

let _gpsPulseStyleInjected = false;
function ensureGpsPulseStyle(pulseColor: string, pulseColor0: string) {
  if (_gpsPulseStyleInjected) return;
  _gpsPulseStyleInjected = true;
  const style = document.createElement('style');
  style.id = 'gps-pulse-style';
  style.textContent = `@keyframes gps-pulse{0%{box-shadow:0 0 0 0 ${pulseColor}}70%{box-shadow:0 0 0 8px ${pulseColor0}}100%{box-shadow:0 0 0 0 ${pulseColor0}}}`;
  document.head.appendChild(style);
}

interface MapLibreGpsLiveBusMarkerProps {
  linha: Linha;
  todasParadas: Parada[];
}

function tempoDecorrido(updatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff === 1) return 'há 1 min';
  return `há ${diff} min`;
}

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{3,6}$/;

function criarIconeHtml(
  corHex: string,
  heading: number | null,
  isLive: boolean,
  isStale: boolean,
): string {
  const cor = HEX_COLOR_RE.test(corHex) ? corHex : '#6b7280';
  const rotacao = heading ?? 0;
  const mostrarSeta = heading !== null;
  const bg = isLive ? cor : hexToRgba(cor, 0.7);
  const pulseColor = hexToRgba(cor, 0.5);
  const pulseColor0 = hexToRgba(cor, 0);
  const showPulse = isLive && !isStale;

  if (showPulse) ensureGpsPulseStyle(pulseColor, pulseColor0);

  return `
    <div style="position:relative;width:36px;height:36px;">
      ${
        mostrarSeta
          ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${rotacao}deg);">
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid ${hexToRgba(cor, 0.8)};transform:translateY(-14px);"></div>
             </div>`
          : ''
      }
      <div style="position:absolute;inset:4px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid white;${showPulse ? `animation:gps-pulse 1.8s ease-in-out infinite;` : 'box-shadow:0 2px 6px rgba(0,0,0,0.25);'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
      ${isLive && !isStale ? `<div style="position:absolute;bottom:-2px;right:-4px;background:#ef4444;color:white;font-size:6px;font-weight:800;font-family:sans-serif;letter-spacing:0.04em;padding:1px 3px;border-radius:var(--shape-xs);border:1px solid white;line-height:1.4;">AO VIVO</div>` : ''}
      ${isStale ? `<div style="position:absolute;bottom:-2px;right:-4px;background:var(--color-warning-solid);color:white;font-size:6px;font-weight:800;font-family:sans-serif;letter-spacing:0.04em;padding:1px 3px;border-radius:var(--shape-xs);border:1px solid white;line-height:1.4;">ATR.</div>` : ''}
    </div>
  `;
}

interface PopupState {
  lng: number;
  lat: number;
}

export function MapLibreGpsLiveBusMarker({ linha, todasParadas }: MapLibreGpsLiveBusMarkerProps) {
  const { current: mapInstance } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHeadingRef = useRef<number | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);

  const { position: livePos, isStale, hasConnectionError } = useGpsLiveTracking(linha.idRota);
  const theoreticalPos = useBusPosition(linha, todasParadas);

  // Posição inicial — calculada uma vez na montagem
  const [initialPos, setInitialPos] = useState<[number, number] | null>(() => {
    const pos = calcularPosicaoTeorica(linha, todasParadas, new Date());
    return pos ? [pos.lat, pos.lng] : null;
  });

  // Se não há posição teórica mas chega GPS ao vivo, usa essa posição para montar o marcador
  useEffect(() => {
    if (!initialPos && livePos) {
      setInitialPos([livePos.lat, livePos.lng]);
    }
  }, [livePos, initialPos]);

  // Cria o marcador imperativo quando o mapa e a posição inicial estiverem prontos
  useEffect(() => {
    if (!initialPos) return;
    const map = mapInstance?.getMap();
    if (!map) return;

    const el = document.createElement('div');
    el.style.width = '36px';
    el.style.height = '36px';
    el.style.cursor = 'pointer';
    el.innerHTML = criarIconeHtml(linha.corHex, null, false, false);

    el.addEventListener('click', () => {
      const m = markerRef.current;
      if (!m) return;
      const lngLat = m.getLngLat();
      setPopupState({ lng: lngLat.lng, lat: lngLat.lat });
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' });
    marker.setLngLat([initialPos[1], initialPos[0]]);
    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
      prevHeadingRef.current = null;
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [mapInstance, initialPos, linha.corHex]);

  // Atualiza posição via GPS ao vivo (WebSocket), refletindo stale no ícone
  useEffect(() => {
    if (!livePos || !markerRef.current) return;
    markerRef.current.setLngLat([livePos.lng, livePos.lat]);
    markerRef.current.getElement().innerHTML = criarIconeHtml(
      linha.corHex,
      livePos.heading,
      true,
      isStale,
    );
  }, [livePos, linha.corHex, isStale]);

  // Mantém popup sincronizado com a posição GPS ao vivo
  useEffect(() => {
    if (!livePos || !popupState) return;
    setPopupState({ lng: livePos.lng, lat: livePos.lat });
    // popupState intencionalmente omitido — queremos reagir ao livePos, não criar loop
  }, [livePos, popupState]);

  // Posição teórica atualizada a cada 5s quando não há GPS ao vivo
  useEffect(() => {
    if (livePos) return;

    const tick = () => {
      const pos = calcularPosicaoTeorica(linha, todasParadas, new Date());
      if (pos && markerRef.current) {
        markerRef.current.setLngLat([pos.lng, pos.lat]);
        const diff = Math.abs((pos.heading ?? 0) - (prevHeadingRef.current ?? 0));
        if (diff > 15 || prevHeadingRef.current === null) {
          prevHeadingRef.current = pos.heading;
          markerRef.current.getElement().innerHTML = criarIconeHtml(
            linha.corHex,
            pos.heading,
            false,
            false,
          );
        }
      }
    };

    intervalRef.current = setInterval(tick, 5_000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [linha, todasParadas, livePos]);

  if (!popupState) return null;

  const isLive = livePos !== null;
  const num = numLinha(linha);

  return (
    <Popup
      longitude={popupState.lng}
      latitude={popupState.lat}
      onClose={() => setPopupState(null)}
      closeButton
      closeOnClick={false}
      maxWidth="220px"
      offset={22}
    >
      <BusPopup
        linha={linha}
        num={num}
        isLive={isLive}
        isStale={isStale}
        hasConnectionError={hasConnectionError}
        livePos={livePos}
        theoreticalPos={theoreticalPos}
      />
    </Popup>
  );
}

interface BusPopupProps {
  linha: Linha;
  num: string;
  isLive: boolean;
  isStale: boolean;
  hasConnectionError: boolean;
  livePos: LiveLocationPayload | null;
  theoreticalPos: ReturnType<typeof useBusPosition>;
}

function BusPopup({
  linha,
  num,
  isLive,
  isStale,
  hasConnectionError,
  livePos,
  theoreticalPos,
}: BusPopupProps) {
  return (
    <div className="flex flex-col gap-2.5 font-sans text-sm">
      <div className="flex items-center gap-2">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
          style={{ background: linha.corHex }}
        >
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-text-primary leading-tight">{linha.nome}</p>
          {linha.sublinha && (
            <p className="truncate text-micro text-text-secondary leading-tight">
              {linha.sublinha}
            </p>
          )}
        </div>
        {isLive && !isStale && (
          <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-micro font-extrabold tracking-wide text-white">
            AO VIVO
          </span>
        )}
        {isStale && (
          <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-micro font-extrabold tracking-wide text-white">
            ATRASADO
          </span>
        )}
      </div>
      <div className="border-t border-card-border" />

      {hasConnectionError && (
        <div className="flex items-center gap-1.5 rounded bg-warning-bg px-2 py-1.5 text-xs text-warning-text">
          <AlertTriangle size={12} aria-hidden="true" className="shrink-0" />
          <span>Sem conexão com o servidor</span>
        </div>
      )}

      {isStale && livePos && (
        <div className="flex items-center gap-1.5 rounded bg-warning-bg px-2 py-1.5 text-xs text-warning-text">
          <AlertTriangle size={12} aria-hidden="true" className="shrink-0" />
          <span>Posição desatualizada, última há {tempoDecorrido(livePos.updatedAt)}</span>
        </div>
      )}

      {isLive && livePos && !isStale ? (
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Radar size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span className="font-semibold text-text-primary">Posição em tempo real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span>
              Confiança:{' '}
              <strong
                className={livePos.confidence >= 0.7 ? 'text-success-text' : 'text-warning-text'}
              >
                {Math.round(livePos.confidence * 100)}%
              </strong>
            </span>
          </div>
          <p className="mt-0.5 text-tiny text-text-tertiary">
            Atualizado {tempoDecorrido(livePos.updatedAt)}
          </p>
        </div>
      ) : (
        !isStale &&
        theoreticalPos && (
          <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
              <span className="font-semibold text-text-primary">Estimativa de posição</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bus size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
              <span>
                Saída <strong className="text-text-primary">{theoreticalPos.horarioSaida}</strong>
                {' · '}
                {Math.round(theoreticalPos.elapsedMin)} min em rota
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
