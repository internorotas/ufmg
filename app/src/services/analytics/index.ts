/**
 * Barrel export para o módulo de analytics.
 */

export type {
  IAnalyticsService,
  AnalyticsEvent,
  TimingEvent,
  PageViewEvent,
  EventCategory,
} from "./IAnalyticsService";

export { GA4AnalyticsService, ga4Analytics } from "./GA4AnalyticsService";
