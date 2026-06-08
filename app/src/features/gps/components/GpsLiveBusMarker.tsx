import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useBusPosition } from '@/features/gps/hooks/useBusPosition';
import { useGpsLiveTracking } from '@/features/gps/hooks/useGpsLiveTracking';
import type { Linha, Parada } from '@/types/data.types';

interface GpsLiveBusMarkerProps {
  linha: Linha;
  todasParadas: Parada[];
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// Extrai o número principal da linha (ex: "3" de idRota "3BHTEC" se linha.linha for null)
function numLinha(linha: Linha): string {
  if (linha.linha) return String(linha.linha);
  const m = linha.idRota.match(/^\d+/);
  return m ? m[0] : linha.idRota.slice(0, 3).toUpperCase();
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
            ? `
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${rotacao}deg);">
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid ${hexToRgba(corHex, 0.8)};transform:translateY(-14px);"></div>
          </div>`
            : ''
        }
        <div style="position:absolute;inset:4px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid white;${isLive ? 'animation:gps-pulse 1.8s ease-in-out infinite;' : 'box-shadow:0 2px 6px rgba(0,0,0,0.25);'}">
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

  // Inject CSS transition once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('bus-marker-css')) return;
    const s = document.createElement('style');
    s.id = 'bus-marker-css';
    s.textContent = [
      '.bus-marker-live { transition: transform 1s linear; }',
      '.bus-marker-t    { transition: transform 5s linear; }',
    ].join('\n');
    document.head.appendChild(s);
  }, []);

  const isLive = livePos !== null;
  const pos = livePos ?? theoreticalPos;

  const icon = useMemo(
    () => criarIcone(linha.corHex, pos?.heading ?? null, isLive),
    [linha.corHex, pos?.heading, isLive],
  );

  if (!pos) return null;

  const num = numLinha(linha);

  return (
    <Marker position={[pos.lat, pos.lng]} icon={icon}>
      <Popup minWidth={200}>
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                background: linha.corHex,
                color: 'white',
                fontSize: '13px',
                fontWeight: '800',
                borderRadius: '5px',
                padding: '2px 7px',
                flexShrink: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {num}
            </span>
            <span
              style={{
                fontWeight: '700',
                color: '#111',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {linha.nome}
            </span>
            {isLive && (
              <span
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: '800',
                  borderRadius: '3px',
                  padding: '2px 5px',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}
              >
                AO VIVO
              </span>
            )}
          </div>

          {/* Separador */}
          <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '10px' }} />

          {/* Corpo */}
          {isLive ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                color: '#374151',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>📡</span>
                <span style={{ fontWeight: '600' }}>Posição em tempo real</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🎯</span>
                <span>
                  Confiança:{' '}
                  <strong style={{ color: livePos.confidence >= 0.7 ? '#16a34a' : '#d97706' }}>
                    {Math.round(livePos.confidence * 100)}%
                  </strong>
                </span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                Atualizado {tempoDecorrido(livePos.updatedAt)}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                color: '#374151',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🕐</span>
                <span style={{ fontWeight: '600' }}>Estimativa de posição</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                <span style={{ fontSize: '14px' }}>🚌</span>
                <span>
                  Saída <strong style={{ color: '#111' }}>{theoreticalPos!.horarioSaida}</strong>
                  {' · '}
                  {Math.round(theoreticalPos!.elapsedMin)} min em rota
                </span>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
