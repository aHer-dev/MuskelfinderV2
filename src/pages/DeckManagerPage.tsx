import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CARD_MUSCLES, getRegions } from '../data'
import { regionLabel } from '../data/labels'
import { isDue } from '../persistence/leitner'
import { useProgressStore } from '../store/useProgressStore'
import type { RegionId } from '../types'
import { EmptyState } from '../components/ui/EmptyState'
import { JointGroupPicker } from '../components/features/deck/JointGroupPicker'
import './deck-manager.css'

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[]
/* Ein Muskel je Karten-Schluessel. Ueber `getMuscles()` (alle 150) zu laufen hiesse: fuer
   die fuenf doppelten Namen zwei Zeilen fuer EINE Karte — und „Entfernen" nimmt dann beide
   mit, weil es derselbe Schluessel ist. Siehe `isCardMuscle` in `src/data/loader.ts`. */
const ALL_MUSCLES = CARD_MUSCLES

/* Ab so vielen Karten fragt „Alle sichtbaren hinzufügen" nach. Darunter ist die Handlung
   klein genug, um sie einzeln zurückzunehmen. */
const BULK_CONFIRM_AT = 20

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
  const removeCards = useProgressStore((s) => s.removeCards)

  const [tab, setTab] = useState<RegionTab>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  /* Hier stand `useMemo(() => new Date(), [])` — beim Mount eingefroren (UX-Review
     2026-07-26). Wer die Seite über Nacht offen liess, sah morgens weiter „morgen" statt
     „fällig". Die Uhrzeit wird jetzt nachgezogen, wenn der Tab zurückkommt — kein Polling,
     denn genau das IST der Fall („ich schaue morgen wieder rein"). */
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const wake = () => setNow(new Date())
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('focus', wake)
    return () => {
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('focus', wake)
    }
  }, [])
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

  /* „Alle sichtbaren hinzufügen" trug bis zum UX-Review 2026-07-26 keine Zahl und keine
     Rückfrage — gemessen legte ein Klick 121 Karten an, und der einzige Rückweg waren 145
     einzelne „Entfernen"-Klicks. ADR 0009 verhindert, dass die APP ungefragt Karten
     anlegt; hier hat es sich der Schüler versehentlich selbst getan. Die Zahl steht jetzt
     am Knopf, und ab `BULK_CONFIRM_AT` fragt er nach. */
  function addVisible() {
    if (notInDeck.length === 0) return
    if (
      notInDeck.length >= BULK_CONFIRM_AT &&
      !confirm(
        `${notInDeck.length} Karten in den Karteikasten legen? Das ist eine ganze Weile Lernstoff — `
          + `du kannst sie unter „Im Karteikasten" wieder herausnehmen.`,
      )
    ) {
      return
    }
    addCards(notInDeck.map((m) => m.nameLatin))
    setSelected(new Set())
  }

  /** Der Rückweg. Ohne ihn ist das Massen-Hinzufügen eine Einbahnstraße. */
  function removeAllInDeck() {
    if (inDeck.length === 0) return
    if (
      confirm(
        `Alle ${inDeck.length} Karten aus dem Karteikasten nehmen? Der Lernstand dieser Karten `
          + `geht mit verloren. Die Muskeln selbst bleiben natürlich zum Nachschlagen da.`,
      )
    ) {
      removeCards(inDeck.map((m) => m.nameLatin))
    }
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
          {inDeck.length > 0 && (
            <button type="button" className="deck-remove deck-remove--all" onClick={removeAllInDeck}>
              Alle {inDeck.length} entfernen
            </button>
          )}
        </div>

        {inDeck.length === 0 ? (
          <EmptyState
            icon="icCards"
            title="Noch keine Karten"
            description="Wähle unten Muskeln aus und füge sie hinzu — einzeln oder gleich ein ganzer Bereich."
          />
        ) : (
          /* Dieselbe Regel wie bei der Faecher-Tabelle im Guide: Die Box scrollt waagerecht (auf
             dem Handy immer), also muss die Tastatur sie erreichen (WCAG 2.1.1) — sonst bleibt
             die letzte Spalte fuer Tastaturnutzer ausserhalb des Sichtfelds. */
          <div
            className="deck-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Karten in deinem Kasten"
          >
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

      {/* ── Nach Gelenk nachlegen ───────────────────────────────────────
          Beim Pruefen aufgefallen (2026-07-26): Die Gelenkwahl stand nur auf dem
          Erststart-Bildschirm, und der rendert nur bei LEEREM Kasten. Nach der ersten
          Gruppe war sie weg — wer im naechsten Kursabschnitt „Ellenbogen" dazunehmen
          wollte, musste sich die Muskeln einzeln aus 145 Kaestchen zusammenklicken.
          Ein Schueler fuellt seinen Kasten ueber ein Semester, nicht in einer Sitzung. */}
      {/* `div`, NICHT `section`: Der Picker bringt seine eigene beschriftete `section` mit.
          Zwei Landmarks mit derselben `aria-labelledby`-Id sind fuer einen Screenreader nicht
          unterscheidbar — axe meldet `landmark-unique` (von meiner eigenen Handy-Pruefung
          gefangen, 2026-07-26). Die Karte hier ist reine Optik. */}
      <div className="deck-section">
        <JointGroupPicker
          headingId="deck-gelenke"
          title="Ganze Gelenkgruppe dazulegen"
          hint="Die schnelle Art, den Kasten zu erweitern — z. B. wenn im Kurs ein neues Gelenk dran ist. Die Zahl ist, was der Klick anlegt."
        />
      </div>

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
            Alle {notInDeck.length} sichtbaren hinzufügen
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
                    <span className="deck-check__text">
                      <span className="deck-check__name">{m.nameLatin}</span>
                      <span className="deck-check__sub">{m.subregion}</span>
                    </span>
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
