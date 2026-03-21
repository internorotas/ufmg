import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-ant-path';

import type { LatLngExpression } from 'leaflet';

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
  const antPathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    // Se não houver coordenadas, não faz nada
    if (!coordinates || coordinates.length === 0) return;

    // Remove camada anterior se existir (para evitar duplicação em re-renders rápidos)
    if (antPathRef.current) {
      map.removeLayer(antPathRef.current);
    }

    // Cria nova instância
    const antPath = new L.Polyline.AntPath(coordinates, options);

    antPathRef.current = antPath;
    map.addLayer(antPath);

    try {
      map.fitBounds(antPath.getBounds(), { padding: [50, 50] });
    } catch (e) {
      console.warn('Could not fit bounds for AntPath', e);
    }

    // Cleanup function: remove a layer quando o componente desmonta ou muda
    return () => {
      if (antPathRef.current) {
        map.removeLayer(antPathRef.current);
        antPathRef.current = null;
      }
    };
  }, [coordinates, options, map]); // Recria apenas se coordenadas ou opções mudarem

  return null;
}
