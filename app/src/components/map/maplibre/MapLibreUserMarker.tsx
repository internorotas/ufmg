import { Marker } from 'react-map-gl/maplibre';

interface MapLibreUserMarkerProps {
  localizacao: [number, number]; // [lat, lng]
  heading: number | null;
}

export function MapLibreUserMarker({ localizacao, heading }: MapLibreUserMarkerProps) {
  const [lat, lng] = localizacao;
  const rotacao = heading ?? 0;
  const mostrarCone = heading !== null;

  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <div style={{ position: 'relative', width: 40, height: 40, pointerEvents: 'none' }}>
        {mostrarCone && (
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: `translateX(-50%) rotate(${rotacao}deg)`,
              transformOrigin: 'center bottom',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderBottom: '36px solid var(--color-info-border)',
              opacity: 0.35,
              filter: 'blur(1px)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            background: 'var(--color-brand-primary)',
            border: '3px solid white',
            borderRadius: '50%',
            boxShadow: '0 2px 8px var(--color-backdrop)',
          }}
        />
      </div>
    </Marker>
  );
}
