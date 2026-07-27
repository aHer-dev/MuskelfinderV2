/* =========================================================================
   export:csv — der Bestand als Tabellen, damit der Fachmann ihn prüfen kann.
   scripts/export-csv.mjs   ·   Aufruf: npm run export:csv

   WARUM ES DAS GIBT: Fachliche Richtigkeit kann kein Test prüfen (siehe
   `docs/pruefstrategie.md`). Ein Mensch muss sie lesen — und zwar nicht in
   JSON, sondern in einer Tabelle, die sich sortieren und filtern lässt.

   WICHTIG: Diese Dateien sind ERZEUGT. Wer sie bearbeitet, ändert nichts an
   der App. Die Quelle steht in `src/data/generated/muscles.json` (aus V1
   migriert), `src/data/editorial/` (handgepflegt) und `src/data/joint-groups.ts`
   (aus `joints`/`subregion` abgeleitet). Der Weg zurück ist: hier lesen, dort
   ändern, `npm run verify`.

   KEINE ZWEITE WAHRHEIT: Das Skript lädt dieselben TypeScript-Module wie die
   App (über Vites SSR-Lader), statt die JSONs noch einmal selbst zu deuten.
   Sonst wäre der Export genau das, was er aufdecken soll — eine Behauptung
   über die Daten, die niemand nachprüft.
   ========================================================================= */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = join(ROOT, 'docs/pruefung/csv');

/* ---- Die App-Module laden (TypeScript, wie die App sie sieht) ---------- */
const server = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
});
const daten = await server.ssrLoadModule('/src/data/index.ts');
const gelenke = await server.ssrLoadModule('/src/data/joint-groups.ts');
const gruppenModul = await server.ssrLoadModule('/src/data/groups.ts');
const berufe = await server.ssrLoadModule('/src/data/profession.ts');
const labels = await server.ssrLoadModule('/src/data/labels.ts');
const dreiD = await server.ssrLoadModule('/src/data/threeD.ts');
await server.close();

const { CARD_MUSCLES, cardKey, getMuscleByCardKey, getMuscles, isCardMuscle } = daten;
const { getJointGroups, orderedJointGroups } = gelenke;
const { getGroups, groupsOf } = gruppenModul;
const { PROFESSIONS, PROFESSION_LABELS } = berufe;
const { regionLabel, movementLabel } = labels;
const { isSupportedIn3D } = dreiD;

const MUSKELN = getMuscles();
const GELENKGRUPPEN = getJointGroups();

/* ---- CSV schreiben ----------------------------------------------------- */

/* Semikolon + BOM + CRLF: So oeffnet Excel (deutsche Fassung) die Datei ohne
   Import-Dialog und mit richtigen Umlauten. Ein Komma waere hier falsch — in
   `M. flexor digitorum longus, Caput mediale` steckt eines drin. */
const TRENN = ';';

function zelle(wert) {
  const s = wert === undefined || wert === null ? '' : String(wert);
  /* Ein Feld mit Trennzeichen, Anfuehrungszeichen oder Zeilenumbruch wird
     gequotet, innere Anfuehrungszeichen verdoppelt (RFC 4180). */
  return /[";\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const dateien = [];

function schreibe(name, spalten, zeilen) {
  const text = [spalten, ...zeilen].map((z) => z.map(zelle).join(TRENN)).join('\r\n');
  writeFileSync(join(ZIEL, name), '﻿' + text + '\r\n', 'utf8');
  dateien.push({ name, zeilen: zeilen.length });
}

/** Dateinamen-taugliche Kurzform: „Sprunggelenk & Fuß" → „sprunggelenk-fuss". */
function slug(s) {
  return s
    .toLowerCase()
    .replaceAll('ä', 'ae').replaceAll('ö', 'oe').replaceAll('ü', 'ue').replaceAll('ß', 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const jaNein = (b) => (b ? 'ja' : 'nein');
const liste = (xs) => (xs ?? []).join(' · ');

/* Welche Gelenkgruppen tragen diesen Muskel? Ueber den KARTENschluessel, nicht
   ueber den Namen — sonst faende „M. abductor digiti minimi" beide (ADR 0012). */
function gelenkgruppenVon(muscle) {
  const key = cardKey(muscle);
  return GELENKGRUPPEN.filter((g) => g.muscles.includes(key)).map((g) => g.label);
}

/* ---- Die Spalten, die der Fachmann liest ------------------------------- */

const FACH_SPALTEN = [
  'Muskel (lateinisch)', 'Deutsch', 'Region', 'Subregion', 'Gelenke', 'Gelenkgruppen',
  'Ursprung', 'Ansatz', 'Funktion (Text)', 'Funktionen (Filter)', 'Innervation', 'Segmente',
  'Klinik', 'Palpation hinterlegt', 'Funktionelle Gruppen', 'Schwierigkeit', 'Bilder',
  'Eigene Karte', 'Kartenschlüssel', 'Detailseite (id)',
];

function fachZeile(m) {
  return [
    m.nameLatin,
    m.nameDE ?? '',
    regionLabel(m.region),
    m.subregion,
    liste(m.joints),
    liste(gelenkgruppenVon(m)),
    m.origin,
    m.insertion,
    m.functionDescription,
    liste((m.functions ?? []).map(movementLabel)),
    m.innervation,
    m.segments,
    m.clinicalNote ?? '',
    jaNein(m.palpation !== undefined),
    liste(groupsOf(cardKey(m)).map((g) => g.label)),
    m.difficulty,
    m.images.length,
    jaNein(isCardMuscle(m)),
    cardKey(m),
    m.id,
  ];
}

/* ---- Los -------------------------------------------------------------- */

rmSync(ZIEL, { recursive: true, force: true });
mkdirSync(ZIEL, { recursive: true });

/* (1) Alles auf einen Blick — ALLE 150 Datensaetze, nicht nur die 148 Karten.
   `M. nasalis` und `M. occipitofrontalis` stehen je zweimal im Bestand (Pars
   transversa / Pars alaris) und sind trotzdem EINE Karte. Wer nur die Karten
   exportiert, sieht die zweite Funktionszeile nie — und genau sie ist eine
   fachliche Frage. Die Spalte „Eigene Karte" macht den Unterschied sichtbar. */
schreibe(
  '00-alle-muskeln.csv',
  FACH_SPALTEN,
  [...MUSKELN].sort((a, b) => a.nameLatin.localeCompare(b.nameLatin, 'de')).map(fachZeile),
);

/* (2) Je Region eine Datei — die vier Bereiche, in denen unterrichtet wird. */
for (const region of ['head', 'trunk', 'upper', 'lower']) {
  const drin = MUSKELN.filter((m) => m.region === region).sort((a, b) =>
    a.subregion.localeCompare(b.subregion, 'de') || a.nameLatin.localeCompare(b.nameLatin, 'de'),
  );
  schreibe(`region-${slug(regionLabel(region))}.csv`, FACH_SPALTEN, drin.map(fachZeile));
}

/* (3) Je Gelenkgruppe eine Datei — DAS ist die Liste, an der die offene Frage
   haengt („was haben die Ergos in der oberen Extremitaet und im Rumpf drin?").
   Gelesen wird ueber den Kartenschluessel: Die Datei zeigt den Muskel, den die
   KARTE rendert, nicht den, der zufaellig denselben Namen traegt. */
for (const gruppe of GELENKGRUPPEN) {
  const zeilen = gruppe.muscles.map((key) => {
    const m = getMuscleByCardKey(key);
    if (m === undefined) return [key, ...Array(FACH_SPALTEN.length).fill('')];
    const andere = gelenkgruppenVon(m).filter((l) => l !== gruppe.label);
    return [...fachZeile(m), liste(andere)];
  });
  schreibe(`gruppe-${slug(gruppe.id)}.csv`, [...FACH_SPALTEN, 'Liegt auch in'], zeilen);
}

/* (4) Die Vorsortierung nach Beruf — sortiert, versteckt nichts. Genau diese
   Tabelle ist der offene Punkt in `docs/todo.md`. */
schreibe(
  'berufe-vorsortierung.csv',
  ['Beruf', 'Rang', 'Gelenkgruppe', 'Typisch für diesen Beruf', 'Karten in der Gruppe', 'Was steckt drin'],
  PROFESSIONS.flatMap((p) => {
    const { typisch, weitere } = orderedJointGroups(p);
    return [...typisch, ...weitere].map((g, i) => [
      PROFESSION_LABELS[p],
      i + 1,
      g.label,
      jaNein(typisch.includes(g)),
      g.muscles.length,
      g.hint,
    ]);
  }),
);

/* (5) Die funktionellen Gruppen (handgepflegt, `editorial/groups.json`). */
schreibe(
  'funktionelle-gruppen.csv',
  ['Gruppe', 'Region laut Gruppe', 'Mitglied', 'Region des Muskels', 'Subregion', 'Gelenkgruppen'],
  getGroups().flatMap((g) =>
    g.muscles.map((key) => {
      const m = getMuscleByCardKey(key);
      return [
        g.label,
        g.region ? regionLabel(g.region) : '',
        key,
        m ? regionLabel(m.region) : '(kein Datensatz)',
        m?.subregion ?? '',
        m ? liste(gelenkgruppenVon(m)) : '',
      ];
    }),
  ),
);

/* (6) Die bildlosen Muskeln — die einzige Luecke, die von Muskel zu Muskel
   VERSCHIEDEN ist. Herkunft und Klinik stehen bei allen 150, die Palpation bei
   keinem (bewusst, `docs/palpation-erfassen.md`) — eine Spalte, die 150-mal
   dasselbe sagt, ist keine Liste, sondern Rauschen.
   Die 3D-Spalte entscheidet mit: Ein Rendering laesst sich nur fuer die Muskeln
   holen, die die 3D-App ueberhaupt kennt (offener Punkt in `docs/todo.md`). */
schreibe(
  'ohne-bild.csv',
  ['Muskel (lateinisch)', 'Region', 'Subregion', 'Gelenkgruppen', 'In der 3D-App vorhanden'],
  MUSKELN.filter((m) => m.images.length === 0)
    .sort((a, b) => a.nameLatin.localeCompare(b.nameLatin, 'de'))
    .map((m) => [
      m.nameLatin,
      regionLabel(m.region),
      m.subregion,
      liste(gelenkgruppenVon(m)),
      jaNein(isSupportedIn3D(m.nameLatin)),
    ]),
);

/* (7) Doppelte Felder — dieselbe Frage, die `check:daten` als Bericht ausgibt,
   hier zum Sortieren. Zwei Muskeln mit woertlich gleichem Funktionstext sind
   kein Programmfehler, aber vielleicht ein Datenfehler; das weiss nur der
   Fachmann. Es ist zugleich der Grund fuer die Zwillingssperre im Quiz. */
const FELDER = [
  ['nameLatin', 'Name'],
  ['origin', 'Ursprung'],
  ['insertion', 'Ansatz'],
  ['functionDescription', 'Funktion (Text)'],
  ['innervation', 'Innervation'],
];
const kollisionen = [];
for (const [feld, titel] of FELDER) {
  const nach = new Map();
  for (const m of MUSKELN) {
    const wert = (m[feld] ?? '').trim();
    if (wert === '') continue;
    if (!nach.has(wert)) nach.set(wert, []);
    nach.get(wert).push(m);
  }
  for (const [wert, gruppe] of nach) {
    if (gruppe.length < 2) continue;
    /* Die beiden Funktionszeilen EINES Muskels sind keine Kollision zwischen
       zwei Muskeln — sie sind derselbe Muskel (ADR 0012 / `isCardMuscle`). */
    const schluessel = new Set(gruppe.map((m) => cardKey(m)));
    kollisionen.push([
      titel,
      gruppe.length,
      liste(gruppe.map((m) => m.nameLatin)),
      liste([...new Set(gruppe.map((m) => regionLabel(m.region)))]),
      jaNein(schluessel.size === 1),
      wert,
    ]);
  }
}
schreibe(
  'doppelte-felder.csv',
  ['Feld', 'Wie oft', 'Betroffene Muskeln', 'Regionen', 'Ist derselbe Muskel', 'Wortlaut'],
  kollisionen.sort((a, b) => a[0].localeCompare(b[0], 'de') || b[1] - a[1]),
);

/* ---- Bericht ----------------------------------------------------------- */
const L = (s = '') => process.stdout.write(s + '\n');
L('\n════════ export:csv ════════');
L(`Ziel: docs/pruefung/csv/  (${dateien.length} Dateien)\n`);
for (const d of dateien) L(`  ✓ ${d.name.padEnd(38)} ${String(d.zeilen).padStart(4)} Zeilen`);
L(`\n${MUSKELN.length} Datensaetze · ${CARD_MUSCLES.length} Karten · ${GELENKGRUPPEN.length} Gelenkgruppen`);
L('Erzeugte Dateien — Aenderungen gehoeren in die Quelldaten, nicht hierher.\n');
