import { Trophy } from 'lucide-react';
import type { RecentPointEvent } from '@/features/profile/api/profileClient';

interface PointDeltaToastProps {
  event: RecentPointEvent | null;
}

export function PointDeltaToast({ event }: PointDeltaToastProps) {
  if (!event) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none animate-gamification-toast fixed bottom-6 right-4 z-[1500] flex max-w-80 items-start gap-3 rounded-xl border border-card-border bg-card px-4 py-3 text-sm shadow-lg"
    >
      <div className="rounded-full border border-card-border bg-background p-2 text-brand-primary">
        <Trophy size={16} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-text-primary">+{event.points} pts</p>
        <p className="text-xs text-text-secondary">{event.message}</p>
      </div>
    </div>
  );
}
