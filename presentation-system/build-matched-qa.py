"""Inspect the native PowerPoint export and preserve editable-content QA evidence."""
from pathlib import Path
from zipfile import ZipFile
import json,re,shutil,sys
from xml.etree import ElementTree as ET
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent;SYSTEM=ROOT/'presentation-system';OUT=ROOT/'backups';QA=SYSTEM/'qa'
source=Path(sys.argv[1]);target=OUT/'ucl-matched-presentation-kit-preview.pdf'
if source.resolve()!=target.resolve():shutil.copy2(source,target)
pdf=pdfium.PdfDocument(target);manifest=json.loads((SYSTEM/'slide-index.json').read_text());scenes=json.loads((ROOT/'assets/presentation-system/scenes.json').read_text())['scenes']
assert len(pdf)==len(manifest)==34
thumbs=[]
for i,page in enumerate(pdf):
 im=page.render(scale=2).to_pil().convert('RGB');im.save(QA/f'slide-{i+1:02}.jpg',quality=93)
 canvas=Image.new('RGB',(640,405),'#ffffff');canvas.paste(im.resize((640,360)),(0,0));d=ImageDraw.Draw(canvas)
 try:font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',17)
 except:font=ImageFont.load_default()
 d.text((12,373),f'{i+1:02} / {manifest[i]["name"]}',fill='#192520',font=font);thumbs.append(canvas)
for name,start,end in [('a',0,12),('b',12,24),('c',24,34)]:
 group=thumbs[start:end];sheet=Image.new('RGB',(1920,405*((len(group)+2)//3)),'#ffffff')
 for i,thumb in enumerate(group):sheet.paste(thumb,((i%3)*640,(i//3)*405))
 sheet.save(OUT/f'ucl-matched-presentation-kit-contact-{name}.jpg',quality=94)
fonts=set()
for page in PdfReader(target).pages:
 for font in page.get('/Resources',{}).get('/Font',{}).values():fonts.add(str(font.get_object().get('/BaseFont')).split('+')[-1])
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','c':'http://schemas.openxmlformats.org/drawingml/2006/chart'}
with ZipFile(OUT/'ucl-matched-presentation-kit.pptx') as z:
 names=z.namelist();slideNames=sorted([n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda n:int(re.search(r'(\d+)\.xml',n).group(1)))
 texts=[];editableFields=0
 for i,n in enumerate(slideNames,1):
  doc=ET.fromstring(z.read(n));ts=[e.text or '' for e in doc.findall('.//a:t',ns)];texts.extend(ts)
  assert f'ppt/notesSlides/notesSlide{i}.xml' in names
  if 2<=i<=27:
   assert len(doc.findall('.//a:videoFile',ns))==1
   native=''.join(ts)
   for e in scenes[i-2]['elements']:
    if e['type']=='text' and e.get('key'):
     value=scenes[i-2]['defaultFields'][e['key']];assert str(value).replace('\n','') in native,(i,e['key']);editableFields+=1
 media=[n for n in names if n.startswith('ppt/media/') and n.endswith('.mp4')]
 charts=[n for n in names if re.fullmatch(r'ppt/charts/chart\d+\.xml',n)]
 workbooks=[n for n in names if n.startswith('ppt/embeddings/') and n.endswith('.xlsx')]
 assert len(media)==9
 assert len(charts)==2 and len(workbooks)==2
 assert not (fonts-{'InterUCL-Regular','SeasonMix-Regular-TRIAL','SeasonMix-RegularItalic-TRIAL'})
 report={'slides':34,'canonical_scenes':26,'canonical_editable_text_fields_verified':editableFields,'native_text_runs':len(texts),'embedded_movies':len(media),'native_charts':len(charts),'chart_workbooks':len(workbooks),'all_slides_have_notes':True,'native_pdf_fonts':sorted(fonts),'pptx_bytes':(OUT/'ucl-matched-presentation-kit.pptx').stat().st_size}
 (QA/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
