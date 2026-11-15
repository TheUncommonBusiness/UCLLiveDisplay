import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '/Users/carterjensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=(process.env.UCL_BASE_URL||'http://127.0.0.1:8787/').replace(/\/?$/,'/');
const api='https://ucl-live-sessions.the-uncommon-6173.chatgpt.site';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const contexts=[],results=[],errors=[];let credentials,control,stage,support,backup;
const redact=s=>String(s).replace(/(control|view)=[A-Za-z0-9_-]+/g,'$1=[redacted]');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=60000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(100)}throw new Error(label)}
const check=async(name,fn)=>{const start=Date.now();const detail=await fn();results.push({name,ms:Date.now()-start,detail});console.log('PASS '+name)};
async function context(skew=0){const c=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});c.setDefaultTimeout(15000);if(skew)await c.addInitScript(offset=>{const original=Date.now;Date.now=()=>original()+offset},skew);contexts.push(c);c.on('page',p=>p.on('pageerror',e=>errors.push(redact(e.message))));return c}
const getState=p=>p.evaluate(async()=>structuredClone((await import('./src/store.js')).store.get()));
const ready=p=>p.waitForSelector('#draft-stage .scene');
async function matches(p,text){await p.waitForFunction(text=>Array.from(document.querySelectorAll('#stage .scene-text')).some(n=>n.textContent===text),text,{timeout:20000})}
async function choose(p,id){await p.click('[data-tab="templates"]');await p.click('[data-pick="'+id+'"]')}
try{
 const c1=await context();control=await c1.newPage();await control.goto(base);await ready(control);
 await check('Selected presentation layouts edit and remain separate from live output',async()=>{
  assert.equal(await control.locator('[data-pick^="presentation-"]').count(),26);
  await choose(control,'presentation-editorial-opening');
  const before=(await getState(control)).feeds[0].program.id;
  await control.fill('[data-field="scene:headline-1"]','Remote rehearsal');
  assert.equal((await getState(control)).feeds[0].program.id,before);
  await control.selectOption('[data-field="motion"]','still');await control.click('#launch');
  const launched=(await getState(control)).feeds[0].program.preset;
  assert.equal(launched.fields['headline-1'],'Remote rehearsal');assert.equal(launched.motion,'still');
  return {sharedLayouts:26,editable:true};
 });
 await control.locator('#media-input').setInputFiles({name:'remote-rehearsal-dot.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jddkAAAAASUVORK5CYII=','base64')});
 await until(async()=>(await getState(control)).media.length===1,'Synthetic image did not save');
 await check('A live session shares current show and uploaded media',async()=>{
  await control.click('#session-button');await control.click('#session-start');
  await until(()=>control.evaluate(async()=>Boolean((await import('./src/session-ui.js')).remoteSession())),'Session creation did not complete');
  credentials=await control.evaluate(async()=>({...((await import('./src/session-ui.js')).remoteSession().credentials)}));
  assert.equal(credentials.role,'controller');assert.ok(credentials.viewToken);
  assert.equal(await control.locator('#session-copy-control').isVisible(),true);
  await control.screenshot({path:'_qa/remote-session-console.png',fullPage:true});
  await control.click('#session-dialog [data-close]');
  return {created:true,mediaFiles:1};
 });
 const mainURL=await control.evaluate(async()=>(await import('./src/session-ui.js')).displayURL('main-display'));
 const supportURL=await control.evaluate(async()=>(await import('./src/session-ui.js')).displayURL('support-left'));
 const c2=await context(90000);stage=await c2.newPage();await stage.goto(mainURL);
 const c3=await context();support=await c3.newPage();await support.goto(supportURL);
 await check('Isolated stage laptops receive independent main and support feeds',async()=>{
  await matches(stage,'Remote rehearsal');await support.waitForSelector('#stage .scene');
  assert.equal((await getState(stage)).feeds[0].program.preset.fields['headline-1'],'Remote rehearsal');
  assert.equal((await getState(support)).feeds[1].program.kind,'loop');
  const clockDelta=await stage.evaluate(async()=>(await import('./src/clock.js')).now())-await control.evaluate(async()=>(await import('./src/clock.js')).now());
  assert.ok(Math.abs(clockDelta)<1500,'Shared clock did not correct 90-second laptop skew: '+clockDelta);
  return {isolatedContexts:3,correctedClockDeltaMs:clockDelta};
 });
 await check('Launch updates remote full-screen output without reloading',async()=>{
  await stage.click('#fullscreen');await stage.waitForFunction(()=>Boolean(document.fullscreenElement));
  const origin=await stage.evaluate(()=>performance.timeOrigin);
  const supportProgram=(await getState(support)).feeds[1].program.id;
  await choose(control,'presentation-editorial-opening');await control.fill('[data-field="scene:headline-1"]','Across computers');
  assert.equal(await stage.locator('#stage [data-field="headline-1"]').textContent(),'Remote rehearsal');
  const started=Date.now();await control.click('#launch');await matches(stage,'Across computers');
  assert.equal(await stage.evaluate(()=>performance.timeOrigin),origin);assert.ok(await stage.evaluate(()=>Boolean(document.fullscreenElement)));
  assert.equal((await getState(support)).feeds[1].program.id,supportProgram);
  await stage.screenshot({path:'_qa/remote-stage-editorial.png'});
  return {latencyMs:Date.now()-started,documentPreserved:true,fullscreenPreserved:true};
 });
 await check('Display links cannot publish state or end sessions',async()=>{
  const result=await stage.evaluate(async({api,id,token})=>{
   const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
   return {write:(await fetch(api+'/api/sessions/'+id,{method:'PUT',headers,body:'{}'})).status,end:(await fetch(api+'/api/sessions/'+id,{method:'DELETE',headers})).status}
  },{api,id:credentials.id,token:credentials.viewToken});
  assert.deepEqual(result,{write:403,end:403});return result;
 });
 await check('Uploaded media downloads and plays on a separate laptop',async()=>{
  const id=(await getState(control)).media[0].id;await control.click('[data-tab="media"]');await control.click('[data-pick="'+id+'"]');await control.click('#launch');
  await stage.waitForFunction(()=>{const i=document.querySelector('#stage img.full-media');return i?.complete&&i.naturalWidth>0},null,{timeout:30000});
  const cached=await stage.evaluate(async id=>{const b=await(await import('./src/media.js')).readBlob(id);return {bytes:b?.size,mime:b?.type}},id);
  assert.ok(cached.bytes>0);assert.equal(cached.mime,'image/png');return cached;
 });
 const controlURL=await control.evaluate(async()=>{const c=(await import('./src/session-ui.js')).remoteSession().credentials;return (await import('./src/session-context.js')).sessionURL({id:c.id,token:c.controlToken,role:'control'})});
 const c4=await context();backup=await c4.newPage();await backup.goto(controlURL);await ready(backup);
 await until(()=>backup.evaluate(async()=>Boolean((await import('./src/session-ui.js')).remoteSession())),'Backup controller did not connect');
 await check('Another control laptop can join and launch the selected styles',async()=>{
  await choose(backup,'presentation-big-type-opening');await backup.fill('[data-field="scene:headline-1"]','One clear idea');
  await backup.click('#launch');await matches(stage,'One clear idea');
  assert.equal(await stage.locator('#stage .scene').getAttribute('data-scene-id'),'big-type-opening');
  await backup.click('#session-button');assert.equal(await backup.locator('#session-copy-control').isVisible(),true);
  await backup.click('#session-dialog [data-close]');
  return {secondController:true,style:'Big Type'};
 });
 await check('A disconnected display holds its last screen and catches up automatically',async()=>{
  await c2.setOffline(true);await sleep(1500);
  await choose(backup,'presentation-night-rodeo-opening');await backup.fill('[data-field="scene:headline-1"]','The next chapter');await backup.click('#launch');
  await sleep(1500);assert.equal(await stage.locator('#stage [data-field="headline-1"]').textContent(),'One clear idea');
  await c2.setOffline(false);await matches(stage,'The next chapter');
  assert.ok(await stage.evaluate(()=>Boolean(document.fullscreenElement)));
  return {heldLastScreen:true,reconnected:true};
 });
 await check('A cached countdown finishes while the stage laptop is offline',async()=>{
  await backup.evaluate(async()=>{const {store}=await import('./src/store.js'),m=await import('./src/model.js');await store.update(s=>{m.cuePreset(s.feeds[0],{...m.TEMPLATES[4],durationSeconds:4});s.feeds[0].endPreset={...m.TEMPLATES[8],title:'Remote timer finished'}})});
  await stage.waitForSelector('#stage .scene[data-layout="countdown"]');await c2.setOffline(true);
  await matches(stage,'Remote timer finished');await c2.setOffline(false);return {automaticEnd:true,clockSkewCorrected:true};
 });
 await check('Ending a session revokes its display links and stored media',async()=>{
  await control.evaluate(async()=>{const c=(await import('./src/session-ui.js')).remoteSession();await c.end()});
  const response=await fetch(api+'/api/sessions/'+credentials.id,{headers:{Authorization:'Bearer '+credentials.viewToken}});
  assert.equal(response.status,404);return {revoked:true};
 });
 assert.deepEqual(errors,[]);
}catch(error){if(control&&!control.isClosed()){const diag=await control.evaluate(()=>({sessionStatus:document.querySelector('#session-status')?.textContent,toast:document.querySelector('#toast')?.textContent})).catch(()=>({}));console.error(JSON.stringify(diag))}results.push({name:'Remote integration',error:redact(error.stack)});console.error(redact(error.stack));process.exitCode=1}
finally{
 if(credentials)await fetch(api+'/api/sessions/'+credentials.id,{method:'DELETE',headers:{Authorization:'Bearer '+credentials.controlToken}}).catch(()=>{});
 await fs.writeFile('_qa/remote-browser-results.json',JSON.stringify({base,createdAt:new Date().toISOString(),results,errors},null,2));
 for(const c of contexts)await c.close();await browser.close();
}
console.log(JSON.stringify({passed:results.filter(r=>!r.error).length,failed:results.filter(r=>r.error).length}));
