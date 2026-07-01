import { Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DISMISS_KEY = 'login-benefits-banner-dismissed';

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function LoginBenefitsBanner() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const navigate = useNavigate();

  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed inset-x-4 bottom-28 z-1400 mx-auto flex max-w-md items-center gap-2 rounded-xl border border-info-border bg-info-bg px-3 py-2 text-xs text-info-text shadow-lg md:bottom-24"
    >
      <Zap className="size-4 shrink-0 text-info-text" aria-hidden="true" />
      <span className="flex-1">
        <strong>Posições mais rápidas.</strong> Faça login para atualizações em tempo real.
      </span>
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md bg-info-text px-2.5 text-xs font-semibold text-info-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-text focus-visible:ring-offset-2 focus-visible:ring-offset-info-bg"
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md border border-info-border text-info-text transition-colors hover:bg-info-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-text"
      >
        ×
      </button>
    </div>
  );
}
