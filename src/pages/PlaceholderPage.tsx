import type { ReactNode } from 'react'
import './pages.css'

/** Gemeinsames Gerüst der Etappe-0-Platzhalterseiten. */
export function PlaceholderPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="page">
      <p className="page__eyebrow">Etappe 0 · Grundgerüst</p>
      <h1 className="page__title">{title}</h1>
      <div className="page__body">{children ?? <p>Inhalt folgt in einer späteren Etappe.</p>}</div>
    </section>
  )
}
