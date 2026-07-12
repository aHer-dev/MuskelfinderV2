import type { ReactNode } from 'react';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { HeaderSearch } from './HeaderSearch';
import { IconRail } from './IconRail';
import { TabBar } from './TabBar';
import { SiteFooter } from './SiteFooter';
import { ToastHost } from '../ui/ToastHost';
import './AppShell.css';

/*
 * AppShell (Etappe 4, Handoff §7): schwebende Glas-Icon-Rail links ab ≥lg,
 * darunter mobile Glas-Tab-Leiste unten. Hintergrund = Bühnen-Radial.
 * Umschaltung über useMediaQuery (§14). Medien-Fenster bleiben in beiden Themes dunkel.
 * Etappe 5: globaler Footer (Attribution + Legal-Links) unter dem Seiteninhalt.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();

  return (
    <div className={`shell${isDesktop ? ' shell--desktop' : ' shell--mobile'}`}>
      {isDesktop ? <IconRail /> : null}
      <div className="content">
        {/* Etappe 7d: Nachschlagen ist von jeder Route aus einen Griff entfernt. */}
        <HeaderSearch />
        <main className="content__main">{children}</main>
        <SiteFooter />
      </div>
      {!isDesktop ? <TabBar /> : null}
      <ToastHost />
    </div>
  );
}
