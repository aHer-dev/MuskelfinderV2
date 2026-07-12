import { chromium } from 'playwright';
const OUT='/tmp/claude-1000/-home-pepperboy8-Documents-Muskelfinder-V2/eba68aeb-c85c-444c-8343-64a0f27d2101/scratchpad';
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1280,height:900} });
const p = await c.newPage();
await p.goto('http://localhost:4319/');
await p.evaluate('localStorage.clear()');
await p.goto('http://localhost:4319/#/quiz');
await p.reload({ waitUntil:'networkidle' });
await p.locator('.quiz-option').first().waitFor({ timeout: 5000 }).catch(async()=>{
  await p.locator('button').filter({hasText:/Start/i}).first().click();
});
for (let i=0;i<10;i++){
  await p.locator('.quiz-option').first().click();
  await p.waitForTimeout(200);
  if (await p.locator('.quiz-card__explain').count()) break;
  const next = p.locator('button').filter({hasText:/Weiter|Nächste/i}).first();
  if (!(await next.count())) break;
  await next.click(); await p.waitForTimeout(200);
}
await p.screenshot({ path: `${OUT}/quiz-explain.png` });
await p.click('button:has-text("Beide vergleichen")');
await p.waitForSelector('[role="dialog"]');
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/quiz-sheet.png` });
await b.close(); console.log('ok');
