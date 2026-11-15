import fs from 'node:fs/promises';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function dependency(name){try{return require(name)}catch{const modules=process.env.PPTX_NODE_MODULES||path.join(process.env.HOME||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');return require(path.join(modules,name))}}
const PptxGenJS=dependency('pptxgenjs'),sharp=dependency('sharp');
const SYSTEM=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.dirname(SYSTEM),OUT=path.join(ROOT,'backups');
const C={green:'192520',cream:'FDFFF2',lime:'F0FE91',muted:'64735C',wash:'E8EDE0'};
const px=n=>n/144,pt=n=>n/2,hex=s=>(s||C.green).replace('#','');
await fs.mkdir(OUT,{recursive:true});
const pres=new PptxGenJS();pres.layout='LAYOUT_WIDE';pres.author='The Uncommon Business';pres.subject='Matched Modern Editorial, Big Type, and Night Rodeo presentation system';pres.title='Uncommon Leaders · Matched Presentation Kit';pres.company='The Uncommon Business';pres.lang='en-US';pres.theme={headFontFace:'Season Mix-TRIAL',bodyFontFace:'Inter UCL',lang:'en-US'};
const manifest=[];
async function image(slide,e){
 const file=path.resolve(ROOT,e.path);const meta=await sharp(file).metadata();
 const ratio=meta.width/meta.height,box=e.w/e.h;let {x,y,w,h}=e;
 if(e.fit!=='cover'){if(ratio>box){h=w/ratio;y+=(e.h-h)/2}else{w=h*ratio;x+=(e.w-w)/2}}
 const opts={path:file,x:px(x),y:px(y),w:px(w),h:px(h),rotate:e.rotate||0,transparency:(1-(e.opacity??1))*100,objectName:e.name||'Reusable artwork · '+path.basename(file)};
 if(e.fit==='cover')Object.assign(opts,pres.imageSizingCrop(file,px(e.x),px(e.y),px(e.w),px(e.h)));
 slide.addImage(opts);
}
function text(slide,e){slide.addText(e.text,{x:px(e.x),y:px(e.y),w:px(e.w),h:px(e.h),fontFace:e.font==='Season'?'Season Mix-TRIAL':'Inter UCL',fontSize:pt(e.size),color:hex(e.color),bold:(e.weight||400)>=600,italic:!!e.italic,margin:0,paraSpaceAfter:0,lineSpacingMultiple:e.lineHeight||1.04,charSpacing:pt(e.letterSpacing||0),valign:'top',align:e.align||'left',rotate:e.rotate||0,transparency:(1-(e.opacity??1))*100,fit:'shrink',wrap:e.multiline===false?false:true,objectName:e.key?'Editable field · '+e.key:e.name||'Editable · '+e.text.replace(/\n/g,' ').slice(0,70)});}
function shape(slide,e){
 const fill=e.fill&&e.fill!=='transparent'?{color:hex(e.fill),transparency:(1-(e.opacity??1))*100}:{color:C.cream,transparency:100};
 const stroke=e.stroke&&e.stroke!=='transparent'?{color:hex(e.stroke),width:pt(e.strokeWidth??1),transparency:(1-(e.opacity??1))*100}:{color:C.cream,transparency:100,width:0};
 const opts={x:px(e.x),y:px(e.y),w:px(e.w),h:px(e.h),fill,line:stroke,rotate:e.rotate||0,objectName:e.name||'Editable '+e.type};
 if(e.type==='line'){
  if(e.w<0){opts.x=px(e.x+e.w);opts.w=px(-e.w);opts.flipH=true}
  if(e.h<0){opts.y=px(e.y+e.h);opts.h=px(-e.h);opts.flipV=true}
  if(e.endArrowType)opts.line.endArrowType=e.endArrowType;
 }
 slide.addShape(e.type,opts);
}
function chart(slide,e){
 const opts={x:px(e.x),y:px(e.y),w:px(e.w),h:px(e.h),catAxisLabelFontFace:'Inter UCL',catAxisLabelFontSize:15,catAxisLabelColor:C.green,valAxisLabelFontFace:'Inter UCL',valAxisLabelFontSize:12,valAxisLabelColor:C.muted,chartColors:[C.green,C.lime,C.muted],showLegend:false,showTitle:false,showValue:true,showBorder:false,showCatName:false,showSerName:false,fontFace:'Inter UCL',fontSize:14,showCatName:false,dataLabelFormatCode:'0',dataLabelPosition:e.chartType==='bar'?'outEnd':'t',dataLabelColor:C.green,dataLabelFontFace:'Inter UCL',dataLabelFontSize:12,catAxisLineColor:'B8C4AE',catAxisLineSize:1,valAxisLineColor:'B8C4AE',valAxisLineSize:0,catAxisLabelPos:'low',valGridLine:{color:'CCD5C2',width:.5},showCatName:false,showValue:true,showMarker:true,showLine:true,showShadow:false,showLeaderLines:false,showPercent:false,showSymbol:false,showArea:false,showDataLabelLegendKey:false,showCatName:false,showBlankAs:'gap',catAxisMajorTickMark:'none',valAxisMajorTickMark:'none',valAxisMinVal:0,valAxisMaxVal:e.chartType==='bar'?100:60,valAxisMajorUnit:e.chartType==='bar'?20:10,showTitle:false,showLegend:false,showCatName:false,serAxisLabelFontFace:'Inter UCL',layout:{x:.05,y:.03,w:.9,h:.85},showBorder:false,chartArea:{fill:{color:C.cream},line:{color:C.cream,transparency:100}},plotArea:{fill:{color:C.cream},line:{color:C.cream,transparency:100}},objectName:'Editable native '+e.chartType+' chart · example data'};
 if(e.chartType==='bar')Object.assign(opts,{barDir:'col',catName:'',barGapWidthPct:110,varyColors:false});else Object.assign(opts,{lineSize:3,lineDataSymbol:'circle',lineDataSymbolSize:8,lineDataSymbolLineSize:1,lineDataSymbolLineColor:C.green});
 const data=e.data||((e.series||[]).map(s=>({name:s.name,labels:e.labels,values:s.values})));if(e.chartStyle){Object.assign(opts,{chartColors:e.chartStyle.colors.slice(0,data.length).map(hex),catAxisLabelFontSize:pt(e.chartStyle.fontSize),valAxisLabelFontSize:pt(e.chartStyle.fontSize),dataLabelFontSize:pt(e.chartStyle.fontSize),catAxisLineColor:hex(e.chartStyle.axisColor),valGridLine:{color:hex(e.chartStyle.gridColor),width:.5}});}const values=data.flatMap(s=>s.values),rawMin=Math.min(0,...values),rawMax=Math.max(1,...values),span=rawMax-rawMin;let step=10**Math.floor(Math.log10(span/4));const rough=span/4/step;step*=rough>5?10:rough>2?5:rough>1?2:1;Object.assign(opts,{showValue:false,valAxisMinVal:Math.floor(rawMin/step)*step,valAxisMaxVal:Math.ceil(rawMax/step)*step,valAxisMajorUnit:step,layout:{x:75/e.w,y:18/e.h,w:(e.w-100)/e.w,h:(e.h-88)/e.h},catAxisLineShow:false,valAxisLineShow:false,catAxisLabelFontSize:11.5,valAxisLabelFontSize:10.5,barGapWidthPct:54,lineSize:2,lineDataSymbolSize:6});slide.addChart(e.chartType,data,opts);
}
function background(slide,media){const video=media.optimizedVideo||media.video;slide.addMedia({type:'video',path:path.resolve(ROOT,video),cover:'image/jpeg;base64,'+readFileSync(path.resolve(ROOT,media.poster)).toString('base64'),x:0,y:0,w:13.333333,h:7.5,objectName:'Looping 4K background · '+media.id});}
async function add(spec){
 const slide=pres.addSlide();slide.background={color:hex(spec.background)};
 if(spec.backgroundMedia)background(slide,spec.backgroundMedia);
 for(const original of spec.elements||[]){const e={...original};if(e.key&&spec.defaultFields?.[e.key]!==undefined){const value=spec.defaultFields[e.key];if(e.type==='text')e.text=String(value);if(e.type==='chart'){e.labels=value.labels;e.series=value.series;e.data=undefined;}}
  if(e.type==='text')text(slide,e);else if(e.type==='image')await image(slide,e);else if(e.type==='chart')chart(slide,e);else if(['rect','line','ellipse'].includes(e.type))shape(slide,e);else throw Error('Unsupported native element '+e.type);
 }
 slide.addNotes((spec.notes||'Duplicate this slide and replace its native editable text with your message.')+(spec.elements?.some(e=>e.type==='chart')?' For a different numeric range, set axis bounds and units to Automatic in Format Axis.':'')+'\n\n'+(spec.backgroundMedia?'This layout matches the live display system. The background film stays behind native editable text, shapes, and chart data. The film starts automatically and loops until you advance. ':'')+'Use the Selection Pane to select individual objects. Install Season Mix-TRIAL and Inter UCL from the adjacent fonts folder on another computer.');
 manifest.push({slide:pres._slides.length,id:spec.id,name:spec.name,role:spec.role,style:spec.style,backgroundMedia:spec.backgroundMedia?.id,editableFields:spec.editableFields||[]});return slide;
}
const T=(text,x,y,w,h,size=40,font='Inter',color=C.green,other={})=>({type:'text',text,x,y,w,h,size,font,color,...other});
const R=(x,y,w,h,fill,other={})=>({type:'rect',x,y,w,h,fill,...other});
const I=(file,x,y,w,h)=>({type:'image',path:file,x,y,w,h,fit:'contain'});
const scenesFile=path.join(ROOT,'assets/presentation-system/scenes.json');
const canonical=JSON.parse(await fs.readFile(scenesFile,'utf8'));
if(canonical.scenes.length!==26)throw Error('Expected 26 canonical scenes.');
const mediaFiles=new Map();
for(const s of canonical.scenes){if(s.backgroundMedia)mediaFiles.set(s.backgroundMedia.id,s.backgroundMedia);}
for(const media of mediaFiles.values()){await fs.access(path.resolve(ROOT,media.video));await fs.access(path.resolve(ROOT,media.poster));}
const reusableNotes='Copy individual native text boxes, shapes, and image objects into your working slide. All illustrations remain separate objects; original vectors retain their vector form.';
function editorialFrame(label,page){return [T('UNCOMMON LEADERS / PRESENTATION KIT',90,63,1250,40,19,'Inter',C.green,{letterSpacing:2.4}),T(label,1390,63,440,40,19,'Inter',C.green,{letterSpacing:2.4,align:'right'}),{type:'line',x:85,y:126,w:1745,h:0,stroke:C.green,strokeWidth:2},T('UNCOMMON LEADERS LIVE',90,1004,1100,40,19,'Inter',C.green,{letterSpacing:2.4}),T(page,1600,1004,230,40,19,'Inter',C.green,{letterSpacing:2.4,align:'right'})];}
await add({id:'matched-guide',name:'Start here',role:'guide',style:'editorial',background:C.cream,notes:'Save a copy of this kit. Duplicate the layouts you need and replace bracketed copy or sample chart data. The native slides match the scene definitions in the live display system.',elements:[...editorialFrame('START HERE','01'),T('A presentation\nthat feels like us.',85,230,1190,390,158,'Season'),T('Modern Editorial for the story.\nBig Type for the idea.\nNight Rodeo for the next chapter.',95,725,1120,200,43,'Inter'),{type:'line',x:1310,y:190,w:0,h:755,stroke:C.green,strokeWidth:1},T('02–27',1395,240,410,95,64,'Season'),T('Matching editable scenes',1400,351,410,90,31,'Inter'),T('28–32',1395,492,410,95,64,'Season'),T('Looping 4K holds',1400,603,410,90,31,'Inter'),T('33–34',1395,745,410,95,64,'Season'),T('Components and elements',1400,856,410,90,31,'Inter')]});
for(const scene of canonical.scenes)await add(scene);

let rangeCopy=path.join(ROOT,'_qa/ppt-media/quiet-range-4k.mp4'),temporaryRange=false;
if(!existsSync(rangeCopy)){rangeCopy=path.join(SYSTEM,'qa/quiet-range-4k.mp4');temporaryRange=true;execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(ROOT,'assets/media/quiet-range-4k.mp4'),'-c:v','libx264','-preset','fast','-crf','20','-threads','2','-pix_fmt','yuv420p','-an','-movflags','+faststart',rangeCopy],{stdio:'inherit'});}
const holdSpecs=[
 {film:'character-hat-tip-4k',name:'Character hat tip',notes:'A finished 15-second film: nine seconds quiet, five seconds of motion, and one second to settle. Character footage is enlarged within a native 4K composition; the logo is baked into this film.'},
 {film:'leaders-stars-4k',name:'Logo + stars',notes:'A finished 20-second 4K logo hold. The logo is part of the film; use the following background-only templates for editable messages.'},
 {film:'quiet-range-4k',name:'Quiet range',elements:[T('[Your message\ngoes here]',110,420,825,330,118,'Season',C.cream),T('[A short supporting line.]',115,775,780,80,30,'Inter',C.cream)]},
 {film:'badge-4k',name:'Austin intermission',elements:[T('[Your message\ngoes here]',110,365,940,340,135,'Season'),T('[A short supporting line.]',117,774,850,80,34)]},
 {film:'pattern-4k',name:'Austin pattern',elements:[T('[Your message\ngoes here]',865,418,940,330,122,'Season'),T('[A short supporting line.]',875,797,850,75,34)]}
];
for(const h of holdSpecs)await add({id:h.film,name:h.name,role:'hold',style:'production',background:C.green,notes:h.notes||'Replace the native message and supporting line. Keep the full-slide film behind the text.',backgroundMedia:{id:h.film,video:h.film==='quiet-range-4k'?path.relative(ROOT,rangeCopy):'assets/media/'+h.film+'.mp4',poster:'assets/media/'+h.film+'.jpg',duration:h.film==='character-hat-tip-4k'?15:20},elements:h.elements||[]});

await add({id:'matched-components',name:'Reusable components',role:'source',style:'editorial',background:C.cream,notes:reusableNotes,elements:[...editorialFrame('THE COMPONENTS','33'),T('Build with the basics.',90,185,1700,160,109,'Season'),T('Select and copy individual text boxes or shapes.',97,350,1650,65,31,'Inter',C.muted),T('Season Mix',90,490,800,150,120,'Season'),T('Headline / 60 pt',98,657,700,60,28,'Inter',C.muted),T('Inter for the details.',90,756,800,100,54,'Inter'),T('Body / 27 pt · Labels / 12 pt',96,882,770,60,27,'Inter',C.muted),{type:'line',x:1000,y:470,w:0,h:450,stroke:C.green,strokeWidth:1},T('LABEL / EYEBROW',1080,480,720,50,24,'Inter',C.muted,{letterSpacing:3}),R(1080,574,355,75,C.green),T('SHORT LABEL',1104,595,307,50,25,'Inter',C.lime,{align:'center'}),...[0,1,2].flatMap(n=>[{type:'ellipse',x:1080+n*155,y:701,w:95,h:95,fill:C.lime},T(String(n+1),1100+n*155,721,55,60,39,'Inter',C.green,{align:'center'})]),...[C.green,C.cream,C.lime].flatMap((color,n)=>[R(1080+n*240,882,60,60,color,{stroke:'#C5CFBC'}),T('#'+color,1156+n*240,897,155,45,22,'Inter',C.green)])]});

const assets=[['UNCOMMON LEADERS · VECTOR','backups/elements/leaders-logo-192520.svg'],['AUSTIN COWGIRL · VECTOR','backups/elements/cowgirl-192520.svg'],['QUIET RANGE · SOURCE PNG','backups/elements/horse.png'],['BOTANICAL BADGE','backups/elements/badge.png'],['AUSTIN PATTERN','backups/elements/pattern.png'],['TEXAS CAPITOL','backups/elements/capitol.png'],['THE UNCOMMON BUSINESS','backups/elements/company-wordmark.png'],['TWINKLE STAR · VECTOR','backups/elements/star.svg'],['SWAYING GRASS · VECTOR','backups/elements/grass.svg'],['LONGHORN · NEW CONCEPT','presentation-studio/characters/longhorn-cutout.png'],['ROPING COWBOY · NEW CONCEPT','presentation-studio/characters/roping-cowboy-cutout.png'],['DANCING COWGIRL · NEW CONCEPT','presentation-studio/characters/dancing-cowgirl-cutout.png']];
const artElements=[...editorialFrame('THE ELEMENTS','34'),T('The elements.',90,178,1730,145,100,'Season'),T('Separate original assets. Select, copy, and reuse.',98,325,1700,60,28,'Inter',C.muted)];
for(let i=0;i<assets.length;i++){const [label,file]=assets[i],x=90+(i%4)*445,y=425+Math.floor(i/4)*180;if(file.includes('company-wordmark'))artElements.push(R(x+5,y+30,405,85,C.green));artElements.push(I(file,x+8,y,405,130),T(label,x+8,y+139,412,32,15,'Inter',C.muted));}
await add({id:'matched-elements',name:'Full-resolution elements',role:'source',style:'editorial',background:C.cream,notes:reusableNotes+' PNGs retain their source pixels. The three new characters are image assets, not editable vector drawings. Separate originals remain in the adjacent elements folder and presentation-studio/characters.',elements:artElements});

const file=path.join(OUT,'ucl-matched-presentation-kit.pptx');await pres.writeFile({fileName:file,compression:true});
if(temporaryRange)await fs.unlink(rangeCopy);
await fs.writeFile(path.join(SYSTEM,'slide-index.json'),JSON.stringify(manifest,null,2));
execFileSync(process.env.PYTHON||'python3',[path.join(SYSTEM,'build-matched-finish.py'),file],{stdio:'inherit'});
const bytes=(await fs.stat(file)).size;if(bytes>=95*1024*1024)throw Error('Deck exceeds 95MiB; optimize embedded films before delivery.');
console.log('Built '+manifest.length+' matched slides ('+(bytes/1024/1024).toFixed(2)+'MiB).');
