/* Etappe 7f: Streak-Anzeige, Freeze-Einlösung beim Öffnen, axe. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:4319';
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

const profile = `localStorage.setItem('mf.profile', JSON.stringify({state:{profession:'physio',examDate:null},version:0}))`;
const deck = `(() => {
  const past = new Date(); past.setDate(past.getDate() - 2); past.setHours(0,0,0,0);
  const cards = {};
  for (const n of ['M. deltoideus','M. trapezius','M. soleus']) cards[n] = { fach: 2, nextDue: past.toISOString(), totalCorrect: 1, totalWrong: 0, lastSeen: null, difficult: false };
  localStorage.setItem('mf.progress', JSON.stringify({ state: { flashcards: { version: 2, cards }, xp: { version: 2, totalXP: 300, lastDailyBonus: null } }, version: 0 }));
})()`;

/** Streak-Zustand setzen: `lastDaysAgo` Tage her, mit `freezes` auf dem Konto. */
function streakState(current, freezes, lastDaysAgo) {
  return `(() => {
    const d = new Date(); d.setDate(d.getDate() - ${lastDaysAgo});
    const stamp = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    localStorage.setItem('mf.streak', JSON.stringify({ state: { streak: {
      version: 2, current: ${current}, best: ${current}, lastCompletedDay: stamp,
      freezes: ${freezes}, day: stamp, reviewedToday: 20, earnedFreezeToday: false
    }}, version: 0 }));
  })()`;
}

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

/* 1) Anzeige: laufende Serie + Freeze, in beiden Themes. */
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); ${profile}; ${deck}; ${streakState(5, 1, 1)}`);
  await page.evaluate(`localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);
  await page.goto(`${BASE}/#/heute`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.today__progress');

  const line = (await page.textContent('.today__progress-text')).trim().replace(/\s+/g, ' ');
  console.log(`\n[${theme}] Fortschrittszeile: "${line}"`);
  if (!line.includes('5 Tage in Folge') || !line.includes('1 Freeze')) {
    console.log('  ✗ Serie/Freeze fehlen in der Anzeige');
    failures++;
  }
  failures += await audit(page, `${theme}/heute mit Serie`);
  await ctx.close();
}

/* 2) Fehltag MIT Freeze: beim Öffnen automatisch überbrückt, ohne Nachfrage. */
console.log('\nFehltag mit Freeze (beim Öffnen):');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  // Zuletzt vor 2 Tagen gelernt → gestern fehlt. Ein Freeze auf dem Konto.
  await page.evaluate(`localStorage.clear(); ${profile}; ${deck}; ${streakState(5, 1, 2)}`);
  await page.goto(`${BASE}/#/heute`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.today__progress');
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.streak')).state.streak);
  const toast = await page.locator('.toast, [class*="toast"]').first().textContent().catch(() => '—');
  const ok = after.current === 5 && after.freezes === 0;
  console.log(`  ${ok ? '✓' : '✗'} Serie steht (${after.current} Tage), Freeze verbraucht (${after.freezes} übrig)`);
  console.log(`  Meldung: "${(toast ?? '—').trim()}"`);
  if (!ok) failures++;
  await ctx.close();
}

/* 3) Fehltag OHNE Freeze: Serie beginnt neu — freundlich, ohne Schuldzuweisung. */
console.log('\nFehltag ohne Freeze:');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); ${profile}; ${deck}; ${streakState(5, 0, 3)}`);
  await page.goto(`${BASE}/#/heute`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.streak')).state.streak);
  const toast = await page.locator('.toast, [class*="toast"]').first().textContent().catch(() => '—');
  const ok = after.current === 0 && after.best === 5;
  console.log(`  ${ok ? '✓' : '✗'} Serie neu (${after.current}), Bestmarke bleibt (${after.best})`);
  console.log(`  Meldung: "${(toast ?? '—').trim()}"`);
  if (!ok) failures++;
  // Keine Schuld-Botschaft.
  const body = await page.textContent('body');
  if (/verloren|leider|schade|verpasst/i.test(body)) {
    console.log('  ✗ Schuld-/Verlust-Botschaft im Text gefunden');
    failures++;
  } else {
    console.log('  ✓ Keine Verlust-/Schuld-Botschaft');
  }
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? '✓ Alles grün' : `✗ ${failures} Problem(e)`}`);
