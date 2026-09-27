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
import { createServer } from 'vite';

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

/* Die Muskelseite, deren Funktions-Kurzform das LAENGSTE Wort traegt (Etappe 15).
   „Funktionsbeschreibung" und „(Radioulnargelenke):" haben bei doppelter Systemschrift auf
   320 px die Detailseite quer gedrueckt — gefunden wurde es nur, weil zufaellig die
   Bizeps-Seite in ROUTES steht. Ein fest eingetragener Muskel prueft das Wort von heute;
   hier wird er aus den Daten gewaehlt und wandert mit, wenn sich die Kurzformen aendern.
   Geladen ueber Vites SSR-Lader, wie in `export-csv.mjs`: dieselbe Anzeige-Regel wie die
   App (`funktionAnzeige`), keine zweite Deutung der JSON. */
const LANGES_WORT = await (async () => {
  const server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
  });
  try {
    const { getMuscles } = await server.ssrLoadModule('/src/data/index.ts');
    const { funktionAnzeige } = await server.ssrLoadModule('/src/data/funktion-kurz.ts');
    let best = { id: '', wort: '' };
    for (const m of getMuscles()) {
      for (const wort of funktionAnzeige(m).split(/\s+/)) {
        if (wort.length > best.wort.length) best = { id: m.id, wort };
      }
    }
    return best;
  } finally {
    await server.close();
  }
})();

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

      /* (e) iOS-Zoomfalle. Safari zoomt die Seite hinein, sobald ein FOKUSSIERTES
         Feld kleiner als 16 px ist — und zoomt nicht zurueck. Der Fehler ist auf
         dem Desktop unsichtbar und im Emulator ebenfalls: Man sieht ihn erst auf
         einem echten iPhone, und dann als „das Layout springt beim Tippen".
         Gefunden wurden so drei Auswahlfelder und das Suchfeld im Karteikasten. */
      const zoomfallen = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('input, select, textarea')) {
          if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 16) {
            const kennung = el.className || `${el.tagName.toLowerCase()}[${el.type ?? ''}]`;
            out.push(`${fs}px — ${kennung}`);
          }
        }
        return [...new Set(out)];
      });
      for (const z of zoomfallen) record(wo, 'IOS-ZOOM', z);

      /* (g) Liegt die Startaktion unter der Falz?
         NUR auf den Seiten, deren ZWECK das Starten einer Uebung ist. Die Liste ist
         eine bewusste Entscheidung, kein Versehen: Auf `/anleitung` steht „Zurueck zu
         Heute" am Ende von 2700 px Anleitung, und das ist genau richtig — ein Ruecklink
         gehoert ans Ende. Eine Regel „jede Hauptaktion ueber die Falz" haette das als
         Fehler gemeldet und waere zu Recht ignoriert worden.
         Gefunden hat die Regel `/lernkarten`: Startknopf bei y=740 auf 667 px, hinaus-
         geschoben von Faelligkeitszahl und drei Auswahlfeldern. Die Seite sah aus, als
         koenne man nichts starten. Klebende Knoepfe erfuellen die Regel per Definition. */
      const STARTSEITEN = ['/lernkarten', '/quiz', '/pruefung', '/heute'];
      if (STARTSEITEN.includes(route)) {
        const aktion = await page.evaluate(() => {
          const el = document.querySelector('main .btn--primary, main .btn--block');
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return { top: Math.round(b.top), vh: window.innerHeight,
            text: (el.textContent || '').trim().slice(0, 28) };
        });
        if (aktion && aktion.top > aktion.vh) {
          record(wo, 'START-UNTER-FALZ',
            `„${aktion.text}" bei y=${aktion.top} auf ${aktion.vh} px Viewport`);
        }
      }

      /* (h) Zu kleine Schrift — Schwelle 11 px, und die Zahl ist begruendet:
         Die App nutzt gesperrte Mikro-Labels bei 11–11.5 px (Eyebrow, Chips,
         Feldnamen). Das ist ein legitimes typografisches Mittel, verbreitet und von
         axe als kontrastreich bestaetigt; iOS beschriftet seine Tab-Leiste aehnlich
         klein. **Diese 48 Stellen umzuwerfen waere eine Designentscheidung, keine
         Reparatur** — deshalb liegt die Grenze NICHT bei 12 px.
         Darunter (10 px, fuenf Stellen) war es zu wenig: Zaehl-Hinweise und
         Pruefungs-Etiketten, die man auf einem Handy in Bewegung liest. */
      const winzig = await page.evaluate(() => {
        const out = new Map();
        for (const el of document.querySelectorAll('main *, .tabbar *')) {
          if (el.children.length > 0) continue;
          const txt = (el.textContent || '').trim();
          if (txt.length < 2) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 11) {
            const k = `${fs}px — ${el.className || el.tagName}`;
            out.set(k, (out.get(k) ?? 0) + 1);
          }
        }
        return [...out].map(([k, n]) => `${k} (${n}×)`);
      });
      for (const w of winzig) record(wo, 'TEXT<11px', w);
    }
  }

  /* ---- (f) Text auf 200 % — WCAG 1.4.4 ----
     Nicht dasselbe wie 320 px: Dort schrumpft der Platz, hier WAECHST der Inhalt.
     Feste Breiten in `px`, `ch`-Mindestbreiten und nicht umbrechende Zeilen fallen
     erst hier auf. Betroffen ist keine Randgruppe — wer die Systemschrift
     vergroessert hat (in dieser Zielgruppe haeufig), sieht genau das.
     Geprueft wird ueber die Wurzel-Schriftgroesse (16 → 32 px), also TEXT-Zoom;
     ein Seiten-Zoom wuerde auch das Layout mitskalieren und nichts beweisen. */
  /* Beide Breiten, nicht nur 375: Ein Live-Nachmessen zeigte, dass `/heute` und
     `/start` bei 375 px sauber sind und bei 320 px um 28 px ueberlaufen. Der enge
     Schirm UND die doppelte Schrift zusammen sind der schaerfste Fall — genau die
     Kombination, die ein Handy mit vergroesserter Systemschrift erzeugt. */
  const zoomRouten = [...ROUTES.map(([r]) => r), `/muskel/${LANGES_WORT.id}`];
  for (const vp of HANDY) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of zoomRouten) {
      await goto(route);
      await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
      await page.waitForTimeout(250);
      const ueber = await page.evaluate(() => {
        const d = document.documentElement;
        return d.scrollWidth > d.clientWidth + 1 ? `${d.scrollWidth} > ${d.clientWidth}` : null;
      });
      if (ueber) record(`${route} @200% @${vp.label}`, 'UEBERLAUF-ZOOM', ueber);
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
  }
}, { seed: SEED });
/* ^ DER SEED HAT HIER GEFEHLT (bis 2026-07-27). Der ganze Handy-Block lief mit
   frischem Browser, also gegen das Onboarding und leere Listen — waehrend der
   Desktop-Block darueber befuellt prueft. Damit haben Tippziel-Messung, axe,
   Ueberlauf und Scrollfallen auf dem Handy jahrelang fast leere Seiten geprueft.
   Sofort nach dem Nachtragen fielen vier Befunde an: die Lueckenliste auf `/heute`
   hat 21 px hohe Links — unter WCAG 2.5.8 (24 px) und weit unter der Projektregel
   (44 px), ausgerechnet die Liste, ueber die der Lernende seine Schwaechen anspringt.
   Dieselbe Fehlerklasse wie im UX-Review 2026-07-26 („beide liefen ausschliesslich
   auf 1440 × 900"), nur eine Ebene tiefer: Eine Pruefung, die den leeren Zustand
   misst, misst nicht die App. */

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
  /* Die Startaktion im LEEREN Zustand, auf dem kleinsten Schirm.
     Der befuellte Lauf oben sieht das nicht — dort gibt es den Leerzustand nicht.
     Gefunden hat das erst eine Messung an der Live-Seite: `/lernkarten` zeigte einem
     neuen Nutzer auf 320 × 568 „Muskeln hinzufuegen" bei y=590, also unsichtbar.
     Zwei Navigationszeilen (120 px) standen davor — eine davon mit demselben Ziel.
     Das ist der erste Eindruck der App: Text und keine Aktion. */
  await page.setViewportSize({ width: 320, height: 568 });
  for (const route of ['/lernkarten', '/quiz', '/pruefung', '/heute']) {
    await goto(route);
    const aktion = await page.evaluate(() => {
      const el = document.querySelector('main .btn--primary, main .btn--block');
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), vh: window.innerHeight,
        text: (el.textContent || '').trim().slice(0, 28) };
    });
    if (aktion && aktion.top > aktion.vh) {
      record(`${route} (Erststart) @320`, 'START-UNTER-FALZ',
        `„${aktion.text}" bei y=${aktion.top} auf ${aktion.vh} px Viewport`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });

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

/* ---- 6. Die Gelenkwahl MIT Auswahl — ein Zustand, den kein Ruhelauf sieht ----
   Die Aktionsleiste der Mehrfachwahl (2026-07-27) existiert nur, wenn etwas angekreuzt ist,
   und sie klebt am unteren Rand. Beides zusammen heisst: Der Ruhezustand-Lauf oben rendert
   sie NIE — dieselbe Luecke, durch die drei Hover-Fehler in Folge gerutscht sind.

   Geprueft wird auf 320 px, wo die Leiste am ehesten anstoesst, und im Dunkeln (dort ist
   eine durchscheinende Flaeche eine Leiste, durch die man den Text darunter liest). */
await withApp(async ({ page, goto, runAxe, setTheme }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await goto('/karteikasten');

  const kaestchen = page.locator('.jgp__group:not(.jgp__group--erledigt)');
  const n = await kaestchen.count();
  if (n < 2) {
    record('/karteikasten (Auswahl)', 'INHALT', `nur ${n} waehlbare Gelenkgruppen gefunden`);
  } else {
    await kaestchen.nth(0).click();
    await kaestchen.nth(1).click();
    await page.waitForTimeout(250);

    const bar = page.locator('.jgp__bar');
    if ((await bar.count()) === 0) {
      record('/karteikasten (Auswahl)', 'INHALT', 'Aktionsleiste erscheint nicht');
    } else {
      for (const theme of ['light', 'dark']) {
        await setTheme(theme);
        await page.waitForTimeout(300);
        const v = await runAxe();
        for (const x of v) {
          record('/karteikasten (Auswahl)', `axe ${theme}`, `[${x.impact}] ${x.id} — ${x.target}`);
        }
      }

      const ueber = await page.evaluate(() => {
        const d = document.documentElement;
        return d.scrollWidth > d.clientWidth + 1 ? `scrollW ${d.scrollWidth} > ${d.clientWidth}` : null;
      });
      if (ueber) record('/karteikasten (Auswahl)', 'UEBERLAUF', ueber);

      /* Sie klebt unten — also darf sie nicht unter der schwebenden TabBar liegen und nicht
         den halben Schirm einnehmen. Beides waere auf dem Desktop unsichtbar. */
      const lage = await page.evaluate(() => {
        const b = document.querySelector('.jgp__bar').getBoundingClientRect();
        const tab = document.querySelector('.tabbar')?.getBoundingClientRect() ?? null;
        return {
          h: Math.round(b.height),
          vh: window.innerHeight,
          ueberdeckt: tab !== null && b.bottom > tab.top && b.top < tab.bottom,
        };
      });
      if (lage.ueberdeckt) {
        record('/karteikasten (Auswahl)', 'VERDECKT', 'Aktionsleiste liegt unter der TabBar');
      }
      if (lage.h > lage.vh * 0.4) {
        record('/karteikasten (Auswahl)', 'ZU HOCH', `${lage.h} px von ${lage.vh} px Viewport`);
      }

      const knopf = await page.locator('.jgp__bar .btn--primary').boundingBox();
      if (knopf && knopf.height < 43.5) {
        record('/karteikasten (Auswahl)', 'ZIEL<44', `${Math.round(knopf.width)}×${Math.round(knopf.height)} Anlegen`);
      }
    }
  }
});

/* ---- 7. Das offene Sheet auf dem Handy ----
   Ein Sheet ist der einzige Ort, an dem zwei Scrollflaechen uebereinanderliegen. Ohne
   `overscroll-behavior: contain` scrollt ein Wisch, der im Sheet beginnt und dessen
   Ende erreicht, die Seite DAHINTER weiter — man wischt im Filter und die Trefferliste
   darunter wandert. Das ist auf dem Desktop mit der Maus nicht zu bemerken.
   Und die Hoehe muss aus dem SICHTBAREN Bereich kommen (`dvh`), nicht aus `vh`:
   `vh` zaehlt die Adressleiste des Handys mit, die sich beim Scrollen wegfaehrt. */
await withApp(async ({ page, goto }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await goto('/suche');
  const knopf = page.locator('button').filter({ hasText: /Filter/i }).first();
  if ((await knopf.count()) === 0) {
    record('/suche (Sheet)', 'INHALT', 'kein Filter-Knopf gefunden');
  } else {
    await knopf.click();
    await page.waitForTimeout(500);
    const s = await page.evaluate(() => {
      const p = document.querySelector('.sheet__panel');
      if (!p) return null;
      const cs = getComputedStyle(p);
      const b = p.getBoundingClientRect();
      return { overscroll: cs.overscrollBehaviorY, hoehe: Math.round(b.height),
        vh: window.innerHeight, bodyOverflow: getComputedStyle(document.body).overflow };
    });
    if (!s) {
      record('/suche (Sheet)', 'INHALT', 'Sheet oeffnet nicht');
    } else {
      if (s.overscroll !== 'contain') {
        record('/suche (Sheet)', 'OVERSCROLL',
          `overscroll-behavior-y ist "${s.overscroll}" — der Wisch greift auf die Seite durch`);
      }
      if (s.hoehe > s.vh) {
        record('/suche (Sheet)', 'ZU HOCH',
          `${s.hoehe} px bei ${s.vh} px Viewport — Fussbereich liegt ausserhalb`);
      }
      if (s.bodyOverflow !== 'hidden') {
        record('/suche (Sheet)', 'BODY-SCROLL',
          `body overflow ist "${s.bodyOverflow}" — die Seite dahinter bleibt scrollbar`);
      }
    }
  }
});

/* =========================================================================
   8. BILDER MUESSEN IN IHREN RAHMEN PASSEN (2026-08-20)

   Gemeldet aus dem Unterricht: Ein Schueler sah im Quiz „Bild → Muskel" auf einem
   MacBook nur einen Ausschnitt — oben und unten fehlte je etwa ein Fuenftel. In
   Chromium war nichts zu sehen, und genau darum konnte diese Pruefung den Fehler
   jahrelang nicht finden: Sie faehrt NUR Chromium.

   Die Ursache ist keine Zahl, sondern eine Bauform. Der Rahmen bekam seine Hoehe aus
   `aspect-ratio`, das Bild wurde nur von `max-height: 100%` darin gehalten. Prozente
   brauchen aber eine Bezugshoehe, und WebKit betrachtet eine erst aus `aspect-ratio`
   entstandene Hoehe an dieser Stelle als unbestimmt — die Begrenzung faellt weg, das
   Bild rendert in voller Hoehe, `overflow: hidden` schneidet den Rest ab. Alle 150
   Muskelbilder sind 600x800 (hoch), jeder Rahmen ist 4/3 (quer): 40 % verschwanden.

   Darum misst Station 8 NICHT nur die Geometrie (die ist in Chromium immer heil),
   sondern die BAUFORM: prozentuale Hoehe am Bild + `aspect-ratio` an einem Vorfahren
   bis zum beschneidenden Kasten. Das faellt hier auch ohne WebKit auf.

   TEIL B — DIE VOLLANSICHT (2026-08-20). Aus demselben Befund ist sie entstanden: Im
   Rahmen ist ein 600x800-Bild rund 360 px breit, auf dem Handy 183 px. Ein Tipp legt es
   jetzt formatfuellend ueber die Seite. Drei Dinge muessen dabei stimmen, und keines
   davon sieht die Routen-Messung oben, weil die Ansicht erst auf einen Klick entsteht:

   1. Sie ist ueberhaupt GROESSER. Eine Lupe, die nichts vergroessert, ist die stillste
      aller Regressionen — alles rendert, nichts faellt auf, der Nutzen ist weg.
   2. Sie passt auf den Bildschirm. Sonst hat man denselben Fehler wie vorher, nur eine
      Ebene hoeher.
   3. axe im OFFENEN Zustand, hell und dunkel. Ein modaler Kasten hat eigene Farben,
      eigene Fokusfolge und einen eigenen Namen; der Routen-Durchlauf sieht ihn nie.
   ========================================================================= */

/* Zwei Dinge, die erst am gerenderten Bild auffallen — beide sind mir beim Bau der
   Vollansicht selbst passiert (2026-08-20):

   (1) Der Lupen-Knopf ist `position: relative` und steht im Quelltext NACH dem
       Zurueck-Pfeil. Ohne `z-index` am Pfeil malt der Browser den Knopf darueber: Der
       Pfeil ist zu sehen, nimmt aber keinen Klick mehr an. Weder ein Unit-Test noch axe
       findet das — beide fragen den DOM, nicht die Malreihenfolge. Eine Trefferprobe tut es.

   (2) Der Knopf fuellt einen Rahmen mit `overflow: hidden` vollstaendig aus. Ein
       Fokus-Ring NACH AUSSEN liegt damit komplett im beschnittenen Bereich: vorhanden,
       messbar, unsichtbar. Wer per Tastatur bedient, sieht nicht, wo er steht.

   Laeuft IM Browser — darf nichts von aussen schliessen. */
const messeBedienung = () => {
  const out = [];
  const name = (el) => (el ? (typeof el.className === 'string' && el.className.trim()
    ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase()) : 'nichts');

  for (const nav of document.querySelectorAll('.image-viewer__nav')) {
    const r = nav.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
    const treffer = document.elementFromPoint(x, y);
    if (treffer !== nav && !nav.contains(treffer)) {
      out.push({ art: 'VERDECKT', detail:
        `„${nav.getAttribute('aria-label')}" bekommt seinen eigenen Klick nicht — `
        + `obenauf liegt ${name(treffer)}` });
    }
  }

  const lupe = document.querySelector('.bild-lupe');
  if (lupe) {
    /* Gelesen wird die REGEL, nicht der Zustand. `:focus-visible` greift bei einem
       programmatischen `focus()` nur, wenn zuletzt die Tastatur im Spiel war — auf der
       Detailseite (nur `goto`) haette dieselbe Messung bestanden und im Quiz (vorher ein
       Mausklick auf den Startknopf) gemeldet. Eine Pruefung, deren Ergebnis von ihrer
       eigenen Vorgeschichte abhaengt, misst nicht die Seite, sondern sich selbst. */
    let regel = null;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; } // fremde Herkunft — nicht lesbar
      for (const r of Array.from(rules)) {
        if (r.selectorText && r.selectorText.includes('.bild-lupe:focus-visible')) regel = r.style;
      }
    }
    const breite = regel ? parseFloat(regel.outlineWidth) || 0 : 0;
    const versatz = regel ? parseFloat(regel.outlineOffset) || 0 : 0;
    if (!regel || regel.outlineStyle === 'none' || breite === 0) {
      out.push({ art: 'FOKUS', detail: 'der Lupen-Knopf hat keinen sichtbaren Fokus-Ring' });
    } else {
      let p = lupe.parentElement;
      let clip = null;
      while (p && p !== document.body) {
        const cp = getComputedStyle(p);
        if (cp.overflowX !== 'visible' || cp.overflowY !== 'visible') { clip = p; break; }
        p = p.parentElement;
      }
      if (clip) {
        const r = lupe.getBoundingClientRect();
        const c = clip.getBoundingClientRect();
        const aussen = versatz + breite;
        const luft = Math.min(r.top - c.top, r.left - c.left, c.bottom - r.bottom, c.right - r.right);
        if (aussen > 0 && luft < aussen) {
          out.push({ art: 'FOKUS', detail:
            `der Ring liegt ${aussen} px ausserhalb, aber ${name(clip)} beschneidet schon `
            + `ab ${Math.round(luft)} px — er ist da und trotzdem unsichtbar` });
        }
      }
    }
  }
  return out;
};

/* Laeuft IM Browser — darf nichts von aussen schliessen. */
const messeBilder = () => {
  const out = [];
  const prozent = (v) => typeof v === 'string' && v.trim().endsWith('%');
  const pfad = (el) => (typeof el.className === 'string' && el.className.trim()
    ? '.' + el.className.trim().split(/\s+/).join('.')
    : el.tagName.toLowerCase());

  for (const img of document.querySelectorAll('main img')) {
    const r = img.getBoundingClientRect();
    if (r.height < 1) continue; // nicht gerendert — nichts zu messen
    const ci = getComputedStyle(img);
    const prozentHoehe = prozent(ci.maxHeight) ? `max-height: ${ci.maxHeight}`
      : prozent(ci.height) ? `height: ${ci.height}` : null;

    let el = img.parentElement;
    let ratio = null;   // Vorfahr, dessen Hoehe aus aspect-ratio entsteht
    let kasten = null;  // erster Vorfahr, der beschneidet
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (!ratio && cs.aspectRatio && cs.aspectRatio !== 'auto') {
        ratio = { sel: pfad(el), wert: cs.aspectRatio };
      }
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { kasten = el; break; }
      el = el.parentElement;
    }

    if (prozentHoehe && ratio) {
      out.push({ art: 'PROZENTHOEHE', detail:
        `${pfad(img)} haelt sich mit „${prozentHoehe}" in ${ratio.sel} `
        + `(aspect-ratio: ${ratio.wert}) — WebKit loest das nicht auf und schneidet ab` });
    }
    if (kasten) {
      const rk = kasten.getBoundingClientRect();
      if (r.height > rk.height + 1) {
        out.push({ art: 'ABGESCHNITTEN', detail:
          `${pfad(img)} ist ${Math.round(r.height)} px hoch in einem `
          + `${Math.round(rk.height)} px hohen ${pfad(kasten)}` });
      }
      if (r.width > rk.width + 1) {
        out.push({ art: 'ABGESCHNITTEN', detail:
          `${pfad(img)} ist ${Math.round(r.width)} px breit in einem `
          + `${Math.round(rk.width)} px breiten ${pfad(kasten)}` });
      }
    }
  }
  return out;
};

await withApp(async ({ page, goto, runAxe, setTheme }) => {
  const L = (s = '') => process.stdout.write(s + '\n');
  L('\n──── Bilder im Rahmen + Vollansicht (Desktop + 390 px) ────');

  /* Wartet, bis das Bild wirklich geladen ist: ein Bild ohne Eigenmass ist 0 px hoch
     und laeuft dann natuerlich ueber gar nichts hinaus — die Messung waere blind. */
  const bildGeladen = (sel) => page.waitForFunction((s) => {
    const i = document.querySelector(s);
    return !!i && i.complete && i.naturalHeight > 0;
  }, sel, { timeout: 8000 }).catch(() => false);

  /* Oeffnet die Vollansicht ueber dem gerade gemessenen Bild und prueft, was nur im
     offenen Zustand pruefbar ist. `rahmenBild` ist das Rechteck aus dem Rahmen. */
  /* Die SICHTBARE Bildflaeche, nicht die Element-Box. Im Rahmen ist das Bild mit
     `object-fit: contain` eingepasst: Das Element ist 590 px breit, das Bild darin nur
     332 — der Rest sind leere Balken. Wer die Element-Box vergleicht, misst die Balken
     mit und haelt eine Vergroesserung um 74 % fuer „vergroessert kaum". (Genau das ist
     dieser Pruefung beim ersten Lauf passiert.) */
  const bildflaeche = (sel) => page.evaluate((s) => {
    const img = document.querySelector(s);
    if (!img || !img.naturalWidth) return null;
    const r = img.getBoundingClientRect();
    const skala = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    return { width: img.naturalWidth * skala, height: img.naturalHeight * skala };
  }, sel);

  const pruefeVollansicht = async (wo, rahmenSel) => {
    const rahmen = await bildflaeche(rahmenSel);
    const lupe = page.locator('.bild-lupe').first();
    if (!(await lupe.count())) {
      record(wo, 'INHALT', 'kein Lupen-Knopf am Bild — Bild groß anzeigen geht nicht mehr');
      return;
    }
    await lupe.click();
    await page.waitForTimeout(300);

    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    if (!(await dialog.count())) {
      record(wo, 'VOLLANSICHT', 'der Klick öffnet keinen modalen Kasten');
      return;
    }

    const gross = await bildflaeche('.lightbox__img');
    if (!gross) {
      record(wo, 'VOLLANSICHT', 'die Vollansicht zeigt kein Bild');
    } else {
      /* (1) Sie muss wirklich vergroessern. 1,25x ist bewusst niedrig angesetzt — es
         geht um „tut ueberhaupt noch etwas", nicht um eine Wunschzahl. */
      if (rahmen && gross.width < rahmen.width * 1.25) {
        record(wo, 'VOLLANSICHT',
          `vergrößert kaum: ${Math.round(rahmen.width)} px → ${Math.round(gross.width)} px`);
      }
      // (2) Sie muss auf den Bildschirm passen.
      const sicht = page.viewportSize();
      if (gross.width > sicht.width + 1 || gross.height > sicht.height + 1) {
        record(wo, 'VOLLANSICHT',
          `${Math.round(gross.width)}×${Math.round(gross.height)} px passen nicht in `
          + `${sicht.width}×${sicht.height} px`);
      }
    }

    // (3) axe im OFFENEN Zustand — hell und dunkel.
    for (const theme of ['light', 'dark']) {
      await setTheme(theme);
      await page.waitForTimeout(200);
      const v = await runAxe();
      for (const x of v) record(wo, `axe Vollansicht ${theme}`, `[${x.impact}] ${x.id} — ${x.msg}`);
    }
    await setTheme('light');

    // Und sie muss sich per Tastatur wieder schliessen lassen.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    if (await page.locator('[role="dialog"][aria-modal="true"]').count()) {
      record(wo, 'VOLLANSICHT', 'Esc schließt sie nicht — Tastaturnutzer sitzen fest');
    }
  };

  for (const vp of [{ width: 1440, height: 900, label: 'Desktop' },
                    { width: 390, height: 664, label: '390' }]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // (a) Detailseite — der Bildbetrachter.
    const woD = `/muskel/biceps-brachii @${vp.label}`;
    await goto('/muskel/biceps-brachii');
    if (!(await page.locator('.image-viewer__img').count())) {
      record(woD, 'INHALT', 'kein Bild im Betrachter — heisst die Klasse noch .image-viewer__img?');
    } else {
      await bildGeladen('.image-viewer__img');
      for (const b of await page.evaluate(messeBilder)) record(woD, b.art, b.detail);
      for (const b of await page.evaluate(messeBedienung)) record(woD, b.art, b.detail);
      await pruefeVollansicht(woD, '.image-viewer__img');
    }

    // (b) Laufendes Quiz „Bild → Muskel" — die Stelle, an der es aufgefallen ist.
    const woQ = `/quiz Bild → Muskel @${vp.label}`;
    await goto('/quiz');
    const btn = page.locator('.quiz-dir-btn', { hasText: 'Bild → Muskel' }).first();
    if (!(await btn.count())) {
      record(woQ, 'INHALT', 'Startknopf nicht gefunden — heisst der Modus in '
        + 'src/data/mode-labels.ts noch so?');
      continue;
    }
    await btn.click();
    await page.waitForTimeout(600);
    if (!(await page.locator('.quiz-card__media img').count())) {
      record(woQ, 'INHALT', 'die Frage zeigt kein Bild — Modus oder Klasse geaendert?');
    } else {
      await bildGeladen('.quiz-card__media img');
      for (const b of await page.evaluate(messeBilder)) record(woQ, b.art, b.detail);
      for (const b of await page.evaluate(messeBedienung)) record(woQ, b.art, b.detail);
      await pruefeVollansicht(woQ, '.quiz-card__media img');
    }

    /* (c) Lernsitzung (Etappe 14a) — das Bild ueber der Karte. Es hat keinen Rahmen wie
       Quiz und Detailseite, darum sitzt der Lupen-Knopf hier eng am Bild; genau das kann
       Fokus-Ring und Groessenverhaeltnis anders ausgehen lassen. Nicht jede Karte hat ein
       Bild (47 von 150): Es wird bis zur ersten MIT Bild weiterbewertet. */
    const woL = `/lernkarten Sitzung @${vp.label}`;
    await goto('/lernkarten');
    const lernen = page.getByRole('button', { name: /Lernen starten/i }).first();
    if (!(await lernen.count())) {
      record(woL, 'INHALT', 'kein „Lernen starten" — Seed nicht angekommen oder nichts fällig?');
      continue;
    }
    await lernen.click();
    await page.waitForTimeout(500);
    const zeigeBild = page.getByRole('button', { name: 'Mit Bild anzeigen' });
    for (let i = 0; i < 12 && !(await zeigeBild.count()); i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(150);
      await page.keyboard.press('3');
      await page.waitForTimeout(250);
    }
    if (!(await zeigeBild.count())) {
      record(woL, 'INHALT', 'in 12 Karten keine mit Bild — Seed oder Knopftext geaendert?');
      continue;
    }
    await zeigeBild.click();
    await bildGeladen('.fc-image');
    for (const b of await page.evaluate(messeBilder)) record(woL, b.art, b.detail);
    for (const b of await page.evaluate(messeBedienung)) record(woL, b.art, b.detail);
    await pruefeVollansicht(woL, '.fc-image');
  }
}, { seed: SEED });
/* ^ Seit 14a MIT Seed: Die Lernsitzung braucht Karten. Detailseite und Quiz („Alle
   Muskeln") haengen nicht am Kasten, ihre Messung aendert sich dadurch nicht. */

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
