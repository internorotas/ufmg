import { useCallback, useState } from 'react';
import { GA_MEASUREMENT_ID } from '@/config/analytics';
import { updateConsentState } from '@/features/auth/api/authClient';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { ga4Analytics } from '@/services/analytics';

export const ANALYTICS_CONSENT_KEY = 'rotas-analytics-consent';

export type ConsentDecision = 'accepted' | 'declined';

export function readAnalyticsConsent(): ConsentDecision | null {
  try {
    const raw = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (raw === 'accepted' || raw === 'declined') return raw;
    return null;
  } catch {
    return null;
  }
}

function writeAnalyticsConsent(value: ConsentDecision): void {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // ignore
  }
}

export function useAnalyticsConsent() {
  const { isAuthenticated } = useAuthContext();
  const [consent, setConsent] = useState<ConsentDecision | null>(readAnalyticsConsent);

  const accept = useCallback(() => {
    writeAnalyticsConsent('accepted');
    setConsent('accepted');
    if (GA_MEASUREMENT_ID) {
      ga4Analytics.grantConsent();
    }
    if (isAuthenticated) {
      void updateConsentState({ consentAnalytics: true }).catch(() => undefined);
    }
  }, [isAuthenticated]);

  const decline = useCallback(() => {
    writeAnalyticsConsent('declined');
    setConsent('declined');
    if (isAuthenticated) {
      void updateConsentState({ consentAnalytics: false }).catch(() => undefined);
    }
  }, [isAuthenticated]);

  return { consent, accept, decline };
}
