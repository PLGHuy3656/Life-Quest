"""Render a strip that proves the prepared facial controls work.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/render_face_controls.py [output_name.png]
Output: 01_DESIGN/comparisons/fox_face_controls_test.png

Facial architecture (simple, web-friendly):
  * FOX_Eye_L/R shape keys: Blink, Wide, Sad, HalfLid, Proud (0..1)
  * FOX_Brow_L/R shape keys: Sad, Proud
  * swap meshes (visibility): FOX_EyeClosedHappy_*, FOX_EyeClosedSleepy_*,
    FOX_Mouth_Neutral / Open (+Tongue) / SmallO / Frown / Smile, FOX_Brow_*
"""
import os
import sys
import bpy
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_turnaround as rt  # noqa: E402
from make_comparison import font, BG  # noqa: E402

ROOT = rt.ROOT
SWAP = ['FOX_EyeClosedHappy_L', 'FOX_EyeClosedHappy_R', 'FOX_EyeClosedSleepy_L', 'FOX_EyeClosedSleepy_R',
        'FOX_Mouth_Neutral', 'FOX_Mouth_Open', 'FOX_Mouth_Tongue', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown',
        'FOX_Mouth_Smile', 'FOX_Brow_L', 'FOX_Brow_R', 'FOX_Eye_L', 'FOX_Eye_R']
EYES = ['FOX_Eye_L', 'FOX_Eye_R']
BROWS = ['FOX_Brow_L', 'FOX_Brow_R']
EXPRESSIONS = {
    'Neutral':   {'show': EYES + ['FOX_Mouth_Neutral'], 'eye': {}, 'brow': {}},
    'Blink':     {'show': EYES + ['FOX_Mouth_Neutral'], 'eye': {'Blink': 1.0}, 'brow': {}},
    'Happy':     {'show': ['FOX_EyeClosedHappy_L', 'FOX_EyeClosedHappy_R', 'FOX_Mouth_Open', 'FOX_Mouth_Tongue'], 'eye': {}, 'brow': {}},
    'Proud':     {'show': EYES + BROWS + ['FOX_Mouth_Smile'], 'eye': {'Proud': 1.0}, 'brow': {'Proud': 1.0}},
    'Sad':       {'show': EYES + BROWS + ['FOX_Mouth_Frown'], 'eye': {'Sad': 1.0}, 'brow': {'Sad': 1.0}},
    'Surprised': {'show': EYES + ['FOX_Mouth_Open', 'FOX_Mouth_Tongue'], 'eye': {'Wide': 1.0}, 'brow': {}},
    'Sleepy':    {'show': ['FOX_EyeClosedSleepy_L', 'FOX_EyeClosedSleepy_R', 'FOX_Mouth_SmallO'], 'eye': {}, 'brow': {}},
}


def apply(expr):
    for n in SWAP:
        o = bpy.data.objects[n]
        vis = n in expr['show']
        o.hide_render = not vis
    for names, keys in ((EYES, expr['eye']), (BROWS, expr['brow'])):
        for n in names:
            for kb in bpy.data.objects[n].data.shape_keys.key_blocks[1:]:
                kb.value = keys.get(kb.name, 0.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, '02_MODEL', 'fox_master.blend'))
    sc = bpy.context.scene
    cam = rt.setup(sc, 24, 360)
    cam.data.ortho_scale = 0.50
    cam.location = (0, -6, 0.60)
    rt.look_at(cam, (0, 0, 0.60))
    tiles = []
    tmp = os.path.join(ROOT, '08_VALIDATION', '_face_tmp.png')
    for name, expr in EXPRESSIONS.items():
        apply(expr)
        sc.render.filepath = tmp
        bpy.ops.render.render(write_still=True)
        im = Image.open(tmp).convert('RGBA')
        bg = Image.new('RGBA', im.size, BG + (255,))
        bg.alpha_composite(im)
        tiles.append((name, bg.convert('RGB')))
    os.remove(tmp)
    W = 360 * len(tiles)
    sheet = Image.new('RGB', (W, 420), BG)
    d = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(tiles):
        sheet.paste(im, (i * 360, 0))
        d.text((i * 360 + 12, 372), name, fill=(60, 40, 30), font=font(26, True))
    name = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.png') else 'fox_face_controls_test.png'
    out = os.path.join(ROOT, '01_DESIGN', 'comparisons', name)
    sheet.save(out)
    print(out)


if __name__ == '__main__':
    main()
