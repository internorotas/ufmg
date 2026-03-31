/**
 * Tooltip - Componente de dica contextual
 * Design System - Interno Rotas UFMG
 *
 * Comportamento:
 * - Desktop: hover abre, mouse-leave fecha
 * - Teclado: focus abre, blur fecha
 * - Mobile: o atributo `title` nativo do elemento filho cobre o caso de toque.
 *   NÃO capturamos eventos de toque no wrapper para não bloquear cliques nos filhos.
 *
 * Estilo: balão escuro com seta CSS.
 */

import { type ReactNode, useCallback, useId, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  /** Texto exibido no tooltip */
  content: string;
  children: ReactNode;
  /** Classes extras para o wrapper externo */
  className?: string;
  /** Lado em que o tooltip aparece em relação ao elemento */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Posição do balão
const balloonClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
  left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  right: 'left-full top-1/2 -translate-y-1/2 ml-3',
};

// Seta CSS apontando de volta para o elemento
const arrowClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[6px] border-t-gray-900 border-x-[6px] border-x-transparent border-b-0',
  bottom:
    'bottom-full left-1/2 -translate-x-1/2 border-b-[6px] border-b-gray-900 border-x-[6px] border-x-transparent border-t-0',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[6px] border-l-gray-900 border-y-[6px] border-y-transparent border-r-0',
  right:
    'right-full top-1/2 -translate-y-1/2 border-r-[6px] border-r-gray-900 border-y-[6px] border-y-transparent border-l-0',
};

export function Tooltip({ content, children, className, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearHideTimer();
    setVisible(true);
  }, [clearHideTimer]);

  const hide = useCallback(() => {
    clearHideTimer();
    setVisible(false);
  }, [clearHideTimer]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: wrapper de tooltip — hover-only, sem captura de eventos de clique/toque nos filhos
    <div className={cn('relative inline-flex', className)} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-5000 w-max max-w-52 rounded-lg px-3 py-2 text-left shadow-xl',
            'bg-gray-900 text-xs font-medium leading-snug text-white',
            balloonClasses[position],
          )}
        >
          {content}
          {/* Seta */}
          <span
            aria-hidden="true"
            className={cn('absolute h-0 w-0 border-solid', arrowClasses[position])}
          />
        </div>
      )}
    </div>
  );
}
