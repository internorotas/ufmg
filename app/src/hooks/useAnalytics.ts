import { useEffect, useCallback, useRef } from "react";
import {
  ga4Analytics,
  type IAnalyticsService,
  type AnalyticsEvent,
  type TimingEvent,
  type EventCategory,
} from "../services/analytics";

// Re-exporta os tipos para compatibilidade
export type { EventCategory, AnalyticsEvent, TimingEvent };

// Serviço de analytics injetável (permite trocar implementação)
let analyticsService: IAnalyticsService = ga4Analytics;

/**
 * Permite injetar um serviço de analytics diferente (útil para testes).
 */
export function setAnalyticsService(service: IAnalyticsService): void {
  analyticsService = service;
}

/**
 * Hook customizado para rastrear eventos no Analytics.
 * Centraliza toda a lógica de analytics e usa a abstração IAnalyticsService.
 */
export function useAnalytics() {
  /**
   * Envia um evento para o Analytics
   */
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analyticsService.trackEvent(event);
  }, []);

  /**
   * Envia um evento de pageview
   */
  const trackPageView = useCallback((path?: string) => {
    analyticsService.trackPageView({ path });
  }, []);

  /**
   * Define uma propriedade do usuário (ex: tema preferido)
   */
  const setUserProperty = useCallback((property: string, value: string) => {
    analyticsService.setUserProperty(property, value);
  }, []);

  /**
   * Rastreia tempo de execução/performance
   */
  const trackTiming = useCallback((timing: TimingEvent) => {
    analyticsService.trackTiming(timing);
  }, []);

  /**
   * Rastreia exceções/erros
   */
  const trackError = useCallback((error: Error, fatal: boolean = false) => {
    analyticsService.trackError(error, fatal);
  }, []);

  return {
    trackEvent,
    trackPageView,
    setUserProperty,
    trackTiming,
    trackError,
    isEnabled: analyticsService.isEnabled,
  };
}

/**
 * Hook para rastrear tempo de permanência em um componente
 */
export function useSessionTiming(
  label: string,
  category: EventCategory = "Session"
) {
  const startTimeRef = useRef<number>(0);
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
