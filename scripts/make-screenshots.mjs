/* =========================================================================
   Manifest-Screenshots erzeugen.   Aufruf: npm run make:screenshots
   scripts/make-screenshots.mjs

   WARUM ES DAS GIBT: Mit `screenshots` im Manifest zeigt Chrome auf Android den
   reichen Installationsdialog (Bild + Beschreibung) statt einer kargen Zeile —
   der Unterschied zwischen „was will die Seite von mir" und „das ist die App".

   ⚠️ ZWEI BAUSCHRITTE: Das Skript fotografiert die **gebaute** App aus `dist/`
   und legt die Bilder in `public/screenshots/` ab. Von dort kommen sie erst
   beim NAECHSTEN Build ins `dist/`. Der Ablauf ist also:

       npm run build && npm run make:screenshots && npm run build

   Klingt umstaendlich, ist aber der einzige Weg, der die Bilder aus der echten
   App holt statt aus einem Dev-Server mit anderem Satzspiegel. `check:pwa`
   prueft anschliessend, dass jede im Manifest genannte Datei wirklich im
   `dist/` liegt — wer den zweiten Build vergisst, erfaehrt es dort.

   Die Groesse muss zu den `sizes` im Manifest passen (vite.config.ts).
   ========================================================================= */

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { withApp } from './checks/harness.mjs';
import { SEED } from './checks/seed.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(ROOT, 'public', 'screenshots');

/* Pixel-7-Format. Muss den `sizes`-Angaben im Manifest entsprechen. */
const VIEWPORT = { width: 412, height: 915 };

const BILDER = [
  { name: 'heute-narrow.png', route: '/heute' },
  { name: 'lernkarten-narrow.png', route: '/lernkarten' },
];

mkdirSync(ZIEL, { recursive: true });

await withApp(async ({ page, goto }) => {
  for (const { name, route } of BILDER) {
    await goto(route);
    /* Kein `fullPage`: Das Manifest deklariert eine feste Groesse, und ein
       fullPage-Bild waere je nach Inhalt hoeher — Chrome wuerde es verwerfen. */
    await page.screenshot({ path: join(ZIEL, name), fullPage: false });
    console.log(`  ✓ ${name}  (${route}, ${VIEWPORT.width}×${VIEWPORT.height})`);
  }
}, { seed: SEED, viewport: VIEWPORT });

console.log(`\n${BILDER.length} Screenshots in public/screenshots/.`);
console.log('Jetzt `npm run build`, damit sie ins dist/ kommen.');
