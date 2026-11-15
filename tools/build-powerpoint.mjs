import fs from 'node:fs/promises';
import {readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function dependency(name){try{return require(name)}catch(error){const modules=process.env.PPTX_NODE_MODULES||path.join(process.env.HOME||'','/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');return require(path.join(modules,name))}}
const pptxgen=dependency('pptxgenjs'),sharp=dependency('sharp');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'backups'),ART=path.join(ROOT,'assets/art'),MEDIA=path.join(ROOT,'assets/media');
await fs.mkdir(path.join(OUT,'elements'),{recursive:true});await fs.mkdir(path.join(OUT,'fonts'),{recursive:true});
const C={green:'192520',cream:'FDFFF2',lime:'F0FE91',muted:'92A28D'};
const px=n=>n/144,pt=n=>n/2;
const family='Season Mix-TRIAL';
for(const f of ['season-regular.otf','season-italic.otf'])await fs.copyFile(path.join(ROOT,'assets/fonts',f),path.join(OUT,'fonts',f));
for(const f of await fs.readdir(ART))await fs.copyFile(path.join(ART,f),path.join(OUT,'elements',f));
await fs.copyFile(path.join(ROOT,'tools/badge-film/assets/badge-matched.png'),path.join(OUT,'elements/badge.png'));
await fs.copyFile(path.join(ROOT,'tools/pattern-film/assets/pattern-matched.png'),path.join(OUT,'elements/pattern.png'));
await fs.copyFile(path.join(ROOT,'tools/range-film/assets/grass.svg'),path.join(OUT,'elements/grass.svg'));
await fs.writeFile(path.join(OUT,'elements/star.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><path fill="#192520" d="M25 0Q28 22 50 25Q28 28 25 50Q22 28 0 25Q22 22 25 0Z"/></svg>');
for(const name of ['star','grass'])await sharp(path.join(OUT,'elements',name+'.svg'),{density:600}).resize({height:2160}).png().toFile(path.join(OUT,'elements',name+'.png'));

async function coloredSVG(name,color){
 let s=await fs.readFile(path.join(ART,name+'.svg'),'utf8');
 s=s.replace(/<svg([^>]*)>/,'<svg$1><style>path,rect,polygon,circle,ellipse{fill:#'+color+' !important}</style>');
 const target=path.join(OUT,'elements',name+'-'+color.toLowerCase()+'.svg');await fs.writeFile(target,s);
 const png=target.replace('.svg','.png');await sharp(Buffer.from(s),{density:600}).resize({width:name==='cowgirl'?2300:3840}).png().toFile(png);
 return {svg:target,png};
}
const logos={dark:await coloredSVG('leaders-logo',C.green),lime:await coloredSVG('leaders-logo',C.lime)};
const cowgirl=await coloredSVG('cowgirl',C.green);
// SVG remains embedded as vector. Its explicit PNG fallback is restored by the OOXML finishing step.
function vector(slide,file,x,y,w,h,name){slide.addImage({path:file.svg,x:px(x),y:px(y),w:px(w),h:px(h),objectName:name});}
function text(slide,value,x,y,w,h,size,{sans=false,color=C.green,italic=false,name='Editable text',align='left',bold=false}={}){
 slide.addText(value,{x:px(x),y:px(y),w:px(w),h:px(h),fontFace:sans?'Inter UCL':family,fontSize:pt(size),color,margin:0,breakLine:false,paraSpaceAfter:0,lineSpacingMultiple:1.04,valign:'top',align,bold,italic,fit:'shrink',objectName:name});
}
function background(slide,id){const jpg=path.join(MEDIA,id+'.jpg'),video=id==='quiet-range-4k'?path.join(ROOT,'_qa/ppt-media',id+'.mp4'):path.join(MEDIA,id+'.mp4');slide.addMedia({type:'video',path:video,cover:'image/jpeg;base64,'+readFileSync(jpg).toString('base64'),x:0,y:0,w:13.333333,h:7.5,objectName:'Looping video background · '+id});}
function footer(slide,light=true){
 const col=light?C.green:C.cream;
 slide.addShape('line',{x:px(100),y:px(969),w:px(1720),h:0,line:{color:col,transparency:78,width:.45},objectName:'Footer rule'});
 text(slide,'AUSTIN, TEXAS',100,1001,1100,43,18,{sans:true,color:col,name:'Editable location'});
 slide.addImage({path:path.join(ART,'company-wordmark.png'),x:px(1480),y:px(1001),w:px(340),h:px(26),objectName:'The Uncommon Business wordmark'});
}
function makeDeck(title){const pres=new pptxgen();pres.layout='LAYOUT_WIDE';pres.author='The Uncommon Business';pres.subject='Uncommon Leaders Live · Austin holding screens';pres.title=title;pres.company='The Uncommon Business';pres.lang='en-US';pres.theme={headFontFace:family,bodyFontFace:'Inter UCL',lang:'en-US'};return pres}
const specs=[
 {name:'01 · Logo & stars',film:'leaders-stars-4k',type:'logo',notes:'Ready-to-play 4K logo hold. The logo is part of this finished film. For custom copy, duplicate one of the editable templates that follow.'},
 {name:'02 · Quiet range',film:'quiet-range-4k',type:'range',title:"We'll begin\nshortly.",subtitle:'Make yourself at home.'},
 {name:'03 · Austin intermission',film:'badge-4k',type:'badge',title:"We'll be\nright back.",subtitle:'Take a breath. Stay a while.'},
 {name:'04 · Austin welcome',film:'pattern-4k',type:'pattern',title:'Make yourself\nat home.',subtitle:"We'll begin shortly."},
 {name:'05 · We’re starting',film:'badge-4k',type:'badge',title:"We're\nstarting.",subtitle:'Welcome back.'},
 {name:'06 · Session introduction',film:'quiet-range-4k',type:'session',title:'Uncommon\nLeaders Live',subtitle:'Session title or speaker name'},
 {name:'07 · Agenda',film:'pattern-4k',type:'agenda',title:"What's ahead."},
 {name:'08 · Return time',film:'quiet-range-4k',type:'return',title:'Take a\nbreather.',subtitle:'We return at',time:'2:30 PM'},
 {name:'09 · Countdown layout',film:'quiet-range-4k',type:'countdown',title:"We'll begin\nshortly.",subtitle:'The next session begins in',time:'20:00',hidden:true,notes:'EDITABLE DESIGN TEMPLATE ONLY. The 20:00 value is a native text box, not a running PowerPoint timer. Use the web display for a live countdown and automatic screen change, or replace this text box with your preferred PowerPoint countdown add-in. This slide is hidden to avoid presenting a static countdown by mistake.'}
];
const heroReady=existsSync(path.join(MEDIA,'character-hat-tip-4k.mp4'))&&existsSync(path.join(MEDIA,'character-hat-tip-4k.jpg'));
const deckSpecs=heroReady?[{name:'Hero · Cowboy hat tip',film:'character-hat-tip-4k',type:'logo',duration:15,notes:'Ready-to-play hero hold. A short character motion appears once per 15-second cycle with a quiet hold between movements. The logo is part of the finished film. Use the other templates for editable messages.'},...specs]:specs;
function addScreen(pres,spec){
 const s=pres.addSlide();s.background={color:spec.type==='range'||spec.type==='session'||spec.type==='return'||spec.type==='countdown'||spec.type==='logo'?C.green:C.cream};background(s,spec.film);
 if(spec.type==='range'){text(s,spec.title,110,420,825,330,118,{color:C.cream,name:'Editable hold message'});text(s,spec.subtitle,115,775,780,80,30,{sans:true,color:C.cream,name:'Editable subheading'})}
 if(spec.type==='badge'){text(s,spec.title,110,365,940,340,147,{name:'Editable hold message'});text(s,spec.subtitle,117,774,850,80,34,{sans:true,name:'Editable subheading'})}
 if(spec.type==='pattern'){text(s,spec.title,865,418,940,330,127,{name:'Editable welcome message'});text(s,spec.subtitle,875,797,850,75,34,{sans:true,name:'Editable subheading'})}
 if(spec.type==='session'){text(s,'UP NEXT',115,360,800,55,27,{sans:true,color:C.lime,name:'Editable eyebrow'});text(s,spec.title,110,445,825,300,112,{color:C.cream,name:'Editable session title'});text(s,spec.subtitle,115,793,800,80,31,{sans:true,color:C.cream,name:'Editable speaker or session line'})}
 if(spec.type==='agenda'){
  text(s,spec.title,865,392,940,155,111,{name:'Editable agenda heading'});
  ['Welcome & connection','Sessions & live builds','Breaks & conversations'].forEach((v,i)=>{text(s,String(i+1).padStart(2,'0'),875,600+i*93,80,65,25,{sans:true,color:'74816C',name:'Agenda number '+(i+1)});text(s,v,990,585+i*93,785,85,47,{name:'Editable agenda item '+(i+1)})});
 }
 if(spec.type==='return'||spec.type==='countdown'){text(s,spec.title,110,338,825,250,106,{color:C.cream,name:'Editable break message'});text(s,spec.subtitle,115,642,780,50,28,{sans:true,color:C.cream,name:'Editable time label'});text(s,spec.time,105,711,825,180,144,{sans:true,color:C.lime,name:spec.type==='countdown'?'Editable static countdown placeholder':'Editable return time'})}
 s.addNotes((spec.notes||'Editable template: change the native text boxes in Normal view. The full-slide 4K video sits behind them and is set to start automatically and loop until you advance.')+'\n\nBackground: '+spec.film+'.mp4, 3840 × 2160, '+(spec.duration||20)+' seconds, silent. Keep the video at the back of the slide. Use the Selection Pane to choose text or the video.\n\nFonts: Season Mix-TRIAL and Inter UCL. Inter UCL is the static Regular instance of the supplied Inter variable font. Install the fonts from the adjacent fonts folder and reopen PowerPoint before editing.\n\nThe web console handles live countdowns, automatic end screens, and independent display feeds. PowerPoint runs one slide show on its selected output.');
 return s;
}
async function elements(pres){
 const s=pres.addSlide();s.background={color:C.cream};
 text(s,'The elements.',90,68,1500,150,96,{name:'Elements page title'});text(s,'Select, copy, and reuse each asset. This page is hidden during the slide show.',94,194,1690,50,26,{sans:true,color:'67765E',name:'Elements page guidance'});
 const cells=[{name:'UNCOMMON LEADERS · VECTOR',kind:'logo'},{name:'AUSTIN COWGIRL · VECTOR',kind:'cowgirl'},{name:'QUIET RANGE · ORIGINAL PNG',file:'horse.png'},
 {name:'BOTANICAL BADGE',file:'badge.png'},{name:'AUSTIN PATTERN',file:'pattern.png'},{name:'TEXAS CAPITOL',file:'capitol.png'},{name:'THE UNCOMMON BUSINESS',file:'company-wordmark.png'},{name:'TWINKLE STAR · VECTOR',kind:'star'},{name:'SWAYING GRASS · VECTOR',kind:'grass'}].map((c,i)=>({...c,x:90+(i%3)*580,y:272+Math.floor(i/3)*223,w:540,h:210}));
 for(const c of cells){
  const cy=c.y,ch=c.h-45;
  if(c.kind==='logo')vector(s,logos.dark,c.x+65,cy+12,410,410*116.4292/361.93769,'Copyable vector Uncommon Leaders logo');
  else if(c.kind==='cowgirl')vector(s,cowgirl,c.x+204,cy,126,169,'Copyable vector Austin cowgirl');
  else if(c.kind==='star')vector(s,{svg:path.join(OUT,'elements/star.svg')},c.x+215,cy+20,110,110,'Copyable vector twinkle star');
  else if(c.kind==='grass')vector(s,{svg:path.join(OUT,'elements/grass.svg')},c.x+245,cy,32,170,'Copyable vector swaying grass');
  else {const file=path.join(OUT,'elements',c.file),meta=await sharp(file).metadata(),w=meta.width,h=meta.height;const sc=Math.min((c.w-34)/w,ch/h);if(c.file==='company-wordmark.png')s.addShape('rect',{x:px(c.x),y:px(cy+25),w:px(c.w),h:px(ch-50),fill:{color:C.green},line:{color:C.green},objectName:'Wordmark contrast backing'});s.addImage({path:file,x:px(c.x+(c.w-w*sc)/2),y:px(cy+(ch-h*sc)/2),w:px(w*sc),h:px(h*sc),objectName:'Copyable full-resolution '+c.file});}
  text(s,c.name,c.x,cy+c.h-35,c.w,40,17,{sans:true,color:'67765E',name:'Asset label'});
 }
 const colors=[C.green,C.cream,C.lime];colors.forEach((c,i)=>{s.addShape('rect',{x:px(90+i*230),y:px(980),w:px(50),h:px(50),fill:{color:c},line:{color:'CBD3C0',width:.5},objectName:'Brand color #'+c});text(s,'#'+c,153+i*230,989,160,40,20,{sans:true,name:'Color value'})});
 text(s,'Season Mix + Inter',965,970,850,60,43,{name:'Typography sample'});text(s,'Separate original assets are also in the elements folder.',965,1030,850,35,18,{sans:true,color:'67765E',name:'Asset folder note'});
 s.addNotes('This is a hidden source-elements slide. Select any individual asset, copy it, and paste it into another slide. The native logo and cowgirl SVGs remain embedded as vectors. PNG art retains its original source resolution, rather than a screenshot of this page. The adjacent elements folder also contains the original separate files. The grass and star decorative elements are embedded in the background videos and available in the source projects.');
}

for(const film of new Set(deckSpecs.map(s=>s.film))){await fs.access(path.join(MEDIA,film+'.mp4'));await fs.access(path.join(MEDIA,film+'.jpg'))}
await fs.mkdir(path.join(ROOT,'_qa/ppt-media'),{recursive:true});
const rangeSource=path.join(MEDIA,'quiet-range-4k.mp4'),rangeCopy=path.join(ROOT,'_qa/ppt-media/quiet-range-4k.mp4');
if(!existsSync(rangeCopy)||statSync(rangeCopy).mtimeMs<statSync(rangeSource).mtimeMs)execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',rangeSource,'-c:v','libx264','-preset','fast','-crf','20','-threads','2','-pix_fmt','yuv420p','-an','-movflags','+faststart',rangeCopy],{stdio:'inherit'});
await fs.writeFile(path.join(ROOT,'_qa/ppt-build-manifest.json'),JSON.stringify({'ucl-live-hold-screens.pptx':{hidden:[...deckSpecs.map((s,i)=>s.hidden?i+1:null).filter(Boolean),deckSpecs.length+1]},'ucl-supporting-loop.pptx':{hidden:[]}},null,2));
const main=makeDeck('Uncommon Leaders Live · Editable holding screens');deckSpecs.forEach(s=>addScreen(main,s));await elements(main);await main.writeFile({fileName:path.join(OUT,'ucl-live-hold-screens.pptx'),compression:true});
const loop=makeDeck('Uncommon Leaders Live · Supporting display loop');specs.slice(0,4).forEach(s=>addScreen(loop,s));await loop.writeFile({fileName:path.join(OUT,'ucl-supporting-loop.pptx'),compression:true});
execFileSync(process.env.PYTHON||'python3',[path.join(ROOT,'tools/build-powerpoint-finish.py')],{stdio:'inherit'});
console.log('Built editable holding-screen deck and supporting display loop.');
