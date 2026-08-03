/**
 * NavRail - Trilha de navegação vertical para desktop
 *
 * Equivalente à BottomNav (mobile), porém adaptada para layout md+: rail
 * vertical fixo à esquerda da viewport. Compartilha o mesmo conjunto de rotas
 * primárias (Mapa, Linhas, Próximos, Ranking, Perfil, Mais).
 */

import { Link, useLocation } from 'react-router-dom';
import { isNavItemActive, NAV_ITEMS } from '@/components/app/navItems';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cn } from '@/lib/utils';

export function NavRail() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'hidden md:flex md:w-20 md:shrink-0 md:flex-col md:items-stretch',
        'md:border-r md:border-(--card-border) md:bg-sidebar',
      )}
    >
      <nav aria-label="Páginas principais" className="mt-4 flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const resolvedTo = !isAuthenticated && item.anonymousTo ? item.anonymousTo : item.to;
          const active = isNavItemActive(location.pathname, item, resolvedTo);
          return (
            <Link
              key={item.to}
              to={resolvedTo}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-(--shape-md) px-2 py-3 text-tiny font-medium',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:focus-visible:ring-brand-accent',
                active
                  ? 'bg-brand-primary/12 text-brand-primary shadow-(--elevation-1) dark:bg-brand-accent/12 dark:text-brand-accent'
                  : 'text-text-secondary hover:bg-card-hover hover:text-text-primary',
              )}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
