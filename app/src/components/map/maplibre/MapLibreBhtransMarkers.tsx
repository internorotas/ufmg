import { Bus, Clock, Radio, WifiOff } from 'lucide-react';
import { memo, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getBhtransLineConfig } from '@/features/gps/config/bhtransLines';
import { useBhtransLivePositions } from '@/features/gps/hooks/useBhtransLivePositions';

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

export interface BhtransCardProps {
  linhaId: string;
  nome: string;
  vehicleId: string;
  recordedAt: string;
  fetchedAt: string | null;
}

export function BhtransCard({ linhaId, nome, vehicleId, recordedAt, fetchedAt }: BhtransCardProps) {
  const cfg = getBhtransLineConfig(linhaId);
  // MOVE (#b3ff19) é claro demais para texto branco — escurece o badge.
  const badgeBg = cfg.color === '#b3ff19' ? '#5a6600' : cfg.color;

  return (
    <div className="flex flex-col font-sans text-sm">
      {/* Barra de título: light=escuro sobre branco, dark=cinza médio sobre card escuro.
          pr-9 reserva espaço para o botão × do MapLibre (24px + 6px gap). */}
      <div className="bg-brand-dark dark:bg-neutral-bg px-3 pr-9 py-1.5">
        <span className="text-xs font-bold text-text-inverse dark:text-text-primary">
          BHTRANS (AO VIVO)
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {/* Badge com número da linha + nome da rota */}
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
            style={{ background: badgeBg }}
          >
            {cfg.nome}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-text-primary leading-tight">{nome || cfg.nome}</p>
            {nome && (
              <p className="truncate text-micro text-text-secondary leading-tight">
                {cfg.label} (BHTRANS)
              </p>
            )}
          </div>
        </div>

        {/* Infos do veículo */}
        <div className="flex flex-col gap-1 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Radio size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span className="font-semibold text-text-primary">Posição ao vivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bus size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span>
              Veículo <strong className="text-text-primary">{vehicleId}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" className="shrink-0 text-text-secondary" />
            <span>
              GPS <strong className="text-text-primary">{timeAgo(recordedAt)}</strong>
              {fetchedAt && (
                <>
                  {' '}
                  · atualizado <strong className="text-text-primary">{timeAgo(fetchedAt)}</strong>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MapLibreBhtransMarkers = memo(function MapLibreBhtransMarkers() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { status, positions, fetchedAt } = useBhtransLivePositions(isAuthenticated);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (positions.length === 0) {
    if (status === 'schema_not_ready' || status === 'unavailable') {
      return (
        <div
          role="status"
          className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-neutral-bg/90 px-2.5 py-1 text-micro text-text-secondary shadow"
        >
          <WifiOff size={12} aria-hidden="true" />
          <span>Ônibus BHTrans indisponíveis no momento</span>
        </div>
      );
    }
    return null;
  }

  const selected = positions.find((p) => p.vehicleId === selectedId) ?? null;

  return (
    <>
      {status === 'stale' && (
        <div
          role="status"
          className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-neutral-bg/90 px-2.5 py-1 text-micro text-text-secondary shadow"
        >
          <WifiOff size={12} aria-hidden="true" />
          <span>Posições BHTrans desatualizadas</span>
        </div>
      )}
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
          closeOnClick
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
});
