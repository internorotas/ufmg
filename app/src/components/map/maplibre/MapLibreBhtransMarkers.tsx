import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { useBhtransLivePositions } from '@/features/gps/hooks/useBhtransLivePositions';

function BhtransIcon() {
  return (
    <div
      style={{
        position: 'relative',
        width: 26,
        height: 26,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: '50%',
          background: '#f97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="white"
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

export function MapLibreBhtransMarkers() {
  const positions = useBhtransLivePositions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (positions.length === 0) return null;

  const selected = positions.find((p) => p.vehicleId === selectedId) ?? null;

  return (
    <>
      {positions.map((pos) => (
        <Marker
          key={pos.vehicleId}
          longitude={pos.lng}
          latitude={pos.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedId(pos.vehicleId);
          }}
        >
          <BhtransIcon />
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          onClose={() => setSelectedId(null)}
          closeButton
          closeOnClick={false}
          maxWidth="180px"
        >
          <div className="flex flex-col gap-1 p-2 font-sans text-sm">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                BHTrans
              </span>
              <span className="font-bold text-text-primary">Linha {selected.linhaId}</span>
            </div>
            <p className="text-[11px] text-text-tertiary">{timeAgo(selected.recordedAt)}</p>
          </div>
        </Popup>
      )}
    </>
  );
}
