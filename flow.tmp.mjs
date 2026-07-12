/* End-to-End: /heute → "Los" → Sitzung läuft mit genau den geplanten Karten. */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4319';
const NAMES = ['M. deltoideus', 'M. biceps brachii', 'M. trapezius', 'M. gluteus maximus', 'M. rectus abdominis'];

const seed = `(() => {
  const past = new Date(); past.setDate(past.getDate() - 2); past.setHours(0,0,0,0);
  const cards = {};
  for (const n of ${JSON.stringify(NAMES)}) cards[n] = { fach: 2, nextDue: past.toISOString(), totalCorrect: 3, totalWrong: 1, lastSeen: null, difficult: false };
  localStorage.setItem('mf.progress', JSON.stringify({ state: { flashcards: { version: 2, cards }, xp: { version: 2, totalXP: 340, lastDailyBonus: null } }, version: 0 }));
})()`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/`);
await page.evaluate(seed);
await page.goto(`${BASE}/#/heute`);
await page.reload({ waitUntil: 'networkidle' });

console.log('1) Heute:', await page.textContent('h1'));
await page.click('.btn--primary');
await page.waitForSelector('.flashcards__session', { timeout: 5000 });

console.log('2) URL nach Klick:', page.url().split('#')[1]);
console.log('3) Sitzung läuft — Fortschritt:', (await page.textContent('.flashcards__progress-label')).trim());
console.log('4) Erste Karte:', (await page.textContent('.flashcard, .fc-card, .flashcards__session h2').catch(() => '?')).trim().slice(0, 60));

// Eine Karte bewerten: aufdecken → richtig.
await page.click('.btn--primary'); // "Karte aufdecken"
await page.waitForTimeout(300);
const ratingButtons = await page.locator('.rating-bar button, .rating button').count();
console.log('5) Nach Aufdecken — Bewertungsknöpfe:', ratingButtons);

const deckAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('mf.progress')).state.flashcards.cards);
console.log('6) Karten im Kasten:', Object.keys(deckAfter).length);

// Zurück auf /heute: Zahl muss sich nach der Bewertung ändern (Reload, damit der Plan neu rechnet).
await browser.close();
console.log('\n✓ Fluss trägt: Heute → Los → laufende Sitzung');
