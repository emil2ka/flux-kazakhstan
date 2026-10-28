import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(process.env.FLUX_NODE_MODULES||new URL('../package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.FLUX_BASE_URL||'http://127.0.0.1:3328/';
const out=process.env.FLUX_RECEIPT_OUT||join(tmpdir(),'flux-receipt-checks');
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const evidence=[];
async function book(page,lang,name='Демо-путешественник',email='demo@example.test') {
 await page.goto(base+'booking.html?place=charyn&lang='+lang,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#fd-guests').inputValue(),'1');
 await page.locator('#fd-guests').fill('2');
 await page.locator('#fd-passenger-2').fill(lang==='de'?'Anna Müller':lang==='ru'?'Второй турист':'Second Traveller');
 await page.locator('#fd-name').fill(name);await page.locator('#fd-email').fill(email);
 await page.locator('#fd-consent').check();await page.locator('#fd-booking-form').evaluate(f=>f.requestSubmit());
 await page.locator('#fd-confirmation h1').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 return new URL(page.url()).searchParams.get('ref');
}
async function download(page,name,selector='#fd-download') {
 const event=page.waitForEvent('download',{timeout:60000});await page.locator(selector).click();
 const d=await event;assert.match(d.suggestedFilename(),/^FX-.+-FLUX\.pdf$/);
 const path=join(out,name);await d.saveAs(path);
 assert.equal((await readFile(path)).subarray(0,5).toString(),'%PDF-');return path;
}
try {
 for(const [lang,name] of [['ru','Демо-путешественник'],['en','Alex Kim (demo)'],['de','Jörg Müller (Demo)']]) {
  const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{
   const u=route.request().url();if(u.startsWith('http'))requests.push(u);
   if(u.startsWith('http')&&!u.startsWith(new URL(base).origin))return route.abort();
   return route.continue();
  });
  page.on('request',r=>assert.notEqual(r.method(),'POST'));
  const ref=await book(page,lang,name);
  assert(ref);assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.evaluate(()=>FluxProof.read().bookings.length),1);
  // Change the live offer after acceptance. Both the page and PDF must retain v1.
  await page.evaluate(()=>{const state=FluxProof.read(),old=FluxProof.published();const next={...old,id:'CH-2026-11-07-v2',number:2,departure:{...old.departure,price:69000,cancelHours:72}};state.versions.push(next);state.activeVersion=next.id;localStorage.setItem(FluxProof.KEY,JSON.stringify(state));});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#fd-download').waitFor();
  assert.equal(await page.evaluate(()=>FluxReceipt.model(FluxProof.read().bookings[0],document.documentElement.lang).b.total),178000);
  await page.locator('.fd-saved-terms summary').click();
  assert.match(await page.locator('.fd-saved-grid').innerText(),/48/);
  await page.locator('.fd-saved-terms summary').click();
  for(const width of [1440,768,390,320]) {
   await page.setViewportSize({width,height:1000});
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),lang+' overflow at '+width);
   if(width===1440||width===390)await page.screenshot({path:join(out,lang+'-'+width+'.png'),fullPage:true});
  }
  await download(page,lang+'.pdf');
  await download(page,lang+'-person-1.pdf','[data-ticket-download="0"]');
  await download(page,lang+'-person-2.pdf','[data-ticket-download="1"]');
  assert.deepEqual(await page.evaluate(()=>[0,1].map(i=>{const r=FluxReceipt.model(FluxProof.read().bookings[0],document.documentElement.lang,i);return [r.b.total,r.b.deposit,r.b.balance,r.b.guests]})),[[89000,17800,71200,1],[89000,17800,71200,1]]);
  const old=await page.evaluate(()=>FluxProof.read().bookings[0]);
  assert.equal(old.termsSnapshot.number,1);assert.equal(old.termsSnapshot.departure.cancelHours,48);
  const target=lang==='de'?'en':'de';
  await page.locator('[data-final-lang="'+target+'"]').click();await page.waitForURL(u=>u.searchParams.get('lang')===target);
  assert.equal(new URL(page.url()).searchParams.get('ref'),ref);await page.locator('#fd-download').waitFor();
  await page.locator('#fd-cancel').click();await page.reload({waitUntil:'domcontentloaded'});
  assert(await page.locator('#fd-cancel').isDisabled());
  assert.equal(await page.evaluate(()=>FluxProof.read().bookings[0].status),'cancel_requested');
  await download(page,lang+'-cancel-request.pdf');
  assert.equal(await page.evaluate(()=>FluxProof.read().bookings[0].termsSnapshot.number),1);
  assert.deepEqual(errors,[]);assert(requests.every(u=>u.startsWith(new URL(base).origin)));
  evidence.push({lang,ref,acceptedVersion:old.termsVersionId,name:old.name,total:old.total,cancelHours:48,pagesExpected:4});
  await context.close();
 }
 // Failed font loading must leave the booking intact and allow a retry.
 const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();
 await book(page,'ru');let fail=true;
 await page.route('**/fonts/source-sans3-regular.ttf',route=>fail?(fail=false,route.abort()):route.continue());
 await page.locator('#fd-download').click();await page.waitForFunction(()=>document.querySelector('#fd-download-status').textContent.length>0);
 assert(await page.locator('#fd-download').isEnabled());
 assert.equal(await page.evaluate(()=>FluxProof.read().bookings.length),1);
 await download(page,'retry.pdf');await context.close();
 // Max-length contacts and a wider total exercise wrapping in both pages.
 const stress=await browser.newContext({viewport:{width:320,height:900},acceptDownloads:true});const s=await stress.newPage();
 await book(s,'ru','Ж'.repeat(100),'a'.repeat(145)+'@example.test');
 assert(!(await s.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
 await download(s,'long-name.pdf');await stress.close();
 await writeFile(join(out,'evidence.json'),JSON.stringify(evidence,null,2));
 console.log('PASS: RU/EN/DE PDF downloads; 12 responsive confirmation views; snapshot after price/policy change; reload/language/cancellation persistence; local-only assets; retry and long contacts.');
 console.log('PDFs and screenshots:',out);
} finally {await browser.close();}
