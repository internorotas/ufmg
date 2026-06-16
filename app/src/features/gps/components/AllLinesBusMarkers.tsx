import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useRotasSelection } from '@/contexts/RotasContext';
import type { PosicaoTeorica } from '@/lib/busPosition';
import { hexToRgba } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { useAllBusPositions } from '../hooks/useAllBusPositions';
import { numLinha } from '../lib/markerUtils';

interface AllLinesBusMarkersProps {
  linhas: Linha[];
  todasParadas: Parada[];
  linhaNumeroExcluido?: number | null;
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

interface BusMarkerPopupProps {
  linha: Linha;
  pos: PosicaoTeorica;
}

function BusMarkerPopup({ linha, pos }: BusMarkerPopupProps) {
  const num = numLinha(linha);
  const { limparSelecao } = useRotasSelection();

  return (
    <div className="flex flex-col gap-2 font-sans text-sm">
      <div className="flex items-center gap-2">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
          style={{ background: linha.corHex }}
        >
          {num}
        </span>
        <span className="min-w-0 flex-1 truncate font-bold text-text-primary">{linha.nome}</span>
      </div>

      <div className="border-t border-card-border" />

      <div className="flex flex-col gap-1 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">🕐</span>
          <span className="font-semibold text-text-primary">Estimativa de posição</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">🚌</span>
          <span>
            Saída <strong className="text-text-primary">{pos.horarioSaida}</strong>
            {' · '}
            {Math.round(pos.elapsedMin)} min em rota
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={limparSelecao}
        className="mt-1 w-full rounded border border-card-border bg-background px-2 py-1.5 text-center text-xs font-semibold text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        Remover seleção
      </button>
    </div>
  );
}

export function AllLinesBusMarkers({
  linhas,
  todasParadas,
  linhaNumeroExcluido,
}: AllLinesBusMarkersProps) {
  const posicoes = useAllBusPositions(linhas, todasParadas);
  const linhaMap = useMemo(() => new Map(linhas.map((l) => [l.idRota, l])), [linhas]);

  return (
    <>
      {Array.from(posicoes.entries())
        .filter(([idRota]) => {
          const l = linhaMap.get(idRota);
          return l?.linha !== linhaNumeroExcluido;
        })
        .map(([idRota, pos]) => {
          const linha = linhaMap.get(idRota);
          if (!linha) return null;

          return (
            <Marker
              key={idRota}
              position={[pos.lat, pos.lng]}
              icon={criarIconeMini(linha.corHex)}
              zIndexOffset={500}
            >
              <Popup minWidth={190}>
                <BusMarkerPopup linha={linha} pos={pos} />
              </Popup>
            </Marker>
          );
        })}
    </>
  );
}
