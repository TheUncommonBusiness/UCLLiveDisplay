const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8787/_qa/render.html');
await page.evaluate(async()=>{window.model=await import('/src/model.js');window.renderer=await import('/src/renderer.js')});
for(const id of ['logo','range','intermission','pattern','starting-soon','break','session','agenda','starting']){
 await page.evaluate(id=>{const p=model.TEMPLATES.find(p=>p.id===id);document.querySelector('#preview').replaceChildren(renderer.buildScene(p,model.defaultState()).root)},id);
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
 await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=4000}));
 await page.screenshot({path:'assets/media/'+id+'.jpg',type:'jpeg',quality:90});
}
await page.goto('http://127.0.0.1:8787/');await page.waitForTimeout(1500);await page.setViewportSize({width:1512,height:1100});await page.screenshot({path:'_qa/console.png',fullPage:true});
await browser.close();console.log('Rendered nine template posters and console preview');
