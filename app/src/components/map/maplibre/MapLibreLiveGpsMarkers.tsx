import { Radar } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { useAllLiveGpsPositionsState } from '@/features/gps/hooks/useAllLiveGpsPositions';
import { numLinha } from '@/features/gps/lib/markerUtils';
import { getContrastingTextColor, hexToRgba } from '@/lib/utils';
import type { Linha } from '@/types/data.types';

interface MapLibreLiveGpsMarkersProps {
  linhas: Linha[];
  /** Linha travada pela sessão GPS do próprio usuário — já tem seu próprio marcador dedicado */
  linhaExcluidaId?: string | null;
}

function tempoDecorrido(updatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
  if (diff < 1) return 'agora mesmo';
  if (diff === 1) return 'há 1 min';
  return `há ${diff} min`;
}

function LiveIcon({
  corHex,
  delayed,
  stale,
}: {
  corHex: string;
  delayed: boolean;
  stale: boolean;
}) {
  const bg = hexToRgba(corHex, 0.9);
  return (
    <div style={{ position: 'relative', width: 32, height: 32, cursor: 'pointer' }}>
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
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Ônibus ao vivo</title>
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
        </svg>
      </div>
      <div
        data-testid="gps-live-batch-badge"
        style={{
          position: 'absolute',
          bottom: -3,
          right: -8,
          background: delayed || stale ? 'var(--color-warning-solid)' : 'var(--color-danger-solid)',
          color: 'white',
          fontSize: 8,
          fontWeight: 800,
          padding: '1px 3px',
          borderRadius: 3,
          border: '1px solid white',
          lineHeight: 1.2,
        }}
      >
        {stale ? 'POSIÇÃO ANTIGA' : delayed ? 'COM ATRASO' : 'AO VIVO'}
      </div>
    </div>
  );
}

// Marcadores em lote de todas as linhas com GPS colaborativo ativo — cliente B
// vê o ônibus de qualquer linha sem precisar selecioná-la. Não duplica com
// MapLibreGpsLiveBusMarker (linha travada da própria sessão) nem com
// MapLibreAllBusMarkers (estimativa teórica): cada linha aparece em exatamente
// um desses três, nunca em mais de um ao mesmo tempo.
export const MapLibreLiveGpsMarkers = memo(function MapLibreLiveGpsMarkers({
  linhas,
  linhaExcluidaId,
}: MapLibreLiveGpsMarkersProps) {
  const { positions } = useAllLiveGpsPositionsState();
  const linhaMap = useMemo(() => new Map(linhas.map((l) => [l.idRota, l])), [linhas]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = Array.from(positions.values()).filter(
    (position) => position.linhaId !== linhaExcluidaId && linhaMap.has(position.linhaId),
  );

  const selected = selectedId ? positions.get(selectedId) : null;
  const selectedLinha = selected ? linhaMap.get(selected.linhaId) : null;
  const selectedIsStale = selected
    ? Date.now() - new Date(selected.updatedAt).getTime() > 60_000
    : false;

  return (
    <>
      {entries.map((pos) => {
        const linha = linhaMap.get(pos.linhaId);
        if (!linha) return null;
        const stale = Date.now() - new Date(pos.updatedAt).getTime() > 60_000;
        return (
          <Marker
            key={pos.vehicleKey}
            longitude={pos.lng}
            latitude={pos.lat}
            anchor="center"
            onClick={(e: { originalEvent: Event }) => {
              e.originalEvent.stopPropagation();
              setSelectedId(pos.vehicleKey);
            }}
          >
            <LiveIcon corHex={linha.corHex} delayed={pos.delayed} stale={stale} />
          </Marker>
        );
      })}

      {selected && selectedLinha && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          onClose={() => setSelectedId(null)}
          closeButton
          closeOnClick
          maxWidth="220px"
        >
          <div className="flex flex-col gap-2 p-3 font-sans text-sm">
            <div className="flex items-center gap-2">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
                style={{
                  background: selectedLinha.corHex,
                  color: getContrastingTextColor(selectedLinha.corHex),
                }}
              >
                {numLinha(selectedLinha)}
              </span>
              <p className="truncate font-bold text-text-primary leading-tight">
                {selectedLinha.nome}
              </p>
            </div>
            <div className="border-t border-card-border" />
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Radar size={14} aria-hidden="true" className="shrink-0" />
              <span>
                {selectedIsStale
                  ? 'Posição antiga'
                  : selected.delayed
                    ? 'Posição com atraso'
                    : 'Posição ao vivo'}
                , atualizado {tempoDecorrido(selected.updatedAt)}
              </span>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
});
