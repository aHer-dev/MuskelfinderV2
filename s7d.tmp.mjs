import { chromium } from 'playwright';
const OUT='/tmp/claude-1000/-home-pepperboy8-Documents-Muskelfinder-V2/eba68aeb-c85c-444c-8343-64a0f27d2101/scratchpad';
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1280,height:900} });
const p = await c.newPage();
await p.goto('http://localhost:4319/');
await p.evaluate(`
  localStorage.clear();
  localStorage.setItem('mf.profile', JSON.stringify({state:{profession:'physio',examDate:null},version:0}));
  const past=new Date(); past.setDate(past.getDate()-2); past.setHours(0,0,0,0);
  const cards={};
  for (const n of ['M. deltoideus','M. trapezius','M. soleus','M. biceps brachii']) cards[n]={fach:2,nextDue:past.toISOString(),totalCorrect:1,totalWrong:0,lastSeen:null,difficult:false};
  localStorage.setItem('mf.progress', JSON.stringify({state:{flashcards:{version:2,cards},xp:{version:2,totalXP:340,lastDailyBonus:null}},version:0}));
  const now=new Date().toISOString();
  localStorage.setItem('mf.lookups', JSON.stringify({state:{lookups:{version:2,entries:{
    'M. supraspinatus':{count:4,lastLookup:now},
    'M. serratus anterior':{count:2,lastLookup:now},
    'M. piriformis':{count:1,lastLookup:now}
  }}},version:0}));
`);
await p.goto('http://localhost:4319/#/heute');
await p.reload({ waitUntil:'networkidle' });
await p.waitForSelector('.today__gaps');
await p.screenshot({ path: `${OUT}/heute-7d.png` });
await b.close(); console.log('ok');
