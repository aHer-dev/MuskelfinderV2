import type { IconName } from '../ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Nur in der Desktop-Rail zeigen (mobile TabBar bleibt schlank; sonst via Seiten-Link erreichbar). */
  railOnly?: boolean;
}

/** Haupt-Navigation — geteilt von IconRail (Desktop) und TabBar (Mobile). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/suche', label: 'Suche', icon: 'icSearch' },
  { to: '/lernkarten', label: 'Lernkarten', icon: 'icCards' },
  { to: '/karteikasten', label: 'Karteikasten', icon: 'icList', railOnly: true },
  { to: '/quiz', label: 'Quiz', icon: 'icQuiz' },
  { to: '/statistik', label: 'Statistik', icon: 'icChart' },
];

/** Mobile-Navigation: die Rail-only-Ziele weglassen. */
export const TABBAR_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => !item.railOnly);
