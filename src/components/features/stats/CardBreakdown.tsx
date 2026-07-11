import type { CardBreakdown as CardBreakdownData } from '../../../data/stats';

interface CardBreakdownProps {
  breakdown: CardBreakdownData;
  deckSize: number;
}

const SEGMENTS = [
  { key: 'mastered', label: 'Gemeistert', modifier: 'mastered' },
  { key: 'learning', label: 'In Arbeit', modifier: 'learning' },
  { key: 'neu', label: 'Neu', modifier: 'neu' },
] as const;

/**
 * Karten-Lernstand als proportionaler Stapelbalken (gemeistert / in Arbeit / neu)
 * mit Legende. Rein abgeleitet aus `cardBreakdown` — kein eigener State.
 */
export function CardBreakdown({ breakdown, deckSize }: CardBreakdownProps) {
  return (
    <div className="card-breakdown">
      <div className="card-breakdown__bar" aria-hidden="true">
        {deckSize === 0 ? (
          <span className="card-breakdown__seg card-breakdown__seg--empty" />
        ) : (
          SEGMENTS.map(({ key, modifier }) => {
            const count = breakdown[key];
            if (count === 0) return null;
            return (
              <span
                key={key}
                className={`card-breakdown__seg card-breakdown__seg--${modifier}`}
                style={{ flexGrow: count }}
              />
            );
          })
        )}
      </div>

      <ul className="card-breakdown__legend">
        {SEGMENTS.map(({ key, label, modifier }) => (
          <li key={key} className="card-breakdown__legend-item">
            <span className={`card-breakdown__dot card-breakdown__dot--${modifier}`} aria-hidden="true" />
            <span className="card-breakdown__legend-label">{label}</span>
            <span className="card-breakdown__legend-count">{breakdown[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
