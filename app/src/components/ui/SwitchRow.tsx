/**
 * SwitchRow - Linha de configuração booleana com switch visual
 *
 * Renderiza um botão acessível (role="switch") com label à esquerda
 * e switch iOS-style à direita. Use para campos verdadeiramente on/off.
 *
 * Para campos multi-opção (3+ escolhas), use <SegmentedControl>.
 * Para campos que ciclam entre 2+ valores com label, use <ToggleRow>.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from './Switch';

interface SwitchRowProps {
  /** Texto ou elemento de label */
  label: ReactNode;
  /** Estado atual */
  checked: boolean;
  /** Handler de clique */
  onClick: () => void;
  /** Desabilita interação */
  disabled?: boolean;
  className?: string;
}

export function SwitchRow({ label, checked, onClick, disabled, className }: SwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-card-border bg-background px-3 py-2 text-left',
        'transition-colors hover:bg-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <Switch checked={checked} disabled={disabled} />
    </button>
  );
}
