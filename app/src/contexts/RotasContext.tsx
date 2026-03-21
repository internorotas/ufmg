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
  useMemo,
  useRef,
  useState,
} from 'react';
import { type IRotasService, RotasService } from '../services/RotasService';
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
  // Dados
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];

  // Estado de seleção
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;

  // Ações
  selecionarLinha: (linha: Linha) => void;
  selecionarParada: (parada: Parada) => void;
  limparSelecao: () => void;

  // Referência do Mapa
  mapaRef: React.RefObject<MapaRef | null>;

  // Serviço de dados (para acesso direto se necessário)
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
  // Estado de seleção
  const [linhaSelecionada, setLinhaSelecionada] = useState<Linha | null>(null);
  const [paradaSelecionada, setParadaSelecionada] = useState<Parada | null>(null);

  // Referência do mapa para centralização
  const mapaRef = useRef<MapaRef | null>(null);

  // Dados memoizados do serviço
  const linhasData = useMemo(() => RotasService.getTodasLinhas(), []);
  const todasParadas = useMemo(() => RotasService.getTodasParadas(), []);

  // Ação: Selecionar uma linha
  const selecionarLinha = useCallback(
    (linha: Linha) => {
      setLinhaSelecionada(linha);
      onLinhaSelect?.(linha);
    },
    [onLinhaSelect],
  );

  // Ação: Selecionar uma parada (também centraliza no mapa)
  const selecionarParada = useCallback(
    (parada: Parada) => {
      setParadaSelecionada(parada);
      mapaRef.current?.centralizarParada(parada);
      onParadaSelect?.(parada);
    },
    [onParadaSelect],
  );

  // Ação: Limpar seleção
  const limparSelecao = useCallback(() => {
    setLinhaSelecionada(null);
    setParadaSelecionada(null);
  }, []);

  // Valor memoizado do contexto para evitar re-renders desnecessários
  const contextValue = useMemo<RotasContextData>(
    () => ({
      // Dados
      linhasData,
      todasParadas,

      // Estado
      linhaSelecionada,
      paradaSelecionada,

      // Ações
      selecionarLinha,
      selecionarParada,
      limparSelecao,

      // Referência
      mapaRef,

      // Serviço
      rotasService: RotasService,
    }),
    [
      linhasData,
      todasParadas,
      linhaSelecionada,
      paradaSelecionada,
      selecionarLinha,
      selecionarParada,
      limparSelecao,
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
  const { linhasData, todasParadas, rotasService } = useRotas();
  return { linhasData, todasParadas, rotasService };
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
