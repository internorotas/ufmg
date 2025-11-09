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

/**
 * Renderiza uma polilinha animada (ant-path) em um mapa Leaflet.
 *
 * @param {object} props - As propriedades do componente.
 * @param {LatLngExpression[]} props.coordinates - Um array de coordenadas de latitude e longitude que definem o caminho.
 * @param {AntPathOptions} props.options - Um objeto com opções para customizar a aparência e o comportamento do ant-path.
 * @returns {null} Este componente não renderiza nenhum elemento visível.
 */
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
