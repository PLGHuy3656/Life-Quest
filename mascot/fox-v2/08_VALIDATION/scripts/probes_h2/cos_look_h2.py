# Gate H2 render probe (Blender): OUTFITS=mage;ninja VIEWS=front,34,side SRC=<anim blend> CLIP=<action> python cos_look_h2.py — renders outfits from the H1 + H2 cosmetic blends

import os, sys
S=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); sys.path.insert(0,S)
import tempfile; os.environ.setdefault('FOX_OUT', tempfile.gettempdir())
import anim_render_e2 as RE
import cosmetics_scene_h2 as CS
from PIL import Image
RE.SRC=os.environ.get('SRC', RE.SRC)
clip=os.environ.get('CLIP','idle'); frames=[int(x) for x in os.environ.get('FRAMES','1').split(',')]
views=os.environ.get('VIEWS','front,34,side,back').split(',')
outfits=[list(CS.OUTFITS[o].values()) if o in CS.OUTFITS else (o.split('+') if o else []) for o in os.environ.get('OUTFITS','mage').split(';')]
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
im.save(os.environ.get('OUTPNG', os.path.join(tempfile.gettempdir(), 'cos_h2.png')))
