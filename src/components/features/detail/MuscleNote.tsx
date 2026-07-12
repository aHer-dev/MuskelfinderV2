import { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '../../../store/useNotesStore';
import { MAX_NOTE_LENGTH } from '../../../persistence/types';

/** Kurz genug, dass nichts verlorengeht; lang genug, dass nicht jeder Tastendruck schreibt. */
const DEBOUNCE_MS = 600;
/** Ab hier wird der Restplatz angezeigt — vorher wäre der Zähler nur Lärm. */
const COUNTER_THRESHOLD = 0.9;
/** Pro Seite gibt es genau eine Notiz — eine feste ID reicht und bleibt gültig. */
const FIELD_ID = 'muscle-note-field';

/**
 * Freitext-Notiz zu einem Muskel (8e). Speichert **ohne Knopf**, aber verlustfrei:
 * Neben dem Debounce schreibt die Aufräumfunktion beim Verlassen der Seite den
 * letzten Stand weg. Eine Notiz, die beim Wegnavigieren verschwindet, ist schlimmer
 * als gar keine.
 *
 * Leerer Text löscht die Notiz (der Store macht daraus keinen leeren Eintrag).
 */
export function MuscleNote({ nameLatin }: { nameLatin: string }) {
  const saved = useNotesStore((s) => s.notes.entries[nameLatin]?.text ?? '');
  const setNote = useNotesStore((s) => s.setNote);

  const [text, setText] = useState(saved);
  const [pending, setPending] = useState(false);

  /* Der letzte Stand, den die Aufräumfunktion noch wegschreiben können muss —
     sie läuft, wenn `text` längst nicht mehr in ihrem Closure hängt. */
  const latest = useRef(text);
  latest.current = text;

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setNote(nameLatin, latest.current);
      setPending(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pending, text, nameLatin, setNote]);

  // Verlassen der Seite = sofort schreiben. Der Debounce darf nichts verschlucken.
  useEffect(() => {
    return () => {
      setNote(nameLatin, latest.current);
    };
  }, [nameLatin, setNote]);

  const remaining = MAX_NOTE_LENGTH - text.length;
  const showCounter = text.length >= MAX_NOTE_LENGTH * COUNTER_THRESHOLD;

  return (
    <section className="muscle-note">
      <div className="muscle-note__head">
        {/* Echtes <label> statt aria-labelledby: Muskelnamen enthalten Leerzeichen und
            taugen damit nicht als ID-Referenz. */}
        <h2 className="muscle-note__title">
          <label htmlFor={FIELD_ID}>Deine Notiz</label>
        </h2>
        {/* Dezent, kein Ausrufezeichen: der Status sagt, dass nichts verlorengeht. */}
        <span className="muscle-note__status" role="status">
          {pending ? 'Wird gespeichert …' : saved !== '' ? 'Gespeichert' : ''}
        </span>
      </div>

      <textarea
        id={FIELD_ID}
        className="muscle-note__field"
        value={text}
        maxLength={MAX_NOTE_LENGTH}
        rows={4}
        placeholder="Was im Unterricht dazu gesagt wurde — steht in keinem Datensatz."
        onChange={(e) => {
          setText(e.target.value);
          setPending(true);
        }}
        onBlur={() => setNote(nameLatin, latest.current)}
      />

      {showCounter && <p className="muscle-note__counter">Noch {remaining} Zeichen</p>}
    </section>
  );
}
