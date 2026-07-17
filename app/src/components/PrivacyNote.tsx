import { Shield } from 'lucide-react';
import type { ReactNode } from 'react';

interface PrivacyNoteProps {
  children?: ReactNode;
  className?: string;
}

export function PrivacyNote({ children, className }: PrivacyNoteProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg bg-background-secondary px-3 py-2.5 text-xs text-text-secondary ${className ?? ''}`}
    >
      <Shield size={14} className="mt-0.5 shrink-0 text-text-tertiary" aria-hidden="true" />
      <span className="leading-relaxed">
        {children ??
          'Sua localização só é enviada quando você ativa o rastreio. As coordenadas brutas são descartadas em até 24h.'}
      </span>
    </div>
  );
}
