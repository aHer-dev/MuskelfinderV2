/* =========================================================================
   check:daten — Invarianten + Kollisionsbericht gegen den ECHTEN Bestand.
   scripts/check-data.mjs   ·   Aufruf: npm run check:daten

   WARUM ES DAS GIBT: Fast jeder harte Bug dieses Projekts sass in den DATEN,
   nicht im Code — das alphabetische Startdeck, „53 Karten vs. 56 Zeilen", das
   Hypothenar, die mehrdeutigen Quizfragen. Die Unit-Tests liefen jahrelang
   gegen selbstgebaute Fixtures, und die sind per Konstruktion sauber: kein
   Fixture-Muskel teilt sich je ein Feld mit einem anderen. Der ganze Fehlertyp
   war in der Testwelt unmoeglich. Dieses Skript laeuft gegen `generated/`.

   ZWEI TEILE:
   - INTEGRITAET (harte Fehler, Exit 1): Dinge, die die App KAPUTT machen —
     ein Bild ohne Datei, eine Gruppe mit einem Muskel, den es nicht gibt.
   - BERICHT (Exit 0): Kollisionen und Luecken, die ein MENSCH ansehen sollte.
     Zwei Muskeln mit demselben Funktionstext sind kein Programmfehler — aber
     vielleicht ein Datenfehler, und nur der Fachmann weiss das.
   ========================================================================= */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const muscles = (() => {
  const raw = read('src/data/generated/muscles.json');
  return Array.isArray(raw) ? raw : raw.muscles;
})();
const regions = read('src/data/generated/regions.json').map((r) => r.id ?? r);
const groupsFile = read('src/data/editorial/groups.json');
const gruppen = groupsFile.gruppen ?? groupsFile;

/* ---- Sammelstellen ---------------------------------------------------- */
const fehler = []; // harte Integritaetsfehler -> Exit 1
const fail = (msg) => fehler.push(msg);

const namenIndex = new Map(); // nameLatin -> Muskel[]  (letzter gewinnt in der Laufzeit)
for (const m of muscles) {
  if (!namenIndex.has(m.nameLatin)) namenIndex.set(m.nameLatin, []);
  namenIndex.get(m.nameLatin).push(m);
}
const kartenMuskeln = muscles.length - [...namenIndex.values()].filter((v) => v.length > 1).length;

/* ═══════════════════════════════════════════════════════════════════════
   TEIL 1 — INTEGRITAET (harte Fehler)
   ═══════════════════════════════════════════════════════════════════════ */

// (a) IDs sind eindeutig — sonst kollidiert `musclesById`.
const idCount = new Map();
for (const m of muscles) idCount.set(m.id, (idCount.get(m.id) ?? 0) + 1);
for (const [id, n] of idCount) if (n > 1) fail(`Doppelte id: "${id}" (${n}×) — musclesById.get liefert nur einen`);

// (b) Jede referenzierte Bilddatei existiert wirklich auf der Platte.
let bildRefs = 0;
const fehlendeBilder = [];
for (const m of muscles) {
  for (const bild of m.images ?? []) {
    bildRefs++;
    if (!bild.url) { fail(`${m.nameLatin}: Bild ohne url`); continue; }
    if (!existsSync(join(ROOT, 'public', bild.url))) fehlendeBilder.push(`${m.nameLatin} → ${bild.url}`);
  }
}
if (fehlendeBilder.length) fail(`${fehlendeBilder.length} Bild-Referenz(en) ohne Datei:\n     ` + fehlendeBilder.join('\n     '));

// (c) Jeder Muskel hat eine gueltige Region.
for (const m of muscles) {
  if (!regions.includes(m.region)) fail(`${m.nameLatin}: unbekannte Region "${m.region}"`);
}

// (d) Jeder Gruppenmuskel existiert — und traegt keinen Namen, dessen Doppel in
//     einer ANDEREN Region liegt (die Hypothenar-Falle: die Gruppe loeste sonst
//     still auf den falschen Koerperteil auf).
const bekannteNamen = new Set(muscles.map((m) => m.nameLatin));
for (const g of gruppen) {
  const mitglieder = g.muscles ?? g.mitglieder ?? g.members ?? [];
  for (const name of mitglieder) {
    if (!bekannteNamen.has(name)) { fail(`Gruppe "${g.label ?? g.id}": Muskel "${name}" existiert nicht`); continue; }
    const doppel = namenIndex.get(name);
    if (doppel.length > 1) {
      const regionenDavon = new Set(doppel.map((m) => m.region));
      if (regionenDavon.size > 1) {
        fail(`Gruppe "${g.label ?? g.id}": "${name}" ist mehrdeutig (${[...regionenDavon].join('/')}) — loest still auf den falschen Muskel auf (Hypothenar-Falle)`);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   TEIL 2 — BERICHT (fuer den Fachmann; kein Fehler)
   ═══════════════════════════════════════════════════════════════════════ */

/** Muskeln, die sich einen Feldwert teilen. */
function kollisionen(feld, label) {
  const map = new Map();
  for (const m of muscles) {
    const v = typeof feld === 'function' ? feld(m) : m[feld];
    if (!v || (typeof v === 'string' && !v.trim())) continue;
    if (!map.has(v)) map.set(v, []);
    map.get(v).push(m.nameLatin);
  }
  return [...map.entries()].filter(([, ms]) => ms.length > 1)
    .map(([wert, ms]) => ({ wert, ms }));
}

const bericht = {
  'Gleicher Name (Hand/Fuss, Kopf)': kollisionen('nameLatin'),
  'Gleiche Funktion': kollisionen('functionDescription'),
  'Gleicher Ursprung': kollisionen('origin'),
  'Gleicher Ansatz': kollisionen('insertion'),
  'Gleiche Innervation': kollisionen('innervation'),
  'Gleiche erste Bilddatei': kollisionen((m) => (m.images ?? [])[0]?.url),
};

/* Datenluecken — kein Fehler, aber gut zu wissen. */
const ohneBild = muscles.filter((m) => !(m.images ?? []).length);
const ohneUrsprung = muscles.filter((m) => !m.origin?.trim());
const ohneFunktion = muscles.filter((m) => !m.functionDescription?.trim());
const ohneSegment = muscles.filter((m) => !m.segments?.trim());

/* ═══════════════════════════════════════════════════════════════════════
   AUSGABE
   ═══════════════════════════════════════════════════════════════════════ */

const L = (s = '') => process.stdout.write(s + '\n');

L('\n════════ check:daten ════════');
L(`Muskeln: ${muscles.length} · Kartenmuskeln (entdoppelt): ${kartenMuskeln} · Regionen: ${regions.length} · Bild-Referenzen: ${bildRefs}`);

L('\n── BERICHT (fuer den Fachmann — kein Fehler, nur zum Ansehen) ──');
L('Der Fragetext im Quiz ist EIN Muskelfeld. Wo sich zwei Muskeln eins teilen,');
L('waere die Frage mehrdeutig — der Code faengt das ab (Distraktor-Sperre), aber');
L('die Frage bleibt: ist der geteilte Wert fachlich richtig oder ein Datenfehler?\n');
for (const [titel, koll] of Object.entries(bericht)) {
  L(`  ${titel}: ${koll.length} Kollision(en)`);
  for (const { wert, ms } of koll.slice(0, 6)) {
    L(`     „${String(wert).slice(0, 66)}"`);
    L(`         ${ms.join(' · ')}`);
  }
  if (koll.length > 6) L(`     … und ${koll.length - 6} weitere`);
}

L('\n── DATENLUECKEN (wie in V1 bewusst, nur zur Kontrolle) ──');
L(`  ohne Bild: ${ohneBild.length} · ohne Ursprung: ${ohneUrsprung.length} · ohne Funktionstext: ${ohneFunktion.length} · ohne Segment: ${ohneSegment.length}`);

/* ---- Urteil ---------------------------------------------------------- */
L('\n── INTEGRITAET (harte Regeln) ──');
if (fehler.length === 0) {
  L('  ✓ Alle Bilder existieren, IDs eindeutig, Gruppen sauber, Regionen gueltig.');
  L('\n✓ check:daten bestanden.\n');
  process.exit(0);
} else {
  for (const f of fehler) L('  ✗ ' + f);
  L(`\n✗ check:daten: ${fehler.length} Integritaetsfehler.\n`);
  process.exit(1);
}
