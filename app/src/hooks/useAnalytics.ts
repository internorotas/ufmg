import { useEffect, useCallback, useRef } from "react";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_ANALYTICS_ENABLED = !!GA_MEASUREMENT_ID;

export type EventCategory =
  | "Engajamento"
  | "Navegação"
  | "Navegação Principal"
  | "Busca"
  | "UI Interaction"
  | "Navegação Detalhes"
  | "Horarios"
  | "Engajamento Detalhes"
  | "Performance"
  | "Erro"
  | "External Link"
  | "Session";

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
}

export interface TimingEvent {
  name: string;
  value: number;
  category?: string;
  label?: string;
}

/**
 * Hook customizado para rastrear eventos no Google Analytics.
 * Centraliza toda a lógica de analytics e garante que só execute quando o GA está configurado.
 */
export function useAnalytics() {
  /**
   * Envia um evento para o Google Analytics
   */
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!IS_ANALYTICS_ENABLED) return;

    ReactGA.event({
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
    });
  }, []);

  /**
   * Envia um evento de pageview
   */
  const trackPageView = useCallback((path?: string) => {
    if (!IS_ANALYTICS_ENABLED) return;

    ReactGA.send({
      hitType: "pageview",
      page: path || window.location.pathname,
    });
  }, []);

  /**
   * Define uma propriedade do usuário (ex: tema preferido)
   */
  const setUserProperty = useCallback((property: string, value: string) => {
    if (!IS_ANALYTICS_ENABLED) return;

    ReactGA.set({ [property]: value });
  }, []);

  /**
   * Rastreia tempo de execução/performance
   */
  const trackTiming = useCallback((timing: TimingEvent) => {
    if (!IS_ANALYTICS_ENABLED) return;

    ReactGA.event({
      category: timing.category || "Performance",
      action: timing.name,
      label: timing.label,
      value: timing.value,
    });
  }, []);

  /**
   * Rastreia exceções/erros
   */
  const trackError = useCallback((error: Error, fatal: boolean = false) => {
    if (!IS_ANALYTICS_ENABLED) return;

    ReactGA.event({
      category: "Erro",
      action: error.name || "Error",
      label: error.message,
      value: fatal ? 1 : 0,
    });
  }, []);

  return {
    trackEvent,
    trackPageView,
    setUserProperty,
    trackTiming,
    trackError,
    isEnabled: IS_ANALYTICS_ENABLED,
  };
}

/**
 * Hook para rastrear tempo de permanência em um componente
 */
export function useSessionTiming(
  label: string,
  category: EventCategory = "Session"
) {
  const startTimeRef = useRef<number>(Date.now());
  const { trackTiming, isEnabled } = useAnalytics();

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (!isEnabled) return;

      const sessionDuration = Date.now() - startTimeRef.current;

      // Só rastreia se a sessão durou mais de 1 segundo (evita cliques acidentais)
      if (sessionDuration > 1000) {
        trackTiming({
          name: "Session Duration",
          value: Math.round(sessionDuration),
          category,
          label,
        });
      }
    };
  }, [label, category, trackTiming, isEnabled]);
}

/**
 * Hook para rastrear cliques em links externos
 */
export function useExternalLinkTracking() {
  const { trackEvent } = useAnalytics();

  const trackExternalLink = useCallback(
    (url: string, label: string) => {
      trackEvent({
        category: "External Link",
        action: "Click",
        label: `${label} - ${url}`,
      });
    },
    [trackEvent]
  );

  return { trackExternalLink };
}
