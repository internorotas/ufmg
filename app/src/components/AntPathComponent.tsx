import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-ant-path";

import { LatLngExpression } from "leaflet";

interface AntPathOptions {
  delay?: number;
  dashArray?: number[];
  weight?: number;
  color?: string;
  pulseColor?: string;
  paused?: boolean;
  reverse?: boolean;
  hardwareAccelerated?: boolean;
}

interface AntPathProps {
  coordinates: LatLngExpression[];
  options: AntPathOptions;
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
