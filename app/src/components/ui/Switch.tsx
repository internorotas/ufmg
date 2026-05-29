/**
 * Switch - Toggle visual estilo iOS
 *
 * Puramente visual — não possui evento próprio. O controle de interação
 * fica no componente pai (botão com role="switch" + aria-checked).
 *
 * Uso típico: envolver com <SwitchRow> ou qualquer botão com role="switch".
 */

import { cn } from '@/lib/utils';

interface SwitchProps {
  /** Estado do switch */
  checked: boolean;
  /** Reduz opacidade visualmente */
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, disabled, className }: SwitchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full',
        'transition-colors duration-150 ease-in-out',
        checked
          ? 'bg-success-border dark:bg-success-border'
          : 'bg-neutral-border dark:bg-neutral-border',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0',
          'transform transition-transform duration-150 ease-in-out',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )}
      />
    </span>
  );
}
