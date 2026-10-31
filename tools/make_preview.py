from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import math
base=Path(__file__).parent.parent
bg=Image.open(base/'assets/office-illustration.png').convert('RGBA')
asset=Image.open(base/'assets/guest-walksheet.png').convert('RGBA');fw=asset.width//6;fh=asset.height//2
path=[(921,813),(870,743),(801,666),(760,627),(708,624),(671,606)]
coords=[]
for i in range(len(path)-1):
 a,b=path[i],path[i+1]
 for t in range(5):
  p=t/5;coords.append((a[0]*(1-p)+b[0]*p,a[1]*(1-p)+b[1]*p))
frames=[]
for idx,(x,y) in enumerate(coords):
 im=bg.copy()
 a=Image.new('RGBA',(90,190),(0,0,0,0)); sprite=asset.crop(((idx%6)*fw,0,(idx%6+1)*fw,fh));a.alpha_composite(sprite,(6,(idx%6==3)*1))
 im.alpha_composite(a,(int(x-45),int(y-190)))
 im=im.resize((768,512),Image.Resampling.LANCZOS)
 # direct RGB-> adaptive P prevents drastically changing the original color treatment
 frames.append(im.convert('RGB').quantize(colors=180,method=Image.Quantize.FASTOCTREE))
frames[0].save(base/'preview-animated.gif',save_all=True,append_images=frames[1:],duration=160,loop=0,optimize=False,disposal=2)
print((base/'preview-animated.gif').stat().st_size)
