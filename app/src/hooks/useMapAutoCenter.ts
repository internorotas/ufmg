/**
 * useMapAutoCenter - Gerencia o auto-centralização do mapa na localização do usuário
 *
 * Encapsula a lógica de refs e efeitos que controlam quando o mapa deve
 * centralizar automaticamente após a localização ser obtida.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { MapaRef } from '../contexts/RotasContext';

interface UseMapAutoCenterParams {
  mapaRef: React.RefObject<MapaRef | null>;
  localizacao: [number, number] | null;
  carregandoLocalizacao: boolean;
  mostrarModalLonge: boolean;
}

interface UseMapAutoCenterReturn {
  /** Registra uma requisição de auto-center. Chamar antes de iniciar o rastreamento. */
  solicitarAutoCenter: () => void;
  /** Marca o auto-center como já consumido, evitando centralização repetida. */
  consumirAutoCenter: () => void;
}

export function useMapAutoCenter({
  mapaRef,
  localizacao,
  carregandoLocalizacao,
  mostrarModalLonge,
}: UseMapAutoCenterParams): UseMapAutoCenterReturn {
  const solicitadoRef = useRef(false);
  const consumidoRef = useRef(false);

  // Reseta "consumido" quando o carregamento reinicia, permitindo novo auto-center
  useEffect(() => {
    if (carregandoLocalizacao) {
      consumidoRef.current = false;
    }
  }, [carregandoLocalizacao]);

  // Centraliza o mapa quando as condições estiverem satisfeitas
  useEffect(() => {
    if (!solicitadoRef.current) return;
    if (!localizacao || carregandoLocalizacao || mostrarModalLonge) return;
    if (consumidoRef.current) return;

    mapaRef.current?.centralizarCoordenada(localizacao, 17);
    consumidoRef.current = true;
  }, [localizacao, carregandoLocalizacao, mostrarModalLonge, mapaRef]);

  const solicitarAutoCenter = useCallback(() => {
    solicitadoRef.current = true;
    consumidoRef.current = false;
  }, []);

  const consumirAutoCenter = useCallback(() => {
    consumidoRef.current = true;
  }, []);

  return { solicitarAutoCenter, consumirAutoCenter };
}
