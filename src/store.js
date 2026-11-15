import {defaultState,sanitizeState} from './model.js';
import {sessionFromURL} from './session-context.js';

const initialSession=sessionFromURL();
let sessionId=initialSession?.id||null,role=initialSession?.role||'local',transport=null;
let state,storageError=null,channel=null,hasSnapshot=false;
const listeners=new Set(),messages=new Set();
const key=()=>sessionId?'ucl-live-display-session-'+sessionId:'ucl-live-display-show-v1';
const channelName=()=>sessionId?'ucl-live-display-session-'+sessionId:'ucl-live-display-v1';
function load(){
 try{const saved=localStorage.getItem(key());hasSnapshot=Boolean(saved);state=saved?sanitizeState(JSON.parse(saved)):defaultState();storageError=null}
 catch(error){state=defaultState();storageError=error;hasSnapshot=false}
}
function accept(value){
 try{const next=sanitizeState(value);if(next.revision>=state.revision){state=next;hasSnapshot=true;listeners.forEach(fn=>fn(state))}}
 catch(error){console.warn('Ignored an invalid display state',error.message)}
}
function bindChannel(){
 channel?.close();channel=typeof BroadcastChannel==='function'?new BroadcastChannel(channelName()):null;
 channel?.addEventListener('message',event=>{const m=event.data;if(m?.type==='state')accept(m.state);else messages.forEach(fn=>fn(m))});
}
function persist(value,{force=false}={}){
 const next=sanitizeState(value);
 if(force)next.revision=Math.max(Date.now(),state?.revision+1||0,next.revision);
 try{localStorage.setItem(key(),JSON.stringify(next));storageError=null}
 catch(error){storageError=error;throw new Error('This browser could not save the show. Export a backup and check its storage settings.')}
 state=next;hasSnapshot=true;channel?.postMessage({type:'state',state});listeners.forEach(fn=>fn(state));return state;
}
load();bindChannel();
window.addEventListener('storage',event=>{if(event.key===key()&&event.newValue){try{accept(JSON.parse(event.newValue))}catch{}}});
export const store={
 get:()=>state,
 get error(){return storageError},
 get sessionId(){return sessionId},
 get role(){return role},
 get hasSnapshot(){return hasSnapshot},
 subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
 onMessage(fn){messages.add(fn);return()=>messages.delete(fn)},
 send(message){channel?.postMessage(message)},
 connectSession(id,snapshot,nextTransport,sessionRole='control'){
  sessionId=id;role=sessionRole;transport=nextTransport;load();bindChannel();
  return persist(snapshot,{force:true});
 },
 disconnectSession(){
  sessionId=null;role='local';transport=null;load();bindChannel();listeners.forEach(fn=>fn(state));return state;
 },
 applyRemote(snapshot){if(!sessionId)return state;return persist(snapshot,{force:true})},
 async update(mutate){
  const write=async()=>{
   if(sessionId&&role==='view')throw new Error('This display link can only receive screens. Open the control link to make changes.');
   if(sessionId&&!transport)throw new Error('Wait for the live session to connect before launching.');
   let latest=state;try{const raw=localStorage.getItem(key());if(raw){const disk=sanitizeState(JSON.parse(raw));if(disk.revision>=latest.revision)latest=disk}}catch{}
   const next=structuredClone(latest);mutate(next);next.revision=Math.max(Date.now(),latest.revision+1);
   const normalized=sanitizeState(next);
   const committed=transport?await transport.commit(normalized):normalized;
   return persist(committed?.state||committed||normalized,{force:Boolean(transport)});
  };
  return navigator.locks?.request?navigator.locks.request(channelName()+'-write',write):write();
 },
 async replace(next){return this.update(s=>Object.assign(s,sanitizeState(next)))}
};
