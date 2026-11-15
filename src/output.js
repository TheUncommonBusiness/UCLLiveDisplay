import {store} from './store.js';
import {StageRenderer} from './renderer.js';
const id=new URLSearchParams(location.search).get('display'),host=document.querySelector('#stage'),renderer=new StageRenderer(host);
let output,idleTimer,wakeLock,fullError='';
function sync(state){output=state.outputs.find(o=>o.id===id);const feed=state.feeds.find(f=>f.id===output?.feedId);if(!output||!feed){renderer.feed=null;renderer.stage.style.visibility='hidden';document.querySelector('#output-name').textContent='Display removed';return}document.title=output.name+' · UCL';document.querySelector('#output-name').textContent=output.name+' · '+feed.name;document.querySelector('#output-fit').value=output.fit;renderer.setOutput(output.fit,output.safe);renderer.setFeed(feed,state)}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else{let screen;if(output?.screenIndex!==null&&'getScreenDetails'in window){try{const permission=await navigator.permissions.query({name:'window-management'});if(permission.state==='granted')screen=(await window.getScreenDetails()).screens[output.screenIndex]}catch{}}await document.documentElement.requestFullscreen({navigationUI:'hide',...(screen?{screen}:{})})}fullError='';}catch{fullError='Full screen was blocked. Try Open as tab, then press F there.';document.querySelector('#tab-fallback').href=location.href;document.querySelector('#tab-fallback').hidden=false;document.querySelector('#output-hint').textContent=fullError;showControls(8000)}}
function showControls(delay=4500){document.body.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(!document.querySelector('#output-controls').contains(document.activeElement))document.body.classList.add('idle')},delay)}
function hide(){document.activeElement?.blur();document.body.classList.add('idle');clearTimeout(idleTimer)}
document.querySelector('#fullscreen').addEventListener('click',async()=>{await fullscreen();document.querySelector('#fullscreen').blur();showControls(1800)});
document.querySelector('#hide-controls').addEventListener('click',hide);
document.querySelector('#output-fit').addEventListener('change',async e=>{await store.update(s=>{const o=s.outputs.find(o=>o.id===id);if(o)o.fit=e.target.value});e.target.blur();showControls()});
window.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.code==='KeyF'){e.preventDefault();fullscreen().then(()=>showControls(1800))}if(e.code==='KeyH'){e.preventDefault();document.body.classList.contains('idle')?showControls():hide()}});
window.addEventListener('mousemove',()=>showControls());window.addEventListener('pointerdown',()=>showControls());
document.addEventListener('fullscreenchange',()=>{document.querySelector('#fullscreen').textContent=document.fullscreenElement?'Exit full screen [F]':'Full screen [F]';if(document.fullscreenElement)showControls(1500)});
async function requestWake(){if('wakeLock'in navigator&&document.visibilityState==='visible'){try{wakeLock=await navigator.wakeLock.request('screen')}catch{}}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestWake()});
store.subscribe(sync);sync(store.get());showControls(8000);requestWake();
setInterval(()=>{const mediaError=[...host.querySelectorAll('video')].find(v=>v.error)?.error?.message;store.send({type:'heartbeat',outputId:id,width:innerWidth,height:innerHeight,fullscreen:Boolean(document.fullscreenElement),mediaError:mediaError||null})},2000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
