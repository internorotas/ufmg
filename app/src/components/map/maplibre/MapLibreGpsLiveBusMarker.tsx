import maplibregl from 'maplibre-gl';
import { Bus, Clock, Radar, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Popup, useMap } from 'react-map-gl/maplibre';
import { calcularPosicaoTeorica } from '@/lib/busPosition';
import { hexToRgba } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { useBusPosition } from '@/features/gps/hooks/useBusPosition';
import { type LiveLocationPayload, useGpsLiveTracking } from '@/features/gps/hooks/useGpsLiveTracking';
import { numLinha } from '@/features/gps/lib/markerUtils';

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

function criarIconeHtml(corHex: string, heading: number | null, isLive: boolean): string {
  const rotacao = heading ?? 0;
  const mostrarSeta = heading !== null;
  const bg = isLive ? corHex : hexToRgba(corHex, 0.7);
  const pulseColor = hexToRgba(corHex, 0.5);
  const pulseColor0 = hexToRgba(corHex, 0);

  return `
    ${isLive ? `<style>@keyframes gps-pulse{0%{box-shadow:0 0 0 0 ${pulseColor}}70%{box-shadow:0 0 0 8px ${pulseColor0}}100%{box-shadow:0 0 0 0 ${pulseColor0}}}</style>` : ''}
    <div style="position:relative;width:36px;height:36px;">
      ${
        mostrarSeta
          ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${rotacao}deg);">
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid ${hexToRgba(corHex, 0.8)};transform:translateY(-14px);"></div>
             </div>`
          : ''
      }
      <div style="position:absolute;inset:4px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid white;${isLive ? `animation:gps-pulse 1.8s ease-in-out infinite;` : 'box-shadow:0 2px 6px rgba(0,0,0,0.25);'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
      ${isLive ? `<div style="position:absolute;bottom:-2px;right:-4px;background:#ef4444;color:white;font-size:6px;font-weight:800;font-family:sans-serif;letter-spacing:0.04em;padding:1px 3px;border-radius:3px;border:1px solid white;line-height:1.4;">AO VIVO</div>` : ''}
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
  const rafRef = useRef<number>(0);
  const prevHeadingRef = useRef<number | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);

  const livePos = useGpsLiveTracking(linha.idRota);
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
    el.innerHTML = criarIconeHtml(linha.corHex, null, false);

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
      cancelAnimationFrame(rafRef.current);
    };
  }, [mapInstance, linha.idRota, initialPos]);

  // Atualiza posição via GPS ao vivo (WebSocket)
  useEffect(() => {
    if (!livePos || !markerRef.current) return;
    markerRef.current.setLngLat([livePos.lng, livePos.lat]);
    markerRef.current.getElement().innerHTML = criarIconeHtml(linha.corHex, livePos.heading, true);
  }, [livePos, linha.corHex]);

  // RAF: posição teórica animada quando não há GPS ao vivo
  useEffect(() => {
    if (livePos) return;

    const animate = () => {
      const pos = calcularPosicaoTeorica(linha, todasParadas, new Date());
      if (pos && markerRef.current) {
        markerRef.current.setLngLat([pos.lng, pos.lat]);
        const diff = Math.abs((pos.heading ?? 0) - (prevHeadingRef.current ?? 0));
        if (diff > 15 || prevHeadingRef.current === null) {
          prevHeadingRef.current = pos.heading;
          markerRef.current.getElement().innerHTML = criarIconeHtml(linha.corHex, pos.heading, false);
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
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
  livePos: LiveLocationPayload | null;
  theoreticalPos: ReturnType<typeof useBusPosition>;
}

function BusPopup({ linha, num, isLive, livePos, theoreticalPos }: BusPopupProps) {
  return (
    <div className="flex flex-col gap-2.5 font-sans text-sm">
      <div className="flex items-center gap-2">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
          style={{ background: linha.corHex }}
        >
          {num}
        </span>
        <span className="min-w-0 flex-1 truncate font-bold text-text-primary">{linha.nome}</span>
        {isLive && (
          <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white">
            AO VIVO
          </span>
        )}
      </div>
      <div className="border-t border-card-border" />
      {isLive && livePos ? (
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Radar size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span className="font-semibold text-text-primary">Posição em tempo real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span>
              Confiança:{' '}
              <strong className={livePos.confidence >= 0.7 ? 'text-success-text' : 'text-warning-text'}>
                {Math.round(livePos.confidence * 100)}%
              </strong>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-text-tertiary">
            Atualizado {tempoDecorrido(livePos.updatedAt)}
          </p>
        </div>
      ) : (
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
