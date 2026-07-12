/* Etappe 7d: Kopfzeilen-Suche, Brücke B1 im echten Browser, Session überlebt Navigation, axe. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4319';
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

const seedProfile = `localStorage.setItem('mf.profile', JSON.stringify({state:{profession:'physio',examDate:null},version:0}))`;
const seedDeck = `(() => {
  const past = new Date(); past.setDate(past.getDate() - 2); past.setHours(0,0,0,0);
  const cards = {};
  for (const n of ['M. deltoideus','M. trapezius','M. soleus']) cards[n] = { fach: 2, nextDue: past.toISOString(), totalCorrect: 1, totalWrong: 0, lastSeen: null, difficult: false };
  localStorage.setItem('mf.progress', JSON.stringify({ state: { flashcards: { version: 2, cards }, xp: { version: 2, totalXP: 200, lastDailyBonus: null } }, version: 0 }));
})()`;

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

/* 1) Suchfeld auf jeder Route + axe in beiden Themes. */
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); ${seedProfile}; ${seedDeck}`);
  await page.evaluate(`localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);

  for (const route of ['#/heute', '#/lernkarten', '#/quiz', '#/statistik']) {
    await page.goto(`${BASE}/${route}`);
    await page.reload({ waitUntil: 'networkidle' });
    const field = await page.locator('.header-search input[type="search"]').count();
    if (field !== 1) { console.log(`  ✗ ${route}: kein Suchfeld in der Kopfzeile`); failures++; }
  }
  console.log(`\n[${theme}] Suchfeld auf allen geprüften Routen vorhanden`);
  failures += await audit(page, `${theme}/statistik mit Kopfzeilen-Suche`);
  await ctx.close();
}

/* 2) Tastatur: Feld fokussierbar, sichtbarer Fokus-Ring. */
const ctxK = await browser.newContext();
const pageK = await ctxK.newPage();
await pageK.goto(`${BASE}/`);
await pageK.evaluate(`localStorage.clear(); ${seedProfile}`);
await pageK.goto(`${BASE}/#/statistik`);
await pageK.reload({ waitUntil: 'networkidle' });
await pageK.keyboard.press('Tab');
let tabs = 1;
while (tabs < 12 && !(await pageK.evaluate(() => document.activeElement?.getAttribute('type') === 'search'))) {
  await pageK.keyboard.press('Tab');
  tabs++;
}
const focused = await pageK.evaluate(() => document.activeElement?.getAttribute('type') === 'search');
const ring = await pageK.evaluate(() => {
  const el = document.querySelector('.search-field');
  return el ? getComputedStyle(el).boxShadow !== 'none' : false;
});
console.log(`\nTastatur: Suchfeld nach ${tabs} Tab(s) fokussiert: ${focused ? '✓' : '✗'} · sichtbarer Fokus-Ring: ${ring ? '✓' : '✗'}`);
if (!focused || !ring) failures++;
await ctxK.close();

/* 3) Brücke B1: dreimal nachschlagen → /heute bietet an → Kasten füllt sich. */
console.log('\nBrücke B1 (echter Browser):');
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${BASE}/`);
await page.evaluate(`localStorage.clear(); ${seedProfile}`);

for (let i = 0; i < 3; i++) {
  await page.goto(`${BASE}/#/muskel/serratus-anterior`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
}
const counts = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.lookups')).state.lookups.entries);
console.log(`  Zähler nach 3 Aufrufen: ${JSON.stringify(counts)}`);

await page.goto(`${BASE}/#/heute`);
await page.reload({ waitUntil: 'networkidle' });
const gapText = await page.locator('.today__gap').first().innerText().catch(() => '—');
console.log(`  /heute zeigt: "${gapText.replace(/\n/g, ' · ')}"`);
failures += await audit(page, 'heute mit „Zuletzt nachgeschlagen"');

await page.click('.today__gaps button');
const deck = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mf.progress')).state.flashcards.cards));
const lookupsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.lookups')).state.lookups.entries);
const ok = deck.includes('M. serratus anterior') && Object.keys(lookupsAfter).length === 0;
console.log(`  ${ok ? '✓' : '✗'} Karte im Kasten (${deck.join(', ')}), Zähler zurückgesetzt — /karteikasten nie geöffnet`);
if (!ok) failures++;

/* 4) Sitzung überlebt den Griff zur Suche. */
console.log('\nSitzung + Suche:');
await page.goto(`${BASE}/#/lernkarten`);
await page.reload({ waitUntil: 'networkidle' });
await page.click('.btn--primary'); // Lernen starten
await page.waitForSelector('.flashcards__session');
const before = (await page.textContent('.flashcards__progress-label')).trim();

await page.fill('.header-search input[type="search"]', 'delt');
await page.waitForTimeout(400);
const urlAfterTyping = page.url().split('#')[1];
await page.goBack();
await page.waitForTimeout(300);
const stillRunning = await page.locator('.flashcards__session').count();
const after = await page.textContent('.flashcards__progress-label').catch(() => '—');
console.log(`  Tippen in der Kopfzeile → Route ${urlAfterTyping}`);
console.log(`  ${stillRunning === 1 ? '✓' : '✗'} Zurück: Sitzung läuft weiter (${before} → ${after.trim()})`);
if (stillRunning !== 1) failures++;

await browser.close();
console.log(`\n${failures === 0 ? '✓ Alles grün' : `✗ ${failures} Problem(e)`}`);
