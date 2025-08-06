import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-ant-path";

import { LatLngExpression } from "leaflet";
interface AntPathProps {
  coordinates: LatLngExpression[];
  options: L.PathOptions & { delay?: number; use?: string | boolean };
}

export function AntPathComponent({ coordinates, options }: AntPathProps) {
  const map = useMap();

  useEffect(() => {
    const antPath = new L.Polyline.AntPath(coordinates, options);
    map.addLayer(antPath);
    map.fitBounds(antPath.getBounds(), { padding: [50, 50] });

    return () => {
      map.removeLayer(antPath);
    };
  }, [coordinates, options, map]);

  return null;
}
