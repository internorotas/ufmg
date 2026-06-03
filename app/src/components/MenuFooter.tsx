import { Heart } from 'lucide-react';
import type { ComponentProps } from 'react';
import { tv } from 'tailwind-variants';

import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

const appVersion = import.meta.env.VITE_APP_VERSION;

export const footerContainerVariants = tv({
  base: [
    'shrink-0 border-t px-3 py-2 sm:px-4',
    'border-card-border bg-sidebar transition-colors',
    'overflow-x-hidden',
  ],
});

export const creditLinkVariants = tv({
  base: [
    'flex items-center justify-center gap-1.5 py-1 cursor-pointer',
    'text-xs font-bold text-text-secondary transition-colors',
    'hover:text-text-primary',
  ],
});

export interface MenuFooterProps extends ComponentProps<'div'> {}

export function MenuFooter({ className, ...props }: MenuFooterProps) {
  const analytics = useAnalytics();

  return (
    <div data-slot="footer" className={cn(footerContainerVariants(), className)} {...props}>
      <div className="flex flex-row flex-wrap items-center justify-center gap-1 text-center">
        <a
          href="https://github.com/igormartins4"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            analytics.trackEvent({
              category: 'navigation',
              action: 'click_outbound_link',
              label: 'Dev Profile',
            })
          }
          aria-label="Perfil do desenvolvedor Igor Martins no GitHub (abre em nova aba)"
          className={creditLinkVariants()}
        >
          Desenvolvido com
          <Heart size={14} fill="currentColor" className="text-red-500" aria-hidden="true" />
          por Igor Martins
        </a>
        {appVersion && (
          <span className="text-xs font-semibold text-text-tertiary"> / v{appVersion}</span>
        )}
      </div>
    </div>
  );
}
