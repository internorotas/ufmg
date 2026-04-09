/**
 * Hook para gerenciar a localização do usuário em tempo real.
 *
 * Responsabilidades:
 * - Rastreamento GPS via watchPosition
 * - Orientação da bússola via DeviceOrientation API
 * - Controle de modais (permissão e distância)
 * - Cálculo de distância até a UFMG
 *
 * Proteções iOS/WebKit:
 * - navigator.permissions.query({ name: 'geolocation' }) lança TypeError no Safari/WebKit;
 *   toda chamada é envolta em try/catch — em caso de erro exibe o modal como fallback seguro.
 * - DeviceOrientationEvent.requestPermission é necessário no iOS 13+; o cast duplo evita
 *   erros de tipo pois a propriedade não consta nos tipos padrão do TypeScript.
 * - webkitCompassHeading (iOS) fornece heading absoluto; alpha (Android) é convertido.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { calcularDistanciaKm } from '../lib/utils';
import { useAnalytics } from './useAnalytics';

/**
 * Coordenadas centrais do Campus UFMG (Pampulha)
 */
export const COORDENADAS_UFMG: [number, number] = [-19.87055, -43.96775];

/**
 * Distância máxima em km para considerar o usuário "perto" da UFMG.
 * Exportada para que mensagens de UI possam referenciar o mesmo valor
 * sem duplicar a constante.
 */
export const DISTANCIA_MAXIMA_KM = 4;

/** Extende DeviceOrientationEvent com a propriedade proprietária do WebKit/iOS. */
type DeviceOrientationEventWebkit = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

/**
 * Interface de retorno do hook
 */
export interface UseLocalizacaoUsuarioReturn {
  /** Coordenadas atuais do usuário [lat, lng] */
  localizacao: [number, number] | null;
  /** Direção da bússola em graus (0-360, onde 0 = Norte) */
  heading: number | null;
  /** Se a permissão de GPS foi concedida */
  permissaoConcedida: boolean;
  /** Se está aguardando resposta do GPS */
  carregando: boolean;
  /** Erro de geolocalização (se houver) */
  erro: string | null;
  /** Controle do modal de permissão */
  mostrarModalPermissao: boolean;
  /** Controle do modal de "longe da UFMG" */
  mostrarModalLonge: boolean;
  /** Abre o modal de permissão */
  abrirModalPermissao: () => void;
  /** Fecha o modal de permissão sem iniciar GPS */
  fecharModalPermissao: () => void;
  /** Fecha o modal de distância */
  fecharModalLonge: () => void;
  /**
   * Ponto de entrada principal. Verifica a Permissions API (com proteção
   * para TypeError do WebKit/iOS) e age conforme o estado:
   * - 'granted': inicia GPS diretamente via solicitarPermissaoNavegador()
   * - 'prompt'/'denied' ou erro: exibe o modal informativo
   */
  iniciarRastreamento: () => Promise<void>;
  /**
   * Inicia efetivamente o watchPosition e o listener de orientação.
   * Deve ser chamado pelo botão "Permitir" do modal ou quando a permissão
   * já é conhecida como 'granted'.
   */
  solicitarPermissaoNavegador: () => Promise<void>;
}

/**
 * Hook para gerenciar localização do usuário com GPS e bússola.
 *
 * @example
 * ```tsx
 * const { localizacao, heading, iniciarRastreamento } = useLocalizacaoUsuario();
 *
 * // FAB: iniciarRastreamento verifica permissão e age conforme o estado
 * <button onClick={iniciarRastreamento}>Minha localização</button>
 *
 * // Modal "Permitir": chama solicitarPermissaoNavegador diretamente
 * <button onClick={solicitarPermissaoNavegador}>Permitir</button>
 * ```
 */
export function useLocalizacaoUsuario(): UseLocalizacaoUsuarioReturn {
  // Estados principais
  const [localizacao, setLocalizacao] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [permissaoConcedida, setPermissaoConcedida] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados dos modais
  const [mostrarModalPermissao, setMostrarModalPermissao] = useState(false);
  const [mostrarModalLonge, setMostrarModalLonge] = useState(false);

  const { trackEvent } = useAnalytics();

  // Refs para controle de ciclo de vida — evitam closures desatualizadas
  const watchIdRef = useRef<number | null>(null);
  const bussolaCleanupRef = useRef<(() => void) | null>(null);
  const jaVerificouDistanciaRef = useRef(false);
  const melhorPrecisaoRef = useRef<number>(Infinity);

  /**
   * Verifica se o usuário está longe da UFMG (apenas 1x por sessão de rastreamento)
   */
  const verificarDistancia = useCallback(
    (lat: number, lng: number) => {
      if (jaVerificouDistanciaRef.current) return;
      jaVerificouDistanciaRef.current = true;

      const distancia = calcularDistanciaKm(lat, lng, COORDENADAS_UFMG[0], COORDENADAS_UFMG[1]);

      if (distancia > DISTANCIA_MAXIMA_KM) {
        setMostrarModalLonge(true);
        trackEvent({
          event: 'user_far_from_campus',
          category: 'map_interaction',
          action: 'user_far_from_campus',
          label: `${distancia.toFixed(1)}km`,
        });
      }
    },
    [trackEvent],
  );

  /**
   * Callback de sucesso do GPS — atualiza posição priorizando precisão boa
   */
  const onPosicaoRecebida = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      setCarregando(false);
      setErro(null);
      setPermissaoConcedida(true);

      // Aceita a primeira leitura (feedback imediato) ou leituras com boa precisão
      const primeiraLeitura = melhorPrecisaoRef.current === Infinity;
      if (primeiraLeitura || accuracy <= 150) {
        setLocalizacao([latitude, longitude]);
        if (accuracy < melhorPrecisaoRef.current) {
          melhorPrecisaoRef.current = accuracy;
        }
      }

      verificarDistancia(latitude, longitude);
    },
    [verificarDistancia],
  );

  /**
   * Callback de erro do GPS
   */
  const onErroGPS = useCallback(
    (error: GeolocationPositionError) => {
      setCarregando(false);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          setErro('Permissão de localização negada. Verifique as configurações do navegador.');
          setPermissaoConcedida(false);
          setMostrarModalPermissao(true);
          trackEvent({
            event: 'location_permission_denied',
            category: 'preferences',
            action: 'location_permission_denied',
            label: 'geolocation_permission_denied',
          });
          break;
        case error.POSITION_UNAVAILABLE:
          setErro('Localização indisponível. Verifique se o GPS está ativado.');
          setMostrarModalPermissao(true);
          break;
        case error.TIMEOUT:
          setErro('Tempo esgotado ao obter localização. Tente novamente.');
          setMostrarModalPermissao(true);
          break;
        default:
          setErro('Erro desconhecido de geolocalização.');
          setMostrarModalPermissao(true);
      }
    },
    [trackEvent],
  );

  /**
   * Inicia o listener da bússola (DeviceOrientation API).
   *
   * iOS 13+: DeviceOrientationEvent.requestPermission é uma função nativa;
   * deve ser chamada ANTES de adicionar o event listener.
   * O cast duplo (unknown → tipo customizado) é necessário pois a API
   * proprietária não está nos tipos padrão do TypeScript/DOM.
   *
   * @returns cleanup function ou null se bússola indisponível
   */
  const iniciarBussola = useCallback(async (): Promise<(() => void) | null> => {
    const handleOrientation = (event: Event) => {
      const e = event as DeviceOrientationEventWebkit;
      if (e.webkitCompassHeading !== undefined) {
        // iOS: propriedade proprietária — heading absoluto em graus
        setHeading(e.webkitCompassHeading);
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android/desktop: alpha é rotação no sentido anti-horário; invertemos
        setHeading(360 - e.alpha);
      }
    };

    // CRÍTICO iOS 13+: requestPermission deve ser chamado antes do addEventListener.
    // Nunca acesse DeviceOrientationEvent do escopo global — no WebKit ele pode ser
    // undefined ou lançar ReferenceError. Sempre via window para acesso seguro.
    const isOrientationSupported =
      typeof window !== 'undefined' && window.DeviceOrientationEvent !== undefined;
    const requestPermission = isOrientationSupported
      ? (
          window.DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
          }
        ).requestPermission
      : undefined;

    if (typeof requestPermission === 'function') {
      try {
        const perm = await requestPermission();
        if (perm === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
          return () => window.removeEventListener('deviceorientation', handleOrientation, true);
        }
      } catch {
        // Bússola indisponível neste dispositivo — GPS continua normalmente
      }
      return null;
    }

    // Android / desktop: deviceorientationabsolute fornece heading absoluto
    // quando disponível; caso contrário usa deviceorientation
    const supportsAbsolute = 'ondeviceorientationabsolute' in window;
    const eventName = supportsAbsolute ? 'deviceorientationabsolute' : 'deviceorientation';

    window.addEventListener(eventName, handleOrientation as EventListener, true);
    return () => window.removeEventListener(eventName, handleOrientation as EventListener, true);
  }, []);

  /**
   * Inicia efetivamente o watchPosition e a bússola.
   * Chamado diretamente quando a permissão já é 'granted', ou pelo botão
   * "Permitir" do modal após confirmação do usuário.
   */
  const solicitarPermissaoNavegador = useCallback(async () => {
    if (carregando) {
      return;
    }

    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada neste navegador.');
      return;
    }

    setMostrarModalPermissao(false);
    setErro(null);
    setCarregando(true);
    melhorPrecisaoRef.current = Infinity;
    jaVerificouDistanciaRef.current = false;

    // Limpa watch anterior se existir
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onPosicaoRecebida, onErroGPS, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });

    const cleanup = await iniciarBussola();
    if (cleanup) {
      bussolaCleanupRef.current = cleanup;
    }
  }, [carregando, onPosicaoRecebida, onErroGPS, iniciarBussola]);

  /**
   * Ponto de entrada principal.
   *
   * Verifica o estado atual da permissão de geolocalização:
   * - 'granted': inicia GPS diretamente sem exibir modal
   * - 'prompt'/'denied': exibe modal informativo
   *
   * CRÍTICO iOS/WebKit: navigator.permissions.query({ name: 'geolocation' })
   * lança TypeError no Safari. O catch trata esse caso exibindo o modal —
   * comportamento correto e conservador para todos os navegadores.
   */
  const iniciarRastreamento = useCallback(async () => {
    if (carregando) {
      return;
    }

    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada neste navegador.');
      return;
    }

    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({
          name: 'geolocation',
        });

        if (status.state === 'granted') {
          // Permissão já concedida anteriormente — pula o modal
          await solicitarPermissaoNavegador();
          return;
        }

        // "prompt" ou "denied" — exibe modal explicativo
        setMostrarModalPermissao(true);
      } catch {
        // WebKit/iOS lança TypeError — exibe modal como fallback seguro
        setMostrarModalPermissao(true);
      }
    } else {
      // Navegador sem Permissions API — exibe modal
      setMostrarModalPermissao(true);
    }
  }, [carregando, solicitarPermissaoNavegador]);

  // Limpeza de recursos ao desmontar o componente
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (bussolaCleanupRef.current) {
        bussolaCleanupRef.current();
      }
    };
  }, []);

  const abrirModalPermissao = useCallback(() => setMostrarModalPermissao(true), []);
  const fecharModalPermissao = useCallback(() => setMostrarModalPermissao(false), []);
  const fecharModalLonge = useCallback(() => setMostrarModalLonge(false), []);

  return {
    localizacao,
    heading,
    permissaoConcedida,
    carregando,
    erro,
    mostrarModalPermissao,
    mostrarModalLonge,
    abrirModalPermissao,
    fecharModalPermissao,
    fecharModalLonge,
    iniciarRastreamento,
    solicitarPermissaoNavegador,
  };
}
