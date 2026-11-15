importScripts('./asset-manifest.js');
const CACHE='ucl-live-'+self.ASSET_VERSION;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(self.PRECACHE))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('ucl-live-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage({type:'cache-ready'})})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);const lookup=url.pathname.endsWith('/')?new URL('index.html',request.url).href:request;
  const cached=await cache.match(lookup,{ignoreSearch:true});if(!cached)return fetch(request);
  const range=request.headers.get('range');if(!range)return cached;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match)return fetch(request);
  const buffer=await cached.arrayBuffer(),size=buffer.byteLength;let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):size-1):size-1;end=Math.min(end,size-1);
  if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
  return new Response(buffer.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'video/mp4','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
 })());
});
