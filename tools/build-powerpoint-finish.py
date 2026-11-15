"""Finish native slide playback settings without changing editable content."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys,re,hashlib,json
try:
    from defusedxml import minidom
except ImportError:
    sys.path.insert(0,'/private/tmp/ucl-pptx-validation-deps')
    from defusedxml import minidom
ROOT=Path(__file__).resolve().parent.parent
P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'

def fragment(doc,s):
    wrapper=minidom.parseString('<wrap xmlns:p="'+P+'" xmlns:a="'+A+'" xmlns:r="'+R+'">'+s+'</wrap>')
    return [doc.importNode(x,True) for x in wrapper.documentElement.childNodes]

report=[]
manifest=json.loads((ROOT/'_qa/ppt-build-manifest.json').read_text())
for name,is_loop in [('ucl-live-hold-screens.pptx',False),('ucl-supporting-loop.pptx',True)]:
    file=ROOT/'backups'/name
    with ZipFile(file) as z: parts={n:z.read(n) for n in z.namelist()}
    # Deduplicate repeated embedded backgrounds while keeping relationships explicit.
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
                if target.startswith('../media/') and 'ppt/'+target[3:] in remap:
                    rel.setAttribute('Target','../'+remap['ppt/'+target[3:]][4:]);changed=True
            if changed:parts[n]=doc.toxml(encoding='UTF-8')
    for n in remap:del parts[n]
    slide_names=sorted([n for n in parts if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda x:int(re.search(r'(\d+)\.xml',x).group(1)))
    for i,n in enumerate(slide_names,1):
        doc=minidom.parseString(parts[n]);root=doc.documentElement
        if i in manifest[name]['hidden']:root.setAttribute('show','0')
        # pptxgenjs allocates media and text IDs from different sequences. Renumber to prevent collisions.
        for j,node in enumerate(doc.getElementsByTagNameNS(P,'cNvPr'),1):node.setAttribute('id',str(j))
        movies=[]
        for pic in doc.getElementsByTagNameNS(P,'pic'):
            if pic.getElementsByTagNameNS(A,'videoFile'):
                movies.append(pic.getElementsByTagNameNS(P,'cNvPr')[0].getAttribute('id'))
        trans='<p:transition spd="slow" advClick="'+('0' if is_loop else '1')+'"'+(' advTm="12000"' if is_loop else '')+'><p:fade/></p:transition>'
        # cTn starts the background at slide entry, repeats through the hold, and stops on slide advance.
        assert len(movies)<=1,'Each slide should have one background movie.'
        timing=(ROOT/'tools/build-powerpoint-video-timing.xml').read_text().replace('__SHAPE_ID__',movies[0]) if movies else ''
        for node in fragment(doc,trans+timing):root.appendChild(node)
        parts[n]=doc.toxml(encoding='UTF-8')
        report.append({'deck':name,'slide':i,'movies':len(movies),'native_textboxes':len(doc.getElementsByTagNameNS(P,'sp')),'hidden':root.getAttribute('show')=='0','auto_advance_seconds':12 if is_loop else None})
    doc=minidom.parseString(parts['ppt/presProps.xml']);root=doc.documentElement
    for old in list(doc.getElementsByTagNameNS(P,'showPr')):root.removeChild(old)
    show='<p:showPr loop="'+('1' if is_loop else '0')+'" showAnimation="1" showNarration="0" useTimings="'+('1' if is_loop else '0')+'"><p:present/><p:sldAll/></p:showPr>'
    root.insertBefore(fragment(doc,show)[0],root.firstChild);parts['ppt/presProps.xml']=doc.toxml(encoding='UTF-8')
    with ZipFile(file,'w',ZIP_DEFLATED) as z:
        for n,b in parts.items():z.writestr(n,b)
    print(name,round(file.stat().st_size/1024/1024,2),'MB')
(ROOT/'_qa'/'ppt-structure-verification.json').write_text(json.dumps(report,indent=2))
