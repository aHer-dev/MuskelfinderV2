import type { IconName } from '../ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** Haupt-Navigation — geteilt von IconRail (Desktop) und TabBar (Mobile). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/suche', label: 'Suche', icon: 'icSearch' },
  { to: '/lernkarten', label: 'Lernkarten', icon: 'icCards' },
  { to: '/quiz', label: 'Quiz', icon: 'icQuiz' },
  { to: '/statistik', label: 'Statistik', icon: 'icChart' },
];
