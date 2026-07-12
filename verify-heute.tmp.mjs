/* Verifikation Etappe 7b: axe (Light+Dark, mehrere Zustände) + Deep-Link-Reload. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4319';
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

/** Karteikasten mit fälligen Karten füllen — für den Normalfall/Stau-Zustand. */
function seedScript(count) {
  return `(() => {
    const names = ${JSON.stringify(count)};
    const past = new Date(); past.setDate(past.getDate() - 2); past.setHours(0,0,0,0);
    const cards = {};
    for (const n of names) cards[n] = { fach: 2, nextDue: past.toISOString(), totalCorrect: 1, totalWrong: 0, lastSeen: null, difficult: false };
    localStorage.setItem('mf.progress', JSON.stringify({
      state: { flashcards: { version: 2, cards }, xp: { version: 2, totalXP: 120, lastDailyBonus: null } },
      version: 0,
    }));
  })()`;
}

const DUE_NAMES = ['M. deltoideus', 'M. biceps brachii', 'M. trapezius', 'M. gluteus maximus'];

async function audit(page, label) {
  await page.evaluate(AXE);
  const res = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] } }),
  );
  const violations = res.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}×): ${v.help}`);
  console.log(`  axe ${label}: ${violations.length === 0 ? '0 Verstöße' : violations.join(' | ')}`);
  return violations.length;
}

const browser = await chromium.launch();
let failures = 0;

for (const theme of ['light', 'dark']) {
  for (const [state, seed] of [
    ['Kasten leer (needsOnboarding)', null],
    ['fällige Karten (review)', DUE_NAMES],
  ]) {
    const ctx = await browser.newContext({ colorScheme: theme });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.evaluate(`localStorage.clear(); localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);
    if (seed) await page.evaluate(seedScript(seed));
    // Vollständiger Reload: ein reiner Hash-Wechsel lädt das Dokument nicht neu,
    // der Store läse den frisch gesetzten localStorage dann nie.
    await page.goto(`${BASE}/#/heute`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('h1');

    const h1 = await page.textContent('h1');
    const primaries = await page.locator('.btn--primary').count();
    const diagnosis = (await page.locator('.today__diagnosis li').allTextContents()).join(' · ');
    console.log(`\n[${theme}] ${state}`);
    console.log(`  h1: "${h1}" · Primärbuttons: ${primaries}${diagnosis ? `\n  Diagnose: ${diagnosis}` : ''}`);
    if (primaries !== 1) {
      console.log('  ✗ Genau ein Primärbutton verletzt!');
      failures++;
    }
    failures += await audit(page, `${theme}/${state}`);
    await ctx.close();
  }
}

/* Deep-Link-Reload: die abgestuften Routen dürfen nicht brechen. */
console.log('\nDeep-Link-Reload:');
for (const route of ['#/heute', '#/suche', '#/lernkarten', '#/karteikasten', '#/quiz', '#/statistik', '#/muskel/pectoralis-minor']) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const resp = await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  const is404 = (h1 ?? '').includes('nicht gefunden') || (h1 ?? '').includes('404');
  const ok = resp.status() === 200 && h1 && !is404;
  console.log(`  ${ok ? '✓' : '✗'} ${route} → HTTP ${resp.status()} · h1: "${h1}"`);
  if (!ok) failures++;
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? '✓ Alles grün' : `✗ ${failures} Problem(e)`}`);
process.exit(failures === 0 ? 0 : 1);
