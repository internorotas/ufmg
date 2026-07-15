import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DISMISS_KEY = 'support-banner-dismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function SupportBanner() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const navigate = useNavigate();

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed right-3 bottom-28 z-1300 flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3 py-2 text-xs text-text-primary shadow-lg backdrop-blur-sm md:bottom-6 md:right-auto md:max-w-xs"
    >
      <Heart size={14} className="shrink-0 text-brand-primary" aria-hidden="true" />
      <span className="flex-1">
        <strong>Ajude a manter o Interno Rotas.</strong> Todo apoio faz diferença.
      </span>
      <button
        type="button"
        onClick={() => navigate('/perfil?tab=apoio')}
        className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md bg-brand-primary px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary/5"
      >
        Apoiar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md border border-brand-primary/20 text-text-secondary transition-colors hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        ×
      </button>
    </div>
  );
}
