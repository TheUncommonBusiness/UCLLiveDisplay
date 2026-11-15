from pathlib import Path
import json, math

ROOT=Path(__file__).resolve().parent
F='#192520'; C='#FDFFF2'; L='#F0FE91'; S='#9EAF9F'
ART='presentation-studio/designs/assets/'
slides=[];styles=[]
def text(x,y,w,h,value,size=40,font='Season',color=F,**kw):return dict(type='text',x=x,y=y,w=w,h=h,text=value,font=font,size=size,color=color,lineHeight=1.04,**kw)
def rect(x,y,w,h,fill,**kw):return dict(type='rect',x=x,y=y,w=w,h=h,fill=fill,**kw)
def line(x,y,w,h=0,color=F,width=1,**kw):return dict(type='line',x=x,y=y,w=w,h=h,stroke=color,strokeWidth=width,**kw)
def image(x,y,w,h,asset,**kw):return dict(type='image',x=x,y=y,w=w,h=h,path=(asset if asset.startswith('presentation-studio/') else ART+asset),fit='contain',**kw)
def logo(x,y,w=300,tone='forest'):return image(x,y,w,w*116.4292/361.93769,'leaders-logo-'+tone+'.svg')
def micro(x,y,w,value,color=F,align='left',**kw):return text(x,y,w,40,value,19,'Inter',color,letterSpacing=2.4,align=align,**kw)
def style(sid,name,tag,description,motion,best):
 styles.append(dict(id=sid,name=name,tag=tag,description=description,motion=motion,bestFor=best))
def add(sid,role,bg,elements,notes=''):
 name=next(s['name'] for s in styles if s['id']==sid)
 slides.append(dict(id=sid+'-'+role,style=sid,name=name+' / '+role.title(),role=role,width=1920,height=1080,background=bg,elements=elements,notes=notes))
def folio(n,bg='light',label='UNCOMMON LEADERS LIVE'):
 color=F if bg=='light' else C
 return [micro(90,1004,900,label,color),micro(1600,1004,230,str(n).zfill(2),color,'right')]
def rotate_group(elements,angle,cx,cy):
 r=math.radians(angle);out=[]
 for e in elements:
  e=e.copy();x=e['x']+e['w']/2;y=e['y']+e['h']/2
  e['x']=round(cx+(x-cx)*math.cos(r)-(y-cy)*math.sin(r)-e['w']/2,3)
  e['y']=round(cy+(x-cx)*math.sin(r)+(y-cy)*math.cos(r)-e['h']/2,3)
  e['rotate']=angle+e.get('rotate',0);out.append(e)
 return out

style('big-type','Big Type','Monumental / direct',
 'Oversized Season headlines, broad color fields, and deliberate crops. The words carry the room.',
 'Hold the type still. Let a cropped illustration move a few pixels at the edge.',
 'Opening statements, bold reframes, section changes, and concise takeaways.')
add('big-type','opening',L,[
 logo(90,68,325),micro(1310,90,520,'01 / A NEW STANDARD',align='right'),
 text(78,263,1780,290,'Lead beyond',250),text(78,513,1770,290,'the expected.',244),
 image(1482,792,490,656,'cowgirl-forest.svg'),
 micro(90,919,920,'UNCOMMON LEADERS LIVE / AUSTIN'),
 text(90,961,1070,64,'A different standard for how we lead.',34,'Inter',F),
], 'The illustration intentionally extends beyond the bottom edge. Keep both headline lines fully visible and editable.')
add('big-type','content',F,[
 micro(90,70,1000,'01 / THREE SHIFTS',L),logo(1535,66,290,'cream'),
 text(78,160,1600,215,'Three shifts.',180,color=C),
 text(89,385,1650,150,'A stronger team.',126,color=L),
 rect(90,574,558,388,L),rect(681,574,558,388,C),rect(1272,574,558,388,S),
 micro(123,605,450,'01 / PRIORITY'),text(120,670,490,104,'Clarity',92),text(125,823,455,98,'Make the next\npriority clear.',37,'Inter'),
 micro(714,605,450,'02 / RESPONSIBILITY'),text(710,670,510,104,'Ownership',82),text(716,823,455,98,'Give the work\na clear owner.',37,'Inter'),
 micro(1305,605,450,'03 / FOLLOW-THROUGH'),text(1300,670,520,104,'Momentum',78),text(1307,823,450,98,'Turn decisions\ninto next steps.',37,'Inter'),
 *folio(2,'dark')
])

style('editorial','Modern Editorial','Asymmetric / considered',
 'A magazine-inspired grid with generous margins, a narrow annotation column, and image crops that break the page rhythm.',
 'Use a soft page-to-page fade. Keep folios and the column grid in the same places.',
 'Teaching, longer arguments, interviews, and content with a clear narrative.')
add('editorial','opening',C,[
 micro(85,63,1100,'UNCOMMON LEADERS / AUSTIN'),micro(1480,63,350,'FIELD NOTES / 01',align='right'),
 line(85,126,1745,color=F,width=2),line(1260,166,0,782,color=F,width=1),
 text(84,235,1160,200,'Lead beyond',169),text(84,430,1160,210,'the expected.',164,italic=True),
 micro(95,775,420,'A PERSPECTIVE FOR THE ROOM'),
 text(94,835,930,108,'The next chapter starts with\nhow we choose to lead.',43,'Inter'),
 image(1326,242,455,610,'cowgirl-forest.svg'),
 micro(1328,882,490,'FIG. 01 / THE UNCOMMON WAY'),
 *folio(1)
])
add('editorial','content',C,[
 micro(85,63,1000,'UNCOMMON LEADERS / AUSTIN'),micro(1480,63,350,'FIELD NOTES / 02',align='right'),line(85,126,1745,color=F,width=2),
 text(86,239,820,430,'Three shifts.\nA stronger team.',119),
 text(85,690,680,185,'03',150,color=S),micro(95,891,750,'SMALL CHANGES. SHARED DIRECTION.'),
 line(950,182,0,740,color=F,width=1),
 micro(1010,205,120,'01'),text(1160,187,635,98,'Clarity',78),text(1168,295,650,92,'Make the next priority clear.',34,'Inter'),line(1010,410,815,color=F,width=1),
 micro(1010,459,120,'02'),text(1160,441,635,98,'Ownership',78),text(1168,549,650,92,'Give the work a clear owner.',34,'Inter'),line(1010,664,815,color=F,width=1),
 micro(1010,713,120,'03'),text(1160,695,635,98,'Momentum',78),text(1168,803,650,92,'Turn decisions into next steps.',34,'Inter'),
 *folio(2)
])

style('gallery','Open Range Gallery','Quiet / spacious',
 'One engraving takes the stage. The typography reads like an exhibition caption, with wide open space around it.',
 'A slow breath in the artwork is enough. Text and captions remain still.',
 'Welcome moments, reflective prompts, keynote openings, and a restrained premium feel.')
add('gallery','opening',C,[
 micro(90,66,900,'UNCOMMON LEADERS LIVE'),micro(1450,66,380,'AUSTIN / COLLECTION 01',align='right'),
 image(350,155,1220,686,'presentation-studio/characters/longhorn-cutout.png'),
 text(150,835,1620,147,'Lead beyond the expected.',111,align='center'),
 micro(620,1014,680,'A NEW STANDARD FOR HOW WE LEAD',align='center'),
], 'The centered illustration is the primary object. Keep the title on one line, with a full-width native text box.')
add('gallery','content',C,[
 micro(90,66,900,'UNCOMMON LEADERS LIVE'),micro(1430,66,400,'AUSTIN / COLLECTION 02',align='right'),
 text(90,150,1740,250,'Three shifts.\nA stronger team.',104,align='center'),
 image(115,541,470,265,'presentation-studio/characters/longhorn-cutout.png'),image(830,449,260,357,'presentation-studio/characters/roping-cowboy-cutout.png'),image(1451,449,238,357,'presentation-studio/characters/dancing-cowgirl-cutout.png'),
 text(100,847,500,75,'Clarity',55,align='center'),text(710,847,500,75,'Ownership',55,align='center'),text(1320,847,500,75,'Momentum',55,align='center'),
 text(100,948,500,87,'Make the next\npriority clear.',31,'Inter',align='center'),text(710,948,500,87,'Give the work\na clear owner.',31,'Inter',align='center'),text(1320,948,500,87,'Turn decisions\ninto next steps.',31,'Inter',align='center'),
])

style('night-rodeo','Night Rodeo','Dramatic / immersive',
 'Deep forest, a monumental engraving, and a short flash of chartreuse. Oversized engravings create the backdrop for short, high-contrast statements.',
 'Use a slow drift in the oversized engraving and a restrained shimmer in the chartreuse accents.',
 'Keynote openings, strong reframes, closing statements, and moments on large stages.')
add('night-rodeo','opening',F,[
 image(-220,-230,1120,1498,'cowgirl-cream.svg',opacity=.18),
 logo(90,65,310,'cream'),micro(1230,85,600,'UNCOMMON LEADERS LIVE / AUSTIN',L,'right'),
 text(605,251,1230,235,'Lead beyond',190,color=C),
 text(606,477,1220,241,'the expected.',184,color=L,italic=True),
 line(620,817,1190,color=C,width=1,opacity=.35),
 micro(620,869,1130,'A DIFFERENT STANDARD FOR HOW WE LEAD',C),
 micro(90,1004,500,'04 / AFTER DARK',L),micro(1490,1004,340,'OPENING / 01',C,'right'),
], 'The engraving intentionally extends beyond the top and left edges. The text stays entirely inside the slide.')
add('night-rodeo','content',F,[
 image(1290,-65,850,1138,'cowgirl-cream.svg',opacity=.12),
 micro(90,65,1200,'04 / A DIFFERENT STANDARD',L),logo(1540,58,285,'cream'),
 text(84,182,1730,205,'Three shifts.',172,color=C),
 text(88,383,1710,157,'A stronger team.',124,color=L),
 line(90,605,1740,color=C,width=1,opacity=.45),
 micro(98,657,430,'01',L),micro(694,657,430,'02',L),micro(1290,657,430,'03',L),
 text(90,710,540,110,'Clarity',91,color=C),text(684,710,555,110,'Ownership',86,color=C),text(1279,710,554,110,'Momentum',80,color=C),
 text(98,855,495,104,'Make the next\npriority clear.',37,'Inter',C),text(694,855,495,104,'Give the work\na clear owner.',37,'Inter',C),text(1290,855,495,104,'Turn decisions\ninto next steps.',37,'Inter',C),
 *folio(2,'dark')
])

style('field-guide','The Field Guide','Precise / practical',
 'A measured grid, numbered callouts, and open diagrams. Each slide feels like a useful page from a working field manual.',
 'Reveal one step or annotation at a time. Keep the grid stable between slides.',
 'Frameworks, processes, workshops, operating principles, and practical exercises.')
add('field-guide','opening',C,[
 rect(74,72,1772,916,'transparent',stroke=F,strokeWidth=2),
 line(74,196,1772,color=F,width=1),line(1353,196,0,792,color=F,width=1),line(74,777,1279,color=F,width=1),
 micro(112,113,1100,'UNCOMMON LEADERS / FIELD GUIDE'),micro(1490,113,315,'EDITION 01',align='right'),
 text(112,308,1188,348,'Lead beyond\nthe expected.',150),
 image(1413,271,373,500,'presentation-studio/characters/roping-cowboy-cutout.png'),
 micro(1412,846,390,'OBSERVE. DECIDE. ACT.'),
 rect(113,825,58,58,F),text(115,837,54,36,'01',24,'Inter',C,align='center'),text(203,836,300,67,'Notice.',44),
 line(500,855,180,color=F,width=1),rect(719,825,58,58,F),text(721,837,54,36,'02',24,'Inter',C,align='center'),text(809,836,430,67,'Choose the next move.',42),
 micro(110,1016,1000,'A PRACTICAL STANDARD FOR HOW WE LEAD'),micro(1600,1016,220,'01',align='right'),
])
add('field-guide','content',C,[
 micro(90,68,1200,'UNCOMMON LEADERS / FIELD GUIDE'),micro(1500,68,330,'FRAMEWORK / 02',align='right'),
 text(88,164,1740,260,'Three shifts.\nA stronger team.',111),
 line(90,446,1740,color=F,width=2),line(90,945,1740,color=F,width=2),line(670,446,0,499,color=F,width=1),line(1250,446,0,499,color=F,width=1),
 rect(110,485,78,78,F),text(113,500,72,48,'01',33,'Inter',C,align='center'),
 rect(690,485,78,78,F),text(693,500,72,48,'02',33,'Inter',C,align='center'),
 rect(1270,485,78,78,F),text(1273,500,72,48,'03',33,'Inter',C,align='center'),
 micro(225,508,400,'PRIORITY'),micro(805,508,400,'RESPONSIBILITY'),micro(1385,508,400,'FOLLOW-THROUGH'),
 text(108,625,510,111,'Clarity',93),text(688,625,510,111,'Ownership',81),text(1268,625,530,111,'Momentum',79),
 text(112,788,485,108,'Make the next\npriority clear.',37,'Inter'),text(692,788,485,108,'Give the work\na clear owner.',37,'Inter'),text(1272,788,485,108,'Turn decisions\ninto next steps.',37,'Inter'),
 *folio(2)
])

style('poster-wall','Poster Wall','Graphic / expressive',
 'Layered print panels, angled typography, and bold pattern crops. The layout has the energy of a wall of event posters.',
 'Let a paper edge settle gently, then hold. Keep body copy steady and avoid continual rotation.',
 'Event openings, short announcements, creative prompts, and punchy summaries.')
poster_open=[
 rect(130,142,1220,786,C),logo(198,200,290),
 micro(200,346,1050,'UNCOMMON LEADERS LIVE / AUSTIN'),
 text(193,438,1090,358,'Lead beyond\nthe expected.',145),
 micro(205,842,1040,'A NEW STANDARD. YOUR NEXT MOVE.'),
]
side_open=[rect(1408,156,405,786,L),image(1445,245,330,495,'presentation-studio/characters/dancing-cowgirl-cutout.png'),micro(1433,824,350,'THE UNCOMMON WAY',align='center')]
add('poster-wall','opening',F,[
 image(-100,210,1120,1182,'pattern-matched.png',opacity=.45),
 *rotate_group(poster_open,-3,740,535),*rotate_group(side_open,5,1610,549),
 micro(90,45,1100,'06 / POSTER WALL',L),micro(1460,1004,360,'OPENING / 01',C,'right')
], 'The paper panels and their contents share fixed rotation angles. Text remains editable as separate native elements.')
poster_content=[]
for i,(x,y,w,h,angle,fill,label,word,body) in enumerate([
 (90,378,574,555,-3,C,'01 / PRIORITY','Clarity','Make the next\npriority clear.'),
 (673,345,574,588,2,L,'02 / RESPONSIBILITY','Ownership','Give the work\na clear owner.'),
 (1258,389,574,544,-3.5,S,'03 / FOLLOW-THROUGH','Momentum','Turn decisions\ninto next steps.'),
]):
 elements=[rect(x,y,w,h,fill),micro(x+35,y+39,w-70,label),text(x+31,y+131,w-64,117,word,82 if i==0 else 72),text(x+36,y+310,w-72,116,body,37,'Inter'),line(x+36,y+h-58,w-72,color=F,width=1)]
 poster_content+=rotate_group(elements,angle,x+w/2,y+h/2)
add('poster-wall','content',F,[
 micro(90,49,1100,'06 / POSTER WALL',L),
 text(86,116,1740,202,'Three shifts. A stronger team.',111,color=C),
 *poster_content,*folio(2,'dark')
])

style('panorama','Across the Horizon','Expansive / connected',
 'Wide horizontal bands and contrasting halves create a continuous visual story. The structure adapts naturally to panoramic stages.',
 'Move gently along the horizon or carry one shared element across the split. Avoid vertical jumps.',
 'Big-room storytelling, three-part narratives, comparisons, and wide display formats.')
add('panorama','opening',C,[
 rect(0,540,1920,540,F),
 logo(90,69,310),micro(1250,91,580,'07 / ACROSS THE HORIZON',align='right'),
 text(86,253,1720,251,'Lead beyond',218),
 image(60,585,580,776,'cowgirl-cream.svg',opacity=.28),
 text(622,655,1208,250,'the expected.',184,color=L,italic=True),
 micro(630,968,1180,'UNCOMMON LEADERS LIVE / AUSTIN',C),
], 'The lower engraving is deliberately cropped at the bottom. The two headline lines stay separate and editable.')
add('panorama','content',C,[
 micro(90,62,1000,'07 / ACROSS THE HORIZON'),
 text(87,144,1170,264,'Three shifts.\nA stronger team.',111),
 image(1395,106,361,254,'presentation-studio/characters/longhorn-cutout.png'),
 rect(0,459,1920,621,F),line(180,606,1560,color=L,width=2),
 rect(180,597,18,18,L),rect(830,597,18,18,L),rect(1480,597,18,18,L),
 micro(182,539,430,'01',L),micro(832,539,430,'02',L),micro(1482,539,340,'03',L),
 text(89,676,545,111,'Clarity',90,color=C),text(738,676,558,111,'Ownership',84,color=C),text(1388,676,442,111,'Momentum',66,color=C),
 text(96,842,520,111,'Make the next\npriority clear.',37,'Inter',C),text(745,842,520,111,'Give the work\na clear owner.',37,'Inter',C),text(1394,842,440,111,'Turn decisions\ninto next steps.',37,'Inter',C),
 *folio(2,'dark')
])

def save():
 data=dict(version=1,width=1920,height=1080,brand=dict(forest=F,cream=C,lime=L,displayFont='Season',bodyFont='Inter'),styles=styles,slides=slides)
 (ROOT/'slides.json').write_text(json.dumps(data,indent=2)+'\n')
 (ROOT/'slides-data.js').write_text('window.DESIGN_DATA='+json.dumps(data,separators=(',',':'))+';\n')
 print(f'Wrote {len(styles)} design directions and {len(slides)} editable slides')
if __name__=='__main__':save()
