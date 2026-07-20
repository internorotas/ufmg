import { FlaskConical } from 'lucide-react';
import { useCallback, useState } from 'react';
import { SystemBanner } from './SystemBanner';

const STORAGE_KEY = 'beta_banner_dismissed';

function isDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(isDismissed);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <SystemBanner
      variant="warning"
      icon={<FlaskConical className="size-4.5" aria-hidden="true" />}
      title="Ambiente em teste"
      onDismiss={handleDismiss}
      description="Estamos em versão beta. O ambiente pode ficar indisponível ou apresentar oscilações. Agradecemos sua compreensão."
    />
  );
}
