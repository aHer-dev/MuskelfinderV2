import { useToastStore } from '../../store/useToastStore'
import { Icon } from './Icon'
import './toast.css'

/**
 * Rendert die aktiven Toasts (Gamification-Rückmeldung). Bewusst `aria-live=polite`,
 * `prefers-reduced-motion` schaltet die Einblend-Animation über theme.css ab.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          {toast.kind === 'level' && (
            <Icon name="icTrophy" size={14} className="toast__icon" />
          )}
          <span className="toast__msg">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
