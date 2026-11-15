import {BUILTIN_MEDIA,uid} from './model.js';
let dbPromise;const urls=new Map();
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('ucl-live-display-media',1);r.onupgradeneeded=()=>r.result.createObjectStore('media',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbPromise}
export async function readBlob(id){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('media').objectStore('media').get(id);r.onsuccess=()=>resolve(r.result?.blob);r.onerror=()=>reject(r.error)})}
export async function writeBlobs(records){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('media','readwrite');records.forEach(r=>t.objectStore('media').put(r));t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('Media storage is full.'))})}
export async function mediaURL(id){if(BUILTIN_MEDIA[id])return BUILTIN_MEDIA[id].url;if(!/^upload-[a-zA-Z0-9-]+$/.test(id||''))throw new Error('Unknown media.');if(urls.has(id))return urls.get(id);const blob=await readBlob(id);if(!blob)throw new Error('This media is not on this computer. Import the complete show file.');const url=URL.createObjectURL(blob);urls.set(id,url);return url}
export function mediaInfo(id,state){return BUILTIN_MEDIA[id]||state.media.find(m=>m.id===id)}
export async function importFiles(files){
 const records=[],metadata=[];
 for(const f of files){if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(f.type))throw new Error('Use JPG, PNG, WebP, MP4, or WebM files.');if(f.size>250*1024*1024)throw new Error(f.name+' is larger than 250 MB.');
  const id=uid('upload');records.push({id,blob:f});metadata.push({id,name:f.name,type:f.type.startsWith('video/')?'video':'image',mime:f.type,size:f.size})}
 await writeBlobs(records);return metadata;
}
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
export async function exportPayload(state){
 const media=[];for(const m of state.media){const blob=await readBlob(m.id);if(!blob)throw new Error('Missing media: '+m.name+'. Reimport it before exporting.');media.push({id:m.id,mime:m.mime,data:await dataURL(blob)})}
 return {format:'ucl-live-display',version:1,createdAt:new Date().toISOString(),show:state,uploads:media};
}
export async function loadPayload(payload,normalize){
 if(payload?.format!=='ucl-live-display'||payload.version!==1||!Array.isArray(payload.uploads))throw new Error('Choose an exported UCL show file.');
 const state=normalize(payload.show),records=[];
 if(payload.uploads.length>100)throw new Error('Too many media files in this show.');
 const uploads=new Map(payload.uploads.map(m=>[m.id,m]));
 for(const meta of state.media){
  const u=uploads.get(meta.id);if(!u||typeof u.data!=='string'||!u.data.startsWith('data:'+meta.mime+';base64,')||u.data.length>350000000)throw new Error('Invalid or missing media: '+meta.name);
  const encoded=u.data.slice(u.data.indexOf(',')+1);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new Error('Invalid encoded media.');
  const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const blob=new Blob([bytes],{type:meta.mime});records.push({id:meta.id,blob});
 }
 await writeBlobs(records);for(const [id,url]of urls){URL.revokeObjectURL(url)}urls.clear();return state;
}
export function downloadJSON(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
