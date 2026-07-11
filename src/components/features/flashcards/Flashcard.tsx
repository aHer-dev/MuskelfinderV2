import type { Muscle } from '../../../types';
import { regionLabel } from '../../../data/labels';

interface FlashcardProps {
  muscle: Muscle;
  revealed: boolean;
  onReveal: () => void;
}

/**
 * Lernkarte mit echtem 3D-Flip (rotateY). Beide Seiten sind immer im DOM und
 * werden über `backface-visibility` verdeckt; die Rückseite ist um 180° vorge-
 * dreht. Klick/Enter/Space deckt die Rückseite auf. Bei `prefers-reduced-motion`
 * entfällt die Drehung (theme.css schaltet Transitions global ab) — die Karte
 * springt dann ohne Animation um.
 */
export function Flashcard({ muscle, revealed, onReveal }: FlashcardProps) {
  return (
    <button
      type="button"
      className={`flashcard${revealed ? ' flashcard--revealed' : ''}`}
      aria-expanded={revealed}
      onClick={() => {
        if (!revealed) onReveal();
      }}
    >
      <span className="flashcard__inner">
        <span className="flashcard__side flashcard__front">
          <span className="flashcard__eyebrow">{regionLabel(muscle.region)}</span>
          <span className="flashcard__name">{muscle.nameLatin}</span>
          {!revealed && <span className="flashcard__hint">Zum Aufdecken tippen</span>}
        </span>

        <span className="flashcard__side flashcard__back" aria-hidden={!revealed}>
          <dl className="flashcard__facts">
            <div>
              <dt>Funktion</dt>
              <dd>{muscle.functionDescription}</dd>
            </div>
            <div>
              <dt>Innervation</dt>
              <dd>{muscle.innervation}</dd>
            </div>
            <div>
              <dt>Segmente</dt>
              <dd>{muscle.segments}</dd>
            </div>
            <div>
              <dt>Ursprung</dt>
              <dd>{muscle.origin}</dd>
            </div>
            <div>
              <dt>Ansatz</dt>
              <dd>{muscle.insertion}</dd>
            </div>
          </dl>
        </span>
      </span>
    </button>
  );
}
