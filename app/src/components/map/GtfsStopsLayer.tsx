import { useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { fetchGtfsStops, type GtfsStop } from '@/services/api/gtfsApi';

interface GtfsStopsLayerProps {
  routeId: string;
  visible?: boolean;
}

export function GtfsStopsLayer({ routeId, visible = true }: GtfsStopsLayerProps) {
  const [stops, setStops] = useState<GtfsStop[]>([]);

  useEffect(() => {
    if (!visible) return;

    const loadStops = async () => {
      try {
        const data = await fetchGtfsStops(routeId);
        setStops(data);
      } catch (_err) {}
    };

    loadStops();
  }, [routeId, visible]);

  if (!visible || stops.length === 0) return null;

  return (
    <>
      {stops.map((stop) => (
        <CircleMarker
          key={stop.stop_id}
          center={[stop.stop_lat, stop.stop_lon]}
          radius={6}
          fillColor="#3b82f6"
          fillOpacity={0.8}
          color="#1d4ed8"
          weight={2}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{stop.stop_name}</p>
              <p className="text-gray-500">ID: {stop.stop_id}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
