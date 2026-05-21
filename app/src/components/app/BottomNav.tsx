/**
 * BottomNav - Barra inferior de navegação primária
 * Aparece em páginas internas (AppShell). Substitui a falta de nav consistente
 * entre /perfil, /ranking, /sobre e /mais.
 */

import { LayoutGrid, Map as MapIcon, Trophy, UserCircle2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  matchPrefix?: string;
  anonymousTo?: string;
}

const ITEMS: BottomNavItem[] = [
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

function isItemActive(currentPath: string, item: BottomNavItem, resolvedTo: string): boolean {
  if (item.matchPrefix) {
    if (currentPath === item.matchPrefix || currentPath.startsWith(`${item.matchPrefix}/`)) {
      return true;
    }
  }
  const targets = [item.to, resolvedTo].filter(Boolean);
  return targets.some((t) => currentPath === t || currentPath.startsWith(`${t}/`));
}

export function BottomNav() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 w-full border-t border-card-border bg-sidebar/95 md:hidden',
        'backdrop-blur supports-[backdrop-filter]:bg-sidebar/80',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="mx-auto flex w-full max-w-5xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const resolvedTo = !isAuthenticated && item.anonymousTo ? item.anonymousTo : item.to;
          const active = isItemActive(location.pathname, item, resolvedTo);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={resolvedTo}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                  active ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-brand-primary transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
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
