"""Gate G1 — Blender (Cycles) key-frame contact sheets of the G1 clips (body + facial morphs; the
runtime effects are not part of the Blender asset — see the runtime previews for those).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_render_g1.py [clip ...]
Writes 04_ANIMATIONS/g1_quest_reward_streak/renders/fox_g1_keyframes_<category>.png
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault('FOX_GATE', 'e2')
import anim_render_e2 as RE  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

MOD = os.path.join(RE.ROOT_DIR, '04_ANIMATIONS', 'g1_quest_reward_streak')
RE.SRC = os.path.join(MOD, 'fox_anim_g1.blend')
RE.SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g1.json')))
RE.OUT_DIR = os.path.join(MOD, 'renders')

PLAN = {
    'quest': [('quest_start', '34r', [1, 6, 9, 13, 18, 30, 38, 46, 60]),
              ('quest_complete', 'front', [1, 3, 10, 12, 15, 20, 24, 31, 50, 80]),
              ('quest_failed', '34', [1, 3, 10, 18, 28, 38, 47, 55, 70, 88])],
    'rewards': [('receive_xp', '34', [1, 4, 11, 18, 21, 23, 32, 44, 54]),
                ('level_up', 'front', [1, 10, 15, 17, 20, 23, 27, 31, 40, 56, 80, 100]),
                ('achievement_unlock', '34r', [1, 6, 11, 24, 30, 38, 50, 66, 78, 86])],
    'streak': [('streak_active', '34', [1, 13, 25, 37, 49, 61, 73, 85, 97]),
               ('streak_lost', '34', [1, 6, 12, 13, 15, 18, 28, 40, 58, 78, 82, 100]),
               ('streak_cheer', 'front', [1, 8, 12, 18, 24, 29, 40, 56, 74])],
}


def sheet(category, rows_plan, res=200):
    r = RE.Renderer(res=res, samples=6)
    rows = []
    for clip, view, frames in rows_plan:
        r.set_clip(clip)
        rows.append((f'{clip} · {view}', [(f, r.shot(f, view)) for f in frames]))
    cols = max(len(t) for _, t in rows)
    pad, lab = 4, 18
    W, H = cols * (res + pad) + pad, 50 + len(rows) * (res + lab + 26)
    S = Image.new('RGB', (W, H), RE.BG)
    d = ImageDraw.Draw(S)
    d.text((pad, 10), f'LifeQuest Fox V2 — Gate G1 · {category} · key frames (Blender Cycles, body + face)', fill=(60, 40, 30), font=RE.font(20, True))
    y = 46
    for title, tiles in rows:
        d.text((pad, y), title, fill=(60, 40, 30), font=RE.font(15, True))
        y += 22
        for i, (f, im) in enumerate(tiles):
            S.paste(im, (pad + i * (res + pad), y))
            d.text((pad + i * (res + pad) + 3, y + res), f'f{f}', fill=(90, 70, 60), font=RE.font(12))
        y += res + lab + 4
    out = os.path.join(RE.OUT_DIR, f'fox_g1_keyframes_{category}.png')
    S.save(out)
    if os.path.exists(r.tmp):
        os.remove(r.tmp)
    print(out, flush=True)


if __name__ == '__main__':
    cats = sys.argv[1:] or list(PLAN)
    for c in cats:
        sheet(c, PLAN[c])
