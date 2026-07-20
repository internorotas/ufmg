import { Trophy, X } from 'lucide-react';
import type { RecentPointEvent } from '@/features/profile/api/profileClient';

interface PointDeltaToastProps {
  event: RecentPointEvent | null;
  onDismiss: () => void;
}

export function PointDeltaToast({ event, onDismiss }: PointDeltaToastProps) {
  if (!event) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-gamification-toast fixed bottom-6 right-4 z-(--z-toast) flex max-w-80 items-start gap-3 surface-card-lg bg-card px-4 py-3 text-sm"
    >
      <div className="surface-card-sm bg-background p-2 text-brand-primary">
        <Trophy size={16} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-primary">+{event.points} pts</p>
        <p className="text-xs text-text-secondary">{event.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar notificação de pontos"
        className="shrink-0 text-text-tertiary hover:text-text-secondary"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
