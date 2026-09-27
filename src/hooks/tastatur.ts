/* =========================================================================
   Tastenkuerzel einer Seite — wann sie NICHT greifen duerfen.
   src/hooks/tastatur.ts

   WARUM ES DAS GIBT: Lernsitzung (Space/1/2/3/F) und Quiz (1–4/Enter) hoeren beide
   an `window` und brauchen dieselben zwei Riegel. Das Quiz hatte seit 2026-08-20
   beide, die Lernsitzung nur den ersten — und genau darum haette dort eine Ziffer die
   Karte HINTER der offenen Bild-Vollansicht bewertet, sobald die Lernkarte ein grosses
   Bild bekam (Etappe 14a). Zwei Kopien derselben Regel laufen auseinander, sobald nur
   eine davon angefasst wird; darum steht sie hier einmal.

   1. **Eingabefelder behalten ihre Tasten.** „F" schreibt ein F, es markiert nichts.
   2. **Ein offener modaler Kasten schluckt sie.** Gefragt wird nach
      `[role="dialog"][aria-modal="true"]`, nicht nach einer Klasse — sonst muesste
      jeder neue Kasten hier nachgetragen werden, und das tut niemand.
   ========================================================================= */

/** Ist gerade ein modaler Kasten offen (Sheet, Bild-Vollansicht, …)? */
export function modalOffen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

/**
 * Darf ein Tastenkuerzel der Seite auf diesen Tastendruck reagieren?
 * `false`, wenn jemand in ein Feld schreibt oder ein modaler Kasten offen ist.
 */
export function tasteGehoertDerSeite(event: KeyboardEvent): boolean {
  const ziel = event.target;
  if (
    ziel instanceof HTMLInputElement ||
    ziel instanceof HTMLTextAreaElement ||
    ziel instanceof HTMLSelectElement ||
    (ziel instanceof HTMLElement && ziel.isContentEditable)
  ) {
    return false;
  }
  return !modalOffen();
}
