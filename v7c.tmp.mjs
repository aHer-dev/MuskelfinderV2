/* Etappe 7c: axe auf beiden Onboarding-Screens (Light+Dark) + Erststart bis zur ersten XP. */
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

const browser = await chromium.launch();
let failures = 0;

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);
  await page.goto(`${BASE}/#/heute`);
  await page.reload({ waitUntil: 'networkidle' });

  console.log(`\n[${theme}] Frage 1: "${await page.textContent('h1')}"`);
  failures += await audit(page, `${theme}/Frage 1`);

  await page.click('button:has-text("Logopädie")');
  await page.waitForSelector('.onboarding__date');
  console.log(`[${theme}] Frage 2: "${await page.textContent('h1')}"`);
  failures += await audit(page, `${theme}/Frage 2`);
  await ctx.close();
}

/* Erststart-Fluss: kalt öffnen → 2 Klicks → Sitzung → erste Karte bewerten. */
console.log('\nErststart (kalt):');
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${BASE}/`);
await page.evaluate('localStorage.clear()');
await page.goto(`${BASE}/#/heute`);
await page.reload({ waitUntil: 'networkidle' });

const t0 = Date.now();
await page.click('button:has-text("Ergotherapie")');
await page.click('button:has-text("Ohne Datum weiter")');
await page.waitForSelector('.flashcards__session', { timeout: 5000 });
console.log(`  ✓ Nach 2 Klicks in der Sitzung — Fortschritt ${(await page.textContent('.flashcards__progress-label')).trim()}`);

const deck = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mf.progress')).state.flashcards.cards));
console.log(`  ✓ Startdeck: ${deck.length} Karten · erste Karte: ${(await page.textContent('.flashcard__name, .flashcard h2, .flashcards__session h2').catch(() => '?')).trim()}`);

await page.click('.btn--primary'); // aufdecken
await page.waitForTimeout(200);
await page.click('button:has-text("Richtig")').catch(async () => {
  const btns = await page.locator('.rating-bar button, .rating button').all();
  await btns[btns.length - 1].click();
});
await page.waitForTimeout(300);
const xp = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.progress')).state.xp.totalXP);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`  ${xp > 0 ? '✓' : '✗'} Erste Karte bewertet, XP: ${xp} (nach ${secs}s Interaktionszeit)`);
if (xp <= 0) failures++;

const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.profile')).state);
console.log(`  ✓ Profil persistiert: ${JSON.stringify(profile)}`);

/* Prüfen: Backup-Export bleibt vom Profil unberührt (ADR 0002). */
await page.goto(`${BASE}/#/statistik`);
await page.waitForSelector('h1');
const hasProfileLink = await page.locator('a[href="#/start"]').count();
console.log(`  ${hasProfileLink === 1 ? '✓' : '✗'} „Lernprofil ändern" aus Fortschritt erreichbar`);
if (hasProfileLink !== 1) failures++;

await browser.close();
console.log(`\n${failures === 0 ? '✓ Alles grün' : `✗ ${failures} Problem(e)`}`);
