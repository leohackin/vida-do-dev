from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
import cv2, numpy as np, os, math, random
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); AS=os.path.join(BASE,'assets'); os.makedirs(AS,exist_ok=True)
src=Image.open(os.path.join(AS,'reference-original.png')).convert('RGBA'); W,H=src.size
rgba=np.array(src); rgb=cv2.cvtColor(rgba[:,:,:3],cv2.COLOR_RGB2BGR)
# careful hand traced outline of the standing figure (pixel-art style), on the supplied illustration
P=[(909,630),(924,629),(933,635),(941,644),(944,661),(941,673),(937,679),(945,685),(950,698),(950,708),(955,710),(961,720),(956,738),(949,738),(946,747),(946,785),(943,795),(950,797),(956,802),(954,811),(942,815),(927,814),(916,806),(913,774),(911,801),(914,808),(907,815),(892,817),(883,811),(883,802),(886,786),(888,747),(883,747),(879,739),(881,716),(885,698),(894,687),(898,677),(893,671),(893,654),(897,640)]
mask=np.zeros((H,W),dtype=np.uint8); cv2.fillPoly(mask,[np.array(P,np.int32)],255)
# local GrabCut correction for clean character silhouette with black outline
roi=(874,619,968,825);x1,y1,x2,y2=roi
local=np.zeros((y2-y1,x2-x1),np.uint8)
m=mask[y1:y2,x1:x2]
local[m>0]=cv2.GC_PR_FGD
local[cv2.erode(m,np.ones((9,9),np.uint8))>0]=cv2.GC_FGD
local[cv2.dilate(m,np.ones((10,10),np.uint8))==0]=cv2.GC_BGD
try:
 bgm=np.zeros((1,65),np.float64); fgm=np.zeros((1,65),np.float64)
 cv2.grabCut(rgb[y1:y2,x1:x2],local,None,bgm,fgm,6,cv2.GC_INIT_WITH_MASK)
 seg=np.where((local==cv2.GC_FGD)|(local==cv2.GC_PR_FGD),255,0).astype(np.uint8)
 # only retain central component, remove background holes connected to fringes
 seg=cv2.morphologyEx(seg,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
 num,labels,stats,cent=cv2.connectedComponentsWithStats(seg,8)
 if num>1: seg=(labels==1+np.argmax(stats[1:,cv2.CC_STAT_AREA])).astype(np.uint8)*255
 fullmask=np.zeros((H,W),np.uint8); fullmask[y1:y2,x1:x2]=seg
except Exception as e:
 print('grabcut fail',e); fullmask=mask
fullmask=cv2.dilate(fullmask,np.ones((3,3),np.uint8))
# subtract surrounding tan floor from uncertain GrabCut border pixels without eating skin
R=rgba[:,:,0].astype(np.int16); G=rgba[:,:,1].astype(np.int16); B=rgba[:,:,2].astype(np.int16)
Y=np.arange(H)[:,None]
floor=(Y>679)
floor=floor & (R>95)&(G>75)&(R-G>=0)&(R-G<49)&(G-B>5)&(G-B<47)&(R<212)
fullmask[floor]=0
# Save actor as true transparent PNG from art (not a geometric silhouette)
actor_rgba=rgba.copy(); actor_rgba[:,:,3]=fullmask
bbox=cv2.boundingRect(fullmask); ax,ay,aw,ah=bbox
actor=Image.fromarray(actor_rgba[ay:ay+ah,ax:ax+aw],'RGBA');actor.save(os.path.join(AS,'guest-original.png'))
# Gentle inpaint where the walking guest was originally positioned, the floor is mostly repetitive here
inpaintMask=cv2.dilate(fullmask,np.ones((13,13),np.uint8))
clean=cv2.inpaint(rgb,inpaintMask,8,cv2.INPAINT_TELEA)
clean_rgba=cv2.cvtColor(clean,cv2.COLOR_BGR2RGBA); clean_rgba[:,:,3]=rgba[:,:,3]
Image.fromarray(clean_rgba).save(os.path.join(AS,'office-illustration.png'),optimize=True)
# 4 direction/5 frame walk cycle using original artwork and carefully bounded sprite perturbations.
# Keep native pixel art intact; small subpart offsets produce a walking bounce.
spr=Image.new('RGBA',(aw*6,ah*2),(0,0,0,0))
for direction in range(2):
 for frame in range(6):
  ft=actor.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if direction else actor.copy()
  # 3 px step bounce in source pixels. Keeps outlines & organic texture intact.
  bounce=[0,1,2,1,0,-1][frame]
  dst=Image.new('RGBA',(aw,ah),(0,0,0,0));dst.alpha_composite(ft,(0,bounce));spr.alpha_composite(dst,(frame*aw,direction*ah))
spr.save(os.path.join(AS,'guest-walksheet.png'))
# derive the main Vida do Dev head from the sofa Dev (same art, with original thick outline)
head=src.crop((715,328,781,403))
headmask=Image.new('L',head.size); hdraw=ImageDraw.Draw(headmask)
# outline of head and glasses from the art; narrow so chair and sofa not carried over
hdraw.polygon([(7,46),(10,31),(16,22),(23,15),(33,11),(46,13),(56,20),(61,33),(61,47),(56,58),(49,65),(38,68),(26,66),(14,62),(6,55)],fill=255)
head.putalpha(headmask.filter(ImageFilter.GaussianBlur(.5)))
head.save(os.path.join(AS,'dev-head.png'))
# derive Dev stand sprites with authentic extracted head, drawn outfit aligned with same original crisp pixel density
S=(112,202); SW,SH=S
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',11)
except: font=ImageFont.load_default()
def dev_frame(kind='idle',frame=0,flip=False):
 canvas=Image.new('RGBA',S);d=ImageDraw.Draw(canvas)
 b=[0,1,0,-1,0,1][frame%6] if kind=='walk' else 0
 O=(13,13,15,255);SHD=(33,34,39,255);BLACK=(20,20,22,255)
 # shoes + legs; walk steps
 step=[0,5,0,-5,0,2][frame%6] if kind=='walk' else 0
 d.polygon([(30,141+b),(51,138+b),(53+step,184+b),(34+step,187+b)],fill=(83,96,110),outline=O,width=3)
 d.polygon([(55,138+b),(77,140+b),(77-step,186+b),(58-step,187+b)],fill=(72,83,99),outline=O,width=3)
 for cx in [43+step,68-step]:
  d.rounded_rectangle((cx-14,182+b,cx+7,193+b),radius=4,fill=(37,36,37),outline=O,width=2)
 # body black t-shirt
 d.polygon([(34,82+b),(45,77+b),(66,76+b),(81,82+b),(89,128+b),(80,150+b),(31,148+b),(23,126+b)],fill=BLACK,outline=O,width=3)
 d.polygon([(26,101+b),(33,106+b),(35,134+b),(26,138+b),(19,125+b)],fill=(240,185,135),outline=O,width=3)
 d.polygon([(83,102+b),(90,108+b),(95,126+b),(85,132+b),(77,121+b)],fill=(237,183,137),outline=O,width=3)
 d.text((32,105+b),'DE BOA',font=font,fill='white',stroke_width=0)
 # head with alignment on real outline
 canvas.alpha_composite(head.resize((64,73),Image.Resampling.LANCZOS),(24,13+b))
 if kind=='coffee':
  d=ImageDraw.Draw(canvas);d.rounded_rectangle((84,116+b,106,140+b),radius=5,fill=(183,185,186),outline=O,width=3);d.arc((102,121+b,114,139+b),-90,80,fill=O,width=3)
 if kind=='type':
  d=ImageDraw.Draw(canvas);d.line([(84,124+b),(98,118+b),(108,121+b)],fill=(232,172,126),width=9)
 if kind=='sit':
  canvas=canvas.crop((0,0,SW,170)).resize((SW,155),Image.Resampling.NEAREST)
  dn=Image.new('RGBA',S);dn.alpha_composite(canvas,(0,31));canvas=dn
 return canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if flip else canvas

devsheet=Image.new('RGBA',(SW*6,SH*5));
for ri,kind in enumerate(['idle','walk','coffee','type','sit']):
 for fi in range(6):devsheet.alpha_composite(dev_frame(kind,fi),(fi*SW,ri*SH))
devsheet.save(os.path.join(AS,'dev-sheet.png'))
# Derive tinted character variants from artwork itself, preserving detailed style.
# Each original guest retains face/outline; hue shifts are constrained to clothing. Ready for independent animation.
arr=np.array(spr)
for name,shirt in [('ana',(184,111,80)),('ops',(68,118,87)),('pm',(107,89,144))]:
 data=arr.copy()
 # shirt light bluish source x-range local, y 65..122; tint within original extraction only
 for iy in range(ah):
  if 65<=iy<=123:
   for ix in range(aw*6):
    rr,gg,bb,aa=data[iy,ix,:4]
    if aa>0 and 78<bb<210 and bb>rr*.88 and bb>gg*.88 and max(rr,gg,bb)>85:
     data[iy,ix,0]=int(rr*.35+shirt[0]*.65)
     data[iy,ix,1]=int(gg*.35+shirt[1]*.65)
     data[iy,ix,2]=int(bb*.35+shirt[2]*.65)
 # mirror second direction same modification
 for iy in range(ah,ah*2):
  for ix in range(aw*6):
   rr,gg,bb,aa=data[iy,ix,:4]
   if aa>0 and 78<bb<210 and bb>rr*.88 and bb>gg*.88 and max(rr,gg,bb)>85:
    data[iy,ix,0]=int(rr*.35+shirt[0]*.65);data[iy,ix,1]=int(gg*.35+shirt[1]*.65);data[iy,ix,2]=int(bb*.35+shirt[2]*.65)
 Image.fromarray(data,'RGBA').save(os.path.join(AS,f'{name}-sheet.png'))
print('guest box',bbox,'files',os.listdir(AS))
