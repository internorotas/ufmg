/**
 * Implementação concreta do serviço de Analytics usando Google Analytics 4.
 * Adapter Pattern - encapsula a dependência do react-ga4.
 */

import ReactGAImport from 'react-ga4';
import type {
  AnalyticsEvent,
  IAnalyticsService,
  PageViewEvent,
  TimingEvent,
} from './IAnalyticsService';

type GAClient = {
  initialize: (measurementId: string, options?: Record<string, unknown>) => void;
  event: (options: Record<string, unknown>) => void;
  send: (options: Record<string, unknown>) => void;
  set: (fields: Record<string, unknown>) => void;
};

function resolveGAClient(): GAClient | null {
  const moduleValue = ReactGAImport as unknown as {
    default?: unknown;
  };
  const candidate = moduleValue.default ?? moduleValue;

  if (
    candidate &&
    typeof candidate === 'object' &&
    'initialize' in candidate &&
    typeof (candidate as { initialize?: unknown }).initialize === 'function'
  ) {
    return candidate as GAClient;
  }

  // Algumas versões/transpilações podem exportar a classe ao invés da instância.
  if (typeof candidate === 'function') {
    const prototype = candidate.prototype as { initialize?: unknown } | undefined;
    if (prototype && typeof prototype.initialize === 'function') {
      const instance = new (candidate as new () => unknown)();
      if (
        instance &&
        typeof instance === 'object' &&
        'initialize' in instance &&
        typeof (instance as { initialize?: unknown }).initialize === 'function'
      ) {
        return instance as GAClient;
      }
    }
  }

  return null;
}

const ReactGA = resolveGAClient();

/**
 * Implementação do serviço de analytics usando Google Analytics 4.
 * Pode ser substituída por outra implementação (Mixpanel, Amplitude, etc.)
 * sem alterar o código que consome o serviço.
 */
export class GA4AnalyticsService implements IAnalyticsService {
  private readonly measurementId: string | undefined;
  private initialized = false;

  constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  }

  get isEnabled(): boolean {
    return !!this.measurementId && !!ReactGA;
  }

  initialize(): void {
    if (!this.isEnabled || this.initialized) {
      return;
    }

    if (!this.measurementId) {
      return;
    }

    ReactGA?.initialize(this.measurementId, {
      // testMode bloqueia envio de hits; manter false para aparecer no DebugView.
      testMode: import.meta.env.MODE === 'test',
      gtagOptions: {
        debug_mode: import.meta.env.DEV,
      },
    });
    this.initialized = true;
  }

  private ensureInitialized(): boolean {
    if (!this.isEnabled) {
      return false;
    }

    if (!this.initialized) {
      this.initialize();
    }

    return this.initialized;
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.ensureInitialized()) return;

    ReactGA?.event({
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
    });
  }

  trackPageView(event?: PageViewEvent): void {
    if (!this.ensureInitialized()) return;

    ReactGA?.send({
      hitType: 'pageview',
      page: event?.path || window.location.pathname,
      title: event?.title,
    });
  }

  setUserProperty(property: string, value: string): void {
    if (!this.ensureInitialized()) return;

    ReactGA?.set({ [property]: value });
  }

  trackTiming(timing: TimingEvent): void {
    if (!this.ensureInitialized()) return;

    ReactGA?.event({
      category: timing.category || 'engagement',
      action: timing.name,
      label: timing.label,
      value: timing.value,
    });
  }

  trackError(error: Error, fatal: boolean = false): void {
    if (!this.ensureInitialized()) return;

    ReactGA?.event({
      category: 'engagement',
      action: 'application_error',
      label: error.message,
      value: fatal ? 1 : 0,
    });
  }
}

// Exporta uma instância singleton
export const ga4Analytics = new GA4AnalyticsService();
