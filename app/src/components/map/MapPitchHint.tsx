import { Hand } from 'lucide-react';
import { useEffect, useState } from 'react';

const HINT_KEY = 'maplibre-pitch-hint-shown';

interface MapPitchHintProps {
  visible: boolean;
}

export function MapPitchHint({ visible }: MapPitchHintProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    try {
      if (localStorage.getItem(HINT_KEY) === 'true') return;
    } catch {}
    setShown(true);
    const t = window.setTimeout(() => {
      setShown(false);
      try {
        localStorage.setItem(HINT_KEY, 'true');
      } catch {}
    }, 4500);
    return () => clearTimeout(t);
  }, [visible]);

  if (!shown) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-36 z-1000 flex justify-center px-4"
    >
      <button
        type="button"
        onClick={() => setShown(false)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/95 px-4 py-2.5 shadow-(--elevation-2) ring-1 ring-card-border backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label="Fechar dica de gestos"
      >
        <Hand
          className="h-4 w-4 shrink-0 text-brand-primary dark:text-brand-accent"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-text-primary">
          Use dois dedos para inclinar e girar
        </span>
      </button>
    </div>
  );
}
