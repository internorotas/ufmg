/**
 * Interface de abstração para serviços de Analytics.
 * Permite troca fácil de biblioteca no futuro (Adapter Pattern).
 */

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

export interface PageViewEvent {
  path?: string;
  title?: string;
}

/**
 * Interface que define o contrato para qualquer serviço de analytics.
 * Implementações podem ser GA4, Mixpanel, Amplitude, etc.
 */
export interface IAnalyticsService {
  /** Verifica se o serviço está habilitado */
  readonly isEnabled: boolean;

  /** Inicializa o serviço de analytics */
  initialize(): void;

  /** Envia um evento customizado */
  trackEvent(event: AnalyticsEvent): void;

  /** Envia um pageview */
  trackPageView(event?: PageViewEvent): void;

  /** Define uma propriedade do usuário */
  setUserProperty(property: string, value: string): void;

  /** Rastreia métricas de performance/timing */
  trackTiming(timing: TimingEvent): void;

  /** Rastreia erros/exceções */
  trackError(error: Error, fatal?: boolean): void;
}
