import {agendaPage,sanitizeSchedule} from './agenda.js';
import {now as clockNow} from './clock.js';

const G='#192520',C='#FDFFF2',L='#F0FE91';
const asset=path=>new URL('../'+path,import.meta.url).href;
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
const box=(n,x,y,w,h)=>{Object.assign(n.style,{position:'absolute',left:x+'px',top:y+'px',width:w+'px',height:h+'px',boxSizing:'border-box'});return n};
const formatDate=value=>{if(!value)return '';return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',timeZone:'America/Chicago'}).format(new Date(value+'T12:00:00Z'))};
const formatTime=value=>{if(!value)return '—';const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};

/** Two native daily-agenda layouts over the approved 15-second background films. */
export function buildAgendaScene(preset,state,{showTimer=false}={}){
 const night=preset.agendaStyle==='night',root=el('div','scene daily-agenda-scene '+(night?'dark':'light')),meta=new Map(),videos=[],texts=[];
 Object.assign(root.style,{position:'absolute',inset:0,width:'1920px',height:'1080px',overflow:'hidden',isolation:'isolate',background:night?G:C,color:night?C:G});root.dataset.layout='daily-agenda';root.dataset.agendaStyle=night?'night':'editorial';root.setAttribute('role','region');root.setAttribute('aria-label',preset.title||'Daily agenda');
 let disposed=false,signature='',lastUpdate=-Infinity,timerNode;const cachedSchedule=sanitizeSchedule(preset.schedule);const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)'),film=night?'system-night-rodeo':'system-editorial-clean';
 const poster=el('img','agenda-poster');poster.alt='';poster.src=asset('assets/media/'+film+'.jpg');box(poster,0,0,1920,1080);poster.style.objectFit='fill';root.append(poster);
 const video=el('video','agenda-background');video.muted=true;video.loop=true;video.playsInline=true;video.poster=poster.src;video.preload='auto';video.src=asset('assets/media/'+film+'.mp4');box(video,0,0,1920,1080);video.style.objectFit='fill';video.setAttribute('aria-hidden','true');root.append(video);videos.push(video);
 const motion=()=>{const still=preset.motion==='still'||Boolean(reduced?.matches);video.dataset.still=String(still);video.style.visibility=still?'hidden':'visible';video.autoplay=!still;if(still){video.pause();try{video.currentTime=0}catch{}}else if(!video.error)video.play().catch(()=>{})};video.addEventListener('error',()=>{video.style.display='none';video.dataset.still='true';root.dataset.mediaError='true'});reduced?.addEventListener?.('change',motion);motion();
 const foreground=box(el('div','agenda-native'),0,0,1920,1080);foreground.style.zIndex='1';root.append(foreground);
 function text(parent,key,value,x,y,w,h,size,{color=night?C:G,font='Inter',align='left',spacing=0,weight=400}={}){const n=box(el('div','scene-text agenda-text',value),x,y,w,h);Object.assign(n.style,{fontFamily:font==='Season'?'Season,Georgia,serif':'UCLInter,Inter,sans-serif',fontSize:size+'px',fontWeight:weight,lineHeight:'1.08',color,textAlign:align,letterSpacing:spacing+'px',whiteSpace:'pre-wrap',overflowWrap:'break-word',overflow:'hidden'});n.dataset.baseSize=String(size);n.dataset.minSize=String(font==='Season'?22:size<=21?14:16);n.dataset.field=key;parent.append(n);texts.push(n);let ax=x,ay=y;for(let a=parent;a&&a!==root;a=a.parentElement){ax+=parseFloat(a.style.left)||0;ay+=parseFloat(a.style.top)||0}meta.set(key,{n,asset:'text:'+value,x:ax,y:ay,w,h,color});return n}
 function rule(parent,x,y,w,color){const n=box(el('div'),x,y,w,1);n.style.background=color;parent.append(n)}
 function logo(x,y,w){const img=box(el('img'),x,y,w,w*.32168);img.src=asset('assets/presentation-system/art/leaders-logo-'+(night?'cream':'forest')+'.svg');img.alt='Uncommon Leaders';foreground.append(img);meta.set('agenda-logo',{n:img,asset:img.src,x,y,w,h:w*.32168})}
 logo(90,63,night?310:280);
 const rows=box(el('div','agenda-rows'),0,0,1920,1080);rows.setAttribute('role','list');rows.setAttribute('aria-label','Sessions');foreground.append(rows);
 if(showTimer){timerNode=box(el('div','timer-pill'),1515,54,320,90);timerNode.style.zIndex='5';root.append(timerNode)}
 const fit=()=>{if(disposed||!root.isConnected||document.fonts.status!=='loaded')return;for(const n of texts){if(n.dataset.fit==='true'||!n.isConnected)continue;let size=Number(n.dataset.baseSize),min=Math.min(Number(n.dataset.minSize)||16,size);while(size>min&&(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1)){size--;n.style.fontSize=size+'px'}n.dataset.fit='true';n.dataset.overflow=String(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2)}};
 const update=(nowMs=clockNow())=>{
  if(disposed)return;if(signature&&Math.abs(nowMs-lastUpdate)<250){fit();return}lastUpdate=nowMs;const at=agendaPage(cachedSchedule,nowMs),key=JSON.stringify([at.day,at.page,at.activeIndex,preset.title]);if(signature===key){fit();return}signature=key;texts.length=0;rows.replaceChildren();for(const k of [...meta.keys()])if(k!=='agenda-logo')meta.delete(k);
  const {day,items,page,pageCount,activeIndex}=at;root.dataset.page=String(page);root.dataset.activeIndex=String(activeIndex);const next=activeIndex>=0?day.items[activeIndex+1]:null;
  const date=formatDate(day.date),pageLabel=`${day.name||'Daily agenda'}  /  ${page+1} of ${pageCount}`;
  if(night){
   text(rows,'eyebrow','THE DAY AHEAD',95,230,510,40,21,{color:L,spacing:3});text(rows,'day',day.name||'Daily agenda',90,300,520,155,112,{font:'Season'});text(rows,'date',date,96,463,500,50,28,{color:'#BAC6AF'});
   text(rows,'title',preset.title||'Today at Uncommon Leaders',90,542,520,190,70,{font:'Season'});
   if(next){text(rows,'next-label','UP NEXT',96,790,490,34,20,{color:L,spacing:3});text(rows,'next-title',next.title||'Untitled session',92,843,515,115,40,{font:'Season'});}else{text(rows,'day-note',activeIndex>=0?'TODAY’S FINAL SESSION':'AUSTIN, TEXAS',96,835,500,70,18,{color:'#BAC6AF',spacing:2})}
   text(rows,'schedule-heading','TODAY’S SESSIONS',716,150,750,40,23,{color:L,spacing:3});text(rows,'page-count',`${page+1} / ${pageCount}`,1620,150,195,40,23,{color:L,align:'right'});rule(rows,716,217,1100,'#FDFFF244');
  }else{
   text(rows,'day',day.name||'Daily agenda',1300,68,520,58,43,{font:'Season',align:'right'});text(rows,'date',date,1280,126,540,38,23,{color:'#61715C',align:'right'});rule(rows,90,184,1730,'#19252066');text(rows,'title',preset.title||'Today at Uncommon Leaders',90,222,1720,132,109,{font:'Season'});
   text(rows,'column-time','TIME',110,360,200,34,18,{color:'#61715C',spacing:3});text(rows,'column-session','SESSION',365,360,950,34,18,{color:'#61715C',spacing:3});text(rows,'column-speaker','WITH',1415,360,370,34,18,{color:'#61715C',spacing:3});
  }
  if(!items.length){text(rows,'empty','Add your sessions to build the day.',night?720:110,night?440:520,night?1050:1680,220,72,{font:'Season',color:night?C:G});}
  items.forEach((item,i)=>{
   const absolute=page*6+i,current=absolute===activeIndex,upNext=activeIndex>=0&&absolute===activeIndex+1,x=night?700:90,y=(night?256:411)+i*(night?117:96),w=night?1140:1730,h=night?108:90;
   const row=box(el('div','agenda-row'),x,y,w,h);row.setAttribute('role','listitem');row.dataset.itemId=item.id;row.dataset.current=String(current);row.setAttribute('aria-label',`${current?'Current session. ':upNext?'Up next. ':''}${formatTime(item.time)}. ${item.title}. ${item.speaker}`);if(current)row.setAttribute('aria-current','true');
   if(current){row.style.background=night?L:G;row.style.borderRadius='4px'}else{row.style.borderBottom='1px solid '+(night?'#FDFFF230':'#19252025');if(upNext)row.style.background=night?'#FDFFF208':'#19252004'}rows.append(row);
   const fg=current?(night?G:C):(night?C:G),muted=current?(night?G:'#D5DFC8'):(night?'#BCC7B1':'#61715C'),tag=current?'CURRENT':upNext?'UP NEXT':'';
   if(night){
    text(row,'time-'+item.id,formatTime(item.time),20,39,170,52,28,{color:fg});if(tag)text(row,'tag-'+item.id,tag,220,12,820,28,15,{color:current?G:L,spacing:2});text(row,'session-'+item.id,item.title||'Untitled session',220,tag?34:17,865,48,43,{font:'Season',color:fg});if(item.speaker)text(row,'speaker-'+item.id,item.speaker,225,79,850,25,21,{color:muted});
   }else{
    text(row,'time-'+item.id,formatTime(item.time),20,26,210,58,31,{color:fg});if(tag)text(row,'tag-'+item.id,tag,275,8,1000,24,14,{color:current?L:'#61715C',spacing:2});text(row,'session-'+item.id,item.title||'Untitled session',275,tag?30:19,1000,63,47,{font:'Season',color:fg});text(row,'speaker-'+item.id,item.speaker,1325,28,370,55,27,{color:muted});
   }
  });
  rule(rows,90,1014,1730,night?'#FDFFF230':'#19252030');text(rows,'footer',!night&&next?'UP NEXT  ·  '+formatTime(next.time)+'  /  '+(next.title||'Untitled session'):'UNCOMMON LEADERS LIVE / AUSTIN',95,1033,1170,32,17,{color:night?'#BAC6AF':'#61715C',spacing:2});text(rows,'page-footer',pageLabel,1250,1033,570,32,17,{color:night?'#BAC6AF':'#61715C',align:'right'});fit();
 };
 update(clockNow());return {root,meta,videos,fit,update,updateTimer(value){if(timerNode)timerNode.textContent=value},dispose(){disposed=true;reduced?.removeEventListener?.('change',motion);video.pause();video.removeAttribute('src');video.load();root.remove()}};
}
