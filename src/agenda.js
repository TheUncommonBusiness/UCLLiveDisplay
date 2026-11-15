const MAX_DAYS=7,MAX_ITEMS=30,PAGE_SIZE=6;
const text=(value,max,fallback='')=>typeof value==='string'?value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim().slice(0,max):fallback;
const safeId=(value,fallback)=>text(value,64).replace(/[^a-zA-Z0-9_-]/g,'')||fallback;
const validDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>'2199-12-31')return '';const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:''};
const validTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value)?value:'';
function uniqueId(raw,fallback,used){let id=safeId(raw,fallback),suffix=2;const base=id;while(used.has(id))id=base+'-'+suffix++;used.add(id);return id}

export function defaultSchedule(){
 return {days:[{id:'day-1',name:'Day 1',date:'',activeItemId:'',items:[
  {id:'session-1',time:'09:00',title:'Opening session',speaker:'[Speaker name]'},
  {id:'session-2',time:'10:00',title:'[Session title]',speaker:'[Speaker name]'},
  {id:'session-3',time:'11:00',title:'[Session title]',speaker:'[Speaker name]'},
  {id:'session-4',time:'13:00',title:'[Session title]',speaker:'[Speaker name]'},
  {id:'session-5',time:'14:00',title:'[Session title]',speaker:'[Speaker name]'},
  {id:'session-6',time:'15:00',title:'Closing session',speaker:'[Speaker name]'}
 ]}],dayId:'day-1',mode:'manual',pageSeconds:15};
}

export function sanitizeSchedule(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.days))return defaultSchedule();
 const usedDays=new Set(),days=input.days.slice(0,MAX_DAYS).map((raw,index)=>{
  const d=raw&&typeof raw==='object'?raw:{},usedItems=new Set();
  const items=(Array.isArray(d.items)?d.items:[]).slice(0,MAX_ITEMS).map((rawItem,i)=>{const it=rawItem&&typeof rawItem==='object'?rawItem:{};return {id:uniqueId(it.id,'item-'+(i+1),usedItems),time:validTime(text(it.time,100)),title:text(it.title,140),speaker:text(it.speaker,100)}});
  const active=safeId(d.activeItemId,'');return {id:uniqueId(d.id,'day-'+(index+1),usedDays),name:text(d.name,60,'Day '+(index+1)),date:validDate(text(d.date,100)),activeItemId:items.some(it=>it.id===active)?active:'',items};
 });
 if(!days.length)days.push({id:'day-1',name:'Day 1',date:'',activeItemId:'',items:[]});
 const requested=safeId(input.dayId,'');return {days,dayId:days.some(d=>d.id===requested)?requested:days[0].id,mode:'manual',pageSeconds:Number.isFinite(Number(input.pageSeconds))?Math.min(120,Math.max(5,Math.round(Number(input.pageSeconds)))):15};
}

export function activeAgendaItem(schedule,nowMs=0){
 const day=schedule?.days?.find(d=>d.id===schedule.dayId)||schedule?.days?.[0];
 return day?.activeItemId&&Array.isArray(day.items)?day.items.findIndex(item=>item.id===day.activeItemId):-1;
}

export function agendaPage(schedule,nowMs=0){
 const clean=sanitizeSchedule(schedule),day=clean.days.find(d=>d.id===clean.dayId)||clean.days[0],activeIndex=activeAgendaItem(clean,nowMs),pageCount=Math.max(1,Math.ceil(day.items.length/PAGE_SIZE));
 const clock=Number.isFinite(nowMs)?Math.max(0,nowMs):0;
 const page=activeIndex>=0?Math.floor(activeIndex/PAGE_SIZE):Math.floor(clock/(clean.pageSeconds*1000))%pageCount;
 return {day,items:day.items.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),page,pageCount,activeIndex};
}

export const AGENDA_PRESETS=[
 {id:'daily-agenda-editorial',layout:'daily-agenda',name:'Daily agenda · Editorial',title:'Today at Uncommon Leaders',theme:'light',agendaStyle:'editorial',schedule:defaultSchedule(),motion:'normal',kind:'hold'},
 {id:'daily-agenda-night',layout:'daily-agenda',name:'Daily agenda · Night',title:'Today at Uncommon Leaders',theme:'dark',agendaStyle:'night',schedule:defaultSchedule(),motion:'normal',kind:'hold'}
];
