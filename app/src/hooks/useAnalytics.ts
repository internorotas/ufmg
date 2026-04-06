/**
 * Hook principal de analytics e hooks auxiliares.
 *
 * - useAnalytics: hook de tracking manual (eventos, pageviews, timing, erros)
 * - useSessionTiming: rastreia tempo de permanência num componente
 * - useExternalLinkTracking: rastreia cliques em links externos
 *
 * Para instrumentação automática (web vitals, erros globais, etc.),
 * veja useAnalyticsAutoTracking.ts.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  type AnalyticsEvent,
  type EventCategory,
  ga4Analytics,
  type IAnalyticsService,
  type TimingEvent,
} from '../services/analytics';

export type { AnalyticsEvent, EventCategory, TimingEvent };

/**
 * Serviço de analytics ativo. Mutável apenas via setAnalyticsService()
 * (útil em testes para injetar um mock sem afetar o módulo inteiro).
 */
let analyticsService: IAnalyticsService = ga4Analytics;
type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

function normalizeAction(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function serializePayload(payload?: AnalyticsPayload): string | undefined {
  if (!payload) return undefined;
  const serialized = JSON.stringify(payload);
  return serialized.length > 120 ? `${serialized.slice(0, 117)}...` : serialized;
}

/**
 * Permite injetar um serviço de analytics diferente (útil para testes).
 * Restaure o serviço original após cada teste para evitar poluição de estado.
 */
export function setAnalyticsService(service: IAnalyticsService): void {
  analyticsService = service;
}

/**
 * Hook customizado para rastrear eventos no Analytics.
 * Centraliza toda a lógica de analytics e usa a abstração IAnalyticsService.
 */
export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent | string, payload?: AnalyticsPayload) => {
    if (typeof event === 'string') {
      const normalizedEvent = normalizeAction(event);
      analyticsService.trackEvent({
        event: normalizedEvent,
        category: 'engagement',
        action: normalizedEvent,
        label: serializePayload(payload),
        params: payload,
      });
      return;
    }

    const baseEvent = event.event || event.action || 'unknown_event';
    const normalizedEvent = normalizeAction(baseEvent);

    analyticsService.trackEvent({
      ...event,
      event: normalizedEvent,
      action: event.action ? normalizeAction(event.action) : normalizedEvent,
    });
  }, []);

  const trackPageView = useCallback((path?: string) => {
    analyticsService.trackPageView({ path });
  }, []);

  const setUserProperty = useCallback((property: string, value: string) => {
    analyticsService.setUserProperty(property, value);
  }, []);

  const trackTiming = useCallback((timing: TimingEvent) => {
    analyticsService.trackTiming(timing);
  }, []);

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
 * Rastreia tempo de permanência em um componente.
 * Envia o evento quando o componente desmonta, se a sessão durou mais de 1s.
 */
export function useSessionTiming(label: string, category: EventCategory = 'engagement') {
  const startTimeRef = useRef<number>(0);
  const { trackTiming, isEnabled } = useAnalytics();

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (!isEnabled) return;

      const sessionDuration = Date.now() - startTimeRef.current;

      if (sessionDuration > 1000) {
        trackTiming({
          name: 'session_duration',
          value: Math.round(sessionDuration),
          category: category,
          label,
        });
      }
    };
  }, [label, category, trackTiming, isEnabled]);
}

/**
 * Rastreia cliques em links externos.
 */
export function useExternalLinkTracking() {
  const { trackEvent } = useAnalytics();

  const trackExternalLink = useCallback(
    (url: string, label: string) => {
      trackEvent({
        event: 'click_external_link',
        category: 'navigation',
        action: 'click_external_link',
        label: `${label} - ${url}`,
      });
    },
    [trackEvent],
  );

  return { trackExternalLink };
}
