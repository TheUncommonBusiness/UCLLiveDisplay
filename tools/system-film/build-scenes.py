"""Canonical selected presentation system: native overlays + shared background films."""
from pathlib import Path
import json, copy, shutil, math
P=Path(__file__).resolve().parents[2]
OUT=P/'assets/presentation-system'
G='#192520';C='#FDFFF2';L='#F0FE91'
designs={s['id']:s for s in json.loads((P/'presentation-studio/designs/slides.json').read_text())['slides']}
toolkit=json.loads((P/'presentation-studio/toolkit-content.json').read_text())['slides']
for name in ['leaders-logo-forest.svg','leaders-logo-cream.svg','cowgirl-forest.svg','cowgirl-cream.svg']:
 shutil.copy(P/'presentation-studio/designs/assets'/name,OUT/'art'/name)
shutil.copy(P/'backups/fonts/inter-ucl-regular.ttf',OUT/'fonts/inter-ucl-regular.ttf')
def film(name):
 return {'id':'system-'+name,'video':'assets/media/system-'+name+'.mp4','poster':'assets/media/system-'+name+'.jpg','duration':15}
def enrich(s,background):
 s=copy.deepcopy(s);s['backgroundMedia']=film(background);s['preview']='assets/presentation-system/previews/'+s['id']+'.jpg'
 s['defaultFields']={};s['editableFields']=[];elements=[];t=0;headline=0
 for e in s['elements']:
  if e['type']=='image':
   if 'cowgirl-' in e['path']:continue
   e['path']=e['path'].replace('presentation-studio/designs/assets/','assets/presentation-system/art/')
  if e['type']=='text':
   t+=1
   if e['font']=='Season' and e['size']>=110:headline+=1;key='headline-'+str(headline);label='Headline'+(' · '+str(headline) if headline>1 else '')
   elif e['y']<140:key='header-'+str(t);label='Header · '+e['text'][:32]
   elif e['y']>=990:key='footer-'+str(t);label='Footer · '+e['text'][:32]
   else:key='text-'+str(t);label=e['text'].replace('\n',' ')[:52]
   e['key']=key;e.setdefault('lineHeight',1.04);e['font']='Season' if e['font']=='Season' else 'Inter'
   maxchars=max(len(e['text'])+20,math.floor(e['w']/e['size']*1.7)*max(1,math.floor(e['h']/(e['size']*e['lineHeight'])))*2)
   meta={'key':key,'label':label,'type':'text','multiline':e['h']>=e['size']*1.7 or '\n' in e['text'],'maxLength':min(700,maxchars)}
   e['label']=label;e['multiline']=meta['multiline'];e['maxLength']=meta['maxLength'];s['editableFields'].append(meta);s['defaultFields'][key]=e['text']
  elif e['type']=='chart':
   key='chart-data';e['key']=key;e['labels']=e['data'][0]['labels'];e['series']=[{'name':d['name'],'values':d['values']} for d in e['data']]
   s['defaultFields'][key]={'labels':e['labels'],'series':e['series']};s['editableFields'].append({'key':key,'label':'Chart data','type':'chart','maxLabels':12,'maxSeries':3})
   e['chartStyle']={'colors':[G,'#8B9C84',L],'font':'Inter','fontSize':23,'axisColor':'#A4B09A','gridColor':'#DDE3D3','showLegend':False}
  elements.append(e)
 s['elements']=elements;return s
scenes=[]
for id,bg in [('editorial-opening','editorial-portrait'),('editorial-content','editorial-clean'),('big-type-opening','big-type'),('night-rodeo-opening','night-rodeo')]:scenes.append(enrich(designs[id],bg))
for n,source in enumerate(toolkit):
 if source['id']=='toolkit-section':
  s=copy.deepcopy(designs['night-rodeo-opening']);s.update(id=source['id'],name='Section divider',role='content',notes=source['notes'])
  for e in s['elements']:
   if e.get('text')=='Lead beyond':e['text']='[Section headline]'
   elif e.get('text')=='the expected.':e['text']='[The next chapter.]'
   elif e.get('text')=='A DIFFERENT STANDARD FOR HOW WE LEAD':e['text']='[ONE SENTENCE THAT SETS UP THIS SECTION.]'
   elif e.get('text')=='04 / AFTER DARK':e['text']='01 / SECTION'
   elif e.get('text')=='OPENING / 01':e['text']='UNCOMMON LEADERS LIVE'
  scenes.append(enrich(s,'night-rodeo'));continue
 if source['id']=='toolkit-big-idea':
  s=copy.deepcopy(designs['big-type-opening']);s.update(id=source['id'],name='Big idea',role='content',notes=source['notes'])
  for e in s['elements']:
   if e.get('text')=='Lead beyond':e['text']='[One clear idea]'
   elif e.get('text')=='the expected.':e['text']='[Worth remembering.]'
   elif e.get('text')=='A different standard for how we lead.':e['text']='[One sentence that makes the idea concrete.]'
  scenes.append(enrich(s,'big-type'));continue
 s=copy.deepcopy(source);s['style']='editorial';s['background']=C
 # The approved folio, running header and top rule establish the editorial system.
 e=copy.deepcopy(designs['editorial-content']['elements']);s['elements']=e[:3]+s['elements'][3:]+e[-2:]
 s['elements'][1]['text']='FIELD NOTES / '+str(n+3).zfill(2);s['elements'][-1]['text']=str(n+3).zfill(2)
 for x in s['elements']:
  if source['background']==G:
   if x.get('color') in [C,L]:x['color']=G
  if x['type']=='text':x.setdefault('lineHeight',1.04)
 # Two-way comparison gets white paper on both sides, with fine editorial rules.
 if s['id']=='toolkit-comparison':
  for x in s['elements']:
   if x['type']=='rect':x['fill']='#F0F3E7';x['stroke']='#C7D1BE';x['strokeWidth']=1
   elif x['type']=='text' and x.get('color') in [C,L]:x['color']=G
 # Remove the last remaining dark plaque from the framework; retain native geometry.
 if s['id']=='toolkit-framework':
  for x in s['elements']:
   if x['type']=='ellipse':x['fill']=L
   elif x['type']=='text' and x.get('color')==L:x['color']=G
 scenes.append(enrich(s,'editorial-clean'))
# Default sizes are measured in the shared browser renderer, then committed so PPT
# starts at the same size rather than relying on a platform-specific auto-fit.
default_sizes={'toolkit-section':{'headline-1':159,'headline-2':153},'toolkit-big-idea':{'headline-2':185},'toolkit-quote':{'headline-1':204}}
for s in scenes:
 for e in s['elements']:
  if e.get('key') in default_sizes.get(s['id'],{}):e['size']=default_sizes[s['id']][e['key']]
data={'version':1,'width':1920,'height':1080,'brand':{'forest':G,'cream':C,'lime':L,'displayFont':'Season','bodyFont':'Inter UCL','browserBodyFont':'UCLInter'},'scenes':scenes}
(OUT/'scenes.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
(OUT/'scenes.js').write_text('export const PRESENTATION_DATA = '+json.dumps(data,ensure_ascii=False)+';\nexport const PRESENTATION_SCENES = PRESENTATION_DATA.scenes;\nexport const PRESENTATION_SCENE_MAP = new Map(PRESENTATION_SCENES.map(s=>[s.id,s]));\nexport const getPresentationScene = id => PRESENTATION_SCENE_MAP.get(id);\nexport const presentationFields = sceneOrId => { const s=typeof sceneOrId === "string" ? getPresentationScene(sceneOrId) : sceneOrId; return structuredClone(s?.defaultFields || {}); };\n')
print('Wrote',len(scenes),'canonical scenes')
