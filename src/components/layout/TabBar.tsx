import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ThemeToggle } from '../ui/ThemeToggle';
import { TABBAR_ITEMS } from './nav';

/**
 * Mobile-Tab-Leiste (Handoff §7): schwebende Glas-Pille unten, Touch-Targets ≥ 52px.
 * Theme-Toggle als letztes Element (unsere „Mehr"-Ersatz).
 */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABBAR_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `tabbar__btn${isActive ? ' tabbar__btn--active' : ''}`}
          aria-label={item.label}
        >
          <Icon name={item.icon} size={23} />
          <span className="tabbar__label">{item.label}</span>
        </NavLink>
      ))}
      <ThemeToggle className="tabbar__btn tabbar__btn--toggle" />
    </nav>
  );
}
