import { useCallback, useEffect, useRef } from 'react';
import {
  type AnalyticsEvent,
  type EventCategory,
  ga4Analytics,
  type IAnalyticsService,
  type TimingEvent,
} from '../services/analytics';

export type { AnalyticsEvent, EventCategory, TimingEvent };

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
 * Hook para rastrear cliques em links externos
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

function truncateLabel(value: string, maxLength: number = 120): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getNavigationTiming(): PerformanceNavigationTiming | null {
  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return entry ?? null;
}

function trackNavigationTimings(trackTiming: (timing: TimingEvent) => void): void {
  const nav = getNavigationTiming();
  if (!nav) return;

  const ttfb = Math.round(nav.responseStart);
  const domReady = Math.round(nav.domContentLoadedEventEnd);
  const totalLoad = Math.round(nav.loadEventEnd);

  trackTiming({ category: 'navigation', name: 'ttfb', value: ttfb, label: nav.type });
  trackTiming({
    category: 'navigation',
    name: 'dom_ready',
    value: domReady,
    label: nav.type,
  });
  trackTiming({
    category: 'navigation',
    name: 'page_load',
    value: totalLoad,
    label: nav.type,
  });
}

function trackResourceSummary(trackEvent: (event: AnalyticsEvent) => void): void {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  if (resources.length === 0) return;

  const jsCount = resources.filter((entry) => entry.initiatorType === 'script').length;
  const cssCount = resources.filter((entry) => entry.initiatorType === 'css').length;
  const imageCount = resources.filter((entry) => entry.initiatorType === 'img').length;
  const fetchCount = resources.filter((entry) => entry.initiatorType === 'fetch').length;
  const totalTransferKb = Math.round(
    resources.reduce((acc, entry) => acc + entry.transferSize, 0) / 1024,
  );

  trackEvent({
    event: 'resource_summary',
    category: 'engagement',
    action: 'resource_summary',
    label: `total=${resources.length};js=${jsCount};css=${cssCount};img=${imageCount};fetch=${fetchCount}`,
    value: totalTransferKb,
  });
}

/**
 * Instrumentação automática para maximizar cobertura de métricas do app.
 * Inclui: performance de carregamento, web vitals (quando suportado), erros globais,
 * status de rede, visibilidade da aba e cliques em elementos interativos.
 */
export function useAnalyticsAutoTracking() {
  const { trackEvent, trackTiming, trackError, setUserProperty, isEnabled } = useAnalytics();
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isEnabled) return;

    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    setUserProperty('viewport', viewport);
    setUserProperty('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown');
    setUserProperty('language', navigator.language || 'unknown');
    setUserProperty('platform', navigator.platform || 'unknown');

    const nav = getNavigationTiming();
    trackEvent({
      event: 'app_boot',
      category: 'navigation',
      action: 'app_boot',
      label: nav?.type || 'navigate',
    });

    trackNavigationTimings(trackTiming);

    const onLoad = () => {
      trackResourceSummary(trackEvent);
      if ('memory' in performance) {
        const memory = performance.memory as {
          usedJSHeapSize: number;
        };
        trackTiming({
          category: 'engagement',
          name: 'used_js_heap_mb',
          value: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          label: 'onLoad',
        });
      }
    };

    window.addEventListener('load', onLoad);

    const onVisibilityChange = () => {
      trackEvent({
        event: 'visibility_change',
        category: 'engagement',
        action: 'visibility_change',
        label: document.visibilityState,
      });

      if (document.visibilityState === 'hidden') {
        // Não rastrear duration aqui: pagehide já captura isso de forma mais confiável
        // e evita contagem dupla em contextos mobile onde ambos os eventos disparam.
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const onWindowError = (event: ErrorEvent) => {
      const message = truncateLabel(`${event.message} @ ${event.filename}:${event.lineno}`);
      trackError(new Error(message), true);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonText =
        typeof event.reason === 'string'
          ? event.reason
          : JSON.stringify(event.reason ?? 'unknown rejection');
      trackError(new Error(truncateLabel(`Unhandled rejection: ${reasonText}`)), true);
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const interactiveElement = target.closest(
        'button, a, [role="button"], input[type="button"], input[type="submit"]',
      ) as HTMLElement | null;
      if (!interactiveElement) return;

      const role =
        interactiveElement.getAttribute('role') || interactiveElement.tagName.toLowerCase();
      const label =
        interactiveElement.getAttribute('aria-label') ||
        interactiveElement.getAttribute('title') ||
        interactiveElement.textContent ||
        'sem-label';

      trackEvent({
        event: 'global_click',
        category: 'engagement',
        action: 'global_click',
        label: truncateLabel(`${role}: ${label}`),
      });
    };

    document.addEventListener('click', onClick, { capture: true });

    let lcpValue = 0;
    let clsValue = 0;
    let inpValue = 0;

    const observers: PerformanceObserver[] = [];

    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            trackTiming({
              category: 'engagement',
              name: 'fcp',
              value: Math.round(entry.startTime),
            });
          }
        });
      });

      paintObserver.observe({ type: 'paint', buffered: true });
      observers.push(paintObserver);

      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          lcpValue = Math.round(last.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);

      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const layoutShift = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value ?? 0;
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);

      const inpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          inpValue = Math.max(inpValue, Math.round(entry.duration));
        });
      });
      inpObserver.observe({ type: 'event', buffered: true });
      observers.push(inpObserver);
    }

    const flushVitals = () => {
      if (lcpValue > 0) {
        trackTiming({ category: 'engagement', name: 'lcp', value: lcpValue });
      }
      if (clsValue > 0) {
        trackEvent({
          event: 'web_vital_cls',
          category: 'engagement',
          action: 'web_vital_cls',
          label: clsValue.toFixed(4),
          value: Math.round(clsValue * 10000),
        });
      }
      if (inpValue > 0) {
        trackTiming({ category: 'engagement', name: 'inp_candidate', value: inpValue });
      }
    };

    const onPageHide = () => {
      flushVitals();
      const durationMs = Date.now() - sessionStartRef.current;
      trackTiming({
        category: 'engagement',
        name: 'session_duration_ms',
        value: durationMs,
        label: 'page_hide',
      });
    };

    window.addEventListener('pagehide', onPageHide);

    const heartbeatId = window.setInterval(() => {
      const elapsedMs = Date.now() - sessionStartRef.current;
      trackTiming({
        category: 'engagement',
        name: 'session_heartbeat_s',
        value: Math.round(elapsedMs / 1000),
        label: window.location.pathname,
      });
    }, 60000);

    return () => {
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      document.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(heartbeatId);
      flushVitals();
      observers.forEach((observer) => {
        observer.disconnect();
      });
    };
  }, [isEnabled, setUserProperty, trackError, trackEvent, trackTiming]);
}
