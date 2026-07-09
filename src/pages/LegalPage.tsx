import type { ReactNode } from 'react'
import './legal.css'

/** Gemeinsames Gerüst der Rechts-/Transparenz-Seiten (Quellen, Datenschutz). */
export function LegalPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string
  title: string
  lead: string
  children: ReactNode
}) {
  return (
    <section className="legal" aria-labelledby="legal-title">
      <p className="legal__eyebrow">{eyebrow}</p>
      <h1 id="legal-title" className="legal__title">
        {title}
      </h1>
      <p className="legal__lead">{lead}</p>
      <div className="legal__cards">{children}</div>
      <p className="legal__foot">© 2026 Anatomie Fokus · Muskelfinder</p>
    </section>
  )
}
