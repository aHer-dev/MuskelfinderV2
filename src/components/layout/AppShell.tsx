import type { ReactNode } from 'react';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { BrandMark } from './BrandMark';
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
 * Etappe 12b: Kopfzeile aus Marke (rechts) + Suche — und damit auf jeder Route.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();

  return (
    <div className={`shell${isDesktop ? ' shell--desktop' : ' shell--mobile'}`}>
      {isDesktop ? <IconRail /> : null}
      <div className="content">
        {/* Etappe 12b: Die Kopfzeile traegt die Marke — und weil die Shell jede Route
            umschliesst, steht sie damit auf JEDER Seite, ohne dass eine Seite etwas dafuer
            tun muss. Im DOM steht sie vor der Suche (sie ist der Kopf der Seite); auf dem
            Desktop schiebt `row-reverse` sie nach rechts, ohne die Lesereihenfolge zu drehen. */}
        <header className="topbar">
          <BrandMark />
          {/* Etappe 7d: Nachschlagen ist von jeder Route aus einen Griff entfernt. */}
          <HeaderSearch />
        </header>
        <main className="content__main">{children}</main>
        <SiteFooter />
      </div>
      {!isDesktop ? <TabBar /> : null}
      <ToastHost />
    </div>
  );
}
