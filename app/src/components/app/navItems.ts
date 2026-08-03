import { Bus, LayoutGrid, Map as MapIcon, Navigation, Trophy, UserCircle2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export interface NavItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  matchPrefix?: string;
  anonymousTo?: string;
}

/** Decide se um item de navegação corresponde à rota atual — usado por NavRail e BottomNav. */
export function isNavItemActive(currentPath: string, item: NavItem, resolvedTo: string): boolean {
  if (item.matchPrefix) {
    if (currentPath === item.matchPrefix || currentPath.startsWith(`${item.matchPrefix}/`)) {
      return true;
    }
  }
  const targets = [item.to, resolvedTo].filter(Boolean);
  return targets.some((t) => currentPath === t || currentPath.startsWith(`${t}/`));
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: MapIcon, label: 'Mapa' },
  { to: '/linhas', icon: Bus, label: 'Linhas', matchPrefix: '/linhas' },
  {
    to: '/proximos',
    icon: Navigation,
    label: 'Próximos',
    matchPrefix: '/proximos',
  },
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
