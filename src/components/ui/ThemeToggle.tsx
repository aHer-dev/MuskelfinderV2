import { Icon } from './Icon'
import { useThemeStore } from '../../store/useThemeStore'

/** Sonne/Mond-Umschalter. Schreibt in den (persistierten) Theme-Store. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((state) => state.theme)
  const toggle = useThemeStore((state) => state.toggle)
  const goDark = theme === 'light'

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={goDark ? 'Zu dunklem Design wechseln' : 'Zu hellem Design wechseln'}
      title={goDark ? 'Dunkles Design' : 'Helles Design'}
    >
      <Icon name={goDark ? 'icMoon' : 'icSun'} size={22} />
    </button>
  )
}
