import { chromium } from 'playwright';

const BASE = 'http://localhost:4319';
const OUT = '/tmp/claude-1000/-home-pepperboy8-Documents-Muskelfinder-V2/eba68aeb-c85c-444c-8343-64a0f27d2101/scratchpad';
const NAMES = ['M. deltoideus', 'M. biceps brachii', 'M. trapezius', 'M. gluteus maximus', 'M. rectus abdominis'];

const seed = `(() => {
  const past = new Date(); past.setDate(past.getDate() - 2); past.setHours(0,0,0,0);
  const cards = {};
  for (const n of ${JSON.stringify(NAMES)}) cards[n] = { fach: 2, nextDue: past.toISOString(), totalCorrect: 3, totalWrong: 1, lastSeen: null, difficult: false };
  localStorage.setItem('mf.progress', JSON.stringify({ state: { flashcards: { version: 2, cards }, xp: { version: 2, totalXP: 340, lastDailyBonus: null } }, version: 0 }));
})()`;

const browser = await chromium.launch();
for (const [theme, w, h, tag] of [
  ['light', 1280, 900, 'desktop-light'],
  ['dark', 1280, 900, 'desktop-dark'],
  ['light', 390, 780, 'mobil-light'],
]) {
  const ctx = await browser.newContext({ colorScheme: theme, viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(`localStorage.clear(); localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);
  await page.evaluate(seed);
  await page.goto(`${BASE}/#/heute`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.today__hero');
  await page.screenshot({ path: `${OUT}/heute-${tag}.png` });
  await ctx.close();
}
await browser.close();
console.log('ok');
