import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToggleRowProps {
  label: ReactNode;
  trailing: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleRow({ label, trailing, onClick, disabled, className }: ToggleRowProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-card-border bg-background px-3 py-2 text-left',
        'transition-colors hover:bg-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <span className="flex shrink-0 items-center gap-1.5">{trailing}</span>
    </button>
  );
}
