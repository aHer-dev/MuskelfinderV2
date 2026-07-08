import { MAX_FACH } from '../../../persistence/leitner';

const BOXES = Array.from({ length: MAX_FACH }, (_, i) => i + 1);

/** Visualisierung der 7 Leitner-Fächer mit Kartenzahl; aktives Fach hervorgehoben. */
export function LeitnerBoxes({ counts, activeBox }: { counts: number[]; activeBox?: number }) {
  return (
    <div className="leitner-boxes" aria-label="Leitner-Fächer">
      {BOXES.map((fach) => (
        <div
          key={fach}
          className={`leitner-box${fach === activeBox ? ' leitner-box--active' : ''}`}
          title={`Fach ${fach}: ${counts[fach] ?? 0} Karten`}
        >
          <span className="leitner-box__num">{fach}</span>
          <span className="leitner-box__count">{counts[fach] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}
