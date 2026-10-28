import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(process.env.FLUX_NODE_MODULES||new URL('../package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.FLUX_BASE_URL||'http://127.0.0.1:3328/';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const routes=['index.html','tours.html',...['kolsai','charyn','burabay','turkestan','altyn'].map(p=>'tours.html?place='+p),'journal.html','booking.html?place=kolsai','booking.html?place=charyn','operator.html','demo.html'];
try {
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const route of routes){
   const response=await page.goto(base+route+(route.includes('?')?'&':'?')+'lang=ru',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);
   if(route==='operator.html')await page.waitForURL(u=>u.pathname.endsWith('tours.html'));
   await page.locator('h1').waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'),'ru');
   assert.equal(await page.locator('h1').count(),1);
   assert.deepEqual(await page.evaluate(()=>[...(window.FluxMissingRU||[])]),[],route);
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),route+' overflow at '+width);
   assert(/[А-Яа-яЁё]/.test(await page.locator('h1').innerText()),route);
  }
 }
 await page.goto(base+'tours.html?lang=ru',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.trip-card').count(),5);
 await page.locator('[data-filter="short"]').click();
 assert.equal(await page.locator('#filter-status').innerText(),'Показано туров: 3');
 await page.locator('[data-lang="de"]').click();await page.waitForURL(/lang=de/);
 assert.equal(await page.locator('html').getAttribute('lang'),'de');
 await page.locator('[data-lang="ru"]').click();await page.waitForURL(/lang=ru/);
 await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('html').getAttribute('lang'),'ru');
 await page.locator('[data-finder-key="days"] [data-value="2"]').click();
 await page.locator('[data-finder-key="theme"] [data-value="nature"]').click();
 await page.locator('[data-finder-key="when"] [data-value="2026-11"]').click();
 assert((await page.locator('#finder-results').innerText()).includes('Посмотреть даты'));
 assert((await page.locator('.finder-card').first().getAttribute('href')).includes('lang=ru'));
 await page.keyboard.press('Control+k');
 await page.locator('.cmdk-input').fill('Туркестан');
 assert((await page.locator('.cmdk-list').innerText()).includes('Туркестан'));
 assert.equal(await page.locator('.cmdk-input').getAttribute('placeholder'),'Поиск направлений и страниц…');
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);
 console.log('PASS Russian: 36 responsive page views, five destinations, itineraries, filters, finder, palette, language switching and persistence; no missing translations or JS errors');
} finally {await browser.close();}
