"""Apply native PowerPoint autoplay/loop settings and deduplicate embedded assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys,re,hashlib,json
try:
 from defusedxml import minidom
except ImportError:
 sys.path.insert(0,'/private/tmp/ucl-pptx-validation-deps')
 from defusedxml import minidom
ROOT=Path(__file__).resolve().parent.parent
P='http://schemas.openxmlformats.org/presentationml/2006/main';A='http://schemas.openxmlformats.org/drawingml/2006/main';R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def fragment(doc,s):
 wrapper=minidom.parseString('<wrap xmlns:p="'+P+'" xmlns:a="'+A+'" xmlns:r="'+R+'">'+s+'</wrap>')
 return [doc.importNode(x,True) for x in wrapper.documentElement.childNodes]
file=Path(sys.argv[1]);report=[]
with ZipFile(file) as z:parts={n:z.read(n) for n in z.namelist()}
seen={};remap={}
for n,b in parts.items():
 if n.startswith('ppt/media/'):
  key=(Path(n).suffix,hashlib.sha256(b).hexdigest())
  if key in seen:remap[n]=seen[key]
  else:seen[key]=n
for n in list(parts):
 if n.endswith('.rels'):
  doc=minidom.parseString(parts[n]);changed=False
  for rel in doc.getElementsByTagName('Relationship'):
   target=rel.getAttribute('Target')
   if target.startswith('../media/') and 'ppt/'+target[3:] in remap:rel.setAttribute('Target','../'+remap['ppt/'+target[3:]][4:]);changed=True
  if changed:parts[n]=doc.toxml(encoding='UTF-8')
for n in remap:del parts[n]
for i,n in enumerate(sorted([n for n in parts if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda x:int(re.search(r'(\d+)\.xml',x).group(1))),1):
 doc=minidom.parseString(parts[n]);root=doc.documentElement
 for j,node in enumerate(doc.getElementsByTagNameNS(P,'cNvPr'),1):node.setAttribute('id',str(j))
 movies=[]
 for pic in doc.getElementsByTagNameNS(P,'pic'):
  if pic.getElementsByTagNameNS(A,'videoFile'):movies.append(pic.getElementsByTagNameNS(P,'cNvPr')[0].getAttribute('id'))
 assert len(movies)<=1
 timing=(ROOT/'tools/build-powerpoint-video-timing.xml').read_text().replace('__SHAPE_ID__',movies[0]) if movies else ''
 for node in fragment(doc,'<p:transition spd="med" advClick="1"><p:fade/></p:transition>'+timing):root.appendChild(node)
 parts[n]=doc.toxml(encoding='UTF-8')
 report.append({'slide':i,'movies':len(movies),'native_shapes':len(doc.getElementsByTagNameNS(P,'sp')),'native_text_runs':len(doc.getElementsByTagNameNS(A,'t')),'charts':len(doc.getElementsByTagName('c:chart'))})
doc=minidom.parseString(parts['ppt/presProps.xml']);root=doc.documentElement
for old in list(doc.getElementsByTagNameNS(P,'showPr')):root.removeChild(old)
root.insertBefore(fragment(doc,'<p:showPr loop="0" showAnimation="1" showNarration="0" useTimings="0"><p:present/><p:sldAll/></p:showPr>')[0],root.firstChild)
parts['ppt/presProps.xml']=doc.toxml(encoding='UTF-8')
with ZipFile(file,'w',ZIP_DEFLATED) as z:
 for n,b in parts.items():z.writestr(n,b)
(ROOT/'presentation-system/qa/structure.json').write_text(json.dumps(report,indent=2))
print(file.name,round(file.stat().st_size/1024/1024,2),'MiB')
