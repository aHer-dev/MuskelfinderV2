import type { Difficulty } from '../../types';

const LABELS: Record<Difficulty, string> = {
  1: 'leicht',
  2: 'mittel',
  3: 'schwer',
};

/** Drei-Punkte-Indikator für den Schwierigkeitsgrad (1..3). */
export function DifficultyDots({ level }: { level: Difficulty }) {
  return (
    <span className="difficulty" role="img" aria-label={`Schwierigkeit: ${LABELS[level]}`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={`difficulty__dot${dot <= level ? ' difficulty__dot--on' : ''}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
