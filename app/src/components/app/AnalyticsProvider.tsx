import type { ReactNode } from 'react';
import { useAnalyticsAutoTracking } from '../../hooks/useAnalyticsAutoTracking';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useAnalyticsAutoTracking();
  return <>{children}</>;
}
