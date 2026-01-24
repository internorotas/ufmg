/**
 * Implementação concreta do serviço de Analytics usando Google Analytics 4.
 * Adapter Pattern - encapsula a dependência do react-ga4.
 */

import ReactGA from "react-ga4";
import type {
  IAnalyticsService,
  AnalyticsEvent,
  TimingEvent,
  PageViewEvent,
} from "./IAnalyticsService";

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
    return !!this.measurementId;
  }

  initialize(): void {
    if (!this.isEnabled || this.initialized) {
      return;
    }

    ReactGA.initialize(this.measurementId!);
    this.initialized = true;
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    ReactGA.event({
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
    });
  }

  trackPageView(event?: PageViewEvent): void {
    if (!this.isEnabled) return;

    ReactGA.send({
      hitType: "pageview",
      page: event?.path || window.location.pathname,
      title: event?.title,
    });
  }

  setUserProperty(property: string, value: string): void {
    if (!this.isEnabled) return;

    ReactGA.set({ [property]: value });
  }

  trackTiming(timing: TimingEvent): void {
    if (!this.isEnabled) return;

    ReactGA.event({
      category: timing.category || "Performance",
      action: timing.name,
      label: timing.label,
      value: timing.value,
    });
  }

  trackError(error: Error, fatal: boolean = false): void {
    if (!this.isEnabled) return;

    ReactGA.event({
      category: "Erro",
      action: error.name || "Error",
      label: error.message,
      value: fatal ? 1 : 0,
    });
  }
}

// Exporta uma instância singleton
export const ga4Analytics = new GA4AnalyticsService();
