import type { IconName } from '../ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/**
 * Haupt-Navigation — geteilt von IconRail (Desktop) und TabBar (Mobile).
 *
 * Vier Absichten statt sechs gleichrangiger Werkzeuge (ADR 0007): Was ist heute
 * dran · Was suche ich · Wie lerne ich · Wo stehe ich. Karteikasten und Quiz
 * verlieren nur den Tab-Rang, nicht die Erreichbarkeit — sie hängen an ihren
 * Zielseiten (Karteikasten unter Fortschritt, Quiz unter Lernen) und bleiben
 * als Routen deep-linkbar.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/heute', label: 'Heute', icon: 'icTarget' },
  { to: '/suche', label: 'Suche', icon: 'icSearch' },
  { to: '/lernkarten', label: 'Lernen', icon: 'icCards' },
  { to: '/statistik', label: 'Fortschritt', icon: 'icChart' },
];
