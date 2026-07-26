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
  /* Die Kennung hat KEIN `m-` davor (`biceps-brachii`). Bis zum UX-Review 2026-07-26 stand
     hier `m-biceps-brachii` — die Route loeste nicht auf, und diese Pruefung hat jahrelang
     die 404-Seite geprueft und sie „detail" genannt. Die inhaltsreichste Seite der App
     (Bilder, Palpation, Notizen, 3D-Link, Attribution) war damit NIE im Audit.
     Station 0 unten laesst das nicht mehr durch. */
  ['/muskel/biceps-brachii', 'detail'],
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
  /* `main a`, nicht `a`: Der erste Link im Dokument ist die Sprungmarke, und die liegt bis
     zum Fokus ausserhalb des Bildes — hovern laesst sie sich nicht. Gemeint war immer ein
     INHALTS-Link. */
  ['/anleitung', 'main a'],
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

  /* ---- 0. Zeigt jede Route ueberhaupt, was sie behauptet? ----
     Eine falsch geschriebene Kennung faellt sonst NICHT auf: Die 404-Seite ist barrierefrei,
     ueberlaeuft nicht und haelt den Satzspiegel — sie besteht jede Messung glaenzend. Genau
     so hat `/muskel/m-biceps-brachii` hier jahrelang gruen geleuchtet. */
  for (const [route, name] of ROUTES) {
    if (name === '404') continue;
    await goto(route);
    const istNichtGefunden = await page.evaluate(
      () => /Unbekannter Muskel|Seite nicht gefunden|Nicht gefunden/i.test(
        document.querySelector('main')?.textContent ?? '',
      ),
    );
    if (istNichtGefunden) {
      record(route, 'ROUTE', `zeigt eine „nicht gefunden"-Seite, sollte aber „${name}" sein`);
    }
  }

  /* ---- 1. Jede Route: axe (Hell+Dunkel), Ueberlauf, Satzspiegel ---- */
  for (const [route] of ROUTES) {
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

/* =========================================================================
   4. DAS HANDY (UX-Review 2026-07-26)

   Bis dahin hat WEDER dieses Skript noch `check:wege` je `setViewportSize` gerufen —
   beide liefen ausschliesslich auf der Harness-Vorgabe 1440 × 900, waehrend
   PROJECT_STATE.md „Desktop+Handy" behauptete. Die ganze Handy-Schicht (TabBar, klebende
   Aktionen, Daumenmasse, Filter-Sheet) war ungeprueft. Gefunden wurde daraufhin sofort:
   `/statistik` schob die Seite bei 320 px um 26 px waagerecht auf, und die Auswahlliste im
   Karteikasten war eine 460-px-Scrollfalle auf 81 % der Viewport-Hoehe.

   **320 px ist Absicht, nicht Pedanterie:** Es ist die schmalste Breite, die real vorkommt
   (iPhone SE 1. Gen, kleine Androiden, und jedes Handy mit vergroesserter Systemschrift).
   Wer nur 390 px prueft, findet Grid-Fallen wie `minmax(280px, 1fr)` nie.
   ========================================================================= */
const HANDY = [
  { width: 390, height: 664, label: '390' },
  { width: 320, height: 568, label: '320' },
];

await withApp(async ({ page, goto, runAxe }) => {
  const L = (s = '') => process.stdout.write(s + '\n');
  L('\n──── Handy (320 + 390 px) ────');

  for (const vp of HANDY) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const [route] of ROUTES) {
      await goto(route);
      const wo = `${route} @${vp.label}`;

      // (a) Waagerechter Ueberlauf der SEITE — der Fehler, der /statistik erwischt hat.
      const ueber = await page.evaluate(() => {
        const d = document.documentElement;
        return d.scrollWidth > d.clientWidth + 1 ? { w: d.scrollWidth, c: d.clientWidth } : null;
      });
      if (ueber) record(wo, 'UEBERLAUF', `scrollW ${ueber.w} > ${ueber.c}`);

      // (b) axe auf dem Handy (andere Schicht: TabBar statt Rail, andere Reihenfolge).
      const v = await runAxe();
      for (const x of v) record(wo, 'axe', `[${x.impact}] ${x.id} ×${x.n} — ${x.target}`);

      /* (c) Daumenmasse. Die Projektregel ist 44 px unter 1024 px, WCAG 2.5.8 verlangt
         mindestens 24 × 24. Zwei ausdrueckliche Ausnahmen, beide dokumentiert:
         eine native Checkbox darf 17 px bleiben, wenn ihr `label` die Trefferflaeche ist,
         und ein Link MITTEN IM SATZ darf die Zeilenhoehe behalten (auch WCAG 2.5.8
         nimmt „inline in einem Textblock" ausdruecklich aus) — ihn auf 44 px zu zwingen
         wuerde den Fliesstext auseinanderreissen. */
      const klein = await page.evaluate(() => {
        const out = [];
        const inlineImSatz = (el) => {
          if (getComputedStyle(el).display !== 'inline') return false;
          const p = el.parentElement;
          if (!p) return false;
          return [...p.childNodes].some(
            (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
          );
        };
        for (const el of document.querySelectorAll(
          'a[href], button, select, [role="tab"], input:not([type="checkbox"])',
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (inlineImSatz(el)) continue;
          const name = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26);
          const wie = `${Math.round(r.width)}×${Math.round(r.height)} "${name}"`;
          if (r.height < 24 || r.width < 24) out.push({ hart: true, wie });
          else if (r.height < 43.5) out.push({ hart: false, wie });
        }
        return out;
      });
      for (const k of klein) {
        record(wo, k.hart ? 'ZIEL<24' : 'ZIEL<44', k.wie);
      }

      /* (d) Verschachtelte Scrollflaechen. Eine eigene Scrollflaeche, die den halben
         Schirm fuellt, faengt jeden Wisch ab, der in ihr beginnt — die Seite darunter
         bewegt sich dann nicht mehr. Genau das war die Auswahlliste im Karteikasten. */
      const fallen = await page.evaluate(
        (vh) => {
          const out = [];
          for (const el of document.querySelectorAll('main *')) {
            const cs = getComputedStyle(el);
            if (!/auto|scroll/.test(cs.overflowY)) continue;
            if (el.scrollHeight <= el.clientHeight + 1) continue;
            const anteil = el.clientHeight / vh;
            if (anteil > 0.5) {
              out.push(
                `${el.className || el.tagName} — ${Math.round(el.clientHeight)} px `
                  + `(${Math.round(anteil * 100)} % der Viewport-Hoehe), Inhalt ${el.scrollHeight} px`,
              );
            }
          }
          return out;
        },
        vp.height,
      );
      for (const f of fallen) record(wo, 'SCROLLFALLE', f);
    }
  }
});

/* ---- 5. Leere Zustaende mit FRISCHEM Browser (kein Seed) ---- */
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
  L('\n✓ check:oberflaeche bestanden — axe 0 (Hell+Dunkel, Ruhe+Hover), kein Ueberlauf,');
  L('  Satzspiegel ok, jede Route zeigt was sie behauptet, Handy (320+390) sauber.\n');
  process.exit(0);
}
L('\n── BEFUNDE ──');
for (const b of befunde) L(`  ✗ ${b.route}  [${b.art}]  ${b.detail}`);
L(`\n✗ check:oberflaeche: ${befunde.length} Befund(e).\n`);
process.exit(1);
