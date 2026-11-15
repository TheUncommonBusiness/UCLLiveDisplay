import {REMOTE_API_URL} from './remote-config.js';

export class RemoteError extends Error {
 constructor(message,{code='NETWORK',status=0,snapshot=null}={}){super(message);this.name='RemoteError';Object.assign(this,{code,status,snapshot})}
}
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export async function deriveViewToken(controlToken){return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ucl-display-v1:'+controlToken))))}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function shiftedClock(state,offset){const next=structuredClone(state);for(const feed of next.feeds||[]){for(const k of ['startedAt','pausedAt'])if(typeof feed.program?.[k]==='number')feed.program[k]+=offset;if(typeof feed.timer?.endAt==='number')feed.timer.endAt+=offset}return next}

export class RemoteClient {
 constructor(options={}){
  this.options=options;this.apiUrl=(options.apiUrl||REMOTE_API_URL).replace(/\/$/,'');this.fetch=options.fetchImpl||globalThis.fetch.bind(globalThis);
  this.credentials=null;this.snapshot=null;this.meta=null;this.revision=-1;this.clockOffset=0;this.clockSamples=[];this.closed=false;this.requests=new Set();this.listeners=new Set();this.knownAssets=new Set();this.failures=0;this.lastPresence=0;this.lastHeartbeat=0;this.heartbeatDetails={clientId:crypto.randomUUID()};this.pollMs=options.pollMs||1000;this.status=null;this.publishing=false;
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 _status(status,message,extra={}){const info={status,message,...extra};if(this.status?.status!==status||this.status?.message!==message||Object.keys(extra).length){this.status=info;this.options.onStatus?.(info)}}
 _clock(serverNow,started){if(!Number.isFinite(serverNow))return;const ended=Date.now(),sample={offset:serverNow-(started+ended)/2,rtt:ended-started};this.clockSamples.push(sample);if(this.clockSamples.length>20)this.clockSamples.shift();const fastest=[...this.clockSamples].sort((a,b)=>a.rtt-b.rtt).slice(0,5).map(s=>s.offset).sort((a,b)=>a-b);this.clockOffset=fastest[Math.floor(fastest.length/2)];this.options.onClock?.(this.clockOffset)}
 async _request(path,{method='GET',data,body,auth=true,timeout=15000,blob=false}={}){
  if(this.closed)throw new RemoteError('This live session is closed.',{code:'CLOSED'});const abort=new AbortController();this.requests.add(abort);const timer=setTimeout(()=>abort.abort(),timeout),started=Date.now();
  const headers={};if(auth&&this.credentials)headers.Authorization='Bearer '+this.credentials.token;if(data!==undefined)headers['Content-Type']='application/json';
  try{
   const response=await this.fetch(this.apiUrl+path,{method,headers,body:data!==undefined?JSON.stringify(data):body,cache:'no-store',credentials:'omit',signal:abort.signal});
   if(blob&&response.ok)return await response.blob();
   let value;try{value=await response.json()}catch{throw new RemoteError('The live service returned an unexpected response.',{status:response.status,code:'SERVICE_ERROR'})}
   this._clock(value.serverNow,started);
   if(!response.ok)throw new RemoteError(value.error?.message||'The live request failed.',{status:response.status,code:value.error?.code||'SERVICE_ERROR',snapshot:value.snapshot||null});
   return value;
  }catch(error){if(error instanceof RemoteError)throw error;throw new RemoteError(this.closed?'This live session is closed.':'Connection interrupted. Your last screen stays live.',{code:this.closed?'CLOSED':'NETWORK'})}finally{clearTimeout(timer);this.requests.delete(abort)}
 }
 _path(suffix=''){return '/api/sessions/'+this.credentials.id+suffix}
 _adopt(result,{emit=true}={}){
  if(!Number.isSafeInteger(result.revision)||result.revision<this.revision)return;
  const newer=result.revision>this.revision,hasState=Object.hasOwn(result,'state');this.revision=result.revision;
  this.meta={revision:result.revision,serverNow:result.serverNow,updatedAt:result.updatedAt,expiresAt:result.expiresAt,role:result.role,limits:result.limits};
  if(hasState)this.snapshot=result.state;
  if(newer&&hasState&&result.state&&emit){this.options.onState?.(result.state,this.meta);for(const fn of this.listeners)fn(result.state,this.meta)}
 }
 async _open(credentials){
  this.credentials={id:credentials.id,token:credentials.token||credentials.controlToken||credentials.viewToken,role:credentials.role||'display'};
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(this.credentials.id||'')||!/^[A-Za-z0-9_-]{43}$/.test(this.credentials.token||''))throw new RemoteError('Open a complete controller or display link.',{code:'INVALID_LINK'});
  this._status('connecting','Connecting to the live session…');
  const result=await this._request(this._path());this.credentials.role=result.role;
  if(result.role==='controller'){this.credentials.controlToken=this.credentials.token;this.credentials.viewToken=await deriveViewToken(this.credentials.token)}
  this._adopt(result);this._status('connected','Live session connected.');this._schedule();return this;
 }
 _schedule(delay=this.pollMs){clearTimeout(this.pollTimer);if(!this.closed&&!this.ending){this.pollTimer=setTimeout(()=>this._poll(),delay);this.pollTimer.unref?.()}}
 async _poll(){
  if(this.closed||this.ending)return;
  try{
   const result=await this._request(this._path('?since='+this.revision));if(this.closed||this.ending)return;this._adopt(result);this.failures=0;if(!this.publishing)this._status('connected','Live session connected.');
   if(Date.now()-this.lastHeartbeat>5000)await this.heartbeat(this.heartbeatDetails).catch(()=>{});
   if(Date.now()-this.lastPresence>5000){this.lastPresence=Date.now();await this.getPresence().catch(()=>{})}
   this._schedule();
  }catch(error){
   if(this.closed||this.ending)return;if([401,404,410].includes(error.status)){this._status(error.status===401?'error':'ended',error.message);this.close();return}
   this.failures++;this._status('reconnecting','Connection lost. Holding the last screen and retrying…');this._schedule(Math.min(15000,1000*2**Math.min(this.failures,4)));
  }
 }
 async getPresence(){const data=await this._request(this._path('/presence'));this.options.onPresence?.(data.presence);return data.presence}
 async heartbeat(details={}){this.heartbeatDetails={...this.heartbeatDetails,...details};this.lastHeartbeat=Date.now();return this._request(this._path('/heartbeat'),{method:'POST',data:this.heartbeatDetails,timeout:10000})}
 async _ensureMedia(state){
  if(!state.media?.length)return;
  const listing=await this._request(this._path('/assets'));for(const asset of listing.assets)if(asset.status==='ready')this.knownAssets.add(asset.id);
  for(const media of state.media){if(this.knownAssets.has(media.id))continue;const blob=await this.options.readBlob?.(media.id);if(!blob)throw new RemoteError('Missing media: '+media.name+'. Import it on this controller before launching.',{code:'MISSING_MEDIA'});await this.upload(blob,{assetId:media.id,name:media.name,mime:media.mime})}
 }
 async commit(state,{expectedRevision=this.revision}={}){
  if(this.credentials?.role!=='controller')throw new RemoteError('Display links cannot change the show.',{code:'READ_ONLY',status:403});
  this.publishing=true;this._status('syncing','Sending the show to stage displays…');
  try{
   await this._ensureMedia(state);
   let result;
   try{result=await this._request(this._path(),{method:'PUT',data:{state,expectedRevision}})}
   catch(error){
    if(error.code==='CONFLICT'&&error.snapshot){this._adopt(error.snapshot);throw error}
    if(error.code==='NETWORK'){
     // A response can be lost after a successful write. Inspect, never blindly replay.
     const latest=await this._request(this._path()).catch(()=>null);
     if(latest&&latest.revision>expectedRevision&&JSON.stringify(latest.state)===JSON.stringify(state))result=latest;
     else{if(latest)this._adopt(latest);throw error}
    }else throw error;
   }
   this._adopt(result,{emit:false});this._status('connected','Live session connected.');return this.snapshot;
  }catch(error){this._status(error.code==='NETWORK'?'reconnecting':'error',error.message);throw error}finally{this.publishing=false}
 }
 async upload(blob,{assetId='upload-'+crypto.randomUUID(),name=blob.name||'Media file',mime=blob.type,onProgress}={}){
  if(this.credentials?.role!=='controller')throw new RemoteError('Display links cannot upload files.',{code:'READ_ONLY',status:403});
  if(blob.size>250*1024*1024)throw new RemoteError(name+' exceeds the 250 MiB limit.',{code:'TOO_LARGE'});
  const ready=await this._request(this._path('/uploads'),{method:'POST',data:{assetId,name,size:blob.size,mime}});
  if(ready.status!=='ready'){
   const chunk=ready.chunkBytes;
   for(let start=0,part=1;start<blob.size;start+=chunk,part++){
    this._status('syncing','Uploading '+name+'…',{progress:start/blob.size});const piece=blob.slice(start,Math.min(start+chunk,blob.size));
    let complete=false;for(let attempt=0;attempt<3&&!complete;attempt++){try{await this._request(this._path('/uploads/'+assetId+'/parts/'+part),{method:'PUT',body:piece,timeout:60000});complete=true}catch(error){if(attempt===2||error.status&&error.status<500)throw error;await pause(500*2**attempt)}}
    onProgress?.(Math.min(start+chunk,blob.size)/blob.size);
   }
   await this._request(this._path('/uploads/'+assetId+'/complete'),{method:'POST',data:{},timeout:30000});
  }
  this.knownAssets.add(assetId);return {assetId,id:assetId,name,size:blob.size,mime,type:mime.startsWith('video/')?'video':'image'};
 }
 async download(assetId){if(!/^[A-Za-z0-9_-]{8,100}$/.test(assetId||''))throw new RemoteError('Invalid media reference.',{code:'INVALID_MEDIA'});return this._request(this._path('/assets/'+assetId),{blob:true,timeout:180000})}
 async end(){
  if(this.credentials?.role!=='controller')throw new RemoteError('Only a controller can end this live session.',{code:'READ_ONLY',status:403});
  if(this.endPromise)return this.endPromise;
  if(this.closed&&this.status?.status==='ended')return;
  // An in-flight poll may see the deletion before its response arrives. Let the
  // explicit end request finish before closing and aborting other requests.
  this.ending=true;clearTimeout(this.pollTimer);
  this.endPromise=(async()=>{
   try{
    try{await this._request(this._path(),{method:'DELETE'})}
    catch(error){
     if(![404,410].includes(error.status)){
      if(error.code!=='NETWORK')throw error;
      // A lost DELETE response is successful only when the server confirms
      // that this session is already gone; never mistake an outage for success.
      let gone=false;try{await this._request(this._path())}catch(check){gone=[404,410].includes(check.status)}
      if(!gone)throw error;
     }
    }
    this._status('ended','Live session ended. Existing screens keep their last view.');this.close();
   }finally{this.ending=false;this.endPromise=null;if(!this.closed)this._schedule()}
  })();
  return this.endPromise;
 }
 close(){this.closed=true;clearTimeout(this.pollTimer);for(const request of this.requests)request.abort();this.requests.clear()}
}
export async function createRemoteSession(state,options={}){
 const client=new RemoteClient(options);client._status('connecting','Creating a live session…');
 try{
  const result=await client._request('/api/sessions',{method:'POST',data:{},auth:false});
  client.credentials={id:result.id,token:result.controlToken,role:'controller',controlToken:result.controlToken,viewToken:result.viewToken};
  client.revision=result.revision;client.meta=result;
  // Existing local timers use the laptop clock. Preserve their remaining time.
  await client.commit(shiftedClock(state,client.clockOffset));client._schedule();return client;
 }catch(error){client._status('error',error.message);client.close();throw error}
}
export async function joinRemoteSession(credentials,options={}){
 const client=new RemoteClient(options);try{return await client._open(credentials)}catch(error){client._status('error',error.message);client.close();throw error}
}
