import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-ant-path';

import type { LatLngExpression } from 'leaflet';

// Opções do ant-path (definidas inline para evitar conflitos de tipo com o plugin)
// Os tipos formais estão documentados em src/types/leaflet-ant-path.d.ts
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
  /** Configuração do ant-path (cor, peso, delay de animação, etc.) */
  options?: AntPathOptions;
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
  const antPathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;

    if (antPathRef.current) {
      map.removeLayer(antPathRef.current);
    }

    // O cast duplo é necessário pois leaflet-ant-path não fornece tipos TypeScript.
    // A definição de tipo está em src/types/leaflet-ant-path.d.ts para documentação.
    const AntPathConstructor = (
      L.Polyline as unknown as {
        AntPath: new (latlngs: LatLngExpression[], options?: AntPathOptions) => L.Polyline;
      }
    ).AntPath;
    const antPath = new AntPathConstructor(coordinates, options);

    antPathRef.current = antPath;
    map.addLayer(antPath);

    try {
      map.fitBounds(antPath.getBounds(), { padding: [50, 50] });
    } catch (_e) {}

    return () => {
      if (antPathRef.current) {
        map.removeLayer(antPathRef.current);
        antPathRef.current = null;
      }
    };
  }, [coordinates, options, map]);

  return null;
}
