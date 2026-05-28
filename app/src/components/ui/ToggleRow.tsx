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
        'flex min-h-11 w-full items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2 text-left hover:bg-card-hover',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-sm font-medium">{label}</span>
      {trailing}
    </button>
  );
}
