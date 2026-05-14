/**
 * Context API - Facade para gerenciamento de estado global de rotas.
 *
 * Mantém compatibilidade com a API pública usada pelo app, enquanto
 * separa internamente estado de dados (cache remoto/fallback) e
 * estado de seleção de UI (linha/parada/mapa).
 */

import type { ReactNode } from 'react';
import {
  type RotasDataContextData,
  RotasDataProvider,
  useRotasData as useRotasDataState,
} from '@/contexts/RotasDataContext';
import {
  type MapaRef,
  type RotasSelectionContextData,
  RotasSelectionProvider,
  useRotasSelectionState,
} from '@/contexts/RotasSelectionContext';
import type { Linha, Parada } from '@/types/data.types';

export type { MapaRef };

interface RotasProviderProps {
  children: ReactNode;
  onLinhaSelect?: (linha: Linha) => void;
  onParadaSelect?: (parada: Parada) => void;
}

export function RotasProvider({ children, onLinhaSelect, onParadaSelect }: RotasProviderProps) {
  return (
    <RotasDataProvider>
      <RotasSelectionProvider onLinhaSelect={onLinhaSelect} onParadaSelect={onParadaSelect}>
        {children}
      </RotasSelectionProvider>
    </RotasDataProvider>
  );
}

export type RotasContextData = RotasDataContextData & RotasSelectionContextData;

export function useRotas(): RotasContextData {
  const data = useRotasDataState();
  const selection = useRotasSelectionState();

  return {
    ...data,
    ...selection,
  };
}

export function useRotasData() {
  return useRotasDataState();
}

export function useRotasSelection() {
  const { linhaSelecionada, paradaSelecionada, selecionarLinha, selecionarParada, limparSelecao } =
    useRotasSelectionState();

  return {
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    limparSelecao,
  };
}

export function useMapaRef() {
  const { mapaRef } = useRotasSelectionState();
  return mapaRef;
}
