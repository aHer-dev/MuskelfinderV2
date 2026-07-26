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
      {/* Sprungmarke (UX-Review 2026-07-26): Gemessen lagen auf `/suche` **sieben**
          Tab-Stopps zwischen dem Seitenanfang und dem Inhalt — Icon-Rail und
          Kopfzeilen-Suche stehen auf JEDER Route, also zahlt eine Tastaturnutzerin sie
          jedes Mal neu. axe schweigt dazu (die Landmarks erfüllen 2.4.1 formal), und genau
          darum fällt so etwas nur beim Durchtabben auf. Der Link ist der erste Tab-Stopp
          und nur dann sichtbar (siehe `.skip-link` in AppShell.css). */}
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>
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
        {/* `tabIndex={-1}`: Ohne ihn springt der Browser zwar hin, setzt den FOKUS aber
            nicht — die nächste Tab-Taste landete wieder oben in der Rail, und der Sprung
            wäre wirkungslos gewesen. */}
        <main className="content__main" id="inhalt" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </div>
      {!isDesktop ? <TabBar /> : null}
      <ToastHost />
    </div>
  );
}
