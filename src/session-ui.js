import {store} from './store.js';
import {createRemoteSession,joinRemoteSession} from './remote.js';
import {sessionFromURL,sessionURL} from './session-context.js';
import {readBlob,setRemoteMediaProvider} from './media.js';
import {setClockOffset} from './clock.js';

let client=null,status={status:'local'},presence=[],busy=false,callbacks={},joining=0;
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const remoteSession=()=>client;
export function displayURL(displayId){
 if(client){const c=client.credentials;return sessionURL({id:c.id,token:c.viewToken||c.token,role:'view',displayId})}
 return 'output.html?display='+encodeURIComponent(displayId);
}
function statusText(){
 const label={local:'This computer only',connecting:'Connecting…',connected:'Live session connected',syncing:'Sending changes…',reconnecting:'Reconnecting · displays keep their last screen',ended:'Session ended · last screen held',error:'Connection needs attention'};
 return status.message||label[status.status]||status.status||'Live session';
}
function draw(){
 const button=$('#session-button');if(!button)return;
 button.textContent=client?'Live session · '+(status.status==='connected'?'Connected':status.status==='syncing'?'Sending':'Check connection'):'Live session';
 button.dataset.status=status.status;
 $('#session-status').textContent=statusText();
 $('#session-status').dataset.status=status.status;
 $('#session-local').hidden=Boolean(client);
 $('#session-return-local').hidden=Boolean(client)||!store.sessionId;
 $('#session-connected').hidden=!client;
 $('#session-start').disabled=busy;
 $('#session-join').disabled=busy;
 $('#session-leave').disabled=busy;
 $('#session-end').disabled=busy;
 if(client){
  const c=client.credentials;
  $('#session-room-id').textContent=c.id;
  $('#session-copy-control').hidden=!['control','controller'].includes(c.role);
  $('#session-end').hidden=!['control','controller'].includes(c.role);
  $('#session-display-links').innerHTML=store.get().outputs.map(o=>'<div class="session-link-row"><span><strong>'+esc(o.name)+'</strong><small>'+esc(store.get().feeds.find(f=>f.id===o.feedId)?.name||'')+'</small></span><button data-session-copy="'+esc(o.id)+'">Copy display link</button><a href="'+esc(displayURL(o.id))+'" target="_blank" rel="noopener">Open ↗</a></div>').join('');
  const displays=presence.filter(entry=>(entry.outputId||entry.details?.outputId)&&!['control','controller'].includes(entry.role));
  $('#session-presence').innerHTML=displays.length?displays.map(entry=>{const data=entry.details||entry;const output=store.get().outputs.find(o=>o.id===data.outputId);return '<div class="session-device"><span class="status-dot"></span><span>'+esc(output?.name||data.outputId)+'<small>'+esc((data.width||'?')+' × '+(data.height||'?')+(data.fullscreen?' · Full screen':' · Windowed')+(data.mediaError?' · '+data.mediaError:''))+'</small></span></div>'}).join(''):'<p class="fine-print">Open a display link on a stage laptop. Connected screens appear here.</p>';
 }
 const awaiting=Boolean(store.sessionId&&!client);
 for(const id of ['#launch','#open-selected','#displays-button','#hold-logo','#blackout'])if($(id))$(id).disabled=awaiting||busy;
 callbacks.onStatus?.(status);
}
const options=()=>({
 readBlob,
 onState:(state,meta)=>{if(client&&store.sessionId===client.credentials.id){store.applyRemote(state);callbacks.onState?.(state,meta)}},
 onStatus:info=>{status=typeof info==='string'?{status:info}:info;draw()},
 onPresence:list=>{presence=list||[];draw();callbacks.onPresence?.(presence)},
 onClock:setClockOffset
});
async function attach(next){
 client?.close();client=next;
 setRemoteMediaProvider(id=>client.download(id));
 store.connectSession(next.credentials.id,next.snapshot,next,'control');
 history.replaceState(null,'',sessionURL({id:next.credentials.id,token:next.credentials.controlToken||next.credentials.token,role:'control'}));
 status={status:'connected'};busy=false;draw();callbacks.onSessionChange?.();
}
async function perform(task){
 if(busy)return;busy=true;draw();
 try{await task()}catch(error){status={status:'error',message:error.message};callbacks.onError?.(error);throw error}
 finally{busy=false;draw()}
}
export async function copySessionText(value){
 try{await navigator.clipboard.writeText(value)}catch{const field=document.createElement('textarea');field.value=value;field.style.cssText='position:fixed;opacity:0';document.body.append(field);field.select();if(!document.execCommand('copy')){field.remove();throw new Error('Copy was blocked by this browser.')}field.remove()}
 callbacks.onNotice?.('Link copied.');
}
function handle(task){return ()=>perform(task).catch(()=>{})}
async function leave(){
 joining++;client?.close();client=null;presence=[];setRemoteMediaProvider(null);setClockOffset(0);
 history.replaceState(null,'',new URL('index.html',location.href));store.disconnectSession();status={status:'local'};draw();callbacks.onSessionChange?.();
}
export async function initializeSessionUI(handlers={}){
 callbacks=handlers;
 $('#session-button').addEventListener('click',()=>{draw();$('#session-dialog').showModal()});
 $('#session-start').addEventListener('click',handle(async()=>{status={status:'connecting',message:'Creating session and preparing shared media…'};draw();await attach(await createRemoteSession(store.get(),options()));callbacks.onNotice?.('Live session ready. Copy a display link to each stage laptop.')}));
 $('#session-join').addEventListener('click',handle(async()=>{let credentials;try{credentials=sessionFromURL($('#session-join-link').value.trim())}catch{}if(!credentials||credentials.role!=='control')throw new Error('Paste a control link here. Display links open directly on stage laptops.');status={status:'connecting'};draw();await attach(await joinRemoteSession(credentials,options()))}));
 $('#session-copy-control').addEventListener('click',()=>{if(client)copySessionText(sessionURL({id:client.credentials.id,token:client.credentials.controlToken||client.credentials.token,role:'control'})).catch(error=>callbacks.onError?.(error))});
 $('#session-display-links').addEventListener('click',event=>{const id=event.target.dataset.sessionCopy;if(id)copySessionText(displayURL(id)).catch(error=>callbacks.onError?.(error))});
 $('#session-leave').addEventListener('click',handle(leave));
 $('#session-return-local').addEventListener('click',handle(leave));
 $('#session-end').addEventListener('click',handle(async()=>{if(!confirm('End this live session and revoke its control and display links? Stage laptops will keep their last screen.'))return;await client.end();await leave();callbacks.onNotice?.('Session ended. Its links no longer connect.')}));
 store.subscribe(()=>{if($('#session-dialog').open)draw()});
 const credentials=sessionFromURL();if(credentials)$('#session-join-link').value=location.href;draw();
 if(credentials){
  const request=++joining;busy=true;status={status:'connecting'};draw();
  try{if(credentials.role!=='control')throw new Error('Open the control link here. Use the display link on an output page.');const next=await joinRemoteSession(credentials,options());if(request!==joining){next.close();return}await attach(next)}
  catch(error){status={status:'error',message:error.message};callbacks.onError?.(error);$('#session-dialog').showModal()}
  finally{busy=false;draw()}
 }
 return client;
}
