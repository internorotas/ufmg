import { LayoutGrid, Map as MapIcon, Trophy, UserCircle2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export interface NavItem {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  matchPrefix?: string;
  anonymousTo?: string;
}

export const NAV_ITEMS: NavItem[] = [
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
