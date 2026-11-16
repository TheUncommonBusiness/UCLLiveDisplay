import {getPresentationScene} from '../assets/presentation-system/scenes.js';

const assetURL=path=>new URL('../'+path,import.meta.url).href;
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const pos=(n,e)=>{Object.assign(n.style,{position:'absolute',left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',boxSizing:'border-box',opacity:e.opacity??1,transform:e.rotate?`rotate(${e.rotate}deg)`:'none',transformOrigin:'center center'});return n};
const svgNode=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n};
const svgText=(svg,text,x,y,attrs={})=>{const n=svgNode('text',{x,y,fill:'#192520','font-family':'UCLInter,Inter,sans-serif','font-size':23,...attrs});n.textContent=text;svg.append(n);return n};

function chartData(e,value){
 const labels=(Array.isArray(value?.labels)?value.labels:e.labels||e.data?.[0]?.labels||[]).slice(0,12).map(x=>String(x).slice(0,45));
 let series=(Array.isArray(value?.series)?value.series:e.series||e.data?.map(d=>({name:d.name,values:d.values}))||[]).slice(0,3);
 series=series.map((s,i)=>({name:String(s.name||`Series ${i+1}`).slice(0,60),values:labels.map((_,j)=>Number.isFinite(Number(s.values?.[j]))?Number(s.values[j]):0)}));
 return {labels,series};
}
function chart(e,value){
 const svg=svgNode('svg',{viewBox:`0 0 ${e.w} ${e.h}`,role:'img','aria-label':e.chartType+' chart'}),d=chartData(e,value),colors=e.chartStyle?.colors||['#192520','#8B9C84','#F0FE91'];
 const legend=d.series.length>1?40:0,p={x:75,y:18,w:e.w-100,h:e.h-88-legend},values=d.series.flatMap(s=>s.values);
 const rawMin=Math.min(0,...values),rawMax=Math.max(1,...values),span=rawMax-rawMin;let step=10**Math.floor(Math.log10(span/4));const rough=span/4/step;step*=rough>5?10:rough>2?5:rough>1?2:1;
 const min=Math.floor(rawMin/step)*step,max=Math.ceil(rawMax/step)*step,yy=v=>p.y+p.h-(v-min)/(max-min)*p.h;
 for(let v=min;v<=max+.0001;v+=step){const y=yy(v);svg.append(svgNode('line',{x1:p.x,y1:y,x2:p.x+p.w,y2:y,stroke:e.chartStyle?.gridColor||'#DDE3D3','stroke-width':1}));svgText(svg,Number(v.toPrecision(5)).toLocaleString(),p.x-15,y+8,{'text-anchor':'end','font-size':21})}
 const count=Math.max(1,d.labels.length),group=p.w/count,pointX=i=>p.x+(i+.5)*group;
 d.labels.forEach((label,i)=>svgText(svg,label,pointX(i),p.y+p.h+36,{'text-anchor':'middle','font-size':Math.min(23,Math.max(15,group/(label.length*.55)))}));
 if(e.chartType==='line')d.series.forEach((s,si)=>{const pts=s.values.map((v,i)=>`${pointX(i)},${yy(v)}`).join(' ');svg.append(svgNode('polyline',{points:pts,fill:'none',stroke:colors[si%colors.length],'stroke-width':4}));s.values.forEach((v,i)=>svg.append(svgNode('circle',{cx:pointX(i),cy:yy(v),r:6,fill:colors[si%colors.length]})))});
 else d.series.forEach((s,si)=>{const bw=group*.66/Math.max(1,d.series.length);s.values.forEach((v,i)=>svg.append(svgNode('rect',{x:p.x+i*group+group*.17+si*bw,y:Math.min(yy(v),yy(0)),width:Math.max(2,bw-5),height:Math.max(1,Math.abs(yy(v)-yy(0))),fill:colors[si%colors.length]})))});
 if(legend)d.series.forEach((s,i)=>{const x=p.x+i*(p.w/d.series.length);svg.append(svgNode('rect',{x,y:e.h-17,width:18,height:8,fill:colors[i]}));svgText(svg,s.name,x+30,e.h-7,{'font-size':20})});
 return svg;
}

/** Editable text and geometry; moving backgrounds are reserved for title and section screens. */
export function buildPresentationScene(preset,state,{showTimer=false}={}){
 const scene=getPresentationScene(preset.sceneId),root=node('div','scene presentation-scene motion-'+(preset.motion||'normal')),meta=new Map(),videos=[];
 Object.assign(root.style,{position:'absolute',inset:0,width:'1920px',height:'1080px',overflow:'hidden',isolation:'isolate',background:scene?.background||'#192520'});root.dataset.layout='presentation';root.dataset.sceneId=preset.sceneId||'';
 let disposed=false,fitted=false,timerNode,video;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)'),media=scene?.backgroundMedia;
 if(!scene){const message=pos(node('div','scene-text','Choose a presentation layout.'),{x:120,y:420,w:1680,h:180});Object.assign(message.style,{font:'72px Season',color:'#FDFFF2'});root.append(message);return {root,meta,videos,fit(){},updateTimer(){},dispose(){root.remove()}}}
 const fields={...scene.defaultFields,...preset.fields};
 if(media){
  const poster=node('img','presentation-poster');poster.alt='';poster.src=assetURL(media.poster);Object.assign(poster.style,{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill',zIndex:0});root.append(poster);
  if(scene.role==='opening'||scene.id==='toolkit-section'){
  video=node('video','presentation-film');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.poster=assetURL(media.poster);video.src=assetURL(media.video);Object.assign(video.style,{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill',zIndex:0});
  video.addEventListener('error',()=>{video.style.display='none';video.dataset.still='true';root.dataset.mediaError='true';root.dispatchEvent(new CustomEvent('presentation-media-error',{bubbles:true,detail:{sceneId:scene.id,video:media.video}}))});root.append(video);videos.push(video);
  }
 }
 const applyMotion=()=>{if(!video||disposed)return;const still=preset.motion==='still'||Boolean(reduced?.matches);video.dataset.still=String(still);video.autoplay=!still;video.style.visibility=still?'hidden':'visible';if(still){video.pause();try{video.currentTime=0}catch{}}else video.play().catch(()=>{})};
 reduced?.addEventListener?.('change',applyMotion);applyMotion();
 const textNodes=[];
 scene.elements.forEach((e,index)=>{
  let n;if(e.type==='image'){n=node('img','presentation-element');n.src=assetURL(e.path);n.alt='';n.style.objectFit=e.fit||'contain'}
  else if(e.type==='chart')n=chart(e,fields[e.key]);
  else if(e.type==='line'){
   n=svgNode('svg',{viewBox:`0 0 ${Math.max(1,Math.abs(e.w))} ${Math.max(1,Math.abs(e.h))}`,overflow:'visible'});const x=e.w<0?Math.abs(e.w):0,y=e.h<0?Math.abs(e.h):0;
   if(e.endArrowType){const defs=svgNode('defs'),marker=svgNode('marker',{id:`arrow-${scene.id}-${index}-${Math.random().toString(36).slice(2)}`,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svgNode('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:e.stroke||'#192520'}));defs.append(marker);n.append(defs);n.dataset.marker=marker.id}
   const line=svgNode('line',{x1:x,y1:y,x2:x+e.w,y2:y+e.h,stroke:e.stroke||'#192520','stroke-width':e.strokeWidth||1});if(n.dataset.marker)line.setAttribute('marker-end',`url(#${n.dataset.marker})`);n.append(line);
  }else n=node('div','presentation-element '+(e.type==='text'?'scene-text':''),e.type==='text'?String(fields[e.key]??e.text??''):undefined);
  pos(n,e);n.style.zIndex='1';n.dataset.element=String(index);if(e.key)n.dataset.field=e.key;
  if(e.type==='text'){
   Object.assign(n.style,{fontFamily:e.font==='Season'?'Season,Georgia,serif':'UCLInter,Inter,sans-serif',fontSize:e.size+'px',fontWeight:e.weight||400,fontStyle:e.italic?'italic':'normal',lineHeight:String(e.lineHeight||1.04),color:e.color||'#192520',letterSpacing:(e.letterSpacing||0)+'px',textAlign:e.align||'left',whiteSpace:'pre-wrap',overflow:'hidden',overflowWrap:'break-word'});n.dataset.baseSize=e.size;textNodes.push(n);
  }
  if(e.type==='rect'||e.type==='ellipse')Object.assign(n.style,{background:e.fill||'transparent',border:e.stroke?`${e.strokeWidth||1}px solid ${e.stroke}`:'none',borderRadius:e.type==='ellipse'?'50%':'0'});
  if(e.type==='line')Object.assign(n.style,{left:Math.min(e.x,e.x+e.w)+'px',top:Math.min(e.y,e.y+e.h)+'px',width:Math.max(1,Math.abs(e.w))+'px',height:Math.max(1,Math.abs(e.h))+'px',overflow:'visible'});
  root.append(n);if(e.type==='text'||e.type==='image')meta.set(e.key||'art-'+index,{n,asset:e.type==='text'?'text:'+n.textContent:e.path,x:e.x,y:e.y,w:e.w,h:e.h,color:e.color});
 });
 if(showTimer){timerNode=pos(node('div','timer-pill',''),{x:1515,y:54,w:320,h:90});timerNode.style.zIndex='5';root.append(timerNode)}
 return {root,meta,videos,fit(){if(disposed||fitted||!root.isConnected||document.fonts.status!=='loaded')return;fitted=true;textNodes.forEach(n=>{let size=Number(n.dataset.baseSize),min=Math.min(24,size);while(size>min&&(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1)){size=Math.max(min,size-1);n.style.fontSize=size+'px'}n.dataset.fittedSize=String(size);n.dataset.overflow=String(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2)})},updateTimer(value){if(timerNode)timerNode.textContent=value},dispose(){disposed=true;reduced?.removeEventListener?.('change',applyMotion);videos.forEach(v=>{v.pause();v.removeAttribute('src');v.load()});root.remove()}};
}
