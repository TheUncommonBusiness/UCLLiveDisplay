import {AGENDA_PRESETS,sanitizeSchedule} from './agenda.js';
import {PRESENTATION_SCENES,getPresentationScene} from '../assets/presentation-system/scenes.js';
import {now as currentTime} from './clock.js';
export const VERSION=1;
export const clone=x=>structuredClone(x);
export const uid=prefix=>prefix+'-'+crypto.randomUUID();
export const clamp=(n,min,max,fallback=min)=>Number.isFinite(Number(n))?Math.max(min,Math.min(max,Number(n))):fallback;
const text=(v,n=180)=>typeof v==='string'?v.slice(0,n):'';
export const TRANSITIONS={cut:'Snap',fade:'Fade',slide:'Slide',zoom:'Soft zoom',morph:'Smart Morph'};
const base={eyebrow:'UNCOMMON LEADERS LIVE',title:'',subtitle:'',speaker:'',location:'AUSTIN, TEXAS',theme:'dark',motion:'normal',durationSeconds:1200,agenda:[],assetId:null};
const preset=(id,name,layout,props={})=>({...base,id,name,layout,kind:props.kind||'hold',...props});
export const PRESENTATION_TEMPLATES=PRESENTATION_SCENES.map(scene=>preset('presentation-'+scene.id,scene.name,'presentation',{sceneId:scene.id,fields:clone(scene.defaultFields),motion:'normal',theme:scene.style==='night-rodeo'?'dark':'light'}));
export const TEMPLATES=[
 preset('logo','Logo & stars','logo'),
 preset('range','Quiet range','range',{title:"We'll begin shortly."}),
 preset('intermission','Austin intermission','badge',{title:"We'll be\nright back.",subtitle:'Take a breath. Stay a while.',theme:'light'}),
 preset('pattern','The Austin pattern','pattern',{title:'Make yourself\nat home.',subtitle:"We'll begin shortly.",theme:'light'}),
 preset('starting-soon','Starting soon','countdown',{kind:'countdown',title:"We'll begin\nshortly.",subtitle:'The next session begins in',durationSeconds:1200}),
 preset('break','Break countdown','countdown',{kind:'countdown',title:'Take a\nbreather.',subtitle:"We'll be back in",durationSeconds:900,theme:'light'}),
 preset('session','Session introduction','session',{eyebrow:'UP NEXT',title:'Uncommon\nLeaders Live',subtitle:'Ideas into action.'}),
 preset('agenda','Agenda','agenda',{title:"What's ahead.",agenda:['Welcome & connection','Sessions & live builds','Breaks & conversations'],theme:'light'}),
 preset('starting','We’re starting','badge',{title:"We're\nstarting.",subtitle:'Welcome back.',theme:'light'}),
 preset('film','4K logo film','media',{kind:'media',assetId:'stars-film'}),
 preset('cowgirl-moment','Cowgirl · a moment of motion','media',{kind:'media',assetId:'cowgirl-film'}),
 ...PRESENTATION_TEMPLATES,
 ...AGENDA_PRESETS
];
export const BUILTIN_MEDIA={
 'cowgirl-film':{id:'cowgirl-film',name:'Cowgirl · motion every 15 seconds',type:'video',mime:'video/mp4',url:'assets/media/character-hat-tip-4k.mp4',poster:'assets/media/character-hat-tip-4k.jpg',builtin:true},
 'range-film':{id:'range-film',name:'Quiet range background',type:'video',mime:'video/mp4',url:'assets/media/quiet-range-4k.mp4',poster:'assets/media/quiet-range-4k.jpg',builtin:true},
 'badge-film':{id:'badge-film',name:'Intermission background',type:'video',mime:'video/mp4',url:'assets/media/badge-4k.mp4',poster:'assets/media/badge-4k.jpg',builtin:true},
 'pattern-film':{id:'pattern-film',name:'Austin pattern background',type:'video',mime:'video/mp4',url:'assets/media/pattern-4k.mp4',poster:'assets/media/pattern-4k.jpg',builtin:true},
 'stars-film':{id:'stars-film',name:'Uncommon Leaders · 4K logo film',type:'video',mime:'video/mp4',url:'assets/media/leaders-stars-4k.mp4',poster:'assets/media/leaders-stars-4k.jpg',builtin:true},
 ...Object.fromEntries(Array.from({length:10},(_,i)=>{const names=['leadership','kinsey','carter','curriculum','student-success','client-success','advisors','enrollment','people','ops-build'];return ['team-'+i,{id:'team-'+i,name:'TUB team · '+names[i].replaceAll('-',' '),type:'image',mime:'image/jpeg',url:'assets/slides/tub-team/'+String(i+1).padStart(2,'0')+'-'+names[i]+'.jpg',builtin:true}]}))
};
export function getPreset(state,id){return [...state.presets,...TEMPLATES].find(p=>p.id===id)||TEMPLATES[0]}
export const isTimer=p=>p.kind==='countdown';
export function itemFromPreset(p,seconds=12,transition='fade'){return {id:uid('item'),preset:clone(p),seconds,transition,transitionSeconds:1.2}}
export function newProgram(p,now=currentTime()){return {id:uid('program'),kind:'preset',preset:clone(p),startedAt:now,pausedAt:null}}
export function newFeed(id,name,now=currentTime()){return {id,name,program:newProgram(TEMPLATES[9],now),timer:null,endPreset:clone(TEMPLATES[8]),blackout:false}}
export function defaultState(now=currentTime()){
 const loop={id:'austin-loop',name:'Austin hold collection',items:TEMPLATES.slice(0,4).map((p,i)=>itemFromPreset(p,12,i===1?'morph':'fade')),timerSeconds:0};
 const team={id:'team-loop',name:'Get to know the TUB team',items:Object.values(BUILTIN_MEDIA).filter(m=>m.id.startsWith('team-')).map(m=>itemFromPreset(preset(m.id,m.name,'media',{kind:'media',assetId:m.id}),12,'fade')),timerSeconds:0};
 const main=newFeed('main','Main stage',now),support=newFeed('support','Supporting displays',now);
 support.program={id:uid('program'),kind:'loop',name:loop.name,items:clone(loop.items),startedAt:now,pausedAt:null};
 return {schema:VERSION,revision:0,presets:[],loops:[loop,team],media:[],feeds:[main,support],outputs:[{id:'main-display',name:'Main display',feedId:'main',fit:'fit',safe:0,screenIndex:null},{id:'support-left',name:'Support left',feedId:'support',fit:'fit',safe:0,screenIndex:null},{id:'support-right',name:'Support right',feedId:'support',fit:'fit',safe:0,screenIndex:null}]};
}
export function cuePreset(feed,p,now=currentTime()){
 feed.program=newProgram(p,now);feed.blackout=false;
 feed.timer=isTimer(p)?{status:'running',durationMs:p.durationSeconds*1000,remainingMs:p.durationSeconds*1000,endAt:now+p.durationSeconds*1000}:null;
}
export function cueLoop(feed,loop,now=currentTime()){
 if(!loop.items.length)throw new Error('Add at least one slide to this loop.');
 feed.program={id:uid('program'),kind:'loop',name:loop.name,items:clone(loop.items),startedAt:now,pausedAt:null};feed.blackout=false;
 feed.timer=loop.timerSeconds>0?{status:'running',durationMs:loop.timerSeconds*1000,remainingMs:loop.timerSeconds*1000,endAt:now+loop.timerSeconds*1000}:null;
}
export function remaining(timer,now=currentTime()){return !timer?0:Math.max(0,timer.status==='running'?timer.endAt-now:timer.remainingMs)}
export function expired(feed,now=currentTime()){return Boolean(feed.timer&&feed.timer.status==='running'&&feed.timer.endAt<=now)}
export function effectiveProgram(feed,now=currentTime()){
 if(expired(feed,now))return {id:feed.program.id+'-finished',kind:'preset',preset:feed.endPreset,startedAt:feed.timer.endAt,pausedAt:null};
 return feed.program;
}
export function timerAction(feed,action,now=currentTime()){
 const t=feed.timer;if(!t)return;
 if(action==='pause'){t.remainingMs=remaining(t,now);t.status='paused';t.endAt=null}
 if(action==='start'){if(remaining(t,now)<=0)t.remainingMs=t.durationMs;t.endAt=now+t.remainingMs;t.status='running'}
 if(action==='reset'){t.remainingMs=t.durationMs;t.status='paused';t.endAt=null}
 if(action==='add'){t.remainingMs=remaining(t,now)+60000;if(t.status==='running')t.endAt=now+t.remainingMs}
}
export function pauseLoop(feed,now=currentTime()){
 const p=feed.program;if(p.kind!=='loop')return;
 if(p.pausedAt!==null){p.startedAt+=now-p.pausedAt;p.pausedAt=null}else p.pausedAt=now;
}
export function loopPosition(program,now=currentTime()){
 const items=program.items||[];if(!items.length)return null;
 const lengths=items.map(i=>i.seconds*1000+(items.length>1&&i.transition!=='cut'?i.transitionSeconds*1000:0));
 const total=lengths.reduce((a,b)=>a+b,0);let time=(((program.pausedAt??now)-program.startedAt)%total+total)%total;
 for(let i=0;i<items.length;i++){if(time<lengths[i]||i===items.length-1){const hold=items[i].seconds*1000;return {index:i,next:(i+1)%items.length,elapsed:time,hold,progress:time<=hold?0:(time-hold)/(lengths[i]-hold),transition:items[i].transition,total}}time-=lengths[i]}
}
export function stepLoop(feed,delta,now=currentTime()){
 const p=feed.program;if(p.kind!=='loop')return;const at=loopPosition(p,now);const target=(at.index+delta+p.items.length)%p.items.length;
 const offset=p.items.slice(0,target).reduce((sum,i)=>sum+i.seconds*1000+(p.items.length>1&&i.transition!=='cut'?i.transitionSeconds*1000:0),0);
 p.startedAt=(p.pausedAt??now)-offset;
}
export function formatTime(ms){const s=Math.ceil(Math.max(0,ms)/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return h?String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'):String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')}

export function sanitizePresentationFields(scene, values={}) {
 const clean={};
 for(const field of scene.editableFields){
  const value=values?.[field.key]??scene.defaultFields[field.key];
  if(field.type==='chart'){
   const original=scene.defaultFields[field.key],source=value&&typeof value==='object'?value:original;
   const labels=Array.isArray(source.labels)&&source.labels.length?source.labels.slice(0,12).map(v=>text(v,60)):clone(original.labels);
   const series=(Array.isArray(source.series)&&source.series.length?source.series:original.series).slice(0,3).map((s,i)=>({name:text(s.name,60)||'Series '+(i+1),values:labels.map((_,j)=>clamp(s.values?.[j],-1000000000,1000000000,0))}));
   clean[field.key]={labels,series};
  }else clean[field.key]=text(value,Math.min(1200,field.maxLength||600));
 }
 return clean;
}

export function sanitizePreset(p){
 if(!p||typeof p!=='object')throw new Error('Invalid screen template.');
 const layouts=['logo','range','badge','pattern','countdown','session','agenda','media','presentation','daily-agenda'];if(!layouts.includes(p.layout))throw new Error('Unsupported template layout.');
 if(p.layout==='daily-agenda')return {...base,id:text(p.id,100)||uid('preset'),name:text(p.name,80)||'Daily agenda',layout:'daily-agenda',kind:'hold',title:text(p.title,110)||'Today at Uncommon Leaders',agendaStyle:p.agendaStyle==='night'?'night':'editorial',theme:p.agendaStyle==='night'?'dark':'light',motion:p.motion==='still'?'still':'normal',schedule:sanitizeSchedule(p.schedule)};
 if(p.layout==='presentation'){const scene=getPresentationScene(p.sceneId);if(!scene)throw new Error('Unknown presentation layout.');return {...base,id:text(p.id,100)||uid('preset'),name:text(p.name,80)||scene.name,layout:'presentation',kind:'hold',sceneId:scene.id,fields:sanitizePresentationFields(scene,p.fields),motion:p.motion==='still'?'still':'normal',theme:scene.style==='night-rodeo'?'dark':'light'};}
 const assetId=p.assetId===null?null:text(p.assetId,100);if(assetId&&!/^[a-zA-Z0-9-]+$/.test(assetId))throw new Error('Invalid media reference.');
 return {...base,id:text(p.id,100)||uid('preset'),name:text(p.name,80)||'Saved screen',layout:p.layout,kind:p.layout==='countdown'?'countdown':p.layout==='media'?'media':'hold',title:text(p.title,130),eyebrow:text(p.eyebrow,80),subtitle:text(p.subtitle,160),speaker:text(p.speaker,120),location:text(p.location,70),theme:p.backgroundId==='range-film'?'dark':['badge-film','pattern-film'].includes(p.backgroundId)?'light':p.theme==='light'?'light':'dark',motion:['still','gentle','normal'].includes(p.motion)?p.motion:'normal',durationSeconds:clamp(p.durationSeconds,1,86400,1200),agenda:Array.isArray(p.agenda)?p.agenda.slice(0,6).map(x=>text(x,100)):[],assetId,backgroundId:['range-film','badge-film','pattern-film'].includes(p.backgroundId)?p.backgroundId:null};
}
export function sanitizeLoop(p){
 if(!p||!Array.isArray(p.items)||p.items.length>200)throw new Error('Invalid slide loop.');
 return {id:text(p.id,100)||uid('loop'),name:text(p.name,80)||'Slide loop',timerSeconds:clamp(p.timerSeconds,0,86400,0),items:p.items.map(i=>({id:text(i.id,100)||uid('item'),preset:sanitizePreset(i.preset),seconds:clamp(i.seconds,1,3600,12),transition:Object.hasOwn(TRANSITIONS,i.transition)?i.transition:'fade',transitionSeconds:clamp(i.transitionSeconds,.25,5,1.2)}))};
}
export function sanitizeState(s,now=currentTime()){
 if(s?.schema!==VERSION||!Array.isArray(s.feeds)||s.feeds.length<1||s.feeds.length>16)throw new Error('This is not a supported UCL show file.');
 const n=defaultState(now);n.presets=(s.presets||[]).slice(0,100).map(sanitizePreset);n.loops=(s.loops||[]).slice(0,50).map(sanitizeLoop);
 n.media=(s.media||[]).slice(0,100).map(m=>({id:text(m.id,100),name:text(m.name,150),mime:text(m.mime,60),type:m.type==='video'?'video':'image',size:clamp(m.size,0,260000000)})).filter(m=>/^upload-[a-zA-Z0-9-]+$/.test(m.id)&&['image/png','image/jpeg','image/webp','video/mp4','video/webm'].includes(m.mime));
 const seen=new Set();n.feeds=s.feeds.map((f,i)=>{
  const id=/^[a-zA-Z0-9-]+$/.test(f.id||'')&&!seen.has(f.id)?f.id:uid('feed');seen.add(id);
  const out=newFeed(id,text(f.name,60)||'Feed '+(i+1),now),p=f.program;
  out.endPreset=sanitizePreset(f.endPreset||TEMPLATES[8]);if(isTimer(out.endPreset))out.endPreset=clone(TEMPLATES[8]);
  if(p?.kind==='loop'){const loop=sanitizeLoop(p);if(loop.items.length)out.program={...loop,id:text(p.id,100)||uid('program'),kind:'loop',startedAt:clamp(p.startedAt,0,9e15,now),pausedAt:p.pausedAt===null?null:clamp(p.pausedAt,0,9e15,now)}}
  else if(p?.preset)out.program={...newProgram(sanitizePreset(p.preset),now),id:text(p.id,100)||uid('program'),startedAt:clamp(p.startedAt,0,9e15,now)};
  if(f.timer){const t=f.timer;out.timer={status:t.status==='running'?'running':'paused',durationMs:clamp(t.durationMs,1000,86400000,1200000),remainingMs:clamp(t.remainingMs,0,86400000,0),endAt:t.status==='running'?clamp(t.endAt,0,9e15,now):null}}
  out.blackout=Boolean(f.blackout);return out;
 });
 const ids=new Set(n.feeds.map(f=>f.id)),outputIds=new Set();n.outputs=(s.outputs||[]).slice(0,32).map((o,i)=>{const id=/^[a-zA-Z0-9-]+$/.test(o.id||'')&&!outputIds.has(o.id)?o.id:uid('display');outputIds.add(id);return {id,name:text(o.name,60)||'Display '+(i+1),feedId:ids.has(o.feedId)?o.feedId:n.feeds[0].id,fit:['fit','fill','stretch'].includes(o.fit)?o.fit:'fit',safe:clamp(o.safe,0,10),screenIndex:o.screenIndex===null?null:clamp(o.screenIndex,0,32)}});n.revision=clamp(s.revision,0,9e15,0);return n;
}
