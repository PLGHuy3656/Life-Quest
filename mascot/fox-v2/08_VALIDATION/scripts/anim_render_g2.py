"""Gate G2 — Cycles QA sheets of the G2 actions (armature hidden), front / 3/4 / side.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/anim_render_g2.py sheet <clip>[,<clip>...] [views=front,34,side] [n=8]
    python 08_VALIDATION/scripts/anim_render_g2.py all            # one Blender key-frame sheet per category
Writes 04_ANIMATIONS/g2_daily_life/renders/fox_g2_blender_<clip|category>.png
Props and VFX are runtime objects and do not appear here (see the browser previews for them).
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g2_daily_life')
os.environ.setdefault('FOX_OUT', os.path.join(MOD, 'renders'))
import anim_render_e2 as RE  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402
from make_comparison import font, BG  # noqa: E402

RE.SRC = os.environ.get('FOX_G2_BLEND', os.path.join(MOD, 'fox_anim_g2.blend'))
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g2.json')))
OUT = os.environ['FOX_OUT']


def frames_for(clip, n):
    c = SPEC['clips'][clip]
    N = c['frames'] + 1
    keys = c.get('key_frames')
    if keys:
        return keys
    return sorted({1 + round(i * (N - 1) / (n - 1)) for i in range(n)})


def sheet(clips, views, n, out_name, res=200, r=None):
    r = r or RE.Renderer(res=res, samples=5)
    rows = []
    for clip in clips:
        r.set_clip(clip)
        fs = frames_for(clip, n)
        for v in views:
            rows.append((f'{clip} · {v}', [(f, r.shot(f, v)) for f in fs]))
    cols = max(len(t) for _, t in rows)
    pad, lab = 4, 16
    S = Image.new('RGB', (cols * (res + pad) + pad, 46 + len(rows) * (res + lab + 24)), BG)
    d = ImageDraw.Draw(S)
    d.text((pad, 10), f'LifeQuest Fox V2 — Gate G2 · {out_name} · Blender key frames (Cycles, props/VFX are runtime-only)', fill=(60, 40, 30), font=font(18, True))
    y = 42
    for title, tiles in rows:
        d.text((pad, y), title, fill=(60, 40, 30), font=font(14, True))
        y += 20
        for i, (f, im) in enumerate(tiles):
            S.paste(im, (pad + i * (res + pad), y))
            d.text((pad + i * (res + pad) + 3, y + res), f'f{f}', fill=(90, 70, 60), font=font(12))
        y += res + lab + 4
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, f'fox_g2_blender_{out_name}.png')
    S.save(p)
    print(p, flush=True)
    return r


def main():
    if sys.argv[1] == 'sheet':
        clips = sys.argv[2].split(',')
        views = sys.argv[3].split(',') if len(sys.argv) > 3 else ['front', '34', 'side']
        n = int(sys.argv[4]) if len(sys.argv) > 4 else 8
        sheet(clips, views, n, os.environ.get('FOX_SHEET_NAME') or (clips[0] if len(clips) == 1 else 'mix'))
    else:
        r = None
        for cat, clips in SPEC['categories'].items():
            r = sheet(clips, ['front', '34'], 8, cat, r=r)
    try:
        os.remove(RE.Renderer.__dict__ and os.path.join(OUT, f'_tmp_{os.getpid()}.png'))
    except OSError:
        pass


if __name__ == '__main__':
    main()
