import {defaultState,sanitizeState} from './model.js';
const KEY='ucl-live-display-show-v1';
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('ucl-live-display-v1'):null;
let state,storageError=null;
try{const saved=localStorage.getItem(KEY);state=saved?sanitizeState(JSON.parse(saved)):defaultState()}catch(error){state=defaultState();storageError=error}
const listeners=new Set(),messages=new Set();
function accept(value){try{const next=sanitizeState(value);if(next.revision>=state.revision){state=next;listeners.forEach(fn=>fn(state))}}catch(error){console.warn('Ignored an invalid display state',error.message)}}
channel?.addEventListener('message',event=>{const m=event.data;if(m?.type==='state')accept(m.state);else messages.forEach(fn=>fn(m))});
window.addEventListener('storage',event=>{if(event.key===KEY&&event.newValue){try{accept(JSON.parse(event.newValue))}catch{}}});
export const store={
 get:()=>state,
 get error(){return storageError},
 subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
 onMessage(fn){messages.add(fn);return()=>messages.delete(fn)},
 send(message){channel?.postMessage(message)},
 async update(mutate){
  const write=()=>{
   let latest=state;try{const raw=localStorage.getItem(KEY);if(raw){const disk=sanitizeState(JSON.parse(raw));if(disk.revision>=latest.revision)latest=disk}}catch{}
   const next=structuredClone(latest);mutate(next);next.revision=Math.max(Date.now(),latest.revision+1);
   const normalized=sanitizeState(next);
   try{localStorage.setItem(KEY,JSON.stringify(normalized));storageError=null}catch(error){storageError=error;throw new Error('This browser could not save the show. Export a backup and check its storage settings.')}
   state=normalized;channel?.postMessage({type:'state',state});listeners.forEach(fn=>fn(state));return state;
  };
  return navigator.locks?.request?navigator.locks.request('ucl-live-display-write',write):write();
 },
 async replace(next){return this.update(s=>Object.assign(s,sanitizeState(next)))}
};
