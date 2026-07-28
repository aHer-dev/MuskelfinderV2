/* =========================================================================
   check:pwa — ist die gebaute App wirklich installierbar?
   scripts/check-pwa.mjs   ·   Aufruf: npm run check:pwa   (braucht `npm run build`)

   WARUM ES DAS GIBT: Die App erfuellte die Installationskriterien, aber bei einem
   Nutzer klappte die Installation und beim naechsten nicht. Die Ursache lag nicht
   im Code, sondern im **Zusammenspiel von Dateien, die niemand gemeinsam ansieht**:
   Manifest, Icons, `base`, `index.html`, Service Worker.

   Der gefaehrlichste Fehler dieser Klasse faellt LOKAL NIE AUF: Wenn `base` und
   `start_url`/`scope` auseinanderlaufen, installiert der Browser einen Scope, den
   es nicht gibt — `vite preview` liefert trotzdem fuer jeden Pfad die index.html
   aus, und im Entwicklungsbetrieb sieht alles richtig aus. Erst auf GitHub Pages
   startet die installierte App ins Nichts.

   Deshalb prueft dieses Skript nicht die Konfiguration, sondern das **gebaute
   Ergebnis** — und leitet die erwartete `base` aus den Asset-Pfaden in
   `dist/index.html` ab, statt sie noch einmal selbst zu behaupten. Eine zweite
   Quelle waere genau der Fehler, den die Pruefung finden soll.
   ========================================================================= */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { leseBaseAusDist } from './lib/dist-base.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const fehler = [];
const hinweise = [];
const fail = (m) => fehler.push(m);
const warn = (m) => hinweise.push(m);
const L = (s = '') => console.log(s);

/* ---- Vorbedingung ----------------------------------------------------- */
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ dist/index.html fehlt — erst `npm run build` laufen lassen.');
  process.exit(1);
}
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

/* ---- PNG-Groesse aus dem IHDR lesen ----------------------------------- */
/** Breite/Hoehe eines PNG ohne Fremdbibliothek: Bytes 16..24 des IHDR. */
function pngGroesse(pfad) {
  const kopf = readFileSync(pfad).subarray(0, 24);
  const istPng = kopf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!istPng) return null;
  return { w: kopf.readUInt32BE(16), h: kopf.readUInt32BE(20) };
}

/* ---- 1. base aus den gebauten Asset-Pfaden ableiten -------------------- */
/* Dieselbe Ableitung nutzt der Playwright-Harness (`scripts/lib/dist-base.mjs`) —
   damit gibt es fuer die base genau eine Quelle: die Vite-Konfiguration. */
const base = leseBaseAusDist(DIST);

/* ---- 2. Manifest ------------------------------------------------------- */
const manifestVerweis = /<link[^>]+rel="manifest"[^>]+href="([^"]+)"/.exec(html);
if (!manifestVerweis) fail('dist/index.html verlinkt kein Manifest (<link rel="manifest">).');
else if (!manifestVerweis[1].startsWith(base)) {
  fail(`Manifest-Verweis "${manifestVerweis[1]}" folgt nicht der base "${base}".`);
}

const manifestDatei = join(DIST, 'manifest.webmanifest');
if (!existsSync(manifestDatei)) {
  console.error('✗ dist/manifest.webmanifest fehlt.');
  process.exit(1);
}
let m;
try {
  m = JSON.parse(readFileSync(manifestDatei, 'utf8'));
} catch (e) {
  console.error(`✗ manifest.webmanifest ist kein gueltiges JSON: ${e.message}`);
  process.exit(1);
}

/* Pflichtfelder. Ohne `name`/`icons`/`start_url`/`display` bietet Chrome die
   Installation gar nicht an; `short_name` steht unter dem Icon. */
for (const feld of ['name', 'short_name', 'start_url', 'scope', 'id', 'display', 'icons']) {
  if (m[feld] === undefined || m[feld] === '') fail(`Manifest: Feld "${feld}" fehlt.`);
}
if (m.display && !['standalone', 'fullscreen', 'minimal-ui'].includes(m.display)) {
  fail(`Manifest: display "${m.display}" macht die App nicht installierbar `
    + '(erlaubt: standalone, fullscreen, minimal-ui).');
}
if (m.short_name && m.short_name.length > 12) {
  warn(`short_name "${m.short_name}" ist ${m.short_name.length} Zeichen — Android kuerzt ab ~12.`);
}

/* DER Kernabgleich: laufen Manifest und base auseinander, installiert der
   Browser einen Scope, den es nicht gibt. */
for (const feld of ['start_url', 'scope', 'id']) {
  if (m[feld] !== undefined && m[feld] !== base) {
    fail(`Manifest: ${feld} ist "${m[feld]}", die gebauten Assets liegen aber unter "${base}". `
      + 'Die installierte App startet damit ins Leere (faellt lokal NICHT auf).');
  }
}

/* ---- 3. Icons: existieren UND haben die deklarierte Groesse ------------ */
const icons = Array.isArray(m.icons) ? m.icons : [];
let hat192 = false, hat512 = false, hatMaskable = false;

for (const icon of icons) {
  const pfad = join(DIST, icon.src);
  if (!existsSync(pfad)) {
    fail(`Manifest nennt Icon "${icon.src}" — die Datei liegt nicht im dist/.`);
    continue;
  }
  const groesse = pngGroesse(pfad);
  if (!groesse) { fail(`Icon "${icon.src}" ist kein lesbares PNG.`); continue; }

  /* Eine falsche `sizes`-Angabe ist heimtueckisch: Chrome verwirft das Icon
     stillschweigend und findet dann womoeglich kein passendes mehr. */
  const [dw, dh] = String(icon.sizes ?? '').split('x').map(Number);
  if (dw !== groesse.w || dh !== groesse.h) {
    fail(`Icon "${icon.src}": Manifest sagt ${icon.sizes}, die Datei ist ${groesse.w}x${groesse.h}.`);
  }
  if (groesse.w >= 192 && groesse.h >= 192) hat192 = true;
  if (groesse.w >= 512 && groesse.h >= 512) hat512 = true;
  if (String(icon.purpose ?? '').includes('maskable')) hatMaskable = true;
}

if (!hat192) fail('Kein Icon mit mindestens 192x192 — Chrome verweigert dann die Installation.');
if (!hat512) fail('Kein Icon mit mindestens 512x512 — Chrome verweigert dann die Installation.');
if (!hatMaskable) {
  warn('Kein Icon mit purpose "maskable" — Android beschneidet das Symbol dann selbst '
    + '(weisser Rand oder abgeschnittene Ecken).');
}

/* ---- 4. Screenshots --------------------------------------------------- */
const shots = Array.isArray(m.screenshots) ? m.screenshots : [];
for (const s of shots) {
  const pfad = join(DIST, s.src);
  if (!existsSync(pfad)) {
    fail(`Manifest nennt Screenshot "${s.src}", der nicht im dist/ liegt. `
      + 'Vergessener zweiter Build? → npm run make:screenshots && npm run build');
    continue;
  }
  const groesse = pngGroesse(pfad);
  if (!groesse) { fail(`Screenshot "${s.src}" ist kein lesbares PNG.`); continue; }
  const [dw, dh] = String(s.sizes ?? '').split('x').map(Number);
  if (dw !== groesse.w || dh !== groesse.h) {
    fail(`Screenshot "${s.src}": Manifest sagt ${s.sizes}, die Datei ist ${groesse.w}x${groesse.h}.`);
  }
}
if (shots.length > 0 && !shots.some((s) => s.form_factor === 'narrow')) {
  warn('Screenshots ohne form_factor "narrow" — Chrome zeigt sie auf dem Handy nicht.');
}
if (shots.length === 0) {
  warn('Keine Screenshots — Android zeigt dann den kargen statt des reichen Installationsdialogs.');
}

/* ---- 5. Service Worker ------------------------------------------------ */
if (!existsSync(join(DIST, 'sw.js'))) {
  fail('dist/sw.js fehlt — ohne Service Worker ist die App nicht installierbar.');
}
if (!/registerSW\.js/.test(html) && !/serviceWorker/.test(html)) {
  fail('dist/index.html registriert keinen Service Worker.');
}

/* ---- 5b. Liegt der `beforeinstallprompt`-Hoerer im START-Bundle? -------
   DER FEHLER, DEN DIESE PRUEFUNG GEFUNDEN HAETTE: `pwa/install.ts` registriert beim
   Import einen Hoerer und puffert das Ereignis, weil Chrome es einmal kurz nach dem
   Laden feuert — noch bevor React gemountet hat. Der Import hing aber an
   `InstallSection` → `GuidePage`, und die ist ein **Lazy-Chunk**. Geladen wurde das
   Modul also erst beim Aufruf von `/anleitung`; da war das Ereignis lange durch, der
   Puffer leer, und die Seite zeigte den Menue-Hinweis auf einem Chrome, das
   installieren WOLLTE.

   Das ist lokal nicht zu sehen: Der Code ist richtig, die Tests sind gruen (sie
   feuern das Ereignis selbst, nach dem Import), das Modul funktioniert. Kaputt ist
   allein der ZEITPUNKT seines Ladens — und der entsteht erst im Build.
   Geprueft wird deshalb gegen `dist/`: In welchem Chunk steht der Hoerer, und wird
   dieser Chunk von `index.html` geladen? */
const MARKE = 'beforeinstallprompt';
const assetsDir = join(DIST, 'assets');
if (!existsSync(assetsDir)) {
  fail('dist/assets/ fehlt — Build kaputt?');
} else {
  const traeger = readdirSync(assetsDir)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => readFileSync(join(assetsDir, f), 'utf8').includes(MARKE));

  if (traeger.length === 0) {
    fail(`Kein gebautes Bundle enthaelt "${MARKE}" — der Installationsknopf kann nie `
      + 'erscheinen. Wurde `src/pwa/install.ts` aus dem Baum entfernt?');
  } else {
    /* „Vom Start geladen" heisst: als <script> ODER als modulepreload im HTML genannt.
       Ein Lazy-Chunk steht dort nicht — genau daran erkennt man den Fehler. */
    const frueh = traeger.filter((f) => html.includes(f));
    if (frueh.length === 0) {
      fail(`Der "${MARKE}"-Hoerer liegt nur in ${traeger.join(', ')} — einem Chunk, den `
        + 'index.html NICHT laedt (Lazy-Route). Chrome feuert das Ereignis einmal kurz '
        + 'nach dem Laden; bis der Chunk kommt, ist es verpasst und der Knopf bleibt aus. '
        + 'Abhilfe: `import \'./pwa/install\'` in `src/main.tsx`.');
    }
  }
}

/* ---- 6. iOS: was das Manifest dort NICHT leistet ---------------------- */
/* iOS liest das Manifest erst ab 16.4 vollstaendig. Fehlen diese Tags, startet
   eine vom Home-Bildschirm geoeffnete App als Safari-Tab mit Browserleiste. */
const IOS_TAGS = [
  ['apple-mobile-web-app-capable', 'App startet sonst als Safari-Tab MIT Browserleiste'],
  ['apple-mobile-web-app-title', 'Unter dem Icon stuende sonst der ganze <title>, abgeschnitten'],
  ['apple-mobile-web-app-status-bar-style', 'Statusleiste wird sonst nicht mitgefaerbt'],
  ['mobile-web-app-capable', 'Standardisierte Fassung, die Chrome erwartet'],
];
for (const [tag, warum] of IOS_TAGS) {
  if (!new RegExp(`name="${tag}"`).test(html)) fail(`index.html: <meta name="${tag}"> fehlt — ${warum}.`);
}

const appleIcon = /<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/.exec(html);
if (!appleIcon) fail('index.html: <link rel="apple-touch-icon"> fehlt — iOS nimmt sonst einen Screenshot als Symbol.');
else {
  const rel = appleIcon[1].startsWith(base) ? appleIcon[1].slice(base.length) : appleIcon[1];
  if (!existsSync(join(DIST, rel))) fail(`apple-touch-icon "${appleIcon[1]}" liegt nicht im dist/.`);
}

if (!/name="theme-color"/.test(html)) warn('Kein <meta name="theme-color"> — die Browserleiste bleibt grau.');

/* ---- Bericht ---------------------------------------------------------- */
L('── PWA: INSTALLIERBARKEIT (gegen dist/) ──');
L(`  base aus den Asset-Pfaden: ${base}`);
L(`  Manifest: ${m.name} · short_name "${m.short_name}" · display ${m.display}`);
L(`  Icons: ${icons.length} (>=192 ${hat192 ? '✓' : '✗'} · >=512 ${hat512 ? '✓' : '✗'} · maskable ${hatMaskable ? '✓' : '✗'})`);
L(`  Screenshots: ${shots.length} · Service Worker: ${existsSync(join(DIST, 'sw.js')) ? '✓' : '✗'}`);
const sonstige = readdirSync(DIST).filter((f) => f.endsWith('.png')).length;
L(`  PNG-Dateien im dist/: ${sonstige}`);

if (hinweise.length) {
  L('\n── HINWEISE (kein harter Fehler) ──');
  for (const h of hinweise) L(`  · ${h}`);
}

if (fehler.length) {
  L('\n── FEHLER ──');
  for (const f of fehler) L(`  ✗ ${f}`);
  L(`\n✗ check:pwa gescheitert (${fehler.length}).`);
  process.exit(1);
}

L('\n✓ check:pwa bestanden — die gebaute App ist installierbar.');
