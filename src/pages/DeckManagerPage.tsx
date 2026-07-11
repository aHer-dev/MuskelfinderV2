import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMuscles, getRegions } from '../data'
import { regionLabel } from '../data/labels'
import { isDue } from '../persistence/leitner'
import { useProgressStore } from '../store/useProgressStore'
import type { RegionId } from '../types'
import './deck-manager.css'

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[]
const ALL_MUSCLES = getMuscles()

type RegionTab = RegionId | 'all'

/** Fällig-Anzeige für die In-Deck-Tabelle: „fällig" oder Restdauer bis nextDue. */
function dueLabel(nextDue: string, difficult: boolean, now: Date): string {
  if (difficult) return 'markiert'
  const due = new Date(nextDue)
  if (due <= now) return 'fällig'
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
  if (days <= 1) return 'morgen'
  return `in ${days} T`
}

/**
 * Karteikasten-Verwaltung (V1 `muscle-selection.html` nachgebaut, Etappe 6): oben die Karten
 * im Kasten (Muskel · Bereich · Fach · Fällig · Entfernen), unten Bulk-Hinzufügen mit
 * Suche + Region-Tabs + Checkboxen. Nutzt die vorhandene Deck-API des Progress-Stores.
 */
export function DeckManagerPage() {
  const cards = useProgressStore((s) => s.flashcards.cards)
  const addCards = useProgressStore((s) => s.addCards)
  const removeCard = useProgressStore((s) => s.removeCard)

  const [tab, setTab] = useState<RegionTab>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const now = useMemo(() => new Date(), [])
  const q = query.trim().toLowerCase()

  const inDeck = useMemo(
    () =>
      ALL_MUSCLES.filter((m) => m.nameLatin in cards).sort((a, b) =>
        a.nameLatin.localeCompare(b.nameLatin, 'de'),
      ),
    [cards],
  )

  const notInDeck = useMemo(
    () =>
      ALL_MUSCLES.filter(
        (m) =>
          !(m.nameLatin in cards) &&
          (tab === 'all' || m.region === tab) &&
          (q === '' ||
            m.nameLatin.toLowerCase().includes(q) ||
            m.subregion.toLowerCase().includes(q)),
      ).sort((a, b) => a.nameLatin.localeCompare(b.nameLatin, 'de')),
    [cards, tab, q],
  )

  const notInDeckTotal = ALL_MUSCLES.length - inDeck.length

  function toggleSelected(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function addSelected() {
    if (selected.size === 0) return
    addCards([...selected])
    setSelected(new Set())
  }

  function addVisible() {
    if (notInDeck.length === 0) return
    addCards(notInDeck.map((m) => m.nameLatin))
    setSelected(new Set())
  }

  return (
    <section className="page deck-manager">
      <header className="deck-manager__header">
        <p className="page__eyebrow">Karteikasten</p>
        <h1 className="page__title">Muskeln verwalten</h1>
        <Link to="/lernkarten" className="deck-manager__back">
          ← Zu den Lernkarten
        </Link>
      </header>

      {/* ── Im Karteikasten ─────────────────────────────────────────── */}
      <section className="deck-section" aria-labelledby="in-deck-title">
        <div className="deck-section__head">
          <h2 id="in-deck-title" className="deck-section__title">
            Im Karteikasten
          </h2>
          <span className="deck-count">{inDeck.length}</span>
        </div>

        {inDeck.length === 0 ? (
          <p className="deck-empty">
            Noch keine Muskeln im Karteikasten. Füge unten welche hinzu.
          </p>
        ) : (
          <div className="deck-table-wrap">
            <table className="deck-table">
              <thead>
                <tr>
                  <th scope="col">Muskel</th>
                  <th scope="col">Bereich</th>
                  <th scope="col">Fach</th>
                  <th scope="col">Fällig</th>
                  <th scope="col">
                    <span className="visually-hidden">Aktion</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inDeck.map((m) => {
                  const card = cards[m.nameLatin]
                  const due = isDue(card, now)
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link to={`/muskel/${m.id}`} className="deck-table__link">
                          {m.nameLatin}
                        </Link>
                      </td>
                      <td className="deck-table__muted">{regionLabel(m.region)}</td>
                      <td>
                        <span className="deck-fach">F{card.fach}</span>
                      </td>
                      <td>
                        <span className={`deck-due${due ? ' deck-due--now' : ''}`}>
                          {dueLabel(card.nextDue, card.difficult, now)}
                        </span>
                      </td>
                      <td className="deck-table__action">
                        <button
                          type="button"
                          className="deck-remove"
                          onClick={() => removeCard(m.nameLatin)}
                          aria-label={`${m.nameLatin} aus Karteikasten entfernen`}
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Noch nicht im Karteikasten ──────────────────────────────── */}
      <section className="deck-section" aria-labelledby="add-title">
        <div className="deck-section__head">
          <h2 id="add-title" className="deck-section__title">
            Noch nicht im Karteikasten
          </h2>
          <span className="deck-count">{notInDeckTotal}</span>
        </div>

        <div className="deck-add-bar">
          <button
            type="button"
            className="btn btn--primary"
            onClick={addSelected}
            disabled={selected.size === 0}
          >
            Ausgewählte hinzufügen ({selected.size})
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={addVisible}
            disabled={notInDeck.length === 0}
          >
            Alle sichtbaren hinzufügen
          </button>
        </div>

        <div className="deck-filter">
          <input
            type="search"
            className="deck-search"
            placeholder="Muskel suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Muskel im Zugang suchen"
          />
          <div className="deck-tabs" role="tablist" aria-label="Nach Region filtern">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={`chip${tab === 'all' ? ' chip--active' : ''}`}
              onClick={() => setTab('all')}
            >
              Alle
            </button>
            {REGION_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={tab === r}
                className={`chip${tab === r ? ' chip--active' : ''}`}
                onClick={() => setTab(r)}
              >
                {regionLabel(r)}
              </button>
            ))}
          </div>
        </div>

        {notInDeck.length === 0 ? (
          <p className="deck-empty">Keine Muskeln passen zu Filter/Suche.</p>
        ) : (
          <ul className="deck-checklist">
            {notInDeck.map((m) => {
              const checked = selected.has(m.nameLatin)
              return (
                <li key={m.id}>
                  <label className={`deck-check${checked ? ' deck-check--on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelected(m.nameLatin)}
                    />
                    <span className="deck-check__name">{m.nameLatin}</span>
                    <span className="deck-check__sub">{m.subregion}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </section>
  )
}
