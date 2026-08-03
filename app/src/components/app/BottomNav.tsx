/**
 * BottomNav - Barra inferior de navegação primária
 * Aparece em páginas internas (AppShell). Substitui a falta de nav consistente
 * entre /perfil, /ranking, /sobre e /mais.
 */

import { Link, useLocation } from 'react-router-dom';
import { isNavItemActive, NAV_ITEMS } from '@/components/app/navItems';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { trackEvent } = useAnalytics();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-(--z-bottom-nav) w-full border-t border-(--card-border) bg-sidebar shadow-[0_-4px_16px_rgba(0,0,0,0.12)] md:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="mx-auto flex w-full max-w-5xl items-stretch justify-around gap-1 p-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const resolvedTo = !isAuthenticated && item.anonymousTo ? item.anonymousTo : item.to;
          const active = isNavItemActive(location.pathname, item, resolvedTo);
          return (
            <li key={item.to} className="min-w-0 flex-1">
              <Link
                to={resolvedTo}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (!active)
                    trackEvent({
                      event: 'nav_item_clicked',
                      category: 'navigation',
                      action: 'nav_item_clicked',
                      label: item.label,
                    });
                }}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-(--shape-md) px-2 py-2 text-xs font-medium',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:focus-visible:ring-brand-accent',
                  active
                    ? 'bg-brand-primary/12 text-brand-primary shadow-(--elevation-1) dark:bg-brand-accent/12 dark:text-brand-accent'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
