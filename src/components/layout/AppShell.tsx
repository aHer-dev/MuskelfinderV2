import type { ReactNode } from 'react';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { IconRail } from './IconRail';
import { TabBar } from './TabBar';
import './AppShell.css';

/*
 * AppShell (Etappe 4, Handoff §7): schwebende Glas-Icon-Rail links ab ≥lg,
 * darunter mobile Glas-Tab-Leiste unten. Hintergrund = Bühnen-Radial.
 * Umschaltung über useMediaQuery (§14). Medien-Fenster bleiben in beiden Themes dunkel.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();

  return (
    <div className={`shell${isDesktop ? ' shell--desktop' : ' shell--mobile'}`}>
      {isDesktop ? <IconRail /> : null}
      <main className="content">{children}</main>
      {!isDesktop ? <TabBar /> : null}
    </div>
  );
}
