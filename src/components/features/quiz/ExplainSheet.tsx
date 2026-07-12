/* =========================================================================
   ExplainSheet — die beiden Muskeln nebeneinander, ÜBER der Session (7e, B2).
   src/components/features/quiz/ExplainSheet.tsx

   Warum ein Sheet und kein `navigate()`: Wer eine laufende Session verlässt,
   kommt nicht zurück. Das Sheet legt sich darüber; Schließen führt in dieselbe
   Frage zurück, der Quiz-Zustand wird nie angefasst.
   ========================================================================= */

import { regionLabel } from '../../../data/labels';
import type { Explanation, ExplainAspect } from '../../../data/explain';
import { Sheet } from '../../ui/Sheet';
import type { Muscle } from '../../../types';

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

interface Row {
  label: string;
  value: string;
  aspect: ExplainAspect;
}

function rows(muscle: Muscle): Row[] {
  return [
    { label: 'Funktion', value: muscle.functionDescription, aspect: 'function' },
    { label: 'Ursprung', value: muscle.origin, aspect: 'origin' },
    { label: 'Ansatz', value: muscle.insertion, aspect: 'insertion' },
    { label: 'Innervation', value: muscle.innervation, aspect: 'innervation' },
    { label: 'Lage', value: muscle.subregion, aspect: 'location' },
  ];
}

/** Kompakte Vergleichskarte. Die Zeile, nach der gefragt war, ist hervorgehoben. */
function CompareCard({
  muscle,
  aspect,
  role,
}: {
  muscle: Muscle;
  aspect: ExplainAspect;
  role: 'correct' | 'chosen';
}) {
  return (
    <article className={`explain-card explain-card--${role}`}>
      <header className="explain-card__head">
        <span className="explain-card__role">
          {role === 'correct' ? 'Gesucht war' : 'Du hattest gewählt'}
        </span>
        <h3 className="explain-card__name">{muscle.nameLatin}</h3>
        <span className="explain-card__region">{regionLabel(muscle.region)}</span>
      </header>

      {muscle.images[0] && (
        <img
          className="explain-card__img"
          src={assetUrl(muscle.images[0].url)}
          alt={`${muscle.nameLatin} — ${muscle.images[0].view}`}
          loading="lazy"
          decoding="async"
        />
      )}

      <dl className="explain-card__rows">
        {rows(muscle)
          .filter((row) => row.value.trim() !== '')
          .map((row) => (
            <div
              key={row.label}
              className={`explain-row${row.aspect === aspect ? ' explain-row--asked' : ''}`}
            >
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}

interface ExplainSheetProps {
  open: boolean;
  explanation: Explanation;
  onClose: () => void;
}

export function ExplainSheet({ open, explanation, onClose }: ExplainSheetProps) {
  const { correct, chosen, aspect, text } = explanation;

  return (
    <Sheet
      open={open}
      title="Warum war das falsch?"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
          Zurück zur Frage
        </button>
      }
    >
      <p className="explain-sheet__text">{text}</p>

      <div className="explain-sheet__compare">
        <CompareCard muscle={correct} aspect={aspect} role="correct" />
        {chosen && chosen.id !== correct.id && (
          <CompareCard muscle={chosen} aspect={aspect} role="chosen" />
        )}
      </div>
    </Sheet>
  );
}
