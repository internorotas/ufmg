import { Polyline } from 'react-leaflet';
import type { Linha } from '@/types/data.types';

interface GpsRouteOverlayProps {
  linha: Linha;
}

export function GpsRouteOverlay({ linha }: GpsRouteOverlayProps) {
  const coords = linha.coordenadasTrajeto;
  if (!coords || coords.length < 2) return null;

  return (
    <>
      {/* Halo de contorno para destacar o traçado ativo */}
      <Polyline positions={coords} color="#ffffff" weight={10} opacity={0.4} />
      <Polyline positions={coords} color={linha.corHex} weight={7} opacity={0.9} />
    </>
  );
}
