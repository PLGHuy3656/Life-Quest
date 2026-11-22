"""Gate G2.1 — close-up deformation evidence (Cycles, armature hidden): front, side and 3/4 views of a region
at a given clip frame, for the original G2 blend and the corrected G2.1 blend, side by side.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/closeup_g2_1.py [shot …]
Writes 04_ANIMATIONS/g2_1_deformation_polish/closeups/closeup_<shot>.png (rows: G2 | G2.1; columns: front, side, 3/4)
Shots are the measured worst frames of the G2 failures (root_cause_g2_1.md). Subdivision ON (render geometry).
"""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
os.environ.setdefault('FOX_OUT', os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'closeups'))
import bpy  # noqa: E402
import anim_render_e2 as RE  # noqa: E402
import render_turnaround as rt  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
from make_comparison import font, BG  # noqa: E402

BLENDS = {'G2': os.path.join(ROOT, '04_ANIMATIONS', 'g2_daily_life', 'fox_anim_g2.blend'),
          'G2.1': os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'fox_anim_g2_1.blend')}
# shot: (clip, frame, bone to centre on, ortho scale, label)
SHOTS = {
    'sit_legs': ('study_focus', 1, 'HIPS', 0.55, 'seated legs — study_focus f1 (Leg raw stretch 2.06; visible 0.50)'),
    'lie_legs': ('sleep_loop', 1, 'HIPS', 0.75, 'lying legs — sleep_loop f1 (Leg raw 2.25; visible 0.57)'),
    'giggle_cheek': ('wake_late', 46, 'NECK', 0.45, 'wake_late f46 — cheek into the left shoulder 19.7 mm (head roll)'),
    'rub_face': ('wake_start', 42, 'NECK', 0.45, 'wake_start f42 — paw 18.3 mm into the head, scarf 7.2 mm, body 0.57'),
    'side_bend': ('sports_start', 20, 'SPINE', 0.6, 'sports_start f20 — side bend: shoulder in cheek 9.5 mm, body 0.52'),
    'scarf_body': ('sleep_wake', 81, 'SPINE', 0.45, 'sleep_wake f81 — scarf flap into the body while standing up'),
    'scarf_head': ('sleep_enter', 101, 'NECK', 0.45, 'sleep_enter f101 — scarf roll 6.3 mm into the jaw'),
    'arm_stretch': ('sports_complete', 50, 'ARM_R', 0.45, 'sports_complete f50 — right shoulder skin stretch 0.87 (wipe)'),
    'foot_tap': ('cooldown_wait_impatient', 88, 'FOOT_R', 0.35, 'cooldown_wait_impatient f88 — visible leg stretch 0.86 (foot tap)'),
}
VIEWS = {'front': 0.0, 'side': 270.0, '3/4': 38.0}


def shot(r, clip, frame, bone, scale, az):
    r.set_clip(clip); r.sc.frame_set(frame)
    rig = bpy.data.objects['FOX_RIG']; c = rig.matrix_world @ rig.pose.bones[bone].head
    a = math.radians(az); r.cam.data.ortho_scale = scale
    r.cam.location = c + Vector((-6 * math.sin(a), -6 * math.cos(a), 0.6)); rt.look_at(r.cam, c)
    for o in r.lights: o.matrix_world = Matrix.Rotation(-a, 4, 'Z') @ r.rest[o.name]
    r.sc.render.filepath = r.tmp; bpy.ops.render.render(write_still=True)
    im = Image.open(r.tmp).convert('RGBA'); bg = Image.new('RGBA', im.size, BG + (255,)); bg.alpha_composite(im)
    return bg.convert('RGB')


def main(names):
    res = 300; out = os.environ['FOX_OUT']; os.makedirs(out, exist_ok=True)
    rows = {n: {} for n in names}
    for gate, path in BLENDS.items():
        if not os.path.exists(path):
            continue
        RE.SRC = path
        r = RE.Renderer(res=res, samples=8)
        for n in names:
            clip, f, bone, sc, _ = SHOTS[n]
            if clip in bpy.data.actions:
                rows[n][gate] = [shot(r, clip, f, bone, sc, az) for az in VIEWS.values()]
        os.remove(r.tmp) if os.path.exists(r.tmp) else None
    for n in names:
        gates = [g for g in BLENDS if g in rows[n]]
        S = Image.new('RGB', (80 + 3 * (res + 6), 40 + len(gates) * (res + 26)), BG); d = ImageDraw.Draw(S)
        d.text((8, 10), SHOTS[n][4], fill=(60, 40, 30), font=font(15, True))
        for gi, g in enumerate(gates):
            y = 40 + gi * (res + 26)
            d.text((8, y + res // 2), g, fill=(60, 40, 30), font=font(18, True))
            for vi, (vn, im) in enumerate(zip(VIEWS, rows[n][g])):
                S.paste(im, (80 + vi * (res + 6), y)); d.text((84 + vi * (res + 6), y + res + 4), vn, fill=(90, 70, 60), font=font(12))
        p = os.path.join(out, f'closeup_{n}.png'); S.save(p); print(p, flush=True)


if __name__ == '__main__':
    main(sys.argv[1:] or list(SHOTS))
