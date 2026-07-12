import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './empty-state.css'

interface EmptyStateProps {
  icon: IconName
  title: string
  /** Erklärt, warum hier nichts steht — und was der nächste Schritt ist. */
  description: ReactNode
  /** Genau eine primäre Handlung; ohne CTA ist ein Leerzustand eine Sackgasse. */
  action?: ReactNode
  /** `1`, wenn der Leerzustand die ganze Seite ist (404) — jede Seite braucht ein h1. */
  headingLevel?: 1 | 2
}

/**
 * Leerzustand für Seiten ohne Inhalt (kein Treffer, leerer Karteikasten, 404).
 * Bewusst ein gemeinsames Primitive: die drei Fälle unterschieden sich vorher nur
 * darin, wie beiläufig sie formuliert waren.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <Heading className="empty-state__title">{title}</Heading>
      <p className="empty-state__text">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
