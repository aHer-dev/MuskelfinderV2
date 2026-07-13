#!/usr/bin/env node
/* =========================================================================
   Gruppen-Vorschlag (Etappe 9a) — schlaegt vor, entscheidet NICHT.
   scripts/propose-groups.mjs

   Funktionelle Gruppen sind Fachinhalt. Dieses Skript liest die vorhandenen
   Tags/Funktionen/Regionen und legt dem Projektinhaber eine Liste zur PRUEFUNG
   vor. Es schreibt NIEMALS `src/data/editorial/groups.json` — das tut ein Mensch.

   Aufruf:  node scripts/propose-groups.mjs
   Ergebnis: docs/gruppen-vorschlag.md
   ========================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const muscles = JSON.parse(
  readFileSync(path.join(repoRoot, 'src/data/generated/muscles.json'), 'utf8'),
);

/** Untergrenze: unter 3 Muskeln ist es keine Gruppe, sondern ein Muskel mit Anhang. */
const MIN_SIZE = 3;
/** Obergrenze: ueber 15 ist es keine Lerneinheit mehr, sondern eine Region. */
const MAX_SIZE = 15;

const REGION_LABEL = {
  upper: 'Obere Extremität',
  lower: 'Untere Extremität',
  trunk: 'Wirbelsäule & Rumpf',
  head: 'Kopf & Hals',
};

/* ---------- Tags einsammeln --------------------------------------------- */

const byTag = new Map();
for (const m of muscles) {
  for (const tag of m.tags) {
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push(m);
  }
}

/* ---------- Datenprobleme, die eine falsche Gruppe erzeugen wuerden ------ */

/** „aussenrotator" und „außenrotator" sind zwei Tags — aber ein Mensch liest ein Wort. */
function normalizeTag(tag) {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

const kollisionen = new Map();
for (const tag of byTag.keys()) {
  const key = normalizeTag(tag);
  if (!kollisionen.has(key)) kollisionen.set(key, []);
  kollisionen.get(key).push(tag);
}
const doppelt = [...kollisionen.values()].filter((tags) => tags.length > 1);

/* ---------- Kandidaten --------------------------------------------------- */

const kandidaten = [...byTag.entries()]
  .filter(([, ms]) => ms.length >= MIN_SIZE && ms.length <= MAX_SIZE)
  .map(([tag, ms]) => {
    const regionen = [...new Set(ms.map((m) => m.region))];
    return { tag, ms, regionen, gemischt: regionen.length > 1 };
  })
  .sort((a, b) => Number(a.gemischt) - Number(b.gemischt) || b.ms.length - a.ms.length);

/* ---------- Bericht ------------------------------------------------------ */

const zeilen = [];
zeilen.push('# Gruppen-Vorschlag (Etappe 9a) — **zur fachlichen Prüfung**');
zeilen.push('');
zeilen.push('> Erzeugt von `node scripts/propose-groups.mjs`. **Dieses Dokument ist ein Vorschlag,');
zeilen.push('> keine Wahrheit.** Erst was der Projektinhaber freigibt, landet in');
zeilen.push('> `src/data/editorial/groups.json`. Eine falsche Gruppenzuordnung wird auswendig gelernt.');
zeilen.push('');
zeilen.push(`Datenstand: **${muscles.length} Muskeln**, ${byTag.size} Tags. Kandidaten mit ${MIN_SIZE}–${MAX_SIZE} Muskeln: **${kandidaten.length}**.`);
zeilen.push('');

if (doppelt.length > 0) {
  zeilen.push('## ⚠️ Zuerst: Tag-Kollisionen in den Daten');
  zeilen.push('');
  zeilen.push('Diese Tags sind für einen Menschen **dasselbe Wort**, für den Code aber zwei verschiedene.');
  zeilen.push('**Nicht vorschnell „reparieren".** Prüfe erst, ob dahinter *eine* Gruppe steckt oder *zwei*:');
  zeilen.push('');
  zeilen.push('- Sind es **zwei** Gruppen (z. B. Außenrotatoren der *Schulter* vs. der *Hüfte*), muss man sie');
  zeilen.push('  **unterschiedlich benennen** — wer die Schreibweise vereinheitlicht, verschmilzt sie zu einer');
  zeilen.push('  **falschen** Gruppe.');
  zeilen.push('- Ist es **eine** Gruppe, gehört der Tag in den Daten korrigiert (`npm run migrate:data`-Quelle!).');
  zeilen.push('');
  for (const tags of doppelt) {
    for (const tag of tags) {
      const ms = byTag.get(tag);
      const regionen = [...new Set(ms.map((m) => REGION_LABEL[m.region]))].join(', ');
      zeilen.push(`- \`${tag}\` → ${ms.length} Muskeln (${regionen}): ${ms.map((m) => m.nameLatin).join(', ')}`);
    }
    zeilen.push('');
  }
}

zeilen.push('## Kandidaten aus einer Region (die saubersten)');
zeilen.push('');
for (const k of kandidaten.filter((k) => !k.gemischt)) {
  zeilen.push(`### \`${k.tag}\` — ${k.ms.length} Muskeln · ${REGION_LABEL[k.regionen[0]]}`);
  for (const m of k.ms) zeilen.push(`- ${m.nameLatin} *(${m.subregion})*`);
  zeilen.push('');
}

zeilen.push('## Kandidaten über mehrere Regionen — meist **zu weit**');
zeilen.push('');
zeilen.push('Ein Tag wie `adduktor` fasst Hüft- **und** Daumenadduktoren zusammen. Das ist eine');
zeilen.push('*Eigenschaft*, keine Lerngruppe. Wenn überhaupt, dann **je Region getrennt**.');
zeilen.push('');
for (const k of kandidaten.filter((k) => k.gemischt)) {
  const proRegion = k.regionen
    .map((r) => `${REGION_LABEL[r]} (${k.ms.filter((m) => m.region === r).length})`)
    .join(' · ');
  zeilen.push(`### \`${k.tag}\` — ${k.ms.length} Muskeln, verteilt auf: ${proRegion}`);
  for (const m of k.ms) zeilen.push(`- ${m.nameLatin} *(${REGION_LABEL[m.region]} · ${m.subregion})*`);
  zeilen.push('');
}

const out = path.join(repoRoot, 'docs/gruppen-vorschlag.md');
writeFileSync(out, zeilen.join('\n') + '\n', 'utf8');
console.log(`Vorschlag geschrieben: docs/gruppen-vorschlag.md`);
console.log(`  ${kandidaten.length} Kandidaten (${kandidaten.filter((k) => !k.gemischt).length} aus einer Region)`);
if (doppelt.length > 0) console.log(`  ⚠️  ${doppelt.length} Tag-Kollision(en) gefunden — im Bericht oben`);
