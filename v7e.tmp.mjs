/* Etappe 7e: Falschantwort erklärt sich, Sheet über der Session, axe + Fokus-Trap. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4319';
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

async function audit(page, label) {
  await page.evaluate(AXE);
  const res = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } }),
  );
  const v = res.violations.map((x) => `${x.id} (${x.impact}, ${x.nodes.length}×)`);
  console.log(`  axe ${label}: ${v.length === 0 ? '0 Verstöße' : v.join(' | ')}`);
  return v.length;
}

/** Quiz starten und absichtlich falsch antworten. */
async function answerWrong(page) {
  await page.goto(`${BASE}/#/quiz`);
  await page.reload({ waitUntil: 'networkidle' });
  // Ersten Quiz-Modus starten (Karten-Struktur der QuizPage).
  await page.locator('.quiz-type, .quiz-type-card, button:has-text("Starten")').first().click().catch(() => {});
  await page.waitForSelector('.quiz-options', { timeout: 5000 });

  // Die NICHT-richtige Option ist vor dem Aufdecken nicht erkennbar — wir klicken
  // die erste, prüfen das Ergebnis und wiederholen ggf. bei der nächsten Frage.
  for (let attempt = 0; attempt < 8; attempt++) {
    const options = page.locator('.quiz-option');
    await options.first().click();
    await page.waitForTimeout(200);
    const wrong = await page.locator('.quiz-card__explain').count();
    if (wrong === 1) return true;
    // Richtig geraten → weiter zur nächsten Frage.
    const next = page.locator('button:has-text("Weiter"), button:has-text("Nächste")').first();
    if ((await next.count()) === 0) return false;
    await next.click();
    await page.waitForTimeout(200);
  }
  return false;
}

const browser = await chromium.launch();
let failures = 0;

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);

  const gotWrong = await answerWrong(page);
  if (!gotWrong) {
    console.log(`[${theme}] ✗ keine Falschantwort erreicht`);
    failures++;
    await ctx.close();
    continue;
  }

  const satz = (await page.textContent('.quiz-card__explain-text')).trim();
  console.log(`\n[${theme}] Erklärsatz: "${satz}"`);

  await page.click('button:has-text("Beide vergleichen")');
  await page.waitForSelector('[role="dialog"]');
  const cards = await page.locator('.explain-card').count();
  const asked = await page.locator('.explain-row--asked').count();
  console.log(`  Sheet offen: ${cards} Vergleichskarten, ${asked} hervorgehobene Merkmalszeilen`);
  if (cards < 2) { console.log('  ✗ Gegenüberstellung unvollständig'); failures++; }

  failures += await audit(page, `${theme}/Sheet offen`);

  // Fokus-Trap: Tab darf das Sheet nicht verlassen.
  let escaped = false;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    if (!inside) { escaped = true; break; }
  }
  console.log(`  ${escaped ? '✗' : '✓'} Fokus bleibt im Sheet (Trap greift)`);
  if (escaped) failures++;

  // Schließen führt in dieselbe Frage zurück, Session unverändert.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const dialogGone = (await page.locator('[role="dialog"]').count()) === 0;
  const questionStill = (await page.locator('.quiz-options').count()) === 1;
  const feedbackStill = (await page.locator('.quiz-card__explain').count()) === 1;
  console.log(`  ${dialogGone && questionStill && feedbackStill ? '✓' : '✗'} Zurück in derselben Frage (Session steht)`);
  if (!(dialogGone && questionStill && feedbackStill)) failures++;

  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? '✓ Alles grün' : `✗ ${failures} Problem(e)`}`);
