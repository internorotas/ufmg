import type { ReactNode } from 'react';
import { useAnalyticsAutoTracking } from '../../hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useAnalyticsAutoTracking();
  return <>{children}</>;
}
