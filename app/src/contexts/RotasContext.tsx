/**
 * Context API - Gerenciamento de Estado Global para Rotas.
 *
 * Este contexto elimina o prop drilling, centralizando o estado
 * de seleção de linhas e paradas em um único local.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type IRotasService, loadRotasService, RotasService } from '../services/RotasService';
import type { CategoriaLinhas, Linha, Parada } from '../types/data.types';

/**
 * Interface que define a referência do Mapa para centralização.
 */
export interface MapaRef {
  centralizarParada: (parada: Parada) => void;
  centralizarCoordenada: (coords: [number, number], zoom?: number) => void;
}

/**
 * Interface que define o formato do contexto de rotas.
 */
interface RotasContextData {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  isLoadingData: boolean;
  dataError: string | null;

  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;

  selecionarLinha: (linha: Linha) => void;
  selecionarParada: (parada: Parada) => void;
  limparSelecao: () => void;

  mapaRef: React.RefObject<MapaRef | null>;

  rotasService: IRotasService;
}

/**
 * Contexto de Rotas - undefined por padrão para garantir uso dentro do Provider.
 */
const RotasContext = createContext<RotasContextData | undefined>(undefined);

/**
 * Props do Provider.
 */
interface RotasProviderProps {
  children: ReactNode;
  onLinhaSelect?: (linha: Linha) => void;
  onParadaSelect?: (parada: Parada) => void;
}

/**
 * Provider que encapsula toda a lógica de estado das rotas.
 *
 * @example
 * ```tsx
 * <RotasProvider>
 *   <App />
 * </RotasProvider>
 * ```
 */
export function RotasProvider({ children, onLinhaSelect, onParadaSelect }: RotasProviderProps) {
  const [linhaSelecionada, setLinhaSelecionada] = useState<Linha | null>(null);
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [rotasService, setRotasService] = useState<IRotasService>(RotasService);

  const mapaRef = useRef<MapaRef | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        const loadedService = await loadRotasService();
        if (!isMounted) return;
        setRotasService(loadedService);
      } catch {
        if (!isMounted) return;
        setDataError('Nao foi possivel carregar os dados de linhas e paradas.');
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const linhasData = useMemo(() => rotasService.getTodasLinhas(), [rotasService]);
  const todasParadas = useMemo(() => rotasService.getTodasParadas(), [rotasService]);

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
      mapaRef.current?.centralizarParada(parada);
      onParadaSelect?.(parada);
    },
    [onParadaSelect],
  );

  const limparSelecao = useCallback(() => {
    setLinhaSelecionada(null);
    setParadaSelecionada(null);
  }, []);

  const contextValue = useMemo<RotasContextData>(
    () => ({
      linhasData,
      todasParadas,
      isLoadingData,
      dataError,
      linhaSelecionada,
      paradaSelecionada,
      selecionarLinha,
      selecionarParada,
      limparSelecao,
      mapaRef,
      rotasService,
    }),
    [
      linhasData,
      todasParadas,
      isLoadingData,
      dataError,
      linhaSelecionada,
      paradaSelecionada,
      selecionarLinha,
      selecionarParada,
      limparSelecao,
      rotasService,
    ],
  );

  return <RotasContext.Provider value={contextValue}>{children}</RotasContext.Provider>;
}

/**
 * Hook para consumir o contexto de rotas.
 *
 * @throws {Error} Se usado fora do RotasProvider.
 *
 * @example
 * ```tsx
 * function MeuComponente() {
 *   const { linhaSelecionada, selecionarLinha } = useRotas();
 *   // ...
 * }
 * ```
 */
export function useRotas(): RotasContextData {
  const context = useContext(RotasContext);

  if (context === undefined) {
    throw new Error('useRotas deve ser usado dentro de um RotasProvider');
  }

  return context;
}

/**
 * Hook seletivo para evitar re-renders - retorna apenas os dados.
 * Use quando o componente só precisa dos dados e não das ações.
 */
export function useRotasData() {
  const { linhasData, todasParadas, rotasService, isLoadingData, dataError } = useRotas();
  return { linhasData, todasParadas, rotasService, isLoadingData, dataError };
}

/**
 * Hook seletivo para evitar re-renders - retorna apenas a seleção.
 * Use quando o componente só precisa saber o que está selecionado.
 */
export function useRotasSelection() {
  const { linhaSelecionada, paradaSelecionada, selecionarLinha, selecionarParada, limparSelecao } =
    useRotas();

  return {
    linhaSelecionada,
    paradaSelecionada,
    selecionarLinha,
    selecionarParada,
    limparSelecao,
  };
}

/**
 * Hook para acessar a referência do mapa.
 */
export function useMapaRef() {
  const { mapaRef } = useRotas();
  return mapaRef;
}
