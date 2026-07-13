/* =========================================================================
   QuizTimer — die Uhr über der Frage (Etappe 11).
   src/components/features/quiz/QuizTimer.tsx

   Zwei Entscheidungen, die man nicht sieht:

   1. **`aria-live="off"`.** Eine Uhr, die jede Sekunde tickt, wäre in einem Screenreader
      unerträglich — sie würde die Frage und die Antwortoptionen permanent unterbrechen.
      Mit `role="timer"` bleibt sie jederzeit abrufbar, ohne sich aufzudrängen. Das
      *Ablaufen* wird angesagt, aber nicht hier: Das übernimmt die Rückmeldezeile der
      Frage-Karte, die ohnehin `aria-live="polite"` ist.

   2. **Die letzten Sekunden färben sich, aber sie blinken nicht.** Ein blinkendes Element
      ist bei Menschen mit Photosensibilität ein echtes Risiko (WCAG 2.3.1), und der
      Balken allein trägt die Information schon.
   ========================================================================= */

interface QuizTimerProps {
  /** Sekunden, die die Frage insgesamt hatte. */
  limit: number;
  /** Sekunden, die noch übrig sind. */
  remaining: number;
  /** Angehalten (Frage ist aufgedeckt) — der Balken friert ein, statt auf 0 zu springen. */
  paused: boolean;
}

/** Ab hier wird es knapp — der Balken wechselt die Farbe, damit man es sieht, ohne zu lesen. */
const KNAPP_AB = 5;

export function QuizTimer({ limit, remaining, paused }: QuizTimerProps) {
  const anteil = limit > 0 ? Math.max(0, Math.min(1, remaining / limit)) : 0;
  const knapp = !paused && remaining <= KNAPP_AB;

  return (
    <div
      className={`quiz-timer${knapp ? ' quiz-timer--knapp' : ''}${paused ? ' quiz-timer--paused' : ''}`}
      role="timer"
      aria-live="off"
      aria-label={
        paused ? 'Zeit angehalten' : `Noch ${remaining} ${remaining === 1 ? 'Sekunde' : 'Sekunden'}`
      }
    >
      <div className="quiz-timer__track">
        <div className="quiz-timer__fill" style={{ width: `${anteil * 100}%` }} />
      </div>
      <span className="quiz-timer__value" aria-hidden="true">
        {remaining}s
      </span>
    </div>
  );
}
