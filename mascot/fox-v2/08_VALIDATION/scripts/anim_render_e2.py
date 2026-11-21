"""Gate E2 — render animation QA sheets, previews and E1-vs-E2 comparisons (Cycles, armature hidden).

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/anim_render_e1.py qa                 # 04_ANIMATIONS/renders_e1/fox_e1_keyframes.png
    python 08_VALIDATION/scripts/anim_render_e1.py preview <name>...  # 04_ANIMATIONS/renders_e1/<name>.mp4 + .gif
       names: idle walk_side walk_34 run_side run_34 head_pet tail_touch happy wave
Locomotion previews move the character over a 5 cm checker floor at the clip's
speed_mps and the camera follows, so a planted foot must stay on its tile.
"""
import json
import math
import os
import shutil
import subprocess
import sys

import bpy
from mathutils import Matrix, Vector
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_turnaround as rt  # noqa: E402
from make_comparison import font, BG  # noqa: E402

ROOT_DIR = rt.ROOT
GATE = os.environ.get('FOX_GATE', 'e2')                       # e2 (default) or e1 (for the before/after comparison)
SRC = os.path.join(ROOT_DIR, '04_ANIMATIONS', f'fox_anim_{GATE}.blend')
SPEC = json.load(open(os.path.join(ROOT_DIR, '04_ANIMATIONS', f'anim_spec_{GATE}.json')))
OUT_DIR = os.environ.get('FOX_OUT', os.path.join(ROOT_DIR, '04_ANIMATIONS', 'renders_e2'))
VIEW_AZ = {'front': 0.0, '34': 38.0, 'side': 270.0, 'back': 180.0, '34back': 140.0, '34r': -38.0, 'back34r': 215.0}

PREVIEWS = {
    # name: (clip, view, loops, label)
    'idle': ('idle', '34', 1, 'idle (12 fps)', 2),
    'walk_front': ('walk', 'front', 1, 'walk — front'),
    'walk_side': ('walk', 'side', 1, 'walk — side, floor at speed_mps'),
    'walk_34': ('walk', '34', 1, 'walk — 3/4, floor at speed_mps'),
    'run_front': ('run', 'front', 2, 'run — front'),
    'run_side': ('run', 'side', 2, 'run — side, floor at speed_mps'),
    'run_34': ('run', '34', 2, 'run — 3/4, floor at speed_mps'),
    'head_pet': ('head_pet', '34', 1, 'head_pet'),
    'tail_touch': ('tail_touch', '34r', 1, 'tail_touch'),
    'happy': ('happy', 'front', 1, 'happy'),
    'wave': ('wave', '34r', 1, 'wave'),
}


class Renderer:
    def __init__(self, res=320, samples=8):
        bpy.ops.wm.open_mainfile(filepath=SRC)
        self.sc = bpy.context.scene
        self.cam = rt.setup(self.sc, samples, res)
        self.sc.render.engine = 'CYCLES'
        self.sc.cycles.samples = samples
        self.sc.cycles.use_denoising = True
        self.lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
        self.rest = {o.name: o.matrix_world.copy() for o in self.lights}
        self.rig = bpy.data.objects['FOX_RIG']
        self.rig.hide_render = True
        self.rig_rest = self.rig.matrix_world.copy()
        self.tmp = os.path.join(OUT_DIR, f'_tmp_{os.getpid()}.png')
        os.makedirs(OUT_DIR, exist_ok=True)
        self.floor = None

    def set_clip(self, name):
        act = bpy.data.actions[name]
        ad = self.rig.animation_data or self.rig.animation_data_create()
        ad.action = act
        ad.action_slot = next(s for s in act.slots if s.target_id_type == 'OBJECT')
        for key in bpy.data.shape_keys:
            sl = next((s for s in act.slots if s.target_id_type == 'KEY' and s.name_display == key.name), None)
            if sl is None:
                continue
            kad = key.animation_data or key.animation_data_create()
            kad.action = act
            kad.action_slot = sl
        return act

    def ensure_floor(self):
        if self.floor:
            self.floor.hide_render = False
            return
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -1.2, 0.0004))
        fl = bpy.context.active_object
        fl.name = 'REVIEW_Floor'
        fl.scale = (0.9, 4.0, 1)
        m = bpy.data.materials.new('REVIEW_FloorChecker')
        m.use_nodes = True
        nt = m.node_tree
        bsdf = nt.nodes['Principled BSDF']
        tex = nt.nodes.new('ShaderNodeTexChecker')
        tc = nt.nodes.new('ShaderNodeTexCoord')
        mp = nt.nodes.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (10, 10, 10)        # object coords: 1 m -> 10 squares... (scaled below)
        nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
        nt.links.new(mp.outputs['Vector'], tex.inputs['Vector'])
        tex.inputs['Scale'].default_value = 1.0
        tex.inputs['Color1'].default_value = (0.93, 0.86, 0.78, 1)
        tex.inputs['Color2'].default_value = (0.80, 0.70, 0.60, 1)
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.9
        fl.data.materials.append(m)
        # checker size: object space is scaled (0.9 x 4.0); compensate so squares are 5 cm in world
        mp.inputs['Scale'].default_value = (0.9 / 0.05 / 2, 4.0 / 0.05 / 2, 1)
        self.floor = fl

    def view(self, name, follow=Vector()):
        if name == 'face':
            az, zc, ortho = 0.0, 0.60, 0.55
        else:
            az, zc, ortho = VIEW_AZ[name], 0.50, 1.25
        a = math.radians(az)
        self.cam.data.ortho_scale = ortho
        tgt = Vector((follow.x, follow.y, zc))
        self.cam.location = tgt + Vector((-6 * math.sin(a), -6 * math.cos(a), 0))
        if name == 'side':
            self.cam.location.z = zc + 0.25
        else:
            self.cam.location.z = zc + 1.0
        rt.look_at(self.cam, tgt)
        for o in self.lights:
            o.matrix_world = Matrix.Translation(follow) @ Matrix.Rotation(-a, 4, 'Z') @ self.rest[o.name]

    def shot(self, frame, view, travel=0.0):
        self.sc.frame_set(frame)
        off = Vector((0, -travel, 0))
        self.rig.matrix_world = Matrix.Translation(off) @ self.rig_rest
        self.view(view, follow=off)
        self.sc.render.filepath = self.tmp
        bpy.ops.render.render(write_still=True)
        im = Image.open(self.tmp).convert('RGBA')
        bg = Image.new('RGBA', im.size, BG + (255,))
        bg.alpha_composite(im)
        return bg.convert('RGB')


def qa_sheet(res=200):
    r = Renderer(res=res, samples=6)
    plan = [('idle', '34', [1, 36, 64, 84, 117, 128]),
            ('walk', 'front', [1, 4, 7, 10, 13, 16, 19]),
            ('walk', 'side', [1, 4, 7, 10, 13, 16, 19]),
            ('walk', '34', [1, 6, 11, 16]),
            ('run', 'front', [1, 3, 5, 6, 8, 10, 12]),
            ('run', 'side', [1, 3, 5, 6, 8, 10, 12]),
            ('run', '34', [1, 4, 6, 8]),
            ('happy', 'front', [1, 8, 10, 14, 21, 30, 40, 52]),
            ('wave', '34r', [1, 9, 17, 24, 28, 36, 52, 62]),
            ('head_pet', '34', [1, 3, 12, 24, 40, 58, 63, 72]),
            ('tail_touch', '34r', [1, 3, 5, 10, 18, 28, 33, 40, 48, 62])]
    rows = []
    for clip, view, frames in plan:
        r.set_clip(clip)
        loco = clip in ('walk', 'run')
        if loco:
            r.ensure_floor()
        elif r.floor:
            r.floor.hide_render = True
        v = SPEC['clips'][clip].get('speed_mps', 0.0)
        tiles = [(f, r.shot(f, view, travel=v * (f - 1) / 24 if loco else 0.0)) for f in frames]
        rows.append((f'{clip} · {view}', tiles))
    cols = max(len(t) for _, t in rows)
    pad, lab = 4, 18
    W = cols * (res + pad) + pad
    H = 50 + len(rows) * (res + lab + 26)
    S = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(S)
    d.text((pad, 10), f'LifeQuest Fox V2 — Gate {GATE.upper()} key frames (Cycles QA)', fill=(60, 40, 30), font=font(22, True))
    y = 46
    for title, tiles in rows:
        d.text((pad, y), title, fill=(60, 40, 30), font=font(15, True))
        y += 22
        for i, (f, im) in enumerate(tiles):
            S.paste(im, (pad + i * (res + pad), y))
            d.text((pad + i * (res + pad) + 3, y + res), f'f{f}', fill=(90, 70, 60), font=font(12))
        y += res + lab + 4
    out = os.path.join(OUT_DIR, f'fox_{GATE}_keyframes.png')
    S.save(out)
    os.remove(r.tmp)
    print(out)


def preview(names, res=260, samples=5):
    r = Renderer(res=res, samples=samples)
    for name in names:
        clip, view, loops, label, *rest = PREVIEWS[name]
        step = rest[0] if rest else 1
        r.set_clip(clip)
        c = SPEC['clips'][clip]
        n = c['frames']
        loco = clip in ('walk', 'run')
        if loco:
            r.ensure_floor()
        elif r.floor:
            r.floor.hide_render = True
        v = c.get('speed_mps', 0.0)
        fdir = os.path.join(OUT_DIR, f'_frames_{name}')
        os.makedirs(fdir, exist_ok=True)
        k = 0
        total = n * loops + (0 if c['loop'] else 1)
        for t in range(0, total, step):
            f = (t % n) + 1 if c['loop'] else t + 1
            im = r.shot(f, view, travel=v * t / 24 if loco else 0.0)
            canvas = Image.new('RGB', (res, res + 26), BG)
            canvas.paste(im, (0, 26))
            ImageDraw.Draw(canvas).text((6, 6), f'{GATE.upper()} · {label} · f{f}', fill=(60, 40, 30), font=font(11, True))
            canvas.save(os.path.join(fdir, f'{k:04d}.png'))
            k += 1
        mp4 = os.path.join(OUT_DIR, f'fox_{GATE}_{name}.mp4')
        gif = os.path.join(OUT_DIR, f'fox_{GATE}_{name}.gif')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(24 // step), '-i', os.path.join(fdir, '%04d.png'),
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
                        '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp4, '-vf',
                        f'fps={24 // step},scale=260:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse',
                        gif], check=True)
        shutil.rmtree(fdir)
        print(name, mp4, k, 'frames', flush=True)
    if os.path.exists(r.tmp):
        os.remove(r.tmp)


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'qa'
    if mode == 'qa':
        qa_sheet()
    else:
        preview(sys.argv[2:] or list(PREVIEWS))
