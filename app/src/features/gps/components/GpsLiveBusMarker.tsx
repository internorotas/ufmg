import L from 'leaflet';
import { useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useGpsLiveTracking } from '@/features/gps/hooks/useGpsLiveTracking';
import type { Linha } from '@/types/data.types';

interface GpsLiveBusMarkerProps {
  linha: Linha;
}

function criarIconeOnibus(corHex: string, heading: number | null): L.DivIcon {
  const rotacao = heading !== null ? heading : 0;
  const mostrarSeta = heading !== null;

  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="position:relative;width:36px;height:36px;">
        ${
          mostrarSeta
            ? `<div style="
                position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                transform:rotate(${rotacao}deg);
              ">
                <div style="
                  width:0;height:0;
                  border-left:7px solid transparent;
                  border-right:7px solid transparent;
                  border-bottom:14px solid ${corHex}88;
                  transform:translateY(-14px);
                "></div>
              </div>`
            : ''
        }
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${corHex};display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);border:2px solid white;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

function minutosAtras(updatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff === 1) return 'há 1 min';
  return `há ${diff} min`;
}

export function GpsLiveBusMarker({ linha }: GpsLiveBusMarkerProps) {
  const position = useGpsLiveTracking(linha.idRota);
  const [isMinimized, setIsMinimized] = useState(false);

  const icon = useMemo(
    () => criarIconeOnibus(linha.corHex, position?.heading ?? null),
    [linha.corHex, position?.heading],
  );

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      {!isMinimized && (
        <Popup>
          <div style={{ minWidth: '160px', fontFamily: 'sans-serif', fontSize: '13px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: linha.corHex,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <strong style={{ color: linha.corHex }}>{linha.nome}</strong>
            </div>
            <div style={{ color: '#6b7280', lineHeight: '1.6' }}>
              <div>📡 Posição ao vivo</div>
              <div>
                Confiança:{' '}
                <strong style={{ color: position.confidence >= 0.7 ? '#16a34a' : '#d97706' }}>
                  {Math.round(position.confidence * 100)}%
                </strong>
              </div>
              <div>Atualizado: {minutosAtras(position.updatedAt)}</div>
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Minimizar
            </button>
          </div>
        </Popup>
      )}
    </Marker>
  );
}
