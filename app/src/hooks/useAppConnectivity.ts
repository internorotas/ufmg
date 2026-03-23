import { useEffect, useRef, useState } from 'react';
import { useAnalytics } from './useAnalytics';

interface UseAppConnectivityReturn {
  isOffline: boolean;
  showOfflineToast: boolean;
}

export function useAppConnectivity(): UseAppConnectivityReturn {
  const { trackEvent } = useAnalytics();
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const offlineToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.onLine) {
      trackEvent({
        event: 'app_opened_offline',
        category: 'navigation',
        action: 'app_opened_offline',
      });
    }
  }, [trackEvent]);

  useEffect(() => {
    const clearOfflineToastTimeout = () => {
      if (offlineToastTimeoutRef.current !== null) {
        window.clearTimeout(offlineToastTimeoutRef.current);
        offlineToastTimeoutRef.current = null;
      }
    };

    const onOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      trackEvent({
        event: 'offline_mode_detected',
        category: 'navigation',
        action: 'offline_mode_detected',
      });
      clearOfflineToastTimeout();
      offlineToastTimeoutRef.current = window.setTimeout(() => {
        setShowOfflineToast(false);
      }, 4500);
    };

    const onOnline = () => {
      setIsOffline(false);
    };

    const onAppInstalled = () => {
      trackEvent({
        event: 'app_installed',
        category: 'engagement',
        action: 'app_installed',
      });
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearOfflineToastTimeout();
    };
  }, [trackEvent]);

  return {
    isOffline,
    showOfflineToast,
  };
}
