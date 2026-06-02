import { Polyline } from 'react-leaflet';
import type { Linha } from '@/types/data.types';

interface GpsRouteOverlayProps {
  linha: Linha;
}

export function GpsRouteOverlay({ linha }: GpsRouteOverlayProps) {
  const coords = linha.coordenadasTrajeto;
  if (!coords || coords.length < 2) return null;

  return (
    <Polyline
      positions={coords}
      color={linha.corHex}
      weight={5}
      opacity={0.3}
      dashArray="10 6"
    />
  );
}
