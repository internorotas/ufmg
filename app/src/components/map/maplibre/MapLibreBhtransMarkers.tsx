import { Bus } from 'lucide-react';
import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { getBhtransLineConfig } from '@/features/gps/config/bhtransLines';
import { useBhtransLivePositions } from '@/features/gps/hooks/useBhtransLivePositions';
import { hexToRgba } from '@/lib/utils';

function BhtransMarkerIcon({ color }: { color: string }) {
  // MOVE (#b3ff19) é claro demais para ícone branco — usa escuro para legibilidade.
  const iconColor = color === '#b3ff19' ? '#1a1a1a' : 'white';
  return (
    <div style={{ position: 'relative', width: 30, height: 30, cursor: 'pointer' }}>
      <div
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={iconColor}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Ônibus BHTrans</title>
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
        </svg>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffS < 10) return 'agora mesmo';
  if (diffS < 60) return `há ${diffS}s`;
  return `há ${Math.floor(diffS / 60)} min`;
}

interface BhtransCardProps {
  linhaId: string;
  nome: string;
  vehicleId: string;
  recordedAt: string;
  fetchedAt: string | null;
}

function BhtransCard({ linhaId, nome, vehicleId, recordedAt, fetchedAt }: BhtransCardProps) {
  const cfg = getBhtransLineConfig(linhaId);
  const iconBg = hexToRgba(cfg.color, 0.15);
  const iconBorder = hexToRgba(cfg.color, 0.3);
  const labelBg = hexToRgba(cfg.color, 0.15);
  const labelColor = cfg.color === '#b3ff19' ? '#5a6600' : cfg.color;

  return (
    <div className="flex flex-col gap-2 p-1 font-sans" style={{ minWidth: 200 }}>
      {/* Cabeçalho: ícone + nome */}
      <div className="flex items-start gap-2">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
          style={{ backgroundColor: iconBg, borderColor: iconBorder }}
        >
          <Bus className="size-5" style={{ color: cfg.color }} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-extrabold"
              style={{ backgroundColor: labelBg, color: labelColor }}
            >
              {cfg.label}
            </span>
            <span className="text-sm font-bold text-text-primary">{cfg.nome}</span>
            {nome && <span className="text-xs text-text-secondary">— {nome}</span>}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px bg-border" />

      {/* Infos do veículo */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-text-tertiary">Veículo</span>
          <span className="font-medium text-text-primary">{vehicleId}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-text-tertiary">Posição GPS</span>
          <span className="font-medium text-text-primary">{timeAgo(recordedAt)}</span>
        </div>
        {fetchedAt && (
          <div className="flex justify-between gap-2">
            <span className="text-text-tertiary">Atualizado</span>
            <span className="font-medium text-text-primary">{timeAgo(fetchedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MapLibreBhtransMarkers() {
  const { positions, fetchedAt } = useBhtransLivePositions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (positions.length === 0) return null;

  const selected = positions.find((p) => p.vehicleId === selectedId) ?? null;

  return (
    <>
      {positions.map((pos) => {
        const { color } = getBhtransLineConfig(pos.linhaId);
        return (
          <Marker
            key={pos.vehicleId}
            longitude={pos.lng}
            latitude={pos.lat}
            anchor="center"
            onClick={(e: { originalEvent: Event }) => {
              e.originalEvent.stopPropagation();
              setSelectedId(pos.vehicleId);
            }}
          >
            <BhtransMarkerIcon color={color} />
          </Marker>
        );
      })}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          onClose={() => setSelectedId(null)}
          closeButton
          closeOnClick={false}
          maxWidth="240px"
        >
          <BhtransCard
            linhaId={selected.linhaId}
            nome={selected.nome}
            vehicleId={selected.vehicleId}
            recordedAt={selected.recordedAt}
            fetchedAt={fetchedAt}
          />
        </Popup>
      )}
    </>
  );
}
