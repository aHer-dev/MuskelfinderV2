/* =========================================================================
   Die Reihenfolge der Fachfelder — an EINER Stelle.
   src/data/muscle-fields.ts

   WARUM ES DAS GIBT: Dieselben fuenf Fachfelder standen an drei Stellen in drei
   verschiedenen Reihenfolgen:

     Detailseite          Ursprung · Ansatz · Funktion · Innervation · Segmente
     Lernkarten-Rueckseite  Funktion · Innervation · Segmente · Ursprung · Ansatz
     Quiz-Vergleichskarte   Funktion · Ursprung · Ansatz · Innervation · (Lage)

   Fuer eine Lern-App ist das der teuerste Fehler dieser Sorte, und zwar nicht
   aus Ordnungsliebe: Wer auswendig lernt, praegt sich die **Position** mit ein,
   nicht nur den Text. Wechselt die Reihenfolge zwischen Nachschlagen (Detail),
   Ueben (Lernkarte) und Abfragen (Quiz), sucht der Lernende jedes Mal an der
   falschen Stelle — und die Karte, die er gerade eingepraegt hat, passt nicht
   mehr zu der Seite, auf der er sie nachliest.

   DIE REIHENFOLGE folgt der anatomischen Beschreibung, in der auch Lehrbuecher
   einen Muskel abhandeln: Wo faengt er an (Ursprung), wo hoert er auf (Ansatz),
   was tut er deshalb (Funktion), woher kommt der Befehl (Innervation), aus
   welcher Rueckenmarkshoehe (Segmente).

   Wer hier etwas umsortiert, sortiert ueberall um. `muscle-fields.test.ts` haelt
   die drei Anzeigen dagegen — eine, die aus der Reihe tanzt, laesst den Test
   fallen. `scripts/export-csv.mjs` folgt derselben Reihenfolge in den Spalten.
   ========================================================================= */

import type { Muscle, MuscleEasyFields } from '../types';

/** Ein Fachfeld: Datenschluessel und deutsches Label, in kanonischer Ordnung. */
export const FACHFELDER = [
  { key: 'origin', label: 'Ursprung' },
  { key: 'insertion', label: 'Ansatz' },
  { key: 'functionDescription', label: 'Funktion' },
  { key: 'innervation', label: 'Innervation' },
  { key: 'segments', label: 'Segmente' },
] as const;

export type FachfeldKey = (typeof FACHFELDER)[number]['key'];

export interface Fachfeld {
  key: FachfeldKey;
  label: string;
  value: string;
}

/**
 * Marke fuer einen Segment-Wert, der noch nicht im Lehrbuch nachgeschlagen ist.
 * Sie haengt am **Label**, nicht am Wert — sonst hielte man den Stern fuer einen
 * Teil der Segmentangabe („C5–C6 *").
 */
export const UNGEPRUEFT_MARKE = ' *';

/**
 * Die fuenf Fachfelder in kanonischer Reihenfolge, Werte aus `quelle`.
 *
 * `quelle` ist absichtlich nur `Pick<…>` und nicht `Muscle`: Die Detailseite
 * liest in der einfachen Ansicht aus `muscle.easy` (`MuscleEasyFields`), und das
 * ist kein Muskel. Beide tragen genau diese fuenf Felder — mehr braucht es hier
 * nicht, und weniger zu verlangen macht den Aufruf falsch benutzbar.
 *
 * `ungepruefteSegmente` setzt den Stern. Er wird hier gesetzt und nicht von den
 * Anzeigen, weil die Regel sonst wieder an zwei Stellen staende — genau die
 * Doppelung, die dieses Modul aufloest.
 *
 * Leere Werte werden **nicht** gefiltert. Ob ein leeres Feld verschwindet oder
 * als Luecke sichtbar bleibt, entscheidet die Anzeige: `segments` fehlt bei 28
 * von 150 Muskeln, und bei 16 davon ist das fachlich richtig (Hirnnerv).
 */
export function fachfelder(
  quelle: Pick<Muscle, FachfeldKey> | MuscleEasyFields,
  ungepruefteSegmente = false,
): Fachfeld[] {
  return FACHFELDER.map(({ key, label }) => ({
    key,
    label: key === 'segments' && ungepruefteSegmente ? `${label}${UNGEPRUEFT_MARKE}` : label,
    value: quelle[key],
  }));
}

/**
 * Folgt `labels` der kanonischen Reihenfolge? Prueft als **Teilfolge**, nicht auf
 * Gleichheit: Eine Anzeige darf Felder auslassen (leere Segmente, das Quiz kennt
 * keine) und eigene hinten anhaengen (Gelenke, TA-Code, Lage). Verboten ist nur
 * das Vertauschen zweier Fachfelder gegeneinander.
 */
export function folgtReihenfolge(labels: readonly string[]): boolean {
  /* Bewusst als `readonly string[]`, nicht als Literal-Tupel: Hier kommen
     beliebige Labels aus dem DOM herein, und gegen ein Tupel liesse sich das
     nicht pruefen. */
  const kanon: readonly string[] = FACHFELDER.map((f) => f.label);
  /* Der Stern der ungepruefte-Marke gehoert zum Label, nicht zur Reihenfolge. */
  const nurFachfelder = labels
    .map((l) => l.replace(/\s*\*$/, ''))
    .filter((l) => kanon.includes(l));
  let i = 0;
  for (const label of nurFachfelder) {
    const pos = kanon.indexOf(label, i);
    if (pos === -1) return false;
    i = pos + 1;
  }
  return true;
}
