import { chromium } from 'playwright';
const OUT='/tmp/claude-1000/-home-pepperboy8-Documents-Muskelfinder-V2/eba68aeb-c85c-444c-8343-64a0f27d2101/scratchpad';
const b = await chromium.launch();
for (const [theme, tag] of [['light','q1-light'],['dark','q1-dark']]) {
  const c = await b.newContext({ colorScheme: theme, viewport:{width:1280,height:820} });
  const p = await c.newPage();
  await p.goto('http://localhost:4319/');
  await p.evaluate(`localStorage.clear(); localStorage.setItem('mf.theme', JSON.stringify({state:{theme:'${theme}'},version:0}))`);
  await p.goto('http://localhost:4319/#/heute');
  await p.reload({ waitUntil:'networkidle' });
  await p.waitForSelector('.onboarding__choices');
  await p.screenshot({ path: `${OUT}/onb-${tag}.png` });
  if (theme==='light') { await p.click('button:has-text("Logopädie")'); await p.waitForSelector('.onboarding__date'); await p.screenshot({ path: `${OUT}/onb-q2-light.png` }); }
  await c.close();
}
await b.close(); console.log('ok');
