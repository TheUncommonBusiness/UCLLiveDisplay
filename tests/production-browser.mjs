import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from '/Users/carterjensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=(process.env.UCL_BASE_URL||'http://127.0.0.1:8787/').replace(/\/?$/,'/');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),errors=[],results=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await page.waitForSelector('#draft-stage .scene');
 const films=await page.evaluate(async()=> (await import('./assets/production/catalog.js')).PRODUCTION_MEDIA);
 assert.equal(films.length,12);
 for(const film of films){
  await page.click('[data-tab="templates"]');await page.click('[data-category="'+film.category+'"]');
  const id=film.id==='cowgirl-film'?'cowgirl-moment':film.id==='stars-film'?'film':film.id;
  await page.click('[data-pick="'+id+'"]');
  await page.waitForFunction(url=>{const v=document.querySelector('#draft-stage video');return v?.src.endsWith(url)&&v.readyState>=2},film.url);
  const info=await page.locator('#draft-stage video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,loop:v.loop,muted:v.muted}));
  assert.equal(info.width,3840);assert.equal(info.height,2160);assert.equal(info.duration,film.duration);assert.ok(info.loop&&info.muted);
  results.push({id:film.id,...info});
 }
 await page.screenshot({path:'_qa/production-app-library.png',fullPage:true});
 await page.click('[data-category="holds"]');await page.click('[data-pick="cowgirl-moment"]');
 await page.click('#displays-button');const opened=page.waitForEvent('popup');await page.click('[data-open="main-display"]');const stage=await opened;
 await page.click('#display-dialog [data-close]');
 const before=await page.evaluate(async()=>JSON.stringify((await import('./src/store.js')).store.get().feeds[1]));
 await page.click('#launch');
 await stage.waitForFunction(()=>document.querySelector('video')?.src.includes('01-cowgirl-hat-tip-4k.mp4')&&document.querySelector('video').readyState>=2);
 assert.equal(await page.evaluate(async()=>JSON.stringify((await import('./src/store.js')).store.get().feeds[1])),before);
 await page.screenshot({path:'_qa/production-holds-library.png',fullPage:true});
 await page.click('[data-tab="loops"]');await page.click('#new-loop');
 const options=await page.locator('#loop-add-select option').evaluateAll(ns=>ns.map(n=>n.value));
 for(const f of films)assert.ok(options.includes(f.id==='cowgirl-film'?'cowgirl-moment':f.id==='stars-film'?'film':f.id));
 await page.click('#loop-dialog [data-close]');
 const roundtrip=await page.evaluate(async()=>{
  const m=await import('./src/model.js'),{PRODUCTION_MEDIA}=await import('./assets/production/catalog.js');
  const s=m.defaultState(0);s.presets=PRODUCTION_MEDIA.map(f=>m.TEMPLATES.find(t=>t.assetId===f.id));s.loops=[{id:'final-films',name:'Final films',timerSeconds:0,items:s.presets.map(p=>m.itemFromPreset(p))}];
  const clean=m.sanitizeState(JSON.parse(JSON.stringify(s)),0);return clean.loops[0].items.map(i=>i.preset.assetId);
 });
 assert.deepEqual(roundtrip,films.map(f=>f.id));
 const hashes=await page.evaluate(async films=>Promise.all(films.map(async f=>{
  const response=await fetch(f.url);if(!response.ok)throw new Error('Missing film: '+f.id);
  const hash=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
  return {id:f.id,sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')};
 })),films);
 for(let i=0;i<films.length;i++)assert.equal(hashes[i].sha256,crypto.createHash('sha256').update(await fs.readFile(films[i].url)).digest('hex'));
 assert.deepEqual(errors,[]);
 await fs.writeFile('_qa/production-browser-results.json',JSON.stringify({base,films:results,hashes,independentLaunch:true,loopRoundtrip:true,errors},null,2));
 console.log('PASS 12 final 4K films, separate stage launch, all loop options, and saved-show roundtrip at '+base);
}finally{await browser.close()}
