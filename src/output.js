import {joinRemoteSession} from './remote.js';
import {sessionFromURL} from './session-context.js';
import {setRemoteMediaProvider,ensureBlob} from './media.js';
import {setClockOffset} from './clock.js';
import {effectiveProgram} from './model.js';
import {store} from './store.js';
import {StageRenderer} from './renderer.js';
const id=new URLSearchParams(location.search).get('display'),host=document.querySelector('#stage'),renderer=new StageRenderer(host);
const remoteCredentials=sessionFromURL(),remoteIntent=new URLSearchParams(location.hash.slice(1)).has('room');
let output,idleTimer,wakeLock,fullError='',remoteClient=null,syncError='',syncRequest=0;
const fitKey='ucl-display-fit-'+(remoteCredentials?.id||'local')+'-'+id;
let localFit=remoteCredentials?sessionStorage.getItem(fitKey):null;
async function sync(state){
 if(remoteIntent&&!remoteCredentials)return;
 const request=++syncRequest;
 const nextOutput=state.outputs.find(o=>o.id===id),feed=state.feeds.find(f=>f.id===nextOutput?.feedId);
 if(!nextOutput||!feed){renderer.feed=null;renderer.stage.style.visibility='hidden';document.querySelector('#output-name').textContent='Display removed';return}
 output=nextOutput;document.title=output.name+' · UCL';document.querySelector('#output-name').textContent=output.name+' · '+feed.name;
 if(remoteCredentials){
  const program=effectiveProgram(feed),presets=program.kind==='loop'?program.items.map(item=>item.preset):[program.preset];
  if(feed.timer&&feed.endPreset)presets.push(feed.endPreset);
  const ids=[...new Set(presets.filter(p=>p?.layout==='media'&&p.assetId?.startsWith('upload-')).map(p=>p.assetId))];
  try{for(const assetId of ids){const blob=await ensureBlob(assetId);if(!blob)throw new Error('Waiting for shared media.')}}
  catch(error){syncError=error.message;document.querySelector('#output-hint').textContent='Waiting for shared media. The last screen stays on stage.';return}
 }
 if(request!==syncRequest)return;syncError='';
 const fit=localFit||output.fit;document.querySelector('#output-fit').value=fit;renderer.setOutput(fit,output.safe);renderer.setFeed(feed,state);
}

async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else{let screen;if(output?.screenIndex!==null&&'getScreenDetails'in window){try{const permission=await navigator.permissions.query({name:'window-management'});if(permission.state==='granted')screen=(await window.getScreenDetails()).screens[output.screenIndex]}catch{}}await document.documentElement.requestFullscreen({navigationUI:'hide',...(screen?{screen}:{})})}fullError='';}catch{fullError='Full screen was blocked. Try Open as tab, then press F there.';document.querySelector('#tab-fallback').href=location.href;document.querySelector('#tab-fallback').hidden=false;document.querySelector('#output-hint').textContent=fullError;showControls(8000)}}
function showControls(delay=4500){document.body.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(!document.querySelector('#output-controls').contains(document.activeElement))document.body.classList.add('idle')},delay)}
function hide(){document.activeElement?.blur();document.body.classList.add('idle');clearTimeout(idleTimer)}
document.querySelector('#fullscreen').addEventListener('click',async()=>{await fullscreen();document.querySelector('#fullscreen').blur();showControls(1800)});
document.querySelector('#hide-controls').addEventListener('click',hide);
document.querySelector('#output-fit').addEventListener('change',async e=>{if(remoteCredentials){localFit=e.target.value;sessionStorage.setItem(fitKey,localFit);renderer.setOutput(localFit,output?.safe||0)}else await store.update(s=>{const o=s.outputs.find(o=>o.id===id);if(o)o.fit=e.target.value});e.target.blur();showControls()});
window.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.code==='KeyF'){e.preventDefault();fullscreen().then(()=>showControls(1800))}if(e.code==='KeyH'){e.preventDefault();document.body.classList.contains('idle')?showControls():hide()}});
window.addEventListener('mousemove',()=>showControls());window.addEventListener('pointerdown',()=>showControls());
document.addEventListener('fullscreenchange',()=>{document.querySelector('#fullscreen').textContent=document.fullscreenElement?'Exit full screen [F]':'Full screen [F]';if(document.fullscreenElement)showControls(1500)});
async function requestWake(){if('wakeLock'in navigator&&document.visibilityState==='visible'){try{wakeLock=await navigator.wakeLock.request('screen')}catch{}}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestWake()});
store.subscribe(sync);if(!remoteIntent||remoteCredentials&&store.hasSnapshot)sync(store.get());else document.querySelector('#output-name').textContent='Connecting to live session…';showControls(8000);requestWake();
setInterval(()=>{const mediaError=syncError||[...host.querySelectorAll('video')].find(v=>v.error)?.error?.message;const details={type:'heartbeat',outputId:id,width:innerWidth,height:innerHeight,fullscreen:Boolean(document.fullscreenElement),mediaError:mediaError||null};store.send(details);remoteClient?.heartbeat(details).catch(()=>{})},2000);
if(remoteCredentials){
 const status=info=>{const disconnected=['reconnecting','ended','error'].includes(info.status);document.querySelector('#output-hint').textContent=disconnected?(info.message||'Connection lost. Keeping the last screen.'):'Connected to live session · F for full screen · H to hide controls';};
 const connect=()=>joinRemoteSession(remoteCredentials,{onState:state=>{if(remoteClient)store.applyRemote(state)},onStatus:status,onClock:setClockOffset}).then(client=>{remoteClient=client;setRemoteMediaProvider(id=>client.download(id));store.connectSession(remoteCredentials.id,client.snapshot,client,'view');document.querySelector('#output-hint').textContent='Connected to live session · F for full screen · H to hide controls';showControls(7000)}).catch(error=>{document.querySelector('#output-name').textContent='Live session could not connect';document.querySelector('#output-hint').textContent=error.message;if(![401,403,404,410].includes(error.status)&&error.code!=='INVALID_LINK')setTimeout(connect,4000)});connect();
 setInterval(()=>{if(syncError&&remoteClient)sync(store.get())},5000);
}

if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});

if(remoteIntent&&!remoteCredentials){document.querySelector('#output-name').textContent='Incomplete live session link';document.querySelector('#output-hint').textContent='Copy a fresh display link from the production console.'}
