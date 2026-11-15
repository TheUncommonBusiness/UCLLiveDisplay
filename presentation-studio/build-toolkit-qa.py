"""Render native PowerPoint PDF pages and verify editable content and media structure."""
from pathlib import Path
from zipfile import ZipFile
import json,re,shutil,sys
from xml.etree import ElementTree as ET
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'presentation-studio/output';QA=ROOT/'_qa'
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/private/tmp/ucl-studio-proof.pdf')
target=OUT/'ucl-presentation-design-studio-preview.pdf'
if source.resolve()!=target.resolve():shutil.copy2(source,target)
pdf=pdfium.PdfDocument(target)
manifest=json.loads((OUT/'slide-index.json').read_text())
assert len(pdf)==len(manifest)==44
thumbs=[]
for i,page in enumerate(pdf):
 im=page.render(scale=2).to_pil().convert('RGB')
 im.save(QA/f'studio-ppt-slide-{i+1:02}.jpg',quality=93)
 thumb=im.resize((640,360));canvas=Image.new('RGB',(640,405),'#ffffff');canvas.paste(thumb,(0,0));d=ImageDraw.Draw(canvas)
 try:font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',17)
 except:font=ImageFont.load_default()
 d.text((12,373),f'{i+1:02} / {manifest[i]["name"]}',fill='#192520',font=font)
 thumbs.append(canvas)
for name,start,end in [('directions',0,15),('content-a',15,27),('content-b',27,37),('holds-elements',37,44)]:
 group=thumbs[start:end];sheet=Image.new('RGB',(1920,405*((len(group)+2)//3)),'#ffffff')
 for i,thumb in enumerate(group):sheet.paste(thumb,((i%3)*640,(i//3)*405))
 sheet.save(OUT/f'preview-{name}.jpg',quality=94)
fonts=set()
for page in PdfReader(target).pages:
 for font in page.get('/Resources',{}).get('/Font',{}).values():
  obj=font.get_object();fonts.add(str(obj.get('/BaseFont')).split('+')[-1])
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','c':'http://schemas.openxmlformats.org/drawingml/2006/chart'}
with ZipFile(OUT/'ucl-presentation-design-studio.pptx') as z:
 slideNames=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n).group(1)))
 texts=[];placeholderSlides=[];notes=[]
 for i,n in enumerate(slideNames,1):
  doc=ET.fromstring(z.read(n));ts=[e.text or '' for e in doc.findall('.//a:t',ns)];texts.extend(ts)
  if any('[' in t and ']' in t for t in ts):placeholderSlides.append(i)
  notes.append(f'ppt/notesSlides/notesSlide{i}.xml' in z.namelist())
 media=[n for n in z.namelist() if n.startswith('ppt/media/') and n.endswith('.mp4')]
 charts=[n for n in z.namelist() if re.fullmatch(r'ppt/charts/chart\d+\.xml',n)]
 workbooks=[n for n in z.namelist() if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')]
 assert len(media)==5
 assert len(charts)==2 and len(workbooks)==2
 assert all(notes)
 assert all(i in placeholderSlides for i in range(16,38))
 assert all(i in placeholderSlides for i in [40,41,42])
 report={'slides':44,'native_text_runs':len(texts),'placeholder_slides':placeholderSlides,'embedded_movies':len(media),'native_charts':len(charts),'chart_workbooks':len(workbooks),'all_slides_have_notes':all(notes),'native_pdf_fonts':sorted(fonts),'pptx_bytes':(OUT/'ucl-presentation-design-studio.pptx').stat().st_size}
 (QA/'studio-ppt-verification.json').write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2))
