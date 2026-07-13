import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useProgressStore } from '../../store/useProgressStore';
import { xpView } from '../../persistence/xp';
import { NAV_ITEMS } from './nav';

/**
 * Desktop-Icon-Rail (Handoff §7): schwebendes Glas-Panel, 68px, radius 20px.
 * Icon-Nav mit aria-labels, unten Level-Ring + Theme-Toggle.
 *
 * Das Logo stand bis Etappe 12b hier oben — ohne Namen, und auf dem Handy gab es die Rail
 * gar nicht. Es sitzt jetzt als Wortmarke in der Kopfzeile (`BrandMark`) und damit auf jeder
 * Seite. Zweimal dasselbe Zeichen auf einem Bildschirm waere kein Branding, sondern ein
 * Versehen — und der Weg nach Hause fehlt hier nicht: „Heute" ist der erste Nav-Punkt.
 */
export function IconRail() {
  const totalXP = useProgressStore((s) => s.xp.totalXP);
  const xp = xpView(totalXP);

  return (
    <nav className="rail" aria-label="Hauptnavigation">
      <ul className="rail__nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              title={item.label}
              className={({ isActive }) => `rail-btn${isActive ? ' rail-btn--active' : ''}`}
            >
              <Icon name={item.icon} size={22} title={item.label} />
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="rail__foot">
        <NavLink
          to="/statistik"
          className="rail__level"
          title={`Level ${xp.level}`}
          aria-label={`Level ${xp.level} — zur Statistik`}
        >
          <ProgressRing value={xp.progress} size={40} stroke={4} centerValue={String(xp.level)} />
        </NavLink>
        <ThemeToggle className="rail-btn" />
      </div>
    </nav>
  );
}
