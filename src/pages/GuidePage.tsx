/* =========================================================================
   GuidePage — wie hier gelernt wird (Etappe 10b, ADR 0009).
   src/pages/GuidePage.tsx

   Die App hat bisher nie erklärt, was sie tut. Sie legte 20 Karten an und fing an zu
   fragen. Ein Schüler, der nicht versteht, warum ein Muskel morgen wiederkommt und ein
   anderer erst in drei Wochen, hält das für Willkür — und bricht ab.

   Diese Seite steht dauerhaft (Fußzeile, `/heute` bei leerem Kasten). Sie erklärt die
   Mechanik, die es wirklich gibt: Leitner-Fächer, Tagesplan, wachsende Abrufhärte.
   Sie verspricht nichts, was die App nicht kann.
   ========================================================================= */

import { Link } from 'react-router-dom';
import { FACH_INTERVALS, MASTERED_FACH, MAX_FACH } from '../persistence/leitner';
import { Icon } from '../components/ui/Icon';
import './guide.css';

/** Ein Schritt des Ablaufs. Die Nummer trägt Bedeutung — es ist eine echte Reihenfolge. */
const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Du wählst, was du lernst',
    body: 'Die App legt dir nichts ungefragt in den Karteikasten. Du holst dir einen Kursabschnitt, einen ganzen Körperbereich oder einzelne Muskeln aus der Suche. Was drin liegt, hast du entschieden — und du kannst es jederzeit ändern.',
  },
  {
    title: 'Jeden Tag schlägt dir „Heute" genau eine Sitzung vor',
    body: 'Nicht alles auf einmal, sondern das, was heute fällig ist. Liegt zu viel an, teilt die App es auf und sagt dir, dass der Rest wartet. Eine Sitzung, die du zu Ende bringst, ist mehr wert als eine, die du abbrichst.',
  },
  {
    title: 'Was du kannst, kommt seltener — was du nicht kannst, kommt wieder',
    body: 'Jede Karte liegt in einem von sieben Fächern. Richtig beantwortet heißt: ein Fach höher, längere Pause. Falsch heißt: zurück nach vorn, in wenigen Tagen wieder — egal, wie weit oben die Karte vorher lag. Was du vergessen hast, ist vergessen; da hilft es nichts, es dir erst in drei Monaten wieder zu zeigen.',
  },
  {
    title: 'Je besser du wirst, desto härter wird gefragt',
    body: 'Am Anfang deckst du die Karte auf und bewertest dich selbst. Weiter hinten musst du den Namen frei eintippen — ohne Auswahl, ohne Anhaltspunkt. So, wie es in der Prüfung auch passiert.',
  },
];

/** Die Fächer als das, was sie sind: ein Abstand in Tagen. Zahlen aus dem Code, nicht erfunden. */
function fachRows() {
  return Array.from({ length: MAX_FACH }, (_, i) => {
    const fach = i + 1;
    const days = FACH_INTERVALS[fach];
    return {
      fach,
      abstand: days === 1 ? 'morgen' : `nach ${days} Tagen`,
      mastered: fach >= MASTERED_FACH,
    };
  });
}

export function GuidePage() {
  return (
    <section className="page guide">
      <header className="guide__header">
        <p className="page__eyebrow">Anleitung</p>
        <h1 className="page__title">So lernst du hier</h1>
        <p className="guide__lead">
          Diese App ist kein Nachschlagewerk mit Quiz obendrauf. Sie führt dich durch einen Stoff,
          den kein Mensch in einem Rutsch behält — indem sie den Abstand zwischen den
          Wiederholungen wachsen lässt, sobald du etwas wirklich kannst.
        </p>
      </header>

      <ol className="guide__steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="guide__step">
            <span className="guide__step-num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="guide__step-text">
              <h2 className="guide__step-title">{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="guide__section" aria-labelledby="guide-faecher">
        <h2 className="guide__subtitle" id="guide-faecher">
          Die sieben Fächer
        </h2>
        <p className="guide__body">
          Eine neue Karte startet in Fach 1. Jede richtige Antwort schiebt sie ein Fach weiter, jede
          falsche wirft sie zurück. Der Abstand sagt, wann du die Karte wiedersiehst.
        </p>
        <div className="guide__table-wrap">
          <table className="guide__table">
            <thead>
              <tr>
                <th scope="col">Fach</th>
                <th scope="col">Wiedersehen</th>
                <th scope="col">Bedeutung</th>
              </tr>
            </thead>
            <tbody>
              {fachRows().map((row) => (
                <tr key={row.fach}>
                  <td className="guide__fach">{row.fach}</td>
                  <td>{row.abstand}</td>
                  <td className="guide__meaning">
                    {row.fach === MAX_FACH
                      ? 'Freier Abruf — du tippst den Namen selbst'
                      : row.mastered
                        ? 'Gilt als beherrscht'
                        : 'Noch am Einprägen'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="guide__note">
          Ab Fach {MASTERED_FACH} gilt ein Muskel als beherrscht — daraus entstehen die Abzeichen
          unter „Fortschritt". Vergisst du ihn wieder, verlierst du das Abzeichen. Das ist Absicht:
          Es misst, was du <em>kannst</em>, nicht, was du mal konntest.
        </p>
      </section>

      <section className="guide__section" aria-labelledby="guide-kasten">
        <h2 className="guide__subtitle" id="guide-kasten">
          Dein Karteikasten gehört dir
        </h2>
        <p className="guide__body">
          Du kannst jederzeit Muskeln nachlegen oder rauswerfen — im{' '}
          <Link to="/karteikasten">Karteikasten</Link>. Zwei Dinge helfen dir dabei:
        </p>
        <ul className="guide__list">
          <li>
            <strong>Schwierig markieren</strong> (Taste <kbd>F</kbd> in der Sitzung): Die Karte
            bleibt fällig, bis du die Markierung wieder wegnimmst. Für die drei, vier, die einfach
            nicht hängenbleiben wollen.
          </li>
          <li>
            <strong>Nachgeschlagen = noch nicht gewusst.</strong> Was du oft in der Suche
            aufrufst, schlägt dir „Heute" von selbst als Karte vor. Du musst es nicht selbst merken.
          </li>
        </ul>
      </section>

      <section className="guide__section" aria-labelledby="guide-pruefung">
        <h2 className="guide__subtitle" id="guide-pruefung">
          Wenn es ernst wird
        </h2>
        <p className="guide__body">
          Der <Link to="/pruefung">Prüfungsmodus</Link> stellt 20 Fragen ohne Rückmeldung — genau
          wie eine echte Klausur. Erst am Ende siehst du, was gesessen hat. Er vergibt keine Punkte
          und keine Serie: Er bewertet, er belohnt nicht. Was du verpasst hast, kannst du mit einem
          Klick in die nächste Lernsitzung schieben.
        </p>
      </section>

      <div className="guide__cta">
        <Link to="/heute" className="btn btn--primary">
          <Icon name="icArrowL" size={16} />
          Zurück zu Heute
        </Link>
      </div>
    </section>
  );
}
