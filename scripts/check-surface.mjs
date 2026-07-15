/* =========================================================================
   check:oberflaeche — die Oberflaeche in JEDEM Zustand, nicht nur in Ruhe.
   scripts/check-surface.mjs   ·   Aufruf: npm run check:oberflaeche

   WARUM: Drei Kontrastfehler in Folge sind im HOVER gestorben, nicht in Ruhe —
   axe meldete auf allen Routen „0 Verstoesse", waehrend ein Knopf beim Ueberfahren
   durchfiel. Ein Ruhezustand-Audit findet diese Klasse nie. Dieses Skript prueft
   jede Route in Hell UND Dunkel, in Ruhe UND mit dem Mauszeiger auf jeder
   Link-/Knopfklasse, und misst nebenbei Ueberlauf und Satzspiegel.

   Harte Fehler (Exit 1): axe-Verstoss · horizontaler Ueberlauf · > 85 Zeichen/Zeile.
   Der Hover-Kontrast wird nach 400 ms gemessen (sonst trifft man die Farbe MITTEN
   in der CSS-Transition).
   ========================================================================= */

import { withApp } from './checks/harness.mjs';
import { SEED, SEED_CARD_COUNT } from './checks/seed.mjs';

/* Alle Routen. Die meisten brauchen einen befuellten Zustand (Seed); die leeren
   Zustaende pruefen wir separat mit frischem Browser. */
const ROUTES = [
  ['/heute', 'heute'],
  ['/anleitung', 'anleitung'],
  ['/start', 'start'],
  ['/suche', 'suche'],
  ['/suche?q=biceps', 'suche-treffer'],
  ['/muskel/m-biceps-brachii', 'detail'],
  ['/lernkarten', 'lernkarten'],
  ['/karteikasten', 'karteikasten'],
  ['/quiz', 'quiz'],
  ['/pruefung', 'pruefung'],
  ['/statistik', 'statistik'],
  ['/quellen', 'quellen'],
  ['/datenschutz', 'datenschutz'],
  ['/gibtsnicht', '404'],
];

/* Hover-Ziele: je Route eine Auswahl der Bedien-/Link-Klassen. */
const HOVER = [
  ['/heute', '.btn--primary'],
  ['/heute', '.today__quick-link'],
  ['/heute', '.btn--ghost'],
  ['/suche', '.muscle-card'],
  ['/karteikasten', 'tbody button'],
  ['/quellen', '.legal-card a'],
  ['/statistik', '.btn'],
  ['/anleitung', 'a'],
];

const befunde = [];
const record = (route, art, detail) => befunde.push({ route, art, detail });

await withApp(async ({ page, goto, runAxe, setTheme, errors }) => {
  const L = (s = '') => process.stdout.write(s + '\n');
  L('\n════════ check:oberflaeche ════════');

  // Kontrolle: kam der Seed an?
  await goto('/karteikasten');
  const zeilen = await page.locator('table tbody tr').count();
  if (zeilen !== SEED_CARD_COUNT) {
    L(`✗ Seed nicht angekommen (${zeilen}/${SEED_CARD_COUNT} Zeilen) — Messungen waertlos.`);
    process.exit(2);
  }

  /* ---- 1. Jede Route: axe (Hell+Dunkel), Ueberlauf, Satzspiegel ---- */
  for (const [route, name] of ROUTES) {
    await goto(route);

    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth > d.clientWidth + 1 ? { w: d.scrollWidth, c: d.clientWidth } : null;
    });
    if (overflow) record(route, 'UEBERLAUF', `scrollW ${overflow.w} > ${overflow.c}`);

    // Satzspiegel: Zeichen pro Zeile bei Fliesstext
    const langeZeilen = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('main p, main li')) {
        const t = el.textContent.trim();
        if (t.length < 90) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 50) continue;
        const probe = document.createElement('span');
        const cs = getComputedStyle(el);
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font}`;
        probe.textContent = t.slice(0, 120);
        document.body.appendChild(probe);
        const avg = probe.getBoundingClientRect().width / Math.min(120, t.length);
        probe.remove();
        const cpl = Math.round(r.width / avg);
        if (cpl > 85) out.push({ cpl, text: t.slice(0, 40) });
      }
      return out.sort((a, b) => b.cpl - a.cpl).slice(0, 3);
    });
    for (const z of langeZeilen) record(route, 'SATZSPIEGEL', `${z.cpl} Zeichen/Zeile — „${z.text}…"`);

    for (const theme of ['light', 'dark']) {
      await setTheme(theme);
      await page.waitForTimeout(250);
      const v = await runAxe();
      for (const x of v) record(route, `axe ${theme}`, `[${x.impact}] ${x.id} ×${x.n} — ${x.target} · ${x.msg}`);
    }
    await setTheme('light');
  }

  /* ---- 2. Hover-Kontrast (nach 400 ms; die alte Fehlerquelle) ---- */
  for (const [route, sel] of HOVER) {
    await goto(route);
    for (const theme of ['light', 'dark']) {
      await setTheme(theme);
      await page.waitForTimeout(200);
      const el = page.locator(sel).first();
      if (!(await el.count())) continue;
      await el.hover();
      await page.waitForTimeout(420); // Transition abwarten
      const v = await runAxe({ rules: ['color-contrast'] });
      for (const x of v) record(route, `HOVER ${theme}`, `${sel} — ${x.msg}`);
    }
    await setTheme('light');
  }

  /* ---- 3. Tastatur-Fokus sichtbar? ---- */
  await goto('/heute');
  const fokusRing = await page.evaluate(() => {
    const el = document.querySelector('.btn--primary');
    if (!el) return true;
    el.focus();
    const cs = getComputedStyle(el);
    const hatOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    const hatShadow = cs.boxShadow && cs.boxShadow !== 'none';
    return hatOutline || hatShadow;
  });
  if (!fokusRing) record('/heute', 'FOKUS', '.btn--primary hat keinen sichtbaren Fokus-Ring');

  if (errors.length) for (const e of [...new Set(errors)]) record('(global)', 'KONSOLE', e);
}, { seed: SEED });

/* ---- 4. Leere Zustaende mit FRISCHEM Browser (kein Seed) ---- */
await withApp(async ({ page, goto, runAxe, setTheme, errors }) => {
  // Erststart: Onboarding auf /heute
  await goto('/heute');
  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    await page.waitForTimeout(250);
    const v = await runAxe();
    for (const x of v) record('/heute (Erststart)', `axe ${theme}`, `[${x.impact}] ${x.id} — ${x.target}`);
  }
  // Leerer Karteikasten
  await goto('/karteikasten');
  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    await page.waitForTimeout(250);
    const v = await runAxe();
    for (const x of v) record('/karteikasten (leer)', `axe ${theme}`, `[${x.impact}] ${x.id} — ${x.target}`);
  }
  if (errors.length) for (const e of [...new Set(errors)]) record('(leer/global)', 'KONSOLE', e);
});

/* ---- Urteil ---- */
const L = (s = '') => process.stdout.write(s + '\n');
if (befunde.length === 0) {
  L('\n✓ check:oberflaeche bestanden — axe 0 (Hell+Dunkel, Ruhe+Hover), kein Ueberlauf, Satzspiegel ok.\n');
  process.exit(0);
}
L('\n── BEFUNDE ──');
for (const b of befunde) L(`  ✗ ${b.route}  [${b.art}]  ${b.detail}`);
L(`\n✗ check:oberflaeche: ${befunde.length} Befund(e).\n`);
process.exit(1);
