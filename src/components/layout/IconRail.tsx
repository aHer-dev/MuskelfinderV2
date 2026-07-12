import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useThemeStore } from '../../store/useThemeStore';
import { useProgressStore } from '../../store/useProgressStore';
import { xpView } from '../../persistence/xp';
import { NAV_ITEMS } from './nav';

/**
 * Desktop-Icon-Rail (Handoff §7): schwebendes Glas-Panel, 68px, radius 20px.
 * Logo themeabhängig, Icon-Nav mit aria-labels, unten Level-Ring + Theme-Toggle.
 */
export function IconRail() {
  const theme = useThemeStore((s) => s.theme);
  const totalXP = useProgressStore((s) => s.xp.totalXP);
  const xp = xpView(totalXP);
  const logo = `${import.meta.env.BASE_URL}logo/${theme === 'dark' ? 'af-logo.png' : 'af-logo-dark.png'}`;

  return (
    <nav className="rail" aria-label="Hauptnavigation">
      <NavLink to="/heute" className="rail__brand" aria-label="Anatomie Fokus — Startseite">
        <img src={logo} alt="Anatomie Fokus" width={30} height={30} />
      </NavLink>

      <div className="rail__divider" />

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
