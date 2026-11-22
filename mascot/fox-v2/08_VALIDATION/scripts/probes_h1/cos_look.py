import os, sys
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
os.environ.setdefault('FOX_OUT','/home/claude/g2/tmp')
import anim_render_e2 as RE
import cosmetics_scene_h1 as CS
from PIL import Image
RE.SRC=os.environ.get('SRC', RE.SRC)
clip=os.environ.get('CLIP','idle'); frames=[int(x) for x in os.environ.get('FRAMES','1').split(',')]
views=os.environ.get('VIEWS','front,34,side,back').split(',')
outfits=[o.split('+') if o else [] for o in os.environ.get('OUTFITS','student_glasses+student_cap+simple_jacket+explorer_magnifier').split(';')]
W=int(os.environ.get('RES','300'))
r=RE.Renderer(res=W,samples=6); r.set_clip(clip)
cos=CS.load_cosmetics()
if os.environ.get('FACE'): RE.VIEW_AZ  # noqa
cells=[]
for of in outfits:
    CS.apply_outfit(cos, of)
    for f in frames:
        for v in views: cells.append(r.shot(f,v))
cols=len(views)*len(frames)
im=Image.new('RGB',(W*cols,W*len(outfits)),(255,255,255))
for i,c in enumerate(cells): im.paste(c,((i%cols)*W,(i//cols)*W))
im.save(os.environ.get('OUTPNG','/home/claude/g2/tmp/cos.png'))
