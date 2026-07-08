import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import type { IconName } from '../ui/Icon'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useThemeStore } from '../../store/useThemeStore'
import './AppShell.css'

/*
 * SKELETT (Etappe 0): strukturelle App-Hülle mit Navigation + Theme-Toggle.
 * Bewusst NICHT pixelgenau — Glassmorphism/Rail/TabBar-Feinschliff kommt in Etappe 4.
 */

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const NAV: NavItem[] = [
  { to: '/suche', label: 'Suche', icon: 'icSearch' },
  { to: '/lernkarten', label: 'Lernkarten', icon: 'icCards' },
  { to: '/quiz', label: 'Quiz', icon: 'icQuiz' },
  { to: '/statistik', label: 'Statistik', icon: 'icChart' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme)
  // Logo themeabhängig (Handoff §15): heller Grund → anthrazites Logo, dunkler Grund → helles Logo.
  const logo = `${import.meta.env.BASE_URL}logo/${theme === 'dark' ? 'af-logo.png' : 'af-logo-dark.png'}`

  return (
    <div className="shell">
      <nav className="rail" aria-label="Hauptnavigation">
        <div className="rail__brand">
          <img src={logo} alt="Anatomie Fokus" width={28} height={28} />
          <span className="rail__wordmark">
            Anatomie<strong>Fokus</strong>
          </span>
        </div>

        <ul className="rail__nav">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="rail__foot">
          <ThemeToggle className="rail__icon-btn" />
        </div>
      </nav>

      <main className="content">{children}</main>
    </div>
  )
}
