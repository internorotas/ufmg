import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { fetchGtfsShape, type GtfsShape } from '@/services/api/gtfsApi';

interface GtfsRouteLayerProps {
  routeId: string;
  color?: string;
  weight?: number;
  opacity?: number;
  visible?: boolean;
}

export function GtfsRouteLayer({
  routeId,
  color = '#000000',
  weight = 4,
  opacity = 0.8,
  visible = true,
}: GtfsRouteLayerProps) {
  const [shapes, setShapes] = useState<GtfsShape[]>([]);

  useEffect(() => {
    if (!visible) return;

    const loadShapes = async () => {
      try {
        const data = await fetchGtfsShape(routeId);
        setShapes(data);
      } catch (_err) {}
    };

    loadShapes();
  }, [routeId, visible]);

  if (!visible || shapes.length === 0) return null;

  // Convert shapes to Leaflet polyline positions
  const positions: [number, number][] = shapes
    .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
    .map((s) => [s.shape_pt_lat, s.shape_pt_lon]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
      }}
    />
  );
}
