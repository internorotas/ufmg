/**
 * NavRail - Trilha de navegação vertical para desktop
 *
 * Equivalente à BottomNav (mobile), porém adaptada para layout md+: rail
 * vertical fixo à esquerda da viewport. Compartilha o mesmo conjunto de rotas
 * primárias (Mapa, Ranking, Perfil, Mais).
 */

import { LayoutGrid, Map as MapIcon, Trophy, UserCircle2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cn } from '@/lib/utils';

interface NavRailItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  matchPrefix?: string;
  anonymousTo?: string;
}

const ITEMS: NavRailItem[] = [
  { to: '/', icon: MapIcon, label: 'Mapa' },
  { to: '/ranking', icon: Trophy, label: 'Ranking', matchPrefix: '/ranking' },
  {
    to: '/perfil',
    icon: UserCircle2,
    label: 'Perfil',
    matchPrefix: '/perfil',
    anonymousTo: '/login',
  },
  { to: '/mais', icon: LayoutGrid, label: 'Mais', matchPrefix: '/mais' },
];

function isItemActive(currentPath: string, item: NavRailItem): boolean {
  if (item.matchPrefix) {
    return currentPath === item.matchPrefix || currentPath.startsWith(`${item.matchPrefix}/`);
  }
  return currentPath === item.to;
}

export function NavRail() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'hidden md:flex md:w-20 md:shrink-0 md:flex-col md:items-stretch',
        'md:border-r md:border-card-border md:bg-sidebar/95',
        'md:backdrop-blur md:supports-[backdrop-filter]:bg-sidebar/80',
      )}
    >
      <nav aria-label="Páginas principais" className="mt-4 flex flex-1 flex-col gap-1 px-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(location.pathname, item);
          const resolvedTo = !isAuthenticated && item.anonymousTo ? item.anonymousTo : item.to;
          return (
            <Link
              key={item.to}
              to={resolvedTo}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                active
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-text-secondary hover:bg-card-hover hover:text-text-primary',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-primary transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
