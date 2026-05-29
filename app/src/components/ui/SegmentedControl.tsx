/**
 * SegmentedControl - Seletor de múltiplas opções com chips inline
 *
 * Exibe N opções em botões lado a lado. A opção ativa fica com fundo
 * sólido brand-primary; as inativas ficam em fundo neutro.
 *
 * Use para campos com 2–4 opções curtas (ex: Mínimo / Normal / Tudo).
 * Para booleanos (on/off), use <SwitchRow>.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  /** Opções disponíveis */
  options: SegmentOption<T>[];
  /** Valor selecionado no momento */
  value: T;
  /** Callback ao selecionar uma opção */
  onChange: (value: T) => void;
  /** Desabilita toda a interação */
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        'flex gap-1 rounded-lg border border-card-border bg-background-secondary p-1',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background-secondary',
              isActive
                ? 'bg-brand-primary text-text-inverse shadow-sm'
                : 'text-text-secondary hover:bg-card-hover hover:text-text-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
