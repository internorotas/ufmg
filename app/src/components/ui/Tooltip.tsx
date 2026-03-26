/**
 * Tooltip - Componente de dica contextual
 * Design System - Interno Rotas UFMG
 *
 * Comportamento:
 * - Desktop: aparece no hover do mouse
 * - Mobile: aparece ao pressionar e segurar por 500ms, some após 1.5s
 */

import { useCallback, useRef, useState, type ReactNode } from 'react';
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

const positionClasses: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, children, className, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    clearHideTimer();
    setVisible(false);
  }, [clearHideTimer]);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setVisible(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Auto-esconde 1.5s após soltar o dedo
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, 1500);
  }, []);

  return (
    <div
      className={cn('relative inline-flex select-none', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-5000 w-max max-w-45 rounded-md px-2.5 py-1.5 text-center',
            'bg-gray-900/95 text-xs font-medium leading-tight text-white shadow-lg',
            'dark:bg-gray-700/95',
            positionClasses[position],
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
