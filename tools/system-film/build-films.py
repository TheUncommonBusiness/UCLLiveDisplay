from pathlib import Path
import shutil,json
P=Path(__file__).resolve().parents[2];ROOT=P/'tools/system-film'
configs=[
 {'id':'editorial-clean','background':'#FDFFF2','art':None,'sparkColor':'#64735C','sparks':[(1870,174,16,3.4),(42,934,11,10.7)]},
 {'id':'editorial-portrait','background':'#FDFFF2','art':['cowgirl-forest.svg',1326,242,455,610,1],'sparkColor':'#64735C','sparks':[(1805,272,16,4.2),(1293,820,10,11.6)]},
 {'id':'big-type','background':'#F0FE91','art':['cowgirl-forest.svg',1482,792,490,656,1],'sparkColor':'#192520','sparks':[(1806,847,17,13.0),(1465,1022,10,13.6)]},
 {'id':'night-rodeo','background':'#192520','art':['cowgirl-cream.svg',-220,-230,1120,1498,.18],'sparkColor':'#F0FE91','sparks':[(1838,180,20,4.3),(1504,948,13,10.4),(490,825,11,12.6)]}
]
for c in configs:
 d=ROOT/c['id'];(d/'assets').mkdir(parents=True,exist_ok=True);shutil.copy(P/'tools/star-film/assets/gsap.min.js',d/'assets/gsap.min.js')
 parts=[f'<div id="background" class="clip" style="position:absolute;inset:0;background:{c["background"]}" data-start="0" data-duration="15" data-track-index="0"></div>']
 if c['art']:
  name,x,y,w,h,op=c['art'];shutil.copy(P/'assets/presentation-system/art'/name,d/'assets'/name)
  parts.append(f'<img id="art" class="clip" src="assets/{name}" alt="" style="position:absolute;left:{2*x}px;top:{2*y}px;width:{2*w}px;height:{2*h}px;object-fit:contain;opacity:{op};transform-origin:50% 80%" data-start="0" data-duration="15" data-track-index="1">')
 for i,(x,y,size,peak) in enumerate(c['sparks']):parts.append(f'<svg id="spark-{i}" class="clip" style="position:absolute;left:{x*2}px;top:{y*2}px;width:{size*2}px;height:{size*2}px;color:{c["sparkColor"]};opacity:0" viewBox="0 0 50 50" data-start="0" data-duration="15" data-track-index="{i+2}"><path d="M25 0Q28 22 50 25Q28 28 25 50Q22 28 0 25Q22 22 25 0Z" fill="currentColor"/></svg>')
 anim=""
 if c['id']=='editorial-portrait':anim="animate('#art',t=>({y:r(-6*bell(t,7.1,5.6))}));"
 if c['id']=='big-type':anim="animate('#art',t=>({y:r(-6*bell(t,13.2,2.2)),rotation:r(.12*bell(t,13.2,2.2)),scale:r(1+.002*bell(t,13.2,2.2))}));"
 if c['id']=='night-rodeo':anim="animate('#art',t=>({scale:r(1+.004*wave(t)),opacity:r(.18+.025*wave(t))}));"
 for i,(_,_,_,peak) in enumerate(c['sparks']):anim+=f"animate('#spark-{i}',t=>({{opacity:r(.7*bell(t,{peak},1.6)),scale:r(.72+.34*bell(t,{peak},1.6))}}));"
 html='<!doctype html><html><head><meta charset="utf-8"><script src="assets/gsap.min.js"></script><style>*{box-sizing:border-box}html,body{margin:0}#root{position:relative;width:3840px;height:2160px;overflow:hidden}</style></head><body><div id="root" data-composition-id="system-'+c['id']+'" data-width="3840" data-height="2160" data-duration="15" data-start="0" data-fps="30">'+''.join(parts)+'</div><script>const tl=gsap.timeline({paused:true});const r=x=>Number(x.toFixed(6));const wave=t=>(1-Math.cos(t*Math.PI*2/15))/2;function bell(t,peak,duration){const x=(t-(peak-duration/2))/duration;return x<=0||x>=1?0:Math.sin(Math.PI*x)**2}function animate(target,values){gsap.set(target,values(0));tl.set(target,values(0),0);const keyframes=[];for(let j=1;j<=120;j++)keyframes.push({...values(j/8),duration:.125,ease:"none"});tl.to(target,{keyframes,ease:"none"},0)}'+anim+'window.__timelines={"system-'+c['id']+'":tl};window.seekHold=t=>{tl.totalTime(t,false)};</script></body></html>'
 (d/'index.html').write_text(html)
(ROOT/'film-specs.json').write_text(json.dumps(configs,indent=2))
print('Four deterministic 15-second background films authored.')
