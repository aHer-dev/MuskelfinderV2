import { Link } from 'react-router-dom';
import type { Badge } from '../../../data/badges';
import type { PracticeSelection } from '../../../data/practice';
import { Icon } from '../../ui/Icon';
import { PracticeCta } from './PracticeCta';

export interface BadgeRow {
  badge: Badge;
  /** Der Weg zum Abzeichen (`groupPractice`) — leer, wenn es verdient ist. */
  selection: PracticeSelection;
}

interface BadgePanelProps {
  rows: readonly BadgeRow[];
  /** Legt die fehlenden Karten an und startet die Sitzung damit. */
  onPractice: (names: string[]) => void;
}

/**
 * Kompetenz-Abzeichen (9b) — verdient wird Können, nicht Anwesenheit.
 *
 * Der Fortschritt ist der interessante Teil, nicht der Pokal: Die noch offenen stehen
 * oben (die am weitesten fortgeschrittenen zuerst), und **neben jedem steht der Knopf,
 * der dorthin führt** (keine Zahl ohne Knopf — Regel aus 8c).
 */
export function BadgePanel({ rows, onPractice }: BadgePanelProps) {
  if (rows.length === 0) return null;

  const earned = rows.filter((r) => r.badge.earned).length;

  return (
    <section className="stats__panel stats__panel--wide">
      <h2>Kompetenz-Abzeichen</h2>
      <p className="stats__panel-sub">
        {earned} von {rows.length} verdient. Ein Abzeichen gibt es, wenn <strong>jeder</strong>{' '}
        Muskel der Gruppe in Fach 5 oder höher steht — vergisst du einen, ist es wieder weg.
      </p>

      <ul className="badges">
        {rows.map(({ badge, selection }) => (
          <li key={badge.id} className={`badge${badge.earned ? ' badge--earned' : ''}`}>
            <div className="badge__head">
              {/* „Verdient" ist ein Wort und ein Symbol, nicht nur eine Farbe (WCAG 1.4.1). */}
              <span className="badge__mark" aria-hidden="true">
                <Icon name={badge.earned ? 'icTrophy' : 'icTarget'} size={16} />
              </span>
              <Link to={`/gruppe/${badge.id}`} className="badge__label">
                {badge.label}
              </Link>
              <span className="badge__state">
                {badge.earned ? 'verdient' : `${badge.mastered} von ${badge.total}`}
              </span>
            </div>

            <div
              className="stat-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={badge.total}
              aria-valuenow={badge.mastered}
              aria-label={`${badge.label}: ${badge.mastered} von ${badge.total} gemeistert`}
            >
              <div
                className="stat-bar__fill"
                style={{ width: `${(badge.mastered / badge.total) * 100}%` }}
              />
            </div>

            {!badge.earned && (
              <PracticeCta
                label={
                  selection.names.length === 1
                    ? 'Die fehlende Karte üben'
                    : 'Die fehlenden Karten üben'
                }
                selection={selection}
                onStart={onPractice}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
