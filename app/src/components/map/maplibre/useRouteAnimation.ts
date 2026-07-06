import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

// Sequência do efeito "formiga marchando" — do exemplo oficial do MapLibre
const DASH_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

/**
 * Anima o `line-dasharray` de um layer MapLibre para criar efeito de formiga marchando.
 * Deve ser chamado dentro de um componente dentro de <Map>.
 *
 * @param layerId ID do layer que será animado
 * @param active  Se false, a animação não roda (evita RAF desnecessário)
 */
export function useRouteAnimation(layerId: string, active: boolean): void {
  const { current: mapInstance } = useMap();

  useEffect(() => {
    if (!active || !mapInstance) return;

    const map = mapInstance.getMap();
    if (!map) return;

    let step = 0;

    const id = setInterval(() => {
      step = (step + 1) % DASH_SEQUENCE.length;
      try {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'line-dasharray', DASH_SEQUENCE[step]);
        }
      } catch {
        // layer ainda não foi adicionado ao estilo — ignora silenciosamente
      }
    }, 80);

    return () => clearInterval(id);
  }, [mapInstance, layerId, active]);
}
