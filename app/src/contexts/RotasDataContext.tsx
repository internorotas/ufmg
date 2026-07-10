import { Turnstile } from '@marsidev/react-turnstile';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTransitSession } from '@/features/transit-data/hooks/useTransitSession';
import { useLinhasQuery } from '@/features/transit-data/queries/useLinhasQuery';
import { useParadasQuery } from '@/features/transit-data/queries/useParadasQuery';
import { useMounted } from '@/hooks/useMounted';
import { fetchTransitDataBinary, setCurrentTransitToken } from '@/services/api/transitApi';
import {
  type IRotasService,
  loadRotasFallbackData,
  type RotasDataSource,
  RotasService,
  RotasServiceImpl,
} from '@/services/RotasService';
import type { CategoriaLinhas, Parada } from '@/types/data.types';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

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
  const binaryLoadedRef = useRef(false);
  const isMounted = useMounted();

  const transitSession = useTransitSession();

  // Rota binária: quando transit token disponível, busca dados em Protobuf
  useEffect(() => {
    if (!transitSession.transitToken || binaryLoadedRef.current) return;

    const token = transitSession.transitToken;
    binaryLoadedRef.current = true;

    const loadBinary = async () => {
      try {
        const { linhas, paradas } = await fetchTransitDataBinary(token);
        if (!isMounted()) return;
        setRotasService(RotasServiceImpl.fromData(linhas, { paradas }));
        setDataSource('api');
        setDataVersion('v1');
        setDataUpdatedAt(new Date().toISOString());
        setDataError(null);
        setIsLoadingData(false);
        fallbackAttemptedRef.current = false;
      } catch (err) {
        binaryLoadedRef.current = false;
        // Token rejeitado pelo servidor (expirado/inválido) — limpa e força re-verificação Turnstile
        if (err instanceof Error && err.message.includes('401')) {
          setCurrentTransitToken(null);
          transitSession.onTurnstileError();
        }
      }
    };

    void loadBinary();
  }, [transitSession.transitToken, isMounted, transitSession.onTurnstileError]);

  // Reset binary flag quando token expira (transitToken volta a null)
  useEffect(() => {
    if (!transitSession.transitToken) {
      binaryLoadedRef.current = false;
    }
  }, [transitSession.transitToken]);

  // Queries JSON sempre habilitadas — /v1/linhas e /v1/paradas são públicos e têm
  // fallback para dados locais. O binary path (fetchTransitDataBinary) complementa
  // quando o transit token estiver disponível via Turnstile.
  const linhasQuery = useLinhasQuery(true);
  const paradasQuery = useParadasQuery(true);

  const hasApiData = Boolean(linhasQuery.data && paradasQuery.data);
  const hasApiError = linhasQuery.isError || paradasQuery.isError;
  const isApiLoading = linhasQuery.isLoading || paradasQuery.isLoading;

  useEffect(() => {
    if (!linhasQuery.data || !paradasQuery.data) {
      return;
    }
    // Não sobrescreve se o binary path já carregou dados mais completos
    if (binaryLoadedRef.current) {
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

    fallbackAttemptedRef.current = true;

    const loadFallback = async () => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        const loadedData = await loadRotasFallbackData();
        if (!isMounted()) return;

        setRotasService(loadedData.service);
        setDataSource(loadedData.source);
        setDataVersion(loadedData.dataVersion);
        setDataUpdatedAt(loadedData.updatedAt);
      } catch {
        if (!isMounted()) return;

        setDataError('Não foi possível carregar os dados de linhas e paradas.');
      } finally {
        if (isMounted()) setIsLoadingData(false);
      }
    };

    void loadFallback();
  }, [hasApiData, hasApiError, isApiLoading, isMounted]);

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

  return (
    <RotasDataContext.Provider value={contextValue}>
      {TURNSTILE_SITE_KEY && !transitSession.disabled && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          options={{ size: 'invisible', execution: 'render' }}
          onSuccess={(token) => {
            void transitSession.onTurnstileSuccess(token);
          }}
          onError={transitSession.onTurnstileError}
          onExpire={transitSession.onTurnstileError}
          style={{ display: 'none' }}
        />
      )}
      {children}
    </RotasDataContext.Provider>
  );
}

export function useRotasData(): RotasDataContextData {
  const context = useContext(RotasDataContext);

  if (context === undefined) {
    throw new Error('useRotasData deve ser usado dentro de um RotasDataProvider');
  }

  return context;
}
