/* =========================================================================
   vergleich:wikipedia — den Bestand gegen die de-Wikipedia-Infobox stellen.
   scripts/vergleich-wikipedia.mjs

   WOFUER: Fuer Ursprung, Ansatz und Segmente gibt es keine eine wahre Quelle —
   Lehrbuecher weichen legitim voneinander ab. Diese Liste ersetzt also kein
   Lehrbuch, sie sagt nur: „hier steht woanders etwas anderes, schau hin."
   Mechanisch vergleichbar sind **Segmente und Innervation**; Ursprung/Ansatz/
   Funktion brauchen ein fachliches Urteil und werden nur markiert.

   EIN- UND AUSGABE sind beide erzeugt und stehen deshalb in der .gitignore:
     Eingabe:  docs/pruefung/csv/00-alle-muskeln.csv   (npm run export:csv)
     Ausgabe:  docs/pruefung/vergleich-wikipedia.csv
   Der Lauf braucht Netz und dauert Minuten (ein Abruf je Muskel, gedrosselt).
   ========================================================================= */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const CSV = 'docs/pruefung/csv/00-alle-muskeln.csv';
const UA = 'MuskelfinderV2-Datenabgleich/0.1 (Lernprojekt, einmaliger Abgleich)';

/* Die Eingabe ist erzeugt und liegt nicht im Repo. Ohne diesen Hinweis stirbt
   das Skript auf einem frischen Klon an einem nackten ENOENT, und der naechste
   Leser sucht den Fehler im Netzabruf statt im fehlenden Export. */
if (!existsSync(CSV)) {
  console.error(`✗ ${CSV} fehlt. Die Datei ist erzeugt (nicht im Repo).`);
  console.error('  Erst `npm run export:csv`, dann diesen Lauf noch einmal.');
  process.exit(2);
}

/* ---- CSV lesen (Semikolon, BOM, CRLF, RFC-4180-Quotes) ----------------- */
function parseCsv(text) {
  const rows = [];
  let row = [], feld = '', inQuote = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuote) {
      if (c === '"') { if (s[i + 1] === '"') { feld += '"'; i++; } else inQuote = false; }
      else feld += c;
    } else if (c === '"') inQuote = true;
    else if (c === ';') { row.push(feld); feld = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(feld); rows.push(row); row = []; feld = ''; }
    else feld += c;
  }
  if (feld || row.length) { row.push(feld); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const kopf = rows[0];
const idx = (name) => kopf.indexOf(name);
const I = {
  name: idx('Muskel (lateinisch)'), region: idx('Region'), sub: idx('Subregion'),
  ursprung: idx('Ursprung'), ansatz: idx('Ansatz'), funktion: idx('Funktion (Text)'),
  nerv: idx('Innervation'), segment: idx('Segmente'), key: idx('Kartenschlüssel'),
};
const bestand = rows.slice(1).filter((r) => r[I.name]).map((r) => ({
  name: r[I.name], region: r[I.region], sub: r[I.sub], key: r[I.key],
  ursprung: r[I.ursprung], ansatz: r[I.ansatz], funktion: r[I.funktion],
  nerv: r[I.nerv], segment: r[I.segment],
}));

/* ---- Titelkandidaten: „M. x" -> „Musculus x", plus Hand/Fuss-Klammer --- */
/** „Mm. iliocostales" -> „Musculus iliocostalis": Mehrzahl auf Einzahl. */
function einzahl(rest) {
  return rest.split(' ').map((w) => w
    .replace(/ales$/, 'alis').replace(/iles$/, 'ilis')
    .replace(/imi$/, 'imus').replace(/ii$/, 'ius')
    .replace(/es$/, 'is').replace(/i$/, 'us')).join(' ');
}

function kandidaten(m) {
  /* Teilmuskeln („– Caput longum") und Synonymklammern haben keinen eigenen
     Artikel — auf den Elternartikel zurueckfallen. Roemische Ziffern desgleichen. */
  const stamm = m.name
    .replace(/\s+[–-]\s+(Caput|Pars|Portio)\b.*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+[IVX]+(\s*[–-]\s*[IVX]+)?\s*$/, '')
    .trim();

  const out = [];
  const push = (t) => { if (t && !out.includes(t)) out.push(t); };

  const istGruppe = /^Mm\.\s+/.test(stamm);
  const rest = stamm.replace(/^Mm?\.\s+/, '');
  const lang = istGruppe ? `Musculi ${rest}` : `Musculus ${rest}`;

  /* Regionsvariante ZUERST: „Mm. interossei dorsales" gibt es an Hand und Fuß,
     und der unqualifizierte Artikel ist der Hand-Artikel. Ohne diese Reihenfolge
     wird ein Fußmuskel gegen die Hand geprüft (N. ulnaris statt N. plantaris). */
  const klammer = /Obere Extremität/.test(m.region) ? '(Hand)'
    : /Untere Extremität/.test(m.region) ? '(Fuß)' : null;
  const ez = istGruppe ? `Musculus ${einzahl(rest)}` : null;

  if (klammer) push(`${lang} ${klammer}`);
  push(lang);
  if (ez) {
    if (klammer) push(`${ez} ${klammer}`);
    push(ez);
  }
  push(stamm.replace(/^Mm?\.\s+/, ''));  /* z. B. „Platysma" */
  return out;
}

/* ---- Wikitext -> Klartext --------------------------------------------- */
function klartext(w) {
  return w
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<br\s*\/?>/gi, ' · ')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---- Infobox aus dem Wikitext schneiden ------------------------------- */
function infobox(wikitext) {
  const start = wikitext.search(/\{\{\s*Infobox Muskel/i);
  if (start < 0) return null;
  let tiefe = 0, ende = -1;
  for (let i = start; i < wikitext.length - 1; i++) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') { tiefe++; i++; }
    else if (wikitext[i] === '}' && wikitext[i + 1] === '}') { tiefe--; i++; if (!tiefe) { ende = i + 1; break; } }
  }
  if (ende < 0) return null;
  const body = wikitext.slice(start + 2, ende - 2);

  /* Parameter auf Tiefe 0 trennen */
  const teile = []; let cur = '', t = 0;
  for (let i = 0; i < body.length; i++) {
    const zwei = body.slice(i, i + 2);
    if (zwei === '{{' || zwei === '[[') { t++; cur += zwei; i++; continue; }
    if (zwei === '}}' || zwei === ']]') { t--; cur += zwei; i++; continue; }
    if (body[i] === '|' && t === 0) { teile.push(cur); cur = ''; continue; }
    cur += body[i];
  }
  teile.push(cur);

  const felder = {};
  for (const teil of teile) {
    const g = teil.indexOf('=');
    if (g < 0) continue;
    felder[teil.slice(0, g).trim().toLowerCase()] = klartext(teil.slice(g + 1));
  }
  return felder;
}

/* ---- Abholen, 50 Titel pro Anfrage ------------------------------------ */
async function holen(titel) {
  const treffer = new Map();
  for (let i = 0; i < titel.length; i += 50) {
    const teil = titel.slice(i, i + 50);
    const url = 'https://de.wikipedia.org/w/api.php?action=query&prop=revisions'
      + '&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1&titles='
      + teil.map(encodeURIComponent).join('|');
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
    const json = await res.json();
    for (const p of json.query?.pages ?? []) {
      if (p.missing) continue;
      const wt = p.revisions?.[0]?.slots?.main?.content;
      if (wt) treffer.set(p.title, wt);
    }
    /* Umleitungen zurueckmappen, damit der Kandidat den Treffer findet */
    for (const r of json.query?.redirects ?? []) {
      const ziel = treffer.get(r.to);
      if (ziel) treffer.set(r.from, ziel);
    }
    for (const n of json.query?.normalized ?? []) {
      const ziel = treffer.get(n.to);
      if (ziel) treffer.set(n.from, ziel);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return treffer;
}

/* ---- Vergleichslogik -------------------------------------------------- */
const norm = (s) => (s || '').toLowerCase()
  .replace(/\bm\.\s*/g, '').replace(/\bmusculus\s*/g, '')
  .replace(/\bn\.\s*/g, '').replace(/\bnervus\s*/g, '')
  .replace(/\blig\.\s*/g, '').replace(/\bligamentum\s*/g, '')
  .replace(/\bproc\.\s*/g, '').replace(/\bprocessus\s*/g, '')
  .replace(/[^a-zäöüß0-9]+/g, ' ').trim();

const STOPP = new Set(['der', 'des', 'die', 'das', 'und', 'am', 'an', 'im', 'in', 'von', 'vom',
  'zum', 'zur', 'bei', 'sowie', 'dessen', 'sich', 'ein', 'eine', 'mit', 'auf', 'für']);

/* Lateinische Deklination einziehen: „humeri" und „humerus" sind derselbe Ort.
   Endvokale plus s/n/m fallen weg — grob, aber es macht den Vergleich erst
   brauchbar. Stamm bleibt mindestens 3 Zeichen. */
const stamm = (w) => {
  let s = w;
  while (s.length > 3 && /[aeiousnm]$/.test(s)) s = s.slice(0, -1);
  return s;
};
const tokens = (s) => new Set(norm(s).split(' ')
  .filter((w) => w.length > 3 && !STOPP.has(w)).map(stamm));

function urteil(mein, fremd) {
  if (!mein && !fremd) return 'beide leer';
  if (!mein) return 'nur Wikipedia';
  if (!fremd) return 'nur bei mir';
  if (norm(mein) === norm(fremd)) return 'gleich';
  const a = tokens(mein), b = tokens(fremd);
  if (!a.size || !b.size) return 'prüfen';
  const schnitt = [...a].filter((w) => b.has(w)).length;
  const jaccard = schnitt / (a.size + b.size - schnitt);
  if (jaccard >= 0.6) return 'gleich (andere Worte)';
  if (jaccard >= 0.25) return 'teils gleich';
  return 'abweichend';
}

/* Segmente sind exakt vergleichbar — aber erst, wenn Bereiche aufgelöst sind.
   „C5–C7" heißt C5, C6, C7; „L4-S1" heißt L4, L5, S1. Dafür braucht es die
   Reihenfolge der Wirbelsäule, nicht nur die Ziffer. */
const WIRBEL = [
  ...Array.from({ length: 8 }, (_, i) => `C${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `Th${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `S${i + 1}`),
  'Co1', 'Co2',
];
const RANG = new Map(WIRBEL.map((c, i) => [c, i]));

/** „th1", „t1", „TH 1" -> „Th1"; unbekanntes -> null */
function segNorm(roh) {
  const m = /^(co|th|t|c|l|s)\s*\.?\s*(\d{1,2})$/i.exec(roh.trim());
  if (!m) return null;
  const p = m[1].toLowerCase();
  const praefix = p === 'co' ? 'Co' : (p === 'th' || p === 't') ? 'Th' : p.toUpperCase();
  const code = `${praefix}${Number(m[2])}`;
  return RANG.has(code) ? code : null;
}

const segCodes = (s) => {
  const out = new Set();
  if (!s) return out;
  /* Bereiche zuerst: Trenner sind –, —, -, „bis" */
  const text = s.replace(/\s*(?:–|—|-|\bbis\b)\s*/gi, '–');
  for (const stueck of text.split(/[,;/·)(]|\bund\b|\boder\b/i)) {
    /* „C5–7" und „Th5–11": die Zweitziffer erbt das Präfix der Erstziffer */
    const rohTeile = stueck.split('–');
    const praefix = /^\s*(co|th|t|c|l|s)/i.exec(rohTeile[0] ?? '')?.[1] ?? '';
    const teile = rohTeile
      .map((x) => (/^\s*\d{1,2}\s*$/.test(x) ? `${praefix}${x.trim()}` : x))
      .map(segNorm).filter(Boolean);
    if (teile.length >= 2) {
      /* Bereich: alles zwischen erstem und letztem Rang aufnehmen */
      const raenge = teile.map((c) => RANG.get(c));
      for (let r = Math.min(...raenge); r <= Math.max(...raenge); r++) out.add(WIRBEL[r]);
    } else if (teile.length === 1) out.add(teile[0]);
  }
  return out;
};
function segUrteil(mein, fremd) {
  const a = segCodes(mein), b = segCodes(fremd);
  if (!a.size && !b.size) return { u: 'beide leer', delta: '' };
  if (!a.size) return { u: 'nur Wikipedia', delta: '' };
  if (!b.size) return { u: 'nur bei mir', delta: '' };
  const nurA = [...a].filter((x) => !b.has(x));
  const nurB = [...b].filter((x) => !a.has(x));
  if (!nurA.length && !nurB.length) return { u: 'gleich', delta: '' };
  const d = [nurA.length ? `nur bei mir: ${nurA.join(', ')}` : '',
    nurB.length ? `nur Wikipedia: ${nurB.join(', ')}` : ''].filter(Boolean).join(' | ');
  return { u: 'abweichend', delta: d };
}

/* ---- Lauf ------------------------------------------------------------- */
const alleTitel = [...new Set(bestand.flatMap(kandidaten))];
console.error(`${bestand.length} Datensätze, ${alleTitel.length} Titelkandidaten …`);
const seiten = await holen(alleTitel);
console.error(`${seiten.size} Artikel geladen.`);

const FELDER = [
  ['Ursprung', 'ursprung', 'ursprung'],
  ['Ansatz', 'ansatz', 'ansatz'],
  ['Funktion', 'funktion', 'funktion'],
  ['Innervation', 'nerv', 'nerv'],
  ['Segmente', 'segment', 'segment'],
];

const zeilen = [];
const stat = { getroffen: 0, keinArtikel: [], keineInfobox: [] };

for (const m of bestand) {
  let titel = null, box = null;
  for (const k of kandidaten(m)) {
    const wt = seiten.get(k);
    if (!wt) continue;
    const b = infobox(wt);
    if (b) { titel = k; box = b; break; }
    if (!titel) titel = k;
  }
  if (!box) {
    (titel ? stat.keineInfobox : stat.keinArtikel).push(m.name);
    zeilen.push([m.name, m.region, m.sub, '—', 'kein Vergleich', '', '', '',
      titel ? 'Artikel ohne Infobox' : 'kein Artikel gefunden']);
    continue;
  }
  stat.getroffen++;
  for (const [label, meinFeld, wikiFeld] of FELDER) {
    const mein = m[meinFeld], fremd = box[wikiFeld] ?? '';
    /* Funktion ist Freitext auf beiden Seiten — maschinell nicht vergleichbar.
       Beide Fassungen trotzdem nebeneinander, zum Lesen. */
    const { u, delta } = label === 'Segmente' ? segUrteil(mein, fremd)
      : label === 'Funktion' ? { u: 'Freitext — nur lesen', delta: '' }
        : { u: urteil(mein, fremd), delta: '' };
    zeilen.push([m.name, m.region, m.sub, label, u, mein, fremd, delta,
      `https://de.wikipedia.org/wiki/${encodeURIComponent(titel.replace(/ /g, '_'))}`]);
  }
}

/* ---- CSV schreiben ---------------------------------------------------- */
const zelle = (v) => (/[";\r\n]/.test(String(v ?? '')) ? `"${String(v).replaceAll('"', '""')}"` : String(v ?? ''));
const kopfzeile = ['Muskel', 'Region', 'Subregion', 'Feld', 'Urteil', 'Bei mir', 'Wikipedia', 'Delta', 'Artikel'];
writeFileSync('docs/pruefung/vergleich-wikipedia.csv',
  '﻿' + [kopfzeile, ...zeilen].map((z) => z.map(zelle).join(';')).join('\r\n') + '\r\n', 'utf8');

/* ---- Bericht ---------------------------------------------------------- */
const zaehl = {};
for (const z of zeilen) if (z[3] !== '—') zaehl[`${z[3]} · ${z[4]}`] = (zaehl[`${z[3]} · ${z[4]}`] ?? 0) + 1;
console.error(`\nAbdeckung: ${stat.getroffen}/${bestand.length} mit Infobox`);
console.error(`kein Artikel: ${stat.keinArtikel.length} · Artikel ohne Infobox: ${stat.keineInfobox.length}`);
console.error('\n--- Urteile ---');
for (const k of Object.keys(zaehl).sort()) console.error(`${String(zaehl[k]).padStart(4)}  ${k}`);
if (stat.keinArtikel.length) console.error('\nOhne Artikel:\n  ' + stat.keinArtikel.join('\n  '));
if (stat.keineInfobox.length) console.error('\nOhne Infobox:\n  ' + stat.keineInfobox.join('\n  '));
