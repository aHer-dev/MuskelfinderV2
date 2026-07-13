import { EXAM_FORM_LABELS, type ExamOutcome, type ExamReport, type ExamTally } from '../../../data/exam';
import { regionLabel } from '../../../data/labels';
import { Icon } from '../../ui/Icon';

interface ExamDebriefProps {
  report: ExamReport;
  /** Der EINE Primärbutton: Fehler → Karteikasten → Sitzung. Das ist Brücke B3. */
  onLearnMistakes: () => void;
  onRestart: () => void;
}

function share(tally: ExamTally): string {
  return `${tally.correct} von ${tally.answered} richtig`;
}

/** Was war gefragt, was kam, was wäre richtig gewesen. */
function OutcomeRow({ outcome }: { outcome: ExamOutcome }) {
  const { item, muscle, answered, correct, typed, check, explanation } = outcome;

  const given = (() => {
    if (!answered) return 'nicht beantwortet';
    if (item.kind === 'recall') return `„${typed}"`;
    const chosen = item.question.options.find((o) => o.id === outcome.selectedId);
    return chosen ? `„${chosen.label}"` : 'nicht beantwortet';
  })();

  return (
    <li className={`exam-outcome exam-outcome--${correct ? 'correct' : answered ? 'wrong' : 'skipped'}`}>
      <span className="exam-outcome__mark" aria-hidden="true">
        <Icon name={correct ? 'icCheck' : 'icClose'} size={16} />
      </span>

      <div className="exam-outcome__body">
        <p className="exam-outcome__name">
          {muscle.nameLatin}
          <span className="exam-outcome__form">{EXAM_FORM_LABELS[item.form]}</span>
        </p>

        {/* Nie nur Farbe: das Urteil steht als Wort da (WCAG 1.4.1). */}
        <p className="exam-outcome__verdict">
          {correct ? 'Richtig' : answered ? 'Falsch' : 'Übersprungen'} · deine Antwort: {given}
        </p>

        {/* Ein Tippfehler war kein Wissensfehler — das gehört gesagt, sonst lernt man
            die falsche Schreibweise ein. */}
        {check?.verdict === 'almost' && (
          <p className="exam-outcome__hint">Tippfehler — richtig geschrieben: {check.matched}</p>
        )}

        {explanation && <p className="exam-outcome__explain">{explanation.text}</p>}
      </div>
    </li>
  );
}

/**
 * Das Debrief (9c) — der eigentliche Punkt des Prüfungsmodus.
 *
 * Kein Prozentwert als Selbstzweck, keine Note: ein Befund nach Struktur (Region,
 * Abrufform, Verwechslung) und **genau ein** nächster Schritt. Die Sprache bleibt
 * schuldfrei — „hier lohnt sich Zeit", nicht „durchgefallen".
 */
export function ExamDebrief({ report, onLearnMistakes, onRestart }: ExamDebriefProps) {
  const { total, answered, correct, missedNames, byRegion, byForm, confusions, outcomes } = report;
  const missedCount = missedNames.length;

  return (
    <div className="exam-debrief">
      <header className="exam-debrief__head">
        <p className="page__eyebrow">Auswertung</p>
        <h2 className="exam-debrief__score">
          {correct} von {answered} richtig
        </h2>
        <p className="exam-debrief__note">
          {missedCount > 0
            ? 'Hier lohnt sich deine Zeit — die Lücken stehen unten, und der Knopf legt sie direkt in den Karteikasten.'
            : 'Nichts verpasst. Es gibt aus dieser Prüfung nichts zu üben.'}
          {answered < total && ` Du hast ${answered} von ${total} Fragen beantwortet; ausgewertet ist nur, was du beantwortet hast.`}
        </p>
      </header>

      {/* Kein CTA ins Leere (Regel aus 8c): Ohne Fehler gibt es den Knopf nicht. */}
      {missedCount > 0 && (
        <button type="button" className="btn btn--primary btn--block" onClick={onLearnMistakes}>
          <Icon name="icCards" size={18} />
          Jetzt aus den Fehlern lernen — {missedCount} {missedCount === 1 ? 'Karte' : 'Karten'}
        </button>
      )}

      {(byRegion.length > 0 || byForm.length > 0) && (
        <div className="exam-debrief__structure">
          {byRegion.length > 0 && (
            <section aria-labelledby="exam-by-region">
              <h3 className="exam-debrief__subtitle" id="exam-by-region">
                Nach Region
              </h3>
              <ul className="exam-tally">
                {byRegion.map(({ region, tally }) => (
                  <li key={region} className="exam-tally__row">
                    <span>{regionLabel(region)}</span>
                    <span className="exam-tally__value">{share(tally)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {byForm.length > 0 && (
            <section aria-labelledby="exam-by-form">
              <h3 className="exam-debrief__subtitle" id="exam-by-form">
                Nach Abrufform
              </h3>
              <ul className="exam-tally">
                {byForm.map(({ form, tally }) => (
                  <li key={form} className="exam-tally__row">
                    <span>{EXAM_FORM_LABELS[form]}</span>
                    <span className="exam-tally__value">{share(tally)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {confusions.length > 0 && (
        <section className="exam-debrief__confusions" aria-labelledby="exam-confusions">
          <h3 className="exam-debrief__subtitle" id="exam-confusions">
            Klassische Verwechslung
          </h3>
          <ul className="exam-confusion-list">
            {confusions.map((explanation) => (
              <li key={`${explanation.correct.id}-${explanation.chosen?.id}`}>{explanation.text}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="exam-questions">
        <h3 className="exam-debrief__subtitle" id="exam-questions">
          Alle Fragen
        </h3>
        <ul className="exam-outcomes">
          {outcomes.map((outcome) => (
            <OutcomeRow key={outcome.item.id} outcome={outcome} />
          ))}
        </ul>
      </section>

      <button type="button" className="btn btn--ghost" onClick={onRestart}>
        Neue Prüfung
      </button>
    </div>
  );
}
