import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Linha, Parada } from '@/types/data.types';

/**
 * Interface que define a referência do Mapa para centralização.
 */
export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
  centralizarCoordenada: (coords: [number, number], zoom?: number) => void;
}

export interface RotasSelectionContextData {
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
  selecionarLinha: (linha: Linha) => void;
  selecionarParada: (parada: Parada) => void;
  limparSelecao: () => void;
  mapaRef: React.RefObject<MapaRef | null>;
}

interface RotasSelectionProviderProps {
  children: ReactNode;
  onLinhaSelect?: (linha: Linha) => void;
  onParadaSelect?: (parada: Parada) => void;
}

const RotasSelectionContext = createContext<RotasSelectionContextData | undefined>(undefined);

export function RotasSelectionProvider({
  children,
  onLinhaSelect,
  onParadaSelect,
}: RotasSelectionProviderProps) {
  const [linhaSelecionada, setLinhaSelecionada] = useState<Linha | null>(null);
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(null);

  const mapaRef = useRef<MapaRef | null>(null);

  const selecionarLinha = useCallback(
    (linha: Linha) => {
      setLinhaSelecionada(linha);
      onLinhaSelect?.(linha);
    },
    [onLinhaSelect],
  );

  const selecionarParada = useCallback(
    (parada: Parada) => {
      setParadaSelecionada(parada);
      onParadaSelect?.(parada);
    },
    [onParadaSelect],
  );

  const limparSelecao = useCallback(() => {
    setLinhaSelecionada(null);
    setParadaSelecionada(null);
  }, []);

  const contextValue = useMemo<RotasSelectionContextData>(
    () => ({
      linhaSelecionada,
      paradaSelecionada,
      selecionarLinha,
      selecionarParada,
      limparSelecao,
      mapaRef,
    }),
    [linhaSelecionada, paradaSelecionada, selecionarLinha, selecionarParada, limparSelecao],
  );

  return (
    <RotasSelectionContext.Provider value={contextValue}>{children}</RotasSelectionContext.Provider>
  );
}

export function useRotasSelectionState(): RotasSelectionContextData {
  const context = useContext(RotasSelectionContext);

  if (context === undefined) {
    throw new Error('useRotasSelectionState deve ser usado dentro de um RotasSelectionProvider');
  }

  return context;
}
