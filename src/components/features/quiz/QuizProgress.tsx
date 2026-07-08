interface QuizProgressProps {
  total: number;
  /** Index der aktuellen Frage. */
  index: number;
  /** Ergebnis je bereits beantworteter Frage (in Reihenfolge). */
  results: boolean[];
}

function segmentState(i: number, index: number, results: boolean[]): string {
  if (i < results.length) return results[i] ? ' quiz-progress__seg--correct' : ' quiz-progress__seg--wrong';
  if (i === index) return ' quiz-progress__seg--current';
  return '';
}

/**
 * Segmentleiste über der Frage: ein Balkenstück je Frage, eingefärbt nach
 * richtig/falsch/aktuell/offen. Rein dekorativ (`aria-hidden`) — die textliche
 * Fortschrittsangabe „Frage X/Y" liefert die zugängliche Information.
 */
export function QuizProgress({ total, index, results }: QuizProgressProps) {
  return (
    <div className="quiz-progress" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`quiz-progress__seg${segmentState(i, index, results)}`} />
      ))}
    </div>
  );
}
