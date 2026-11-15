import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '/Users/carterjensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=(process.env.UCL_BASE_URL||'http://127.0.0.1:8787/').replace(/\/?$/,'/');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const results=[],errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));let stage;
const state=p=>p.evaluate(async()=>structuredClone((await import('./src/store.js')).store.get()));
async function until(fn,label){const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,75))}throw new Error(label)}
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name)}
try{
 await page.goto(base);await page.waitForSelector('#draft-stage .scene');await page.evaluate(()=>document.fonts.ready);
 await check('Focused library contains titles, agendas, holds and countdowns',async()=>{
  assert.equal(await page.locator('[data-pick^="presentation-"]').count(),3);assert.equal(await page.locator('[data-pick="session"]').count(),1);
  assert.equal(await page.locator('[data-field="end-preset"]').count(),0);assert.equal(await page.locator('[data-field="name"]').isVisible(),false);
  await page.click('[data-tab="loops"]');await page.click('#new-loop');const options=await page.locator('#loop-add-select option').evaluateAll(ns=>ns.map(n=>n.value));
  assert.ok(options.includes('daily-agenda-editorial'));assert.ok(!options.some(id=>id.includes('toolkit-')));assert.ok(!options.includes('presentation-editorial-content'));await page.click('#loop-dialog [data-close]');
  await page.click('[data-tab="templates"]');await page.click('[data-category="agendas"]');assert.equal(await page.locator('[data-pick^="daily-agenda-"]').count(),2);await page.click('[data-pick="daily-agenda-night"]');
 });
 const before=(await state(page)).feeds[0].program.id;
 await check('Each day has editable times, titles, speakers and independent rows',async()=>{
  await page.click('[data-agenda-edit]');await page.fill('#agenda-day-name','Day 1 · Welcome');
  const row=page.locator('.agenda-edit-row').first();await row.locator('[data-agenda-item-field="time"]').fill('09:30');await row.locator('[data-agenda-item-field="title"]').fill('Opening conversations');await row.locator('[data-agenda-item-field="speaker"]').fill('First speaker');
  await page.click('#agenda-add-day');await page.fill('#agenda-day-name','Day 2 · Build');
  for(let i=0;i<7;i++){await page.click('#agenda-add-item');const row=page.locator('.agenda-edit-row').nth(i);await row.locator('[data-agenda-item-field="time"]').fill(String(9+i).padStart(2,'0')+':00');await row.locator('[data-agenda-item-field="title"]').fill('Build session '+(i+1));await row.locator('[data-agenda-item-field="speaker"]').fill('Speaker '+(i+1))}
  await page.click('.agenda-dialog .primary[data-agenda-close]');
  await page.selectOption('[data-agenda-current]',{label:'15:00 · Build session 7'});
  await page.waitForFunction(()=>document.querySelector('#draft-stage .scene')?.dataset.activeIndex==='6');
  assert.equal((await state(page)).feeds[0].program.id,before);assert.equal(await page.locator('#draft-stage .scene').getAttribute('data-page'),'1');
  await page.selectOption('select[data-agenda-style]','editorial');await page.waitForFunction(()=>document.querySelector('#draft-stage .scene')?.dataset.agendaStyle==='editorial');
  assert.ok((await page.locator('#draft-stage').textContent()).includes('Build session 7'));
  await page.selectOption('[data-agenda-day]',{label:'Day 1 · Welcome'});await page.waitForFunction(()=>document.querySelector('#draft-stage')?.textContent.includes('Opening conversations'));
  await page.selectOption('[data-agenda-day]',{label:'Day 2 · Build'});
  await page.selectOption('[data-agenda-current]',{label:'14:00 · Build session 6'});
 });
 await check('Launch and live Next session keep stage full-screen with manual highlighting',async()=>{
  stage=await context.newPage();await stage.goto(new URL('output.html?display=main-display',base).href);await stage.waitForSelector('#stage .scene');await stage.click('#fullscreen');await stage.waitForFunction(()=>Boolean(document.fullscreenElement));const origin=await stage.evaluate(()=>performance.timeOrigin);
  const support=(await state(page)).feeds[1].program.id;await page.click('#launch');
  await stage.waitForFunction(()=>document.querySelector('#stage .scene')?.dataset.activeIndex==='5');
  await page.click('[data-live-agenda="next"]');await stage.waitForFunction(()=>document.querySelector('#stage .scene')?.dataset.activeIndex==='6');
  assert.equal(await stage.locator('#stage .scene').getAttribute('data-page'),'1');assert.equal(await page.locator('[data-live-agenda="next"]').isDisabled(),true);
  assert.equal(await stage.evaluate(()=>performance.timeOrigin),origin);assert.ok(await stage.evaluate(()=>Boolean(document.fullscreenElement)));assert.equal((await state(page)).feeds[1].program.id,support);
  await stage.evaluate(async()=>(await import('./src/clock.js')).setClockOffset(3600000));await stage.waitForTimeout(400);assert.equal(await stage.locator('#stage .scene').getAttribute('data-active-index'),'6');await stage.evaluate(async()=>(await import('./src/clock.js')).setClockOffset(0));
  await page.click('[data-live-agenda="overview"]');await stage.waitForFunction(()=>document.querySelector('#stage .scene')?.dataset.activeIndex==='-1');
  const pageBefore=await stage.locator('#stage .scene').getAttribute('data-page');await stage.evaluate(async()=>(await import('./src/clock.js')).setClockOffset(15000));await until(async()=>(await stage.locator('#stage .scene').getAttribute('data-page'))!==pageBefore,'Agenda did not rotate to its other page');await stage.evaluate(async()=>(await import('./src/clock.js')).setClockOffset(0));
 });
 await check('Saved agendas preserve all days and can be reused in loops and exported shows',async()=>{
  await page.click('.more-options summary');await page.fill('[data-field="name"]','Two-day rehearsal');await page.click('#save-template');await until(async()=>(await state(page)).presets.some(p=>p.name==='Two-day rehearsal'),'Agenda did not save');
  const saved=(await state(page)).presets.find(p=>p.name==='Two-day rehearsal');assert.equal(saved.schedule.days.length,2);assert.equal(saved.schedule.days[1].items.length,7);
  const roundtrip=await page.evaluate(async()=>{const {store}=await import('./src/store.js'),{exportPayload,loadPayload}=await import('./src/media.js'),{sanitizeState}=await import('./src/model.js');return loadPayload(await exportPayload(store.get()),sanitizeState)});
  assert.deepEqual(roundtrip.presets[0].schedule,saved.schedule);
  await page.click('[data-tab="loops"]');await page.click('#new-loop');await page.selectOption('#loop-add-select',saved.id);await page.click('#loop-add-item');await page.click('#loop-save');const loop=(await state(page)).loops.at(-1);assert.deepEqual(loop.items[0].preset.schedule,saved.schedule);
 });
 await check('Title editing is compact and the console fits laptop, tablet and phone',async()=>{
  await page.click('[data-tab="templates"]');await page.click('[data-pick="presentation-editorial-opening"]');assert.equal(await page.locator('[data-field="motion"]').isVisible(),false);assert.equal(await page.locator('[data-field="end-preset"]').count(),0);
  for(const width of [1440,900,390]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);const size=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(size.sw<=size.w+1,JSON.stringify(size));await page.screenshot({path:'_qa/simplified-console-'+width+'.png',fullPage:true})}
 });
 assert.deepEqual(errors,[]);
}catch(error){console.error(error.stack);process.exitCode=1;await page.screenshot({path:'_qa/agenda-browser-failure.png',fullPage:true}).catch(()=>{});results.push({error:error.stack})}
finally{await fs.writeFile('_qa/agenda-browser-results.json',JSON.stringify({base,results,errors},null,2));await browser.close()}
