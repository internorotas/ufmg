import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InfoRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn('rounded-lg border border-card-border bg-background px-3 py-2', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm text-text-secondary">{value}</p>
    </div>
  );
}
