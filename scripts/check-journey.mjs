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

  /* ---- STATION 2: Gelenkgruppe waehlen — versprochene Zahl == angelegte Zahl ----
     Seit 2026-07-26 fuellt man den Kasten nach GELENK, nicht nach Region: „Obere
     Extremitaet" legte 53 Karten an und kippte den frischen Kasten sofort in den
     `backlog`-Zustand („Wir holen den Stau in Etappen auf" — in Minute eins).

     Der Beruf sortiert die Gruppen vor. Station 1 hat „Physiotherapie" gewaehlt, also steht
     das Huftgelenk oben; die Pruefung greift trotzdem nach dem LABEL, nicht nach der
     Position — sonst misst sie die Sortierung statt die Zahl. */
  L('\n2. Karteikasten fuellen — die Zahl am Knopf haelt Wort');
  const gruppenKnopf = page.locator('.jgp__group').filter({ hasText: 'Ellenbogen' }).first();
  pruefe(await gruppenKnopf.count() > 0, 'Die Gelenkgruppe „Ellenbogen" steht zur Wahl');
  const versprochen = parseInt((await gruppenKnopf.locator('.jgp__count').innerText()).trim(), 10);
  await gruppenKnopf.click();
  await page.waitForTimeout(500);
  const angelegt = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mf.progress'));
    return Object.keys(s.state.flashcards.cards).length;
  });
  pruefe(versprochen === angelegt, `„Ellenbogen": ${versprochen} versprochen == ${angelegt} angelegt`);
  pruefe(versprochen > 0 && versprochen < 30,
    `Eine Gelenkgruppe ist eine verdauliche Portion (${versprochen} Karten, < 30 = kein Stau-Zustand)`);

  /* Die vier Regionen duerfen zum FUELLEN nicht mehr auftauchen — sie sind der Grund fuer
     den Stau-Fehler. In Suche und Filter bleiben sie. */
  const regionKnopf = await page.locator('.jgp__group, .deck-starter__section').filter({ hasText: /^Obere Extremität/ }).count();
  pruefe(regionKnopf === 0, 'Der 53-Karten-Knopf „Obere Extremität" ist aus dem Erststart verschwunden');

  await goto('/karteikasten');
  const zeilen = await page.locator('table tbody tr').count();
  pruefe(zeilen === angelegt, `Kasten-Tabelle zeigt ${zeilen} Zeilen == ${angelegt} Karten (keine Phantomzeilen)`);

  /* ---- STATION 2b: Eine ueberlappende Gruppe verspricht nur die NEUEN Karten ----
     26 Muskeln liegen in mehreren Gruppen (`M. biceps brachii`: Ellenbogen + Schultergelenk).
     Wer die Mitgliederzahl an den Knopf schreibt, verspricht nach dem ersten Klick mehr, als
     er anlegt.

     Und die Station prueft gleich mit, dass die Gruppenwahl UEBERHAUPT noch da ist: Sie stand
     zuerst nur im `DeckStarter`, und der rendert nur bei LEEREM Kasten — nach der ersten
     Gruppe war sie weg. Sie lebt jetzt dauerhaft auf `/karteikasten`. */
  await goto('/karteikasten');
  pruefe(await page.locator('.jgp__group').count() > 0,
    'Die Gelenkwahl ist auch mit gefuelltem Kasten noch erreichbar (nicht nur beim Erststart)');
  const schulter = page.locator('.jgp__group').filter({ hasText: 'Schultergelenk' }).first();
  const versprochen2 = parseInt((await schulter.locator('.jgp__count').innerText()).trim(), 10);
  await schulter.click();
  await page.waitForTimeout(500);
  const angelegt2 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mf.progress'));
    return Object.keys(s.state.flashcards.cards).length;
  });
  pruefe(angelegt + versprochen2 === angelegt2,
    `„Schultergelenk" nach „Ellenbogen": ${versprochen2} versprochen == ${angelegt2 - angelegt} neu angelegt (Ueberlappung abgezogen)`);

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

  /* ---- STATION 7: Eine laufende Pruefung stirbt nicht am Nachschlagen ----
     Der teuerste Fehler des UX-Reviews 2026-07-26 war ein FLUSS-Fehler, den kein
     Einzelseiten-Audit findet: Die Pruefung raeumte sich beim Unmount selbst weg, und seit
     7d steht das Suchfeld in der Kopfzeile JEDER Route. Gemessen: „biceps" ins Suchfeld,
     Enter, zurueck — 20 Antworten weg, ohne Warnung. Diese Station geht genau diesen Weg. */
  L('\n7. Pruefung + Nachschlagen — die Antworten muessen bleiben');
  await goto('/pruefung');
  const start7 = page.getByRole('button', { name: /Pruefung starten|Prüfung starten/i }).first();
  if (await start7.count()) {
    await start7.click();
    await page.waitForTimeout(700);

    // Eine Frage beantworten, damit es etwas zu verlieren gibt.
    const feld7 = page.locator('input[type="text"], textarea').first();
    const opt7 = page.locator('.quiz-option').first();
    if (await feld7.count()) await feld7.fill('probe');
    else if (await opt7.count()) await opt7.click();
    await page.waitForTimeout(250);
    const beantwortet = await page.locator('.exam-step--answered').count();
    pruefe(beantwortet > 0, `Eine Frage ist beantwortet (${beantwortet})`);

    // Jetzt in der Kopfzeile etwas nachschlagen — der Weg, der sie umgebracht hat.
    const suche = page.locator('header input[type="search"]').first();
    await suche.fill('biceps');
    await suche.press('Enter');
    await page.waitForTimeout(700);
    pruefe(page.url().includes('/suche'), 'Die Kopfzeilen-Suche hat die Route gewechselt');

    // Und zurueck.
    await page.goBack();
    await page.waitForTimeout(800);
    const laeuftNoch = await page.locator('.exam-steps').count();
    pruefe(laeuftNoch > 0, 'Die Pruefung laeuft nach dem Nachschlagen WEITER');
    pruefe(
      (await page.locator('.exam-step--answered').count()) >= beantwortet,
      'Die gegebenen Antworten sind noch da',
    );
    pruefe(
      (await page.getByRole('button', { name: /verwerfen/i }).count()) > 0,
      'Es gibt einen ausdruecklichen Weg, sie zu verwerfen',
    );
  } else {
    pruefe(false, 'Pruefung liess sich fuer Station 7 nicht starten');
  }

  /* ---- STATION 8: „Lernstand zuruecksetzen" laesst den Karteikasten stehen ----
     Der Text auf /statistik versprach „Der Karteikasten bleibt" — und der Code loeschte ihn
     mit (gemessen 24 Karten -> 0), einen Halbsatz nachdem dieselbe Zeile erklaerte, dass es
     unumkehrbar ist. */
  L('\n8. Lernstand zuruecksetzen — der Kasten bleibt');
  await goto('/karteikasten');
  const vorher8 = await page.locator('.deck-table tbody tr').count();
  pruefe(vorher8 > 0, `Vor dem Zuruecksetzen liegen ${vorher8} Karten im Kasten`);

  await goto('/statistik');
  page.once('dialog', (d) => d.accept());
  const resetKnopf = page.getByRole('button', { name: /Lernstand zuruecksetzen|Lernstand zurücksetzen/i }).first();
  if (await resetKnopf.count()) {
    await resetKnopf.click();
    await page.waitForTimeout(600);

    /* Ohne Reload weiter: Ein Hash-Wechsel laedt das Dokument nicht neu, und genau so
       bedient auch ein Mensch die App. (Beim Messen mit Seed ist es zusaetzlich Pflicht —
       ein `addInitScript`-Seed wuerde bei jedem Reload neu injiziert und die Zahl faelschen.) */
    await page.evaluate(() => { window.location.hash = '/karteikasten'; });
    await page.waitForTimeout(800);
    const nachher8 = await page.locator('.deck-table tbody tr').count();
    pruefe(nachher8 === vorher8, `Der Kasten ist unveraendert (${vorher8} -> ${nachher8})`);

    const faecher = await page.evaluate(() => {
      const raw = localStorage.getItem('mf.progress');
      const st = JSON.parse(raw || '{}')?.state;
      const karten = Object.values(st?.flashcards?.cards ?? {});
      return { alleFach1: karten.every((c) => c.fach === 1), xp: st?.xp?.totalXP, anzahl: karten.length };
    });
    pruefe(faecher.alleFach1, 'Alle Faecher stehen wieder auf 1');
    pruefe(faecher.xp === 0, `XP sind zurueckgesetzt (${faecher.xp})`);
    pruefe(faecher.anzahl === vorher8, `Im Speicher liegen weiter ${vorher8} Karten (${faecher.anzahl})`);
  } else {
    pruefe(false, 'Zuruecksetzen-Knopf nicht gefunden');
  }

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
