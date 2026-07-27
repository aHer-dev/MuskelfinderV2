/* =========================================================================
   Die `base` aus dem gebauten `dist/` ableiten.
   scripts/lib/dist-base.mjs

   WARUM ES DAS GIBT: `base` stand an zwei Stellen — in `vite.config.ts` und als
   Literal im Playwright-Harness. Zwei Stellen fuer dieselbe Konstante heisst:
   Bei einem Wechsel (eigene Domain, anderer Repo-Name) zieht jemand die eine
   nach und vergisst die andere. Dann laufen die Browser-Pruefungen gegen eine
   URL, die es nicht gibt, und melden Fehler, die keine sind.

   Statt die Konstante zu teilen, wird sie hier **abgelesen**: Die Asset-Pfade in
   `dist/index.html` sind das Ergebnis der einen echten `base` aus der
   Vite-Konfiguration. Wer sie dort aendert, aendert sie hier automatisch mit.
   (Gleiches Prinzip wie in `export-csv.mjs`: keine zweite Wahrheit ueber die
   eigenen Daten.)
   ========================================================================= */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Liest die `base` aus den gebauten Asset-Pfaden.
 *
 * @param {string} distDir Pfad zum `dist/`-Verzeichnis.
 * @returns {string} z. B. `/MuskelfinderV2/` — immer mit Schraegstrich am Ende.
 * @throws wenn nicht gebaut wurde oder kein Asset-Skript im HTML steht.
 */
export function leseBaseAusDist(distDir) {
  const html = join(distDir, 'index.html');
  if (!existsSync(html)) {
    throw new Error(`${html} fehlt — erst \`npm run build\` laufen lassen.`);
  }
  const inhalt = readFileSync(html, 'utf8');
  /* Das Einstiegsskript liegt immer unter <base>assets/… — Vite schreibt den
     Pfad beim Build um, er ist damit die verlaesslichste Spur der echten base. */
  const treffer = /<script[^>]+src="([^"]*\/assets\/[^"]+)"/.exec(inhalt);
  if (!treffer) {
    throw new Error(`In ${html} steht kein Asset-Skript — Build kaputt?`);
  }
  return treffer[1].slice(0, treffer[1].indexOf('assets/'));
}
