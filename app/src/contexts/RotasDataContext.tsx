import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLinhasQuery } from '@/features/transit-data/queries/useLinhasQuery';
import { useParadasQuery } from '@/features/transit-data/queries/useParadasQuery';
import {
  type IRotasService,
  loadRotasFallbackData,
  type RotasDataSource,
  RotasService,
  RotasServiceImpl,
} from '@/services/RotasService';
import type { CategoriaLinhas, Parada } from '@/types/data.types';

export interface RotasDataContextData {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  isLoadingData: boolean;
  dataError: string | null;
  dataSource: RotasDataSource;
  dataVersion: string;
  dataUpdatedAt: string;
  isOfflineDataFallback: boolean;
  rotasService: IRotasService;
}

interface RotasDataProviderProps {
  children: ReactNode;
}

const RotasDataContext = createContext<RotasDataContextData | undefined>(undefined);

export function RotasDataProvider({ children }: RotasDataProviderProps) {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [rotasService, setRotasService] = useState<IRotasService>(RotasService);
  const [dataSource, setDataSource] = useState<RotasDataSource>('source-fallback');
  const [dataVersion, setDataVersion] = useState('unknown');
  const [dataUpdatedAt, setDataUpdatedAt] = useState('');

  const fallbackAttemptedRef = useRef(false);

  const linhasQuery = useLinhasQuery(true);
  const paradasQuery = useParadasQuery(true);

  const hasApiData = Boolean(linhasQuery.data && paradasQuery.data);
  const hasApiError = linhasQuery.isError || paradasQuery.isError;
  const isApiLoading = linhasQuery.isLoading || paradasQuery.isLoading;

  useEffect(() => {
    if (!linhasQuery.data || !paradasQuery.data) {
      return;
    }

    setRotasService(RotasServiceImpl.fromData(linhasQuery.data, paradasQuery.data));
    setDataSource('api');
    setDataVersion('v1');
    setDataUpdatedAt(new Date().toISOString());
    setDataError(null);
    setIsLoadingData(false);
    fallbackAttemptedRef.current = false;
  }, [linhasQuery.data, paradasQuery.data]);

  useEffect(() => {
    if (hasApiData) {
      return;
    }

    if (isApiLoading) {
      setIsLoadingData(true);
      return;
    }

    if (!hasApiError || fallbackAttemptedRef.current) {
      return;
    }

    let isMounted = true;
    fallbackAttemptedRef.current = true;

    const loadFallback = async () => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        const loadedData = await loadRotasFallbackData();

        if (!isMounted) {
          return;
        }

        setRotasService(loadedData.service);
        setDataSource(loadedData.source);
        setDataVersion(loadedData.dataVersion);
        setDataUpdatedAt(loadedData.updatedAt);
      } catch {
        if (!isMounted) {
          return;
        }

        setDataError('Não foi possível carregar os dados de linhas e paradas.');
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void loadFallback();

    return () => {
      isMounted = false;
    };
  }, [hasApiData, hasApiError, isApiLoading]);

  const linhasData = useMemo(() => rotasService.getTodasLinhas(), [rotasService]);
  const todasParadas = useMemo(() => rotasService.getTodasParadas(), [rotasService]);

  const contextValue = useMemo<RotasDataContextData>(
    () => ({
      linhasData,
      todasParadas,
      isLoadingData,
      dataError,
      dataSource,
      dataVersion,
      dataUpdatedAt,
      isOfflineDataFallback: dataSource !== 'api',
      rotasService,
    }),
    [
      linhasData,
      todasParadas,
      isLoadingData,
      dataError,
      dataSource,
      dataVersion,
      dataUpdatedAt,
      rotasService,
    ],
  );

  return <RotasDataContext.Provider value={contextValue}>{children}</RotasDataContext.Provider>;
}

export function useRotasData(): RotasDataContextData {
  const context = useContext(RotasDataContext);

  if (context === undefined) {
    throw new Error('useRotasData deve ser usado dentro de um RotasDataProvider');
  }

  return context;
}
