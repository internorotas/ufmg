import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { Linha, Parada } from '@/types/data.types';
import { useAllBusPositions } from '../hooks/useAllBusPositions';

interface AllLinesBusMarkersProps {
  linhas: Linha[];
  todasParadas: Parada[];
  linhaExcluida?: string | null;
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

function numLinha(linha: Linha): string {
  if (linha.linha) return String(linha.linha);
  const m = linha.idRota.match(/^\d+/);
  return m ? m[0] : linha.idRota.slice(0, 3).toUpperCase();
}

function criarIconeMini(corHex: string): L.DivIcon {
  const bg = hexToRgba(corHex, 0.7);
  return L.divIcon({
    className: 'bus-marker-t',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `
      <div style="position:relative;width:28px;height:28px;">
        <div style="position:absolute;inset:3px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

export function AllLinesBusMarkers({
  linhas,
  todasParadas,
  linhaExcluida,
}: AllLinesBusMarkersProps) {
  const posicoes = useAllBusPositions(linhas, todasParadas);
  const linhaMap = useMemo(() => new Map(linhas.map((l) => [l.idRota, l])), [linhas]);

  return (
    <>
      {Array.from(posicoes.entries())
        .filter(([idRota]) => idRota !== linhaExcluida)
        .map(([idRota, pos]) => {
          const linha = linhaMap.get(idRota);
          if (!linha) return null;

          const icon = criarIconeMini(linha.corHex);
          const num = numLinha(linha);

          return (
            <Marker key={idRota} position={[pos.lat, pos.lng]} icon={icon}>
              <Popup minWidth={190}>
                <div
                  style={{
                    fontFamily: 'system-ui,sans-serif',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  {/* Cabeçalho */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        background: linha.corHex,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        flexShrink: 0,
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
                  </div>

                  <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '8px' }} />

                  {/* Info */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      color: '#6b7280',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🕐</span>
                      <span style={{ fontWeight: '600', color: '#374151' }}>
                        Estimativa de posição
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🚌</span>
                      <span>
                        Saída <strong style={{ color: '#111' }}>{pos.horarioSaida}</strong>
                        {' · '}
                        {Math.round(pos.elapsedMin)} min em rota
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
}
