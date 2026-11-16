import {buildAgendaScene} from './agenda-renderer.js';
import {buildPresentationScene} from './presentation-renderer.js';
import {now as currentTime} from './clock.js';
import {effectiveProgram,loopPosition,remaining,formatTime} from './model.js';
import {mediaInfo,mediaURL} from './media.js';

const ART='assets/art/';
const starPath='M25 0Q28 22 50 25Q28 28 25 50Q22 28 0 25Q22 22 25 0Z';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function pos(n,x,y,w,h){Object.assign(n.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});return n}
function svg(html){const s=el('div');s.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 800">'+html+'</svg>';return s.firstChild}
function grass(){
 let g='';for(const [bx,tipY,bow] of [[54,236,22],[72,330,-26],[40,300,16],[88,408,-18],[60,440,9],[30,470,-12],[100,360,-22]])g+=`<path d="M${bx} 784 C${bx} ${(784+tipY)/2} ${bx+bow} ${tipY+90} ${bx+bow} ${tipY}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`;
 for(const [bx,tipY,bow]of [[64,236,14],[90,330,-12],[40,400,11]]){const tx=bx+bow;g+=`<path d="M${bx} 784 Q${bx-2} 450 ${tx} ${tipY}" fill="none" stroke="currentColor" stroke-width="1.3"/>`;for(let i=0;i<8;i++){const t=i/7;for(const angle of [-34,34])g+=`<path transform="translate(${tx+(bx-tx)*t*.7} ${tipY+t*140}) rotate(${angle}) scale(${.85-.28*t})" d="M0 0C3.4 -4.2 3.4 -9.4 0 -13.5C-3.4 -9.4 -3.4 -4.2 0 0Z" fill="currentColor"/>`}}
 return svg(g);
}
function stars(parent,preset){
 const points=[{x:1760,y:105,size:43},{x:890,y:177,size:24},{x:1640,y:830,size:28},{x:121,y:110,size:20}];
 for(let i=0;i<52;i++){const x=75+(i*557)%1770,y=73+(i*233)%840;if(x>750&&y>325&&y<730)continue;if(x>125&&x<710&&y>180&&i%3!==0)continue;points.push({x,y,size:7+(i*7)%7})}
 points.forEach((s,i)=>{const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.classList.add('twinkle');n.setAttribute('viewBox','0 0 50 50');n.innerHTML='<path fill="currentColor" d="'+starPath+'"/>';pos(n,s.x,s.y,s.size,s.size);const period=[5,10,20][i%3];n.style.setProperty('--period',period+'s');n.style.animationDelay=(-((currentTime()/1000+i*.618*period)%period))+'s';parent.append(n)});
}
export function buildScene(preset,state,{showTimer=false}={}){
 if(preset.layout==='daily-agenda')return buildAgendaScene(preset,state,{showTimer});
 if(preset.layout==='presentation')return buildPresentationScene(preset,state,{showTimer});
 if(!document.getElementById('austin-palette')){const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');defs.style.cssText='position:absolute;width:0;height:0;pointer-events:none';defs.setAttribute('aria-hidden','true');defs.innerHTML='<defs><filter id="austin-palette" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".231 .777 .078 0 -.064 .220 .739 .075 0 -.010 .214 .718 .073 0 -.025 0 0 0 1 0"/></filter></defs>';document.body.append(defs)}
 const root=el('div','scene '+preset.theme+' motion-'+preset.motion+' layout-'+preset.layout);root.dataset.layout=preset.layout;const meta=new Map(),videos=[];let disposed=false,fitted=false;
 const fg=preset.theme==='light'?'#192520':'#FDFFF2',accent=preset.theme==='light'?'#192520':'#F0FE91';
 function mask(key,file,x,y,w,h,color=accent,cls=''){const n=pos(el('div','art mask '+cls),x,y,w,h);n.style.backgroundColor=color;n.style.maskImage=`url("${ART+file}")`;root.append(n);meta.set(key,{n,asset:file,x,y,w,h,color});return n}
 function img(key,file,x,y,w,h,cls=''){const n=pos(el('img','art '+cls),x,y,w,h);n.src=ART+file;n.alt='';root.append(n);meta.set(key,{n,asset:file,x,y,w,h});return n}
 function text(key,value,x,y,w,h,size,cls=''){const n=pos(el('div','scene-text '+cls,value),x,y,w,h);n.style.fontSize=size+'px';root.append(n);if(key)meta.set(key,{n,asset:'text:'+value,x,y,w,h});return n}
 const glow=el('div','scene-glow');root.append(glow);
 let timerNode;
 if(preset.layout==='media'){
  const info=mediaInfo(preset.assetId,state);const n=el(info?.type==='video'?'video':'img','full-media');n.style.objectFit='contain';
  if(info?.type==='video'){n.muted=true;n.loop=true;n.autoplay=preset.motion!=='still';n.dataset.still=String(preset.motion==='still');n.playsInline=true;n.preload='auto';if(info.poster)n.poster=info.poster;videos.push(n)}else n.alt=info?.name||'';
  root.append(n);mediaURL(preset.assetId).then(url=>{if(disposed)return;n.src=url;if(info?.type==='video'&&n.autoplay)n.play().catch(()=>{})}).catch(error=>{if(!disposed){root.replaceChildren(el('div','media-error',error.message))}});
 }else{
  if(preset.theme==='dark'&&preset.layout!=='logo')stars(root,preset);
  if(preset.layout==='logo'){
   if(preset.theme==='dark'){
    const info=mediaInfo('cowgirl-background',state),v=el('video','full-media');v.muted=true;v.loop=true;v.autoplay=preset.motion!=='still';v.dataset.still=String(preset.motion==='still');v.playsInline=true;v.preload='auto';v.poster=info.poster;v.src=info.url;root.append(v);videos.push(v);if(v.autoplay)v.play().catch(()=>{});
    mask('logo','leaders-logo.svg',850,350,965,310.42);
   }else{mask('cowgirl','cowgirl.svg',150,192,530,709,fg,'cowgirl');mask('logo','leaders-logo.svg',815,385,970,312)}
  }else if(preset.layout==='range'){
   mask('logo','leaders-logo.svg',105,105,470,151);
   img('horse','horse.png',880,255,960,640,'horse');
   text('title',preset.title,105,432,860,300,118,'display');text(null,preset.subtitle,110,770,770,100,30,'sans');
   for(const [side,x]of [['left',-205],['right',1660]]){const n=pos(el('div','botanical '+side),x,210,360,810);n.append(grass());root.append(n)}
  }else if(preset.layout==='badge'){
   mask('logo','leaders-logo.svg',112,105,500,161);
   img('badge','badge.png',1110,195,660,660,'badge');text('title',preset.title,110,365,940,340,147,'display');text(null,preset.subtitle,117,774,850,80,34,'sans');
  }else if(preset.layout==='pattern'){
   img('pattern','pattern.png',0,0,710,1080,'pattern');mask('logo','leaders-logo.svg',865,120,625,201);
   text('title',preset.title,865,418,940,330,127,'display');text(null,preset.subtitle,875,797,850,75,34,'sans');
  }else if(preset.layout==='countdown'){
   mask('logo','leaders-logo.svg',110,105,490,158);mask('cowgirl','cowgirl.svg',1330,250,430,575,fg,'cowgirl');
   text('title',preset.title,110,325,1110,265,116,'display');text(null,preset.subtitle,115,654,1090,52,30,'sans');timerNode=text(null,formatTime(preset.durationSeconds*1000),105,709,1160,190,174,'timer-digits');
   const n=pos(el('div','botanical right'),1700,240,310,760);n.append(grass());root.append(n);
  }else if(preset.layout==='session'){
   mask('logo','leaders-logo.svg',110,105,490,158);img('badge','badge.png',1350,300,440,440,'badge');text(null,preset.eyebrow,117,359,1100,65,30,'eyebrow');text('title',preset.title,110,462,1190,285,123,'display');text(null,preset.speaker||preset.subtitle,118,793,1120,80,37,'sans');
  }else if(preset.layout==='agenda'){
   mask('logo','leaders-logo.svg',110,105,490,158);text('title',preset.title,110,374,720,280,132,'display');img('badge','badge.png',145,670,200,200,'badge');
   preset.agenda.forEach((line,i)=>{text(null,String(i+1).padStart(2,'0'),890,280+i*105,90,70,27,'sans agenda-number');text(null,line,1015,263+i*105,770,90,44,'display agenda-line')});
  }
  const line=pos(el('div','footer-rule'),100,969,1720,1);root.append(line);text(null,'●   '+preset.location,100,1001,1120,45,18,'location');mask('company','company-wordmark.png',1480,1001,340,26,fg);
 }
 if(preset.backgroundId){
  root.querySelectorAll('.art,.scene-glow,.twinkle,.botanical,.footer-rule,.location').forEach(n=>n.remove());meta.clear();
  const info=mediaInfo(preset.backgroundId,state),v=el('video','full-media background-film');v.muted=true;v.loop=true;v.autoplay=preset.motion!=='still';v.playsInline=true;v.preload='auto';if(info?.poster)v.poster=info.poster;v.dataset.still=String(preset.motion==='still');root.prepend(v);videos.push(v);mediaURL(preset.backgroundId).then(url=>{if(disposed)return;v.src=url;if(v.autoplay)v.play().catch(()=>{})});
 }
 if(showTimer&&preset.layout!=='countdown'){timerNode=pos(el('div','timer-pill',''),1515,54,320,90);root.append(timerNode)}
 return {root,meta,videos,fit(){if(fitted||!root.isConnected||document.fonts.status!=='loaded')return;fitted=true;root.querySelectorAll('.scene-text:not(.timer-digits)').forEach(n=>{let size=parseFloat(n.style.fontSize);while(size>24&&(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2)){size-=2;n.style.fontSize=size+'px'}})},updateTimer(value){if(timerNode)timerNode.textContent=value},dispose(){disposed=true;videos.forEach(v=>{v.pause();v.removeAttribute('src');v.load()});root.remove()}};
}
const ease=t=>t*t*(3-2*t);
function colorMix(a,b,t){if(!a||!b)return a;const ac=a.match(/\w\w/g).map(x=>parseInt(x,16)),bc=b.match(/\w\w/g).map(x=>parseInt(x,16));return '#'+ac.map((v,i)=>Math.round(v+(bc[i]-v)*t).toString(16).padStart(2,'0')).join('')}
export class StageRenderer{
 constructor(host,{preview=false}={}){this.host=host;this.preview=preview;this.stage=el('div','stage-canvas');host.replaceChildren(this.stage);this.layers=new Map();this.morphs=[];this.fit='fit';this.safe=0;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick)}
 setFeed(feed,state){this.feed=feed;this.state=state}
 setPreset(preset,state){this.setFeed({program:{id:'preview-'+JSON.stringify(preset),kind:'preset',preset,startedAt:0},timer:null,blackout:false},state)}
 setOutput(fit='fit',safe=0){this.fit=fit;this.safe=safe;this.resize()}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;let sx=w/1920,sy=h/1080;if(this.fit!=='stretch')sx=sy=this.fit==='fill'?Math.max(sx,sy):Math.min(sx,sy);const margin=1-this.safe/100;Object.assign(this.stage.style,{transform:`translate(-50%,-50%) scale(${sx*margin},${sy*margin})`})}
 clearMorph(){this.morphs.forEach(m=>{m.a.n.style.visibility='';m.b.n.style.visibility='';m.n.remove()});this.morphs=[];this.morphKey=null}
 layer(key,preset,timer){if(!this.layers.has(key)){const scene=buildScene(preset,this.state,{showTimer:timer});this.layers.set(key,scene);this.stage.append(scene.root)}return this.layers.get(key)}
 tick(){
  this.frame=requestAnimationFrame(this.tick);if(!this.feed)return;
  const now=currentTime(),p=effectiveProgram(this.feed,now),timer=Boolean(this.feed.timer&&!p.id.endsWith('-finished'));
  this.stage.style.visibility=this.feed.blackout?'hidden':'visible';
  const at=p.kind==='loop'?loopPosition(p,now):null;if(p.kind==='loop'&&!at)return;
  const current=at?p.items[at.index].preset:p.preset,key=p.id+'-'+(at?.index??0),a=this.layer(key,current,timer);let b=null,bkey=null;
  const progress=at?.progress||0;
  if(progress>0){bkey=p.id+'-'+at.next;b=this.layer(bkey,p.items[at.next].preset,timer)}
  if(this.morphKey!==key+'-'+bkey||at?.transition!=='morph'||!b)this.clearMorph();
  for(const [k,scene]of this.layers){if(k!==key&&k!==bkey){scene.dispose();this.layers.delete(k)}}
  const t=ease(progress);a.root.style.opacity='1';a.root.style.transform='';a.root.style.zIndex='1';
  if(b){b.root.style.zIndex='2';b.root.style.opacity=String(t);b.root.style.transform='';
   if(at.transition==='slide'){a.root.style.transform=`translateX(${-120*t}px)`;b.root.style.transform=`translateX(${120*(1-t)}px)`;a.root.style.opacity=String(1-t)}
   else if(at.transition==='zoom'){a.root.style.transform=`scale(${1+.04*t})`;b.root.style.transform=`scale(${1.04-.04*t})`;a.root.style.opacity=String(1-t)}
   else if(at.transition==='morph'&&current.layout!=='media'&&p.items[at.next].preset.layout!=='media'){
    if(!this.morphKey){this.morphKey=key+'-'+bkey;for(const [id,one]of a.meta){const two=b.meta.get(id);if(two?.asset===one.asset){const n=one.n.cloneNode(true);n.classList.add('morph-object');n.style.animation='none';this.stage.append(n);one.n.style.visibility='hidden';two.n.style.visibility='hidden';this.morphs.push({a:one,b:two,n})}}}
    for(const m of this.morphs){pos(m.n,m.a.x+(m.b.x-m.a.x)*t,m.a.y+(m.b.y-m.a.y)*t,m.a.w+(m.b.w-m.a.w)*t,m.a.h+(m.b.h-m.a.h)*t);if(m.a.color)m.n.style.backgroundColor=colorMix(m.a.color,m.b.color,t)}
   }
  }
  for(const scene of [a,b].filter(Boolean)){
   scene.update?.(now);scene.fit();scene.updateTimer(formatTime(this.feed.timer?remaining(this.feed.timer,now):(current.durationSeconds||1200)*1000));
   for(const v of scene.videos){if(v.dataset.still==='true'){if(!v.paused)v.pause();continue}if(Number.isFinite(v.duration)&&v.duration>0&&v.readyState>=2){const target=Math.max(0,((p.pausedAt??now)-p.startedAt)/1000)%v.duration;const drift=Math.abs(v.currentTime-target);if(drift>.55&&drift<v.duration-.55)v.currentTime=target;if(p.pausedAt!==null&&p.pausedAt!==undefined){if(!v.paused)v.pause()}else if(v.paused&&!v.error)v.play().catch(()=>{})}}
  }
 }
 destroy(){cancelAnimationFrame(this.frame);this.clearMorph();this.layers.forEach(s=>s.dispose());this.observer.disconnect();this.host.replaceChildren()}
}
