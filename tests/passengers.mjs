import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(process.env.FLUX_NODE_MODULES||new URL('../package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.FLUX_BASE_URL||'http://127.0.0.1:3328/';
const browser=await chromium.launch();
try {
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'booking.html?place=charyn&lang=ru');
 assert.equal(await page.locator('#fd-guests').inputValue(),'1');
 assert.equal(await page.locator('#fd-extra-passengers input').count(),0);
 await page.locator('#fd-name').fill('Эмиль Демо');await page.locator('#fd-email').fill('demo@example.test');await page.locator('#fd-consent').check();
 await page.locator('#fd-guests').fill('2');
 await page.locator('#fd-booking-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>FluxProof.read().bookings.length),0);
 assert.match(await page.locator('#fd-error').innerText(),/каждого туриста/);
 assert.equal(await page.locator('#fd-passenger-2').getAttribute('aria-invalid'),'true');
 await page.locator('#fd-passenger-2').fill('Хакназар Демо');
 await page.locator('#fd-guests').fill('3');await page.locator('#fd-passenger-3').fill('Третий турист');
 await page.locator('#fd-guests').fill('1');await page.locator('#fd-guests').fill('3');
 assert.equal(await page.locator('#fd-passenger-2').inputValue(),'Хакназар Демо');assert.equal(await page.locator('#fd-passenger-3').inputValue(),'Третий турист');
 await page.locator('#fd-guests').fill('2');await page.locator('#fd-booking-form').evaluate(f=>f.requestSubmit());
 await page.locator('#receipt-heading').waitFor();
 let booking=await page.evaluate(()=>FluxProof.read().bookings[0]);
 assert.equal(booking.passengers.length,2);assert.deepEqual(booking.passengers.map(p=>p.name),['Эмиль Демо','Хакназар Демо']);
 assert.equal(booking.total,178000);assert.equal(booking.deposit,35600);assert.equal(booking.paidAmount,0);
 assert.notEqual(booking.passengers[0].ticketId,booking.passengers[1].ticketId);
 assert.equal(await page.locator('[data-ticket-download]').count(),2);
 assert.match(await page.locator('#fd-download').innerText(),/все билеты/);
 const models=await page.evaluate(()=>[0,1].map(i=>FluxReceipt.model(FluxProof.read().bookings[0],'ru',i).b));
 assert.deepEqual(models.map(b=>b.total),[89000,89000]);assert.deepEqual(models.map(b=>b.deposit),[17800,17800]);assert.deepEqual(models.map(b=>b.balance),[71200,71200]);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));}
 await page.reload();await page.locator('#receipt-heading').waitFor();
 assert.equal(await page.locator('[data-ticket-download]').count(),2);assert((await page.locator('.fd-ticket-list').innerText()).includes('Хакназар Демо'));
 // A legacy group without individual names remains one group ticket; do not invent passengers.
 const legacy=await page.evaluate(()=>{const b=FluxProof.read().bookings[0];delete b.passengers;return {markup:FluxReceipt.markup(b,'ru'),model:FluxReceipt.model(b,'ru').b,total:FluxReceipt.tickets(b).length};});
 assert.equal(legacy.total,0);assert.equal(legacy.model.total,178000);assert(!legacy.markup.includes('data-ticket-download='));
 // XSS must stay plain text in the saved list.
 const escaped=await page.evaluate(()=>{const b=FluxProof.read().bookings[0];b.passengers[1].name='<img src=x onerror=alert(1)>';return FluxReceipt.markup(b,'ru');});
 assert(escaped.includes('&lt;img'));assert(!escaped.includes('<img src=x'));
 assert.deepEqual(errors,[]);await context.close();
 // Every supported group size, language and mobile form; invalid counts create no extra bookings.
 for(const lang of ['ru','en','de']) {
  const c=await browser.newContext({viewport:{width:320,height:900}}),p=await c.newPage();
  await p.goto(base+'booking.html?place=charyn&lang='+lang);
  await p.locator('#fd-guests').fill('8');assert.equal(await p.locator('#fd-extra-passengers input').count(),7);
  await p.locator('#fd-name').fill('Traveller 1');await p.locator('#fd-email').fill('demo@example.test');
  for(let i=2;i<=8;i++)await p.locator('#fd-passenger-'+i).fill('Traveller '+i);
  await p.locator('#fd-consent').check();await p.locator('#fd-booking-form').evaluate(f=>f.requestSubmit());await p.locator('#receipt-heading').waitFor();
  assert.equal(await p.locator('[data-ticket-download]').count(),8);assert.equal(await p.evaluate(()=>FluxProof.read().bookings[0].total),712000);
  assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
  await c.close();
 }
 console.log('PASS passengers: required names, 1/2/3/8 guests, retained inputs, unique tickets, per-person amounts, persistence, legacy group support, escaping, RU/EN/DE and 320px layout');
} finally {await browser.close();}
