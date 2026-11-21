"""Gate D1 — render the rigging contact sheet and the animation preview.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/rig_render.py sheet      # 03_RIG/renders/fox_rig_contact_sheet.png
    python 08_VALIDATION/scripts/rig_render.py preview    # 03_RIG/renders/fox_rig_preview.mp4 (+ .gif)
Cycles (low samples, denoised), same camera-relative light rig as the Gate C turnaround. Several views
per pose (front / 3/4 / side / back as relevant) so problems are not hidden
by camera choice.
"""
import math
import os
import shutil
import subprocess
import sys

import bpy
from mathutils import Matrix
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_turnaround as rt  # noqa: E402
from make_comparison import font, BG  # noqa: E402
import importlib  # noqa: E402
_T = importlib.import_module(os.environ.get('FOX_TESTS', 'rig_tests'))  # rig_tests (D1) or rig_tests_d1_1
TESTS, POSE_LABELS, RIG_FILE = _T.TESTS, _T.POSE_LABELS, _T.RIG_FILE

ROOT_DIR = rt.ROOT
OUT_DIR = os.path.join(ROOT_DIR, '03_RIG', os.environ.get('FOX_RENDER_DIR', 'renders'))
VIEW_AZ = {'front': 0.0, '34': 38.0, 'side': 270.0, 'back': 180.0, '34back': 140.0}
TEST_VIEWS = {'T1': ['front', '34', 'side'], 'T2': ['front', '34', 'back'], 'T3': ['back', '34back', 'side'],
              'T4': ['front', '34', 'back'], 'T5': ['front', 'side', 'back'], 'T6': ['face']}


class Renderer:
    def __init__(self, res=360, samples=12):
        bpy.ops.wm.open_mainfile(filepath=RIG_FILE)
        self.sc = bpy.context.scene
        self.cam = rt.setup(self.sc, 8, res)
        # Cycles (CPU): EEVEE runs on software GL in this build environment
        # (~45 s/frame), Cycles at low samples + denoise is ~5 s/frame
        self.sc.render.engine = 'CYCLES'
        self.sc.cycles.samples = samples
        self.sc.cycles.use_denoising = True
        self.rig_lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
        self.rest = {o.name: o.matrix_world.copy() for o in self.rig_lights}
        bpy.data.objects['FOX_RIG'].hide_render = True
        self.tmp = os.path.join(OUT_DIR, '_tmp.png')
        os.makedirs(OUT_DIR, exist_ok=True)

    def view(self, name):
        if name == 'face':
            az, zc, ortho = 0.0, 0.60, 0.55
        else:
            az, zc, ortho = VIEW_AZ[name], 0.50, 1.20
        a = math.radians(az)
        self.cam.data.ortho_scale = ortho
        self.cam.location = (-6 * math.sin(a), -6 * math.cos(a), zc)
        rt.look_at(self.cam, (0, 0, zc))
        for o in self.rig_lights:
            o.matrix_world = Matrix.Rotation(-a, 4, 'Z') @ self.rest[o.name]

    def shot(self, frame, view):
        self.sc.frame_set(frame)
        self.view(view)
        self.sc.render.filepath = self.tmp
        bpy.ops.render.render(write_still=True)
        im = Image.open(self.tmp).convert('RGBA')
        bg = Image.new('RGBA', im.size, BG + (255,))
        bg.alpha_composite(im)
        return bg.convert('RGB')


def contact_sheet(res=300):
    r = Renderer(res=res)
    rows = []
    for tid, (label, a, b, poses) in TESTS.items():
        views = TEST_VIEWS[tid]
        tiles = []
        for f in [a] + poses if tid != 'T6' else poses:
            for v in views:
                tiles.append((f, v, r.shot(f, v)))
        rows.append((tid, label, tiles))
    pad, lab_h, head = 6, 22, 70
    per_row = max(len(t) for _, _, t in rows)
    cols = min(per_row, 9)
    W = cols * (res + pad) + pad
    blocks = []
    for tid, label, tiles in rows:
        nlines = math.ceil(len(tiles) / cols)
        blocks.append((tid, label, tiles, nlines))
    H = head + sum(40 + n * (res + lab_h + pad) for *_, n in blocks) + 10
    S = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(S)
    d.text((pad, 14), os.environ.get('FOX_SHEET_TITLE', 'LifeQuest Fox V2 — Gate D1 rig deformation tests (Cycles preview, armature hidden)'),
           fill=(60, 40, 30), font=font(28, True))
    d.text((pad, 46), 'Each pose shown from several cameras; first tile of each body test = rest pose for reference.',
           fill=(90, 70, 60), font=font(16))
    y = head
    for tid, label, tiles, nlines in blocks:
        d.text((pad, y + 8), f'{tid} — {label}', fill=(60, 40, 30), font=font(22, True))
        y += 40
        for i, (f, v, im) in enumerate(tiles):
            cx = pad + (i % cols) * (res + pad)
            cy = y + (i // cols) * (res + lab_h + pad)
            S.paste(im, (cx, cy))
            txt = ('rest' if f == TESTS[tid][1] and tid != 'T6' else POSE_LABELS.get(f, f'f{f}')) + f' · {v}'
            d.text((cx + 4, cy + res + 2), txt, fill=(80, 60, 50), font=font(13))
        y += nlines * (res + lab_h + pad)
    out = os.path.join(OUT_DIR, 'fox_rig_contact_sheet.png')
    S.save(out)
    os.remove(r.tmp)
    print(out)


def preview(res=280, step=3):
    r = Renderer(res=res, samples=6)
    fdir = os.path.join(OUT_DIR, '_frames')
    os.makedirs(fdir, exist_ok=True)
    start, end = r.sc.frame_start, r.sc.frame_end
    label_of = {}
    for tid, (label, a, b, _) in TESTS.items():
        for f in range(a, b + 1):
            label_of[f] = f'{tid} {label}'
    k = 0
    for f in range(start, end + 1, step):
        tid = label_of[f][:2]
        view = {'T1': '34', 'T2': 'front', 'T3': '34back', 'T4': 'front', 'T5': 'side', 'T6': 'face'}[tid]
        im = r.shot(f, view)
        canvas = Image.new('RGB', (res, res + 28), BG)
        canvas.paste(im, (0, 28))
        ImageDraw.Draw(canvas).text((6, 6), f'{label_of[f]}  ·  f{f}', fill=(60, 40, 30), font=font(13, True))
        canvas.save(os.path.join(fdir, f'{k:04d}.png'))
        k += 1
    fps = 24 // step
    mp4 = os.path.join(OUT_DIR, 'fox_rig_preview.mp4')
    gif = os.path.join(OUT_DIR, 'fox_rig_preview.gif')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(fdir, '%04d.png'),
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
                    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-vf',
                    f'fps={fps},scale=300:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse',
                    gif], check=True)
    shutil.rmtree(fdir)
    os.remove(r.tmp)
    print(mp4, gif, k, 'frames')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'sheet'
    contact_sheet() if mode == 'sheet' else preview()
