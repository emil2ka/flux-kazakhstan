import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(process.env.FLUX_NODE_MODULES || new URL('../package.json',import.meta.url));
const { chromium } = require('playwright');
const base = process.env.FLUX_BASE_URL || 'http://127.0.0.1:3328/';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport:{width:1440,height:1100} });
const page = await context.newPage();
const errors = [];let posts=0;
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.method()==='POST')posts++;});
try {
 await page.goto(base+'operator.html?lang=ru',{waitUntil:'domcontentloaded'});
 await page.waitForURL(u=>u.pathname.endsWith('tours.html')&&u.searchParams.get('place')==='charyn');
 await page.locator('h1').waitFor();
 assert.equal(await page.locator('[href*="operator.html"],#op-publish,#op-fix').count(),0);
 assert.equal(await page.evaluate(()=>typeof FluxProof.publish),'undefined');
 await page.goto(base+'booking.html?place=charyn&lang=ru',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#fd-guests').inputValue(),'1');
 assert.match(await page.locator('#fd-total').innerText(),/44/);
 await page.locator('#fd-name').fill('Демо');await page.locator('#fd-email').fill('demo@example.test');
 await page.locator('#fd-consent').check();await page.locator('#fd-booking-form').evaluate(f=>f.requestSubmit());
 await page.locator('#fd-confirmation h1').waitFor();
 assert((await page.locator('#fd-confirmation').innerText()).includes('Денег списано: 0'));
 const download=page.waitForEvent('download');await page.locator('#fd-download').click();
 assert.match((await download).suggestedFilename(),/^FX-.+-FLUX\.pdf$/);
 await page.locator('#fd-cancel').click();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#fd-cancel').waitFor();assert(await page.locator('#fd-cancel').isDisabled());
 for(const lang of ['ru','de','en'])for(const path of ['index.html','tours.html?place=charyn','booking.html?place=charyn','operator.html']) {
  await page.setViewportSize({width:390,height:844});
  const response=await page.goto(base+path+(path.includes('?')?'&':'?')+'lang='+lang,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  if(path==='operator.html')await page.waitForURL(u=>u.pathname.endsWith('tours.html'));
  await page.locator('h1').waitFor();
  assert.equal(await page.locator('[href*="operator.html"],#op-publish,#op-fix').count(),0);
  assert.equal(await page.locator('h1').count(),1);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),lang+' '+path);
 }
 assert.deepEqual(errors,[]);assert.equal(posts,0);
 console.log('PASS: direct booking, PDF download, saved cancellation, removed operator redirect, 12 mobile routes, no JS errors or POST requests');
} finally { await browser.close(); }
