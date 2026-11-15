import fs from 'node:fs/promises';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function dependency(name){try{return require(name)}catch{const modules=process.env.PPTX_NODE_MODULES||path.join(process.env.HOME||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');return require(path.join(modules,name))}}
const PptxGenJS=dependency('pptxgenjs'),sharp=dependency('sharp');
const STUDIO=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.dirname(STUDIO),OUT=path.join(STUDIO,'output');
const C={green:'192520',cream:'FDFFF2',lime:'F0FE91',muted:'64735C',wash:'E8EDE0'};
const px=n=>n/144,pt=n=>n/2,hex=s=>(s||C.green).replace('#','');
await fs.mkdir(OUT,{recursive:true});
for(const d of ['fonts','elements'])await fs.mkdir(path.join(OUT,d),{recursive:true});
for(const f of ['season-regular.otf','season-italic.otf','inter-ucl-regular.ttf'])await fs.copyFile(path.join(ROOT,'backups/fonts',f),path.join(OUT,'fonts',f));
const sourceFiles=['leaders-logo-192520.svg','leaders-logo-f0fe91.svg','cowgirl-192520.svg','horse.png','badge.png','pattern.png','capitol.png','company-wordmark.png','star.svg','grass.svg'];
for(const f of sourceFiles)await fs.copyFile(path.join(ROOT,'backups/elements',f),path.join(OUT,'elements',f));
const cutouts=['longhorn-cutout.png','roping-cowboy-cutout.png','dancing-cowgirl-cutout.png'];
for(const f of cutouts){await fs.access(path.join(STUDIO,'characters',f));await fs.copyFile(path.join(STUDIO,'characters',f),path.join(OUT,'elements',f));}
const pres=new PptxGenJS();pres.layout='LAYOUT_WIDE';pres.author='The Uncommon Business';pres.subject='Seven visual directions and native editable content templates';pres.title='Uncommon Leaders · Presentation Design Studio';pres.company='The Uncommon Business';pres.lang='en-US';pres.theme={headFontFace:'Season Mix-TRIAL',bodyFontFace:'Inter UCL',lang:'en-US'};
const manifest=[];
async function image(slide,e){
 const file=path.resolve(ROOT,e.path);const meta=await sharp(file).metadata();
 const ratio=meta.width/meta.height,box=e.w/e.h;let {x,y,w,h}=e;
 if(e.fit!=='cover'){if(ratio>box){h=w/ratio;y+=(e.h-h)/2}else{w=h*ratio;x+=(e.w-w)/2}}
 const opts={path:file,x:px(x),y:px(y),w:px(w),h:px(h),rotate:e.rotate||0,transparency:(1-(e.opacity??1))*100,objectName:e.name||'Reusable artwork · '+path.basename(file)};
 if(e.fit==='cover')Object.assign(opts,pres.imageSizingCrop(file,px(e.x),px(e.y),px(e.w),px(e.h)));
 slide.addImage(opts);
}
function text(slide,e){slide.addText(e.text,{x:px(e.x),y:px(e.y),w:px(e.w),h:px(e.h),fontFace:e.font==='Season'?'Season Mix-TRIAL':'Inter UCL',fontSize:pt(e.size),color:hex(e.color),bold:(e.weight||400)>=600,italic:!!e.italic,margin:0,paraSpaceAfter:0,lineSpacingMultiple:e.lineHeight||1.04,charSpacing:pt(e.letterSpacing||0),valign:'top',align:e.align||'left',rotate:e.rotate||0,transparency:(1-(e.opacity??1))*100,fit:'shrink',objectName:e.name||'Editable · '+e.text.replace(/\n/g,' ').slice(0,70)});}
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
 if(e.chartType==='bar')Object.assign(opts,{barDir:'col',catName:'',gapSizePct:110,varyColors:true});else Object.assign(opts,{lineSize:3,lineDataSymbol:'circle',lineDataSymbolSize:8,lineDataSymbolLineSize:1,lineDataSymbolLineColor:C.green});
 slide.addChart(e.chartType,e.data,opts);
}
async function add(spec){const slide=pres.addSlide();slide.background={color:hex(spec.background)};for(const e of spec.elements){if(e.type==='text')text(slide,e);else if(e.type==='image')await image(slide,e);else if(e.type==='chart')chart(slide,e);else shape(slide,e)}slide.addNotes((spec.notes||'Duplicate this slide and replace the editable text with your message.')+'\n\nFonts: Season Mix-TRIAL and Inter UCL. Install the fonts in the adjacent fonts folder before editing on another computer. All text, chart data, and simple shapes are editable; illustrations remain separate image objects.');manifest.push({slide:pres._slides.length,id:spec.id,name:spec.name,role:spec.role,style:spec.style});return slide;}
const T=(text,x,y,w,h,size=40,font='Inter',color=C.green,other={})=>({type:'text',text,x,y,w,h,size,font,color,...other});
const R=(x,y,w,h,fill,other={})=>({type:'rect',x,y,w,h,fill,...other});
const I=(file,x,y,w,h)=>({type:'image',path:file,x,y,w,h,fit:'contain'});
await add({id:'how-to',name:'Start here',role:'guide',style:'toolkit',background:C.green,notes:'Choose a visual direction, copy the content templates you need into a new file, and replace all bracketed copy and example data before presenting.',elements:[I('backups/elements/leaders-logo-f0fe91.svg',110,75,390,126),T('Presentation\ndesign studio.',110,285,1650,365,160,'Season',C.cream),T('7 directions. A toolkit for your next message.',118,725,1530,90,49,'Inter',C.lime),T('02–15  Explore seven visual directions\n16–37  Duplicate editable content layouts\n38–42  Use animated holds\n43–44  Copy components and full-resolution elements',120,866,1660,160,27,'Inter',C.cream)]});
const designs=JSON.parse(await fs.readFile(path.join(STUDIO,'designs/slides.json'),'utf8'));
if(designs.slides.length!==14)throw Error('Expected 14 finalized style previews; got '+designs.slides.length);
for(const spec of designs.slides)await add(spec);
const layouts=JSON.parse(await fs.readFile(path.join(STUDIO,'toolkit-content.json'),'utf8'));
for(const spec of layouts.slides)await add(spec);
const holdSpecs=[
 {film:'character-hat-tip-4k',name:'Character hat tip',notes:'A finished 15-second film: nine seconds quiet, five seconds of motion, and one second to settle. Character footage is enlarged within a native 4K master; the logo is baked into this film.'},
 {film:'leaders-stars-4k',name:'Logo + stars',notes:'A finished 20-second 4K logo hold. The logo is part of the film; duplicate the following background-only templates for editable messages.'},
 {film:'quiet-range-4k',name:'Quiet range',elements:[T('[Your message\ngoes here]',110,420,825,330,118,'Season',C.cream),T('[A short supporting line.]',115,775,780,80,30,'Inter',C.cream)]},
 {film:'badge-4k',name:'Austin intermission',elements:[T('[Your message\ngoes here]',110,365,940,340,135,'Season'),T('[A short supporting line.]',117,774,850,80,34)]},
 {film:'pattern-4k',name:'Austin pattern',elements:[T('[Your message\ngoes here]',865,418,940,330,122,'Season'),T('[A short supporting line.]',875,797,850,75,34)]}
];
let rangeCopy=path.join(ROOT,'_qa/ppt-media/quiet-range-4k.mp4'),temporaryRange=false;
if(!existsSync(rangeCopy)){rangeCopy=path.join(OUT,'.build-quiet-range-4k.mp4');temporaryRange=true;execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(ROOT,'assets/media/quiet-range-4k.mp4'),'-c:v','libx264','-preset','fast','-crf','20','-threads','2','-pix_fmt','yuv420p','-an','-movflags','+faststart',rangeCopy],{stdio:'inherit'});}
for(const h of holdSpecs){const slide=pres.addSlide();const media=path.join(ROOT,'assets/media');const video=h.film==='quiet-range-4k'?rangeCopy:path.join(media,h.film+'.mp4');slide.addMedia({type:'video',path:video,cover:'image/jpeg;base64,'+readFileSync(path.join(media,h.film+'.jpg')).toString('base64'),x:0,y:0,w:13.333333,h:7.5,objectName:'Looping 4K video · '+h.name});for(const e of h.elements||[])text(slide,e);slide.addNotes((h.notes||'Replace the native text boxes. Keep the full-slide 4K video behind the editable text.')+'\n\nVideo begins automatically and loops until you advance. Silent 3840 × 2160 H.264 MP4. Use Selection Pane to select individual objects. PowerPoint provides a single slide show; use the web console for independent displays or live countdowns.');manifest.push({slide:pres._slides.length,id:h.film,name:h.name,role:'hold',style:'production'});}
await add({id:'components',name:'Reusable components',role:'source',style:'toolkit',background:C.cream,notes:'Select a text style, label, rule, number, or color swatch; copy it to your working slide and edit the text or shape.',elements:[T('Build with the basics.',110,76,1700,170,109,'Season'),T('Select and copy individual text boxes or shapes.',116,255,1650,65,31,'Inter',C.muted),T('Season Mix',110,385,800,150,120,'Season'),T('Headline / 60 pt',118,558,700,60,28,'Inter',C.muted),T('Inter for the details.',110,680,800,100,54,'Inter'),T('Body / 27 pt · Labels / 12 pt',116,814,770,60,27,'Inter',C.muted),T('LABEL / EYEBROW',1080,380,720,50,24,'Inter',C.muted,{letterSpacing:3}),R(1080,490,355,75,C.green),T('SHORT LABEL',1104,511,307,50,25,'Inter',C.lime,{align:'center'}),...[0,1,2].flatMap((n)=>[{type:'ellipse',x:1080+n*155,y:630,w:95,h:95,fill:C.lime},T(String(n+1),1100+n*155,650,55,60,39,'Inter',C.green,{align:'center'})]),{type:'line',x:1080,y:790,w:720,h:0,stroke:C.green,strokeWidth:2},...[C.green,C.cream,C.lime].flatMap((color,n)=>[R(1080+n*240,875,60,60,color,{stroke:'#C5CFBC'}),T('#'+color,1156+n*240,890,155,45,22,'Inter',C.green)])]});
const assets=[
 ['UNCOMMON LEADERS · VECTOR','leaders-logo-192520.svg'],['AUSTIN COWGIRL · VECTOR','cowgirl-192520.svg'],['QUIET RANGE · SOURCE PNG','horse.png'],['BOTANICAL BADGE','badge.png'],['AUSTIN PATTERN','pattern.png'],['TEXAS CAPITOL','capitol.png'],['THE UNCOMMON BUSINESS','company-wordmark.png'],['TWINKLE STAR · VECTOR','star.svg'],['SWAYING GRASS · VECTOR','grass.svg'],['LONGHORN · NEW CONCEPT','longhorn-cutout.png'],['ROPING COWBOY · NEW CONCEPT','roping-cowboy-cutout.png'],['DANCING COWGIRL · NEW CONCEPT','dancing-cowgirl-cutout.png']
];
const assetElements=[T('The elements.',90,45,1730,145,100,'Season'),T('Every illustration is a separate object. Copy it, resize it, make it yours.',98,195,1700,60,28,'Inter',C.muted)];
for(let n=0;n<assets.length;n++){const [label,file]=assets[n];const x=90+(n%4)*445,y=290+Math.floor(n/4)*245;if(file==='company-wordmark.png')assetElements.push(R(x+5,y+44,405,98,C.green));assetElements.push(I(path.relative(ROOT,path.join(OUT,'elements',file)),x+8,y,405,178),T(label,x+8,y+190,412,42,16,'Inter',C.muted));}
await add({id:'elements',name:'Full-resolution elements',role:'source',style:'toolkit',background:C.cream,notes:'Copy individual images from this page. The original SVGs stay vector; the PNGs retain their full source resolution. Separate files are also in output/elements. The three new character concepts are image assets, not editable vector drawings.',elements:assetElements});
const file=path.join(OUT,'ucl-presentation-design-studio.pptx');await pres.writeFile({fileName:file,compression:true});
if(temporaryRange)await fs.unlink(rangeCopy);
await fs.writeFile(path.join(OUT,'slide-index.json'),JSON.stringify(manifest,null,2));
execFileSync(process.env.PYTHON||'python3',[path.join(STUDIO,'build-toolkit-finish.py'),file],{stdio:'inherit'});
console.log('Built '+manifest.length+' native editable slides.');
