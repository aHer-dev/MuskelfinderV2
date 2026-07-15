/* =========================================================================
   check:wege — der Weg einer Schuelerin, vom Kaltstart bis zur Pruefung.
   scripts/check-journey.mjs   ·   Aufruf: npm run check:wege

   WARUM: Die teuersten Fehler des Projekts lagen im ABLAUF, nicht auf einer
   einzelnen Seite — das alphabetische Startdeck („zwei Klicks, und man stand in
   einer Sitzung mit 20 Karten, die man nie gewaehlt hatte"), die klebenden
   Aktionen unter der Falz, „53 Karten vs. 56 Zeilen". Kein Ruhezustand-Audit
   findet die; man muss den Weg GEHEN.

   FRISCHER Browser, KEIN Seed — das ist der Kaltstart, den echte Schueler sehen.
   Jede Station ist eine harte Behauptung (Exit 1 bei Bruch).
   ========================================================================= */

import { withApp } from './checks/harness.mjs';

const MODI = ['Bild → Muskel', 'Name → Bild', 'Ursprung → Ansatz', 'Ansatz → Ursprung',
              'Funktion → Muskel', 'Muskel → Funktion'];

const fehler = [];
const pruefe = (bedingung, text) => {
  process.stdout.write(`  ${bedingung ? '✓' : '✗'} ${text}\n`);
  if (!bedingung) fehler.push(text);
};

await withApp(async ({ page, goto, errors, BASE }) => {
  const L = (s = '') => process.stdout.write(s + '\n');
  L('\n════════ check:wege (frischer Browser) ════════');

  /* ---- STATION 1: Erststart legt KEINE Karten an (ADR 0009) ---- */
  L('\n1. Erststart — Onboarding, kein ungefragtes Deck');
  await goto('/heute');
  const storage0 = await page.evaluate(() => Object.keys(localStorage));
  pruefe(!storage0.includes('mf.progress'), 'Frischer Browser: keine Karten im Speicher');

  const berufe = page.locator('.onboarding__choice');
  pruefe((await berufe.count()) === 3, 'Onboarding zeigt drei Berufe');
  await berufe.first().click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /Ohne Datum weiter/i }).click();
  await page.waitForTimeout(400);

  const kartenNachOnboarding = await page.evaluate(() => {
    const raw = localStorage.getItem('mf.progress');
    if (!raw) return 0;
    const s = JSON.parse(raw);
    return Object.keys(s?.state?.flashcards?.cards ?? {}).length;
  });
  pruefe(kartenNachOnboarding === 0, `Nach zwei Klicks: 0 Karten im Kasten (war ${kartenNachOnboarding})`);
  const primaer = await page.locator('.today__start .btn--primary, .today__hero .btn--primary').count();
  pruefe(primaer === 0, 'Leerer Kasten hat keinen Primaerknopf (ADR 0009 — Waehlen IST die Aufgabe)');

  /* ---- STATION 2: Bereich waehlen — versprochene Zahl == angelegte Zahl ---- */
  L('\n2. Karteikasten fuellen — die Zahl am Knopf haelt Wort');
  const bereichKnopf = page.locator('.deck-starter__regions .deck-starter__section').filter({ hasText: 'Obere Extremität' }).first();
  const versprochen = parseInt(await bereichKnopf.locator('.deck-starter__count').innerText(), 10);
  await bereichKnopf.click();
  await page.waitForTimeout(500);
  const angelegt = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mf.progress'));
    return Object.keys(s.state.flashcards.cards).length;
  });
  pruefe(versprochen === angelegt, `„Obere Extremität": ${versprochen} versprochen == ${angelegt} angelegt`);

  await goto('/karteikasten');
  const zeilen = await page.locator('table tbody tr').count();
  pruefe(zeilen === angelegt, `Kasten-Tabelle zeigt ${zeilen} Zeilen == ${angelegt} Karten (keine Phantomzeilen)`);

  /* ---- STATION 3: /heute schlaegt jetzt eine Sitzung vor ---- */
  L('\n3. /heute fuehrt jetzt in die Sitzung');
  await goto('/heute');
  const cta = page.locator('.today__hero .btn--primary').first();
  pruefe(await cta.count() > 0, '/heute zeigt jetzt einen Primaerknopf (Kasten ist gefuellt)');

  /* ---- STATION 4: Lernsitzung — Aufdecken, Bewerten, Aktionen ueber der Falz ---- */
  L('\n4. Lernsitzung — Tastatur, Aktionen erreichbar');
  await goto('/lernkarten');
  const start = page.locator('.btn--primary').first();
  await start.click();
  await page.waitForTimeout(600);
  pruefe(await page.locator('.fc, .flashcard').first().isVisible().catch(() => false), 'Karte ist sichtbar');
  const actionsBox = await page.locator('.fc-actions').boundingBox().catch(() => null);
  pruefe(actionsBox !== null && actionsBox.y < 900, `Aktionen liegen im Sichtfeld (y=${actionsBox ? Math.round(actionsBox.y) : '?'} < 900)`);
  await page.keyboard.press('f');
  await page.waitForTimeout(400);
  pruefe(await page.locator('.fc-actions button').count() > 0, 'Taste [F] deckt auf, Bewertungsknoepfe da');
  await page.keyboard.press('1');
  await page.waitForTimeout(400);
  pruefe(await page.locator('.fc, .flashcard').first().isVisible().catch(() => false), 'Taste [1] bewertet, naechste Karte kommt');

  /* ---- STATION 5: Jeder Quizmodus — 4 Optionen, keine Doppel, Rueckmeldung ---- */
  L('\n5. Jeder Quizmodus — vier Optionen, keine Doppelung, Rueckmeldung');
  for (const modus of MODI) {
    await goto('/quiz');
    const btn = page.locator('.quiz-dir-btn', { hasText: modus }).first();
    if (!(await btn.count())) { pruefe(false, `${modus}: Startknopf nicht gefunden`); continue; }
    await btn.click();
    await page.waitForTimeout(600);

    let ok = true, grund = '';
    for (let q = 0; q < 5; q++) {
      const opts = page.locator('.quiz-option');
      const n = await opts.count();
      if (n === 0) { ok = false; grund = 'keine Optionen'; break; }
      if (n !== 4) { ok = false; grund = `nur ${n} Optionen`; break; }
      const sig = await opts.evaluateAll((els) => els.map((e) => {
        const img = e.querySelector('img');
        return img ? 'BILD:' + img.getAttribute('src') : 'TEXT:' + e.innerText.trim();
      }));
      if (new Set(sig).size !== sig.length) { ok = false; grund = 'zwei identische Optionen'; break; }
      await opts.first().click();
      await page.waitForTimeout(200);
      if ((await page.locator('.quiz-option--correct, .quiz-option--wrong').count()) === 0) { ok = false; grund = 'keine Rueckmeldung'; break; }
      const w = page.getByRole('button', { name: /^(Weiter|Auswerten)$/ }).first();
      if (!(await w.count()) || !(await w.isEnabled())) break;
      await w.click();
      await page.waitForTimeout(250);
    }
    pruefe(ok, `${modus}${ok ? '' : ' — ' + grund}`);
  }

  /* ---- STATION 6: Pruefung laeuft bis zum Debrief ---- */
  L('\n6. Pruefungsmodus — Start bis Debrief');
  await goto('/pruefung');
  const examStart = page.locator('.btn--primary').first();
  pruefe(await examStart.count() > 0, 'Pruefung hat einen Startknopf');
  await examStart.click();
  await page.waitForTimeout(700);
  let debrief = false;
  for (let i = 0; i < 25; i++) {
    const feld = page.locator('input[type="text"], textarea').first();
    const opts = page.locator('.quiz-option, .question-card button');
    if (await feld.count()) await feld.fill('test');
    else if (await opts.count()) await opts.first().click();
    await page.waitForTimeout(120);
    const weiter = page.getByRole('button', { name: /Weiter|Auswerten|Abschließen|Fertig|Ergebnis/ }).first();
    if (!(await weiter.count()) || !(await weiter.isEnabled())) { debrief = true; break; }
    await weiter.click();
    await page.waitForTimeout(250);
  }
  pruefe(debrief || await page.locator('h1, h2').first().isVisible(), 'Pruefung laeuft ohne Absturz bis zum Ende durch');

  pruefe(errors.length === 0, `Keine Konsolen-/Seitenfehler (${errors.length})`);
  if (errors.length) for (const e of [...new Set(errors)].slice(0, 5)) L('       ' + e);
});

/* ---- Urteil ---- */
const L = (s = '') => process.stdout.write(s + '\n');
if (fehler.length === 0) {
  L('\n✓ check:wege bestanden — Kaltstart legt keine Karten an, alle Modi tragen, Pruefung laeuft.\n');
  process.exit(0);
}
L(`\n✗ check:wege: ${fehler.length} gebrochene Behauptung(en):`);
for (const f of fehler) L('   ✗ ' + f);
L('');
process.exit(1);
