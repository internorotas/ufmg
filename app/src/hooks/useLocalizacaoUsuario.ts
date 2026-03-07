/**
 * Hook para gerenciar a localização do usuário em tempo real.
 *
 * Responsabilidades:
 * - Rastreamento GPS via watchPosition
 * - Orientação da bússola via DeviceOrientation API
 * - Controle de modais (permissão e distância)
 * - Cálculo de distância até a UFMG
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { calcularDistanciaKm } from "../lib/utils";

/**
 * Coordenadas centrais do Campus UFMG (Pampulha)
 */
export const COORDENADAS_UFMG: [number, number] = [-19.87055, -43.96775];

/**
 * Distância máxima em km para considerar o usuário "perto" da UFMG
 */
const DISTANCIA_MAXIMA_KM = 4;

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
  /** Fecha o modal de permissão */
  fecharModalPermissao: () => void;
  /** Fecha o modal de distância */
  fecharModalLonge: () => void;
  /** Inicia o rastreamento de GPS (chamar após permissão do usuário) */
  iniciarRastreamento: () => void;
}

/**
 * Hook para gerenciar localização do usuário com GPS e bússola.
 *
 * @example
 * ```tsx
 * const { localizacao, heading, abrirModalPermissao } = useLocalizacaoUsuario();
 *
 * // Quando o usuário clicar no FAB:
 * if (!permissaoConcedida) {
 *   abrirModalPermissao();
 * } else {
 *   map.flyTo(localizacao, 17);
 * }
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

  // Refs para controle
  const watchIdRef = useRef<number | null>(null);
  const bussolaCleanupRef = useRef<(() => void) | null>(null);
  const jaVerificouDistanciaRef = useRef(false);
  const melhorPrecisaoRef = useRef<number>(Infinity);

  /**
   * Verifica se o usuário está longe da UFMG (apenas 1x por sessão)
   */
  const verificarDistancia = useCallback((lat: number, lng: number) => {
    if (jaVerificouDistanciaRef.current) return;

    const distancia = calcularDistanciaKm(
      lat,
      lng,
      COORDENADAS_UFMG[0],
      COORDENADAS_UFMG[1],
    );

    if (distancia > DISTANCIA_MAXIMA_KM) {
      setMostrarModalLonge(true);
    }

    jaVerificouDistanciaRef.current = true;
  }, []);

  /**
   * Callback de sucesso do GPS
   * Atualiza posição priorizando precisão boa
   */
  const onPosicaoRecebida = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Sempre para o loading na primeira resposta
      setCarregando(false);
      setErro(null);
      setPermissaoConcedida(true);

      // Limite de precisão aceitável em metros
      // Posições com mais de 150m são muito imprecisas e podem confundir
      const precisaoMaximaAceitavel = 150;

      // Lógica simples:
      // - Aceita qualquer posição com precisão razoável (< 150m)
      // - Primeira leitura: aceita qualquer coisa para dar feedback rápido
      const primeiraLeitura = melhorPrecisaoRef.current === Infinity;
      const precisaoAceitavel = accuracy <= precisaoMaximaAceitavel;

      if (primeiraLeitura || precisaoAceitavel) {
        setLocalizacao([latitude, longitude]);

        // Registra a melhor precisão obtida (para debug/futuro)
        if (accuracy < melhorPrecisaoRef.current) {
          melhorPrecisaoRef.current = accuracy;
        }
      }

      // Verifica distância na primeira coordenada válida
      verificarDistancia(latitude, longitude);
    },
    [verificarDistancia],
  );

  /**
   * Callback de erro do GPS
   */
  const onErroGPS = useCallback((error: GeolocationPositionError) => {
    setCarregando(false);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setErro(
          "Permissão de localização negada. Verifique as configurações do navegador.",
        );
        setPermissaoConcedida(false);
        // Reabre o modal para mostrar o erro
        setMostrarModalPermissao(true);
        break;
      case error.POSITION_UNAVAILABLE:
        setErro("Localização indisponível. Verifique se o GPS está ativado.");
        setMostrarModalPermissao(true);
        break;
      case error.TIMEOUT:
        setErro("Tempo esgotado ao obter localização. Tente novamente.");
        setMostrarModalPermissao(true);
        break;
      default:
        setErro("Erro desconhecido de geolocalização");
        setMostrarModalPermissao(true);
    }
  }, []);

  /**
   * Inicia o listener da bússola (DeviceOrientation)
   */
  const iniciarBussola = useCallback(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // webkitCompassHeading é específico do iOS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compassHeading = (event as any).webkitCompassHeading;

      if (compassHeading !== undefined) {
        // iOS: webkitCompassHeading já é a direção absoluta
        setHeading(compassHeading);
      } else if (event.alpha !== null) {
        // Android/outros: alpha é relativo à orientação inicial
        // Para direção absoluta, usamos deviceorientationabsolute quando disponível
        setHeading(360 - event.alpha);
      }
    };

    // Detecta suporte a deviceorientationabsolute (mais preciso no Android)
    const supportsAbsolute =
      typeof window !== "undefined" && "ondeviceorientationabsolute" in window;

    const eventName = supportsAbsolute
      ? "deviceorientationabsolute"
      : "deviceorientation";

    window.addEventListener(
      eventName,
      handleOrientation as EventListener,
      true,
    );

    // Cleanup function
    return () => {
      window.removeEventListener(
        eventName,
        handleOrientation as EventListener,
        true,
      );
    };
  }, []);

  /**
   * Inicia o rastreamento de GPS
   */
  const iniciarRastreamento = useCallback(() => {
    if (!navigator.geolocation) {
      setErro("Geolocalização não suportada neste navegador");
      return;
    }

    // Limpa erro anterior e inicia loading
    setErro(null);
    setCarregando(true);

    // Reseta a melhor precisão para nova sessão de rastreamento
    melhorPrecisaoRef.current = Infinity;

    // Limpa watch anterior se existir
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Fecha o modal imediatamente (navegador vai mostrar seu próprio prompt)
    setMostrarModalPermissao(false);

    // Inicia watch do GPS - o callback onPosicaoRecebida vai setar permissaoConcedida
    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosicaoRecebida,
      onErroGPS,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0, // Sempre pedir posição fresca para máxima precisão
      },
    );

    // Inicia bússola e armazena cleanup
    bussolaCleanupRef.current = iniciarBussola();
  }, [onPosicaoRecebida, onErroGPS, iniciarBussola]);

  // Cleanup ao desmontar
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

  // Funções de controle dos modais
  const abrirModalPermissao = useCallback(() => {
    setMostrarModalPermissao(true);
  }, []);

  const fecharModalPermissao = useCallback(() => {
    setMostrarModalPermissao(false);
  }, []);

  const fecharModalLonge = useCallback(() => {
    setMostrarModalLonge(false);
  }, []);

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
  };
}
