"""Write editable 1920×1080 content-template geometry for the design studio."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
G='#192520';C='#FDFFF2';L='#F0FE91';M='#64735C';W='#E8EDE0'
slides=[]
def T(text,x,y,w,h,size=44,font='Inter',color=G,**kw):return dict(type='text',text=text,x=x,y=y,w=w,h=h,size=size,font=font,color=color,**kw)
def R(x,y,w,h,fill=C,stroke=None,strokeWidth=1,**kw):return dict(type='rect',x=x,y=y,w=w,h=h,fill=fill,stroke=stroke,strokeWidth=strokeWidth,**kw)
def E(x,y,w,h,fill=C,stroke=None,strokeWidth=1,**kw):return dict(type='ellipse',x=x,y=y,w=w,h=h,fill=fill,stroke=stroke,strokeWidth=strokeWidth,**kw)
def LN(x,y,w,h=0,color=G,width=1,**kw):return dict(type='line',x=x,y=y,w=w,h=h,stroke=color,strokeWidth=width,**kw)
def I(file,x,y,w,h,**kw):return dict(type='image',path=file,x=x,y=y,w=w,h=h,fit='contain',**kw)
def title(text,dark=False):return T(text,110,178,1670,172,112,'Season',C if dark else G)
def base(id,name,heading=None,dark=False,notes='Replace the bracketed copy, then duplicate this layout for your next message.'):
 s=dict(id=id,style='toolkit',name=name,role='content',width=1920,height=1080,background=G if dark else C,elements=[],notes=notes)
 s['elements']=[T(name.upper(),110,76,1250,44,23,'Inter',L if dark else M,letterSpacing=3),I('backups/elements/leaders-logo-'+('f0fe91' if dark else '192520')+'.svg',1510,66,300,96),T('UNCOMMON LEADERS LIVE',110,1008,900,36,18,'Inter',C if dark else M,letterSpacing=2)]
 if heading:s['elements'].append(title(heading,dark))
 slides.append(s);return s['elements']

# 01. Section divider
a=base('toolkit-section','Section divider',dark=True,notes='Replace the section number, headline, and one-line promise. Keep this page brief.')
a += [T('01',110,300,350,250,190,'Season',L),T('[Section\nheadline]',500,290,1230,420,166,'Season',C),T('[One sentence that sets up this section.]',510,790,1140,100,37,'Inter',C)]
# 02. Agenda
a=base('toolkit-agenda','Agenda',"[What we’ll cover]",notes='Replace the four topics and descriptions. Remove a row if your agenda is shorter.')
for i in range(4):
 y=385+i*125;a += [T(f'0{i+1}',115,y,110,80,36,'Inter',M),T(f'[Topic {i+1}]',290,y-10,620,95,58,'Season'),T('[A short description of this part.]',960,y+3,790,80,33,'Inter',M)]
 if i<3:a.append(LN(290,y+94,1480,0,'#C7D1BE',1))
# 03. Big idea
a=base('toolkit-big-idea','Big idea',dark=True,notes='Write one clear idea in the large type. Use the smaller line only when it adds context.')
a += [T('[The one idea\nyou want them\nto remember.]',110,265,1630,540,147,'Season',C),T('[One sentence that makes the idea concrete.]',118,855,1510,80,34,'Inter',L)]
# 04. Quote
a=base('toolkit-quote','Quote + attribution',notes='Paste a real quote, name its source, and add the context or date in the attribution.')
a += [T('“',100,230,190,230,250,'Season',M),T('[A meaningful quote\ngoes here. Keep the\nwords worth reading.]',320,285,1370,425,112,'Season',G,italic=True),T('[Name, role or source]',330,815,1250,65,34,'Inter'),T('[Context or date]',330,883,1250,50,25,'Inter',M)]
# 05. Two-column text
a=base('toolkit-two-columns','Two-column text','[Headline for this message]',notes='Replace both column headings and their supporting points. Keep each point to one or two lines.')
for x,h in [(110,'[First idea]'),(1020,'[Second idea]')]:
 a += [T(h,x,390,740,105,71,'Season'),T('[Point one, stated clearly.]\n\n[Point two, with enough context.]\n\n[Point three or the next action.]',x+5,535,730,380,36,'Inter')]
a.append(LN(955,400,0,500,'#B9C7AF',1.5))
# 06. Text + image
a=base('toolkit-text-image','Text + image','[A headline with a point]',notes='Replace the image placeholder with your photo or screenshot. Edit the headline and supporting copy.')
a += [T('[Explain the image\nin one clear thought.]',110,403,770,230,77,'Season'),T('[Add the context your audience needs.\nKeep this to a short paragraph.]',115,700,730,180,37,'Inter',M),R(1010,380,800,530,W,'#A6B59A',2),LN(1010,380,800,530,'#C4CEBB',1),LN(1010,910,800,-530,'#C4CEBB',1),R(1215,585,390,90,C),T('ADD YOUR IMAGE',1230,610,360,55,27,'Inter',M,align='center'),T('[Caption or source]',1015,940,790,42,23,'Inter',M)]
# 07. Three pillars
a=base('toolkit-pillars','Three pillars','[Three things that matter]',notes='Name three pillars and give each one a single supporting sentence.')
for i,x in enumerate([110,710,1310]):
 a += [T(f'0{i+1}',x,406,130,100,65,'Season',M),T(f'[Pillar {i+1}]',x,540,480,160,72,'Season'),T('[One sentence that explains\nwhy this pillar matters.]',x+4,735,470,140,33,'Inter',M)]
 if i<2:a.append(LN(x+540,416,0,450,'#BBC7B1',1))
# 08. Comparison
a=base('toolkit-comparison','Two-way comparison','[Choose between two paths]',notes='Replace the option labels and compare the same three criteria on each side.')
for i,x in enumerate([110,990]):
 a += [R(x,390,820,530,G if i==1 else W),T('[Option '+('B' if i else 'A')+']',x+45,435,730,110,75,'Season',L if i else G),T('[Criterion one]\n\n[Criterion two]\n\n[Criterion three]',x+50,600,710,270,36,'Inter',C if i else G)]
# 09. Before / after
a=base('toolkit-before-after','Before + after','[Show the change]',notes='Describe the starting point and desired outcome. Put the change itself in the center.')
a += [T('BEFORE',110,412,650,48,26,'Inter',M,letterSpacing=3),T('[The current\nstate]',110,505,650,235,94,'Season'),T('[What is happening today.]',115,804,630,85,34,'Inter',M),T('→',846,580,225,170,122,'Inter',M,align='center'),T('AFTER',1180,412,630,48,26,'Inter',M,letterSpacing=3),T('[The better\nstate]',1180,505,630,235,94,'Season'),T('[What changes for people.]',1185,804,620,85,34,'Inter',M)]
# 10. Three-step process
a=base('toolkit-process-three','Three-step process','[A process people can follow]',notes='Use verbs for each step and explain the action in one short sentence.')
for i,x in enumerate([110,710,1310]):
 a += [E(x,407,100,100,L),T(str(i+1),x+20,422,60,70,47,'Inter',G,align='center'),T(f'[Step {i+1}]',x,568,480,100,70,'Season'),T('[Describe the action\nfor this step.]',x+4,714,475,160,35,'Inter',M)]
 if i<2:a.append(T('→',x+488,427,90,90,55,'Inter',M,align='center'))
# 11. Five-step process
a=base('toolkit-process-five','Five-step process','[Five moves, one outcome]',notes='Replace each numbered step with a short verb phrase. Keep detail on the following slides.')
a.append(LN(255,484,1390,0,'#A5B699',3))
for i,x in enumerate([110,460,810,1160,1510]):
 a += [E(x+65,414,140,140,G),T(str(i+1),x+102,442,65,82,55,'Inter',L,align='center'),T(f'[Step {i+1}]',x,620,290,150,61,'Season',G,align='center'),T('[Short action\nor description]',x,812,290,100,29,'Inter',M,align='center')]
# 12. Timeline
a=base('toolkit-timeline','Timeline','[The plan over time]',notes='Replace dates, milestone names, and outcomes. Move the native markers to match your schedule.')
a.append(LN(140,560,1320,0,G,3))
for i,x in enumerate([140,580,1020,1460]):
 a += [E(x-13,547,26,26,G),T('[DATE]',x-30,420,280,60,30,'Inter',M),T(f'[Milestone {i+1}]',x-30,650,360,120,54,'Season'),T('[What will be true\nat this point.]',x-26,805,350,110,29,'Inter',M)]
# 13. Matrix
a=base('toolkit-matrix','2 × 2 matrix','[Map the choices]',notes='Replace axis labels and the four quadrants. Move the markers to map real options.')
a += [R(440,365,1190,540,W),LN(1035,365,0,540,'#8CA07C',2),LN(440,635,1190,0,'#8CA07C',2),T('[VERTICAL AXIS]',65,500,300,200,29,'Inter',M,align='center'),T('[HORIZONTAL AXIS]',770,937,560,45,25,'Inter',M,align='center')]
for (x,y,n) in [(480,405,1),(1080,405,2),(480,685,3),(1080,685,4)]:a += [T(f'[Quadrant {n}]',x,y,500,85,52,'Season'),T('[Meaning or action]',x+5,y+116,480,80,30,'Inter',M)]
# 14. Editable framework
a=base('toolkit-framework','Framework / cycle','[Show how the parts connect]',notes='Rename the three parts and central outcome. All circles, connectors, and labels are editable shapes.')
a += [E(768,535,385,180,G),T('[Shared\noutcome]',813,552,295,145,52,'Season',L,align='center')]
for x,y,label in [(680,345,'[Part one]'),(1110,725,'[Part two]'),(250,725,'[Part three]')]:a += [R(x,y,560,175,W),T(label,x+30,y+43,500,100,65,'Season',G,align='center')]
a += [LN(1240,510,150,175,M,3,endArrowType='triangle'),LN(1090,827,-250,0,M,3,endArrowType='triangle'),LN(533,700,180,-165,M,3,endArrowType='triangle')]
# 15. Big metric
a=base('toolkit-metric','One big metric',dark=True,notes='Replace the metric, unit, and source. Remove this slide until you have a real value to share.')
a += [T('[00]',110,245,1450,380,270,'Season',L),T('[What this number means]',118,690,1540,135,91,'Season',C),T('[Time period · source · definition]',121,880,1500,70,30,'Inter',C)]
# 16. Three metrics
a=base('toolkit-metrics','Three metrics','[The measures that matter]',notes='Replace each value, label, and source with your own metrics.')
for i,x in enumerate([110,710,1310]):
 a += [T('[00]',x,390,490,230,153,'Season'),T(f'[Metric {i+1}]',x+4,680,480,110,55,'Season'),T('[Time period or definition]',x+5,836,475,70,27,'Inter',M)]
# 17. Native bar chart
a=base('toolkit-bar-chart','Bar chart','[Compare the values]',notes='Right-click the chart and choose Edit Data. Replace the example labels and values, then update the source line.')
a += [dict(type='chart',chartType='bar',x=110,y=378,w=1690,h=510,data=[dict(name='Example values',labels=['Option A','Option B','Option C'],values=[35,65,85])]),T('EXAMPLE DATA · REPLACE BEFORE PRESENTING',115,928,1260,44,23,'Inter',M)]
# 18. Native line chart
a=base('toolkit-line-chart','Line chart','[Show the trend]',notes='Right-click the chart and choose Edit Data. Replace the example dates and values with your own data.')
a += [dict(type='chart',chartType='line',x=110,y=378,w=1690,h=510,data=[dict(name='Example trend',labels=['Period 1','Period 2','Period 3','Period 4'],values=[20,35,28,50])]),T('EXAMPLE DATA · REPLACE BEFORE PRESENTING',115,928,1260,44,23,'Inter',M)]
# 19. Case study
a=base('toolkit-case-study','Case study','[A specific example]',notes='Use a real story and verifiable outcome. Replace each placeholder with evidence from that case.')
a += [T('[Person or organization]',110,385,1650,95,65,'Season'),T('[Brief context for the story.]',115,510,1560,90,36,'Inter',M)]
for x,label,copy in [(110,'THE SITUATION','[What was happening?]'),(710,'THE ACTION','[What did they change?]'),(1310,'THE RESULT','[What happened next?]')]:a += [T(label,x,690,480,55,24,'Inter',M,letterSpacing=2),T(copy,x,792,475,150,49,'Season')]
# 20. Exercise
a=base('toolkit-exercise','Exercise / prompt',dark=True,notes='Replace the prompt, time box, and share-back instruction. Keep the task visible while people work.')
a += [R(110,260,300,70,L),T('[5 MINUTES]',130,280,260,45,25,'Inter',G,align='center'),T('[What do you\nwant people\nto work on?]',110,380,1610,430,126,'Season',C),T('[Write it down, discuss with a partner, then share one takeaway.]',118,902,1570,78,32,'Inter',L)]
# 21. FAQ / summary
a=base('toolkit-faq','FAQ / summary','[Make the next step clear]',notes='Replace each question with a real audience question and answer it in one sentence.')
for i in range(3):
 y=388+i*176;a += [T(f'[Question {i+1}]',110,y,700,110,63,'Season'),T('[A direct answer in one or two short lines.]',940,y+7,850,120,37,'Inter',M)]
 if i<2:a.append(LN(110,y+141,1690,0,'#C3CEB9',1))
# 22. Closing / CTA
a=base('toolkit-closing','Closing / next action',dark=True,notes='Name one next action. Replace the link or contact details and the closing line.')
a += [T('[What happens\nnext?]',110,270,1640,370,164,'Season',C),T('[One clear action for the audience.]',117,722,1570,95,50,'Inter',L),T('[Link, contact, or next meeting details]',120,884,1500,80,31,'Inter',C)]

output={'version':1,'width':1920,'height':1080,'slides':slides}
(ROOT/'toolkit-content.json').write_text(json.dumps(output,indent=2,ensure_ascii=False))
print('Wrote',len(slides),'editable content layouts')
