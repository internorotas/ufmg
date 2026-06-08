import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { calcularPosicaoTeorica } from '@/lib/busPosition';
import { hexToRgba } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { useBusPosition } from '../hooks/useBusPosition';
import { type LiveLocationPayload, useGpsLiveTracking } from '../hooks/useGpsLiveTracking';
import { numLinha } from '../lib/markerUtils';

interface GpsLiveBusMarkerProps {
  linha: Linha;
  todasParadas: Parada[];
}

function criarIcone(corHex: string, heading: number | null, isLive: boolean): L.DivIcon {
  const rotacao = heading ?? 0;
  const mostrarSeta = heading !== null;
  const bg = isLive ? corHex : hexToRgba(corHex, 0.7);
  const pulseColor = hexToRgba(corHex, 0.5);
  const pulseColor0 = hexToRgba(corHex, 0);

  return L.divIcon({
    className: 'bus-marker-live',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
    html: `
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
    `,
  });
}

function tempoDecorrido(updatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff === 1) return 'há 1 min';
  return `há ${diff} min`;
}

export function GpsLiveBusMarker({ linha, todasParadas }: GpsLiveBusMarkerProps) {
  const livePos = useGpsLiveTracking(linha.idRota);
  const theoreticalPos = useBusPosition(linha, todasParadas);
  const markerRef = useRef<L.Marker>(null);
  const prevHeadingRef = useRef<number | null>(null);

  // Posição inicial — calculada uma vez na montagem; se não houver horário ativo,
  // livePos pode ainda fornecer posição quando um usuário estiver compartilhando
  const [initialPos, setInitialPos] = useState<[number, number] | null>(() => {
    const pos = calcularPosicaoTeorica(linha, todasParadas, new Date());
    return pos ? [pos.lat, pos.lng] : null;
  });
  const [initialIcon] = useState<L.DivIcon>(() => criarIcone(linha.corHex, null, false));

  // Se não há posição teórica mas chega GPS ao vivo, monta o marcador com essa posição
  useEffect(() => {
    if (!initialPos && livePos) {
      setInitialPos([livePos.lat, livePos.lng]);
    }
  }, [livePos, initialPos]);

  // Posição em tempo real via WebSocket
  useEffect(() => {
    if (!livePos || !markerRef.current) return;
    markerRef.current.setLatLng([livePos.lat, livePos.lng]);
    markerRef.current.setIcon(criarIcone(linha.corHex, livePos.heading, true));
  }, [livePos, linha.corHex]);

  // RAF: atualiza posição teórica a cada frame — segue a geometria exata do trajeto
  useEffect(() => {
    if (livePos) return;

    let rafId: number;
    const animate = () => {
      const pos = calcularPosicaoTeorica(linha, todasParadas, new Date());
      if (pos && markerRef.current) {
        markerRef.current.setLatLng([pos.lat, pos.lng]);
        const diff = Math.abs((pos.heading ?? 0) - (prevHeadingRef.current ?? 0));
        if (diff > 15 || prevHeadingRef.current === null) {
          prevHeadingRef.current = pos.heading;
          markerRef.current.setIcon(criarIcone(linha.corHex, pos.heading, false));
        }
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [linha, todasParadas, livePos]);

  if (!initialPos) return null;

  const isLive = livePos !== null;
  const num = numLinha(linha);

  return (
    <Marker ref={markerRef} position={initialPos} icon={initialIcon}>
      <Popup minWidth={200}>
        <BusPopup
          linha={linha}
          num={num}
          isLive={isLive}
          livePos={livePos}
          theoreticalPos={theoreticalPos}
        />
      </Popup>
    </Marker>
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
            <span aria-hidden="true">📡</span>
            <span className="font-semibold text-text-primary">Posição em tempo real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">🎯</span>
            <span>
              Confiança:{' '}
              <strong
                className={livePos.confidence >= 0.7 ? 'text-success-text' : 'text-warning-text'}
              >
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
              <span aria-hidden="true">🕐</span>
              <span className="font-semibold text-text-primary">Estimativa de posição</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span aria-hidden="true">🚌</span>
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
