import { Bus, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { useRotasSelection } from '@/contexts/RotasContext';
import type { PosicaoTeorica } from '@/lib/busPosition';
import { hexToRgba } from '@/lib/utils';
import type { Linha, Parada } from '@/types/data.types';
import { useAllBusPositions } from '@/features/gps/hooks/useAllBusPositions';
import { numLinha } from '@/features/gps/lib/markerUtils';

interface MapLibreAllBusMarkersProps {
  linhas: Linha[];
  todasParadas: Parada[];
  linhaNumeroExcluido?: number | null;
}

interface BusPopupState {
  linha: Linha;
  pos: PosicaoTeorica;
  lng: number;
  lat: number;
}

function BusIconMini({ corHex }: { corHex: string }) {
  const bg = hexToRgba(corHex, 0.7);
  return (
    <div style={{ position: 'relative', width: 28, height: 28, cursor: 'pointer' }}>
      <div
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: '50%',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
        </svg>
      </div>
    </div>
  );
}

function BusMarkerPopup({ linha, pos }: { linha: Linha; pos: PosicaoTeorica }) {
  const num = numLinha(linha);
  const { selecionarLinha } = useRotasSelection();

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
          <Clock size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
          <span className="font-semibold text-text-primary">Estimativa de posição</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bus size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
          <span>
            Saída <strong className="text-text-primary">{pos.horarioSaida}</strong>
            {' · '}
            {Math.round(pos.elapsedMin)} min em rota
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => selecionarLinha(linha)}
        className="mt-1 w-full rounded bg-brand-primary px-2 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        Ver esta linha
      </button>
    </div>
  );
}

export function MapLibreAllBusMarkers({
  linhas,
  todasParadas,
  linhaNumeroExcluido,
}: MapLibreAllBusMarkersProps) {
  const posicoes = useAllBusPositions(linhas, todasParadas);
  const [selected, setSelected] = useState<BusPopupState | null>(null);
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
              longitude={pos.lng}
              latitude={pos.lat}
              anchor="center"
              onClick={() => setSelected({ linha, pos, lng: pos.lng, lat: pos.lat })}
            >
              <BusIconMini corHex={linha.corHex} />
            </Marker>
          );
        })}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          onClose={() => setSelected(null)}
          closeButton
          closeOnClick={false}
          maxWidth="220px"
        >
          <BusMarkerPopup linha={selected.linha} pos={selected.pos} />
        </Popup>
      )}
    </>
  );
}
