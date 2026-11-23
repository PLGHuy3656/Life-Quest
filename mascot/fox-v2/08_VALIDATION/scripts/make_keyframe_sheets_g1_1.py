"""Gate G1.1 — runtime key-frame sheets rebuilt from the preview videos (front | 3/4 of each key frame).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_keyframe_sheets_g1_1.py
Reads   04_ANIMATIONS/g1_1_cinematic_polish/previews/fox_g1_1_<clip>.mp4 (capture_g1_1_previews.py)
Writes  04_ANIMATIONS/g1_1_cinematic_polish/renders/fox_g1_1_runtime_keyframes_<category>.png
(capture_g1_1_previews.py writes sheets only for the clips of one run; this script always covers all nine.)
"""
import io, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capture_g1_1_previews as C  # noqa: E402

FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)


def frame(mp4, n):
    png = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp4, '-vf', f"select='eq(n\\,{n})'", '-vsync', '0', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
                         capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB')


def main():
    sheets = {}
    for clip, (_s, _t, _e, views, keys) in C.PLAN.items():
        mp4 = os.path.join(C.PREV, f'fox_g1_1_{clip}.mp4')
        tiles = []
        for k in keys:
            im = frame(mp4, k)
            if len(views) > 2:                                   # keep front | 3/4 of a three-view frame
                im = im.crop((0, 0, int(im.width * 2 / 3) - 2, im.height))
            tiles.append(im)
        sheets.setdefault(C.SPEC['clips'][clip]['category'], []).append(tiles)
    for cat, rows in sheets.items():
        tw, pad = 300, 6
        rs = [[t.resize((tw, int(t.height * tw / t.width))) for t in r] for r in rows]
        th = max(t.height for r in rs for t in r)
        S = Image.new('RGB', (pad + 6 * (tw + pad), 46 + len(rs) * (th + pad + 4)), (245, 243, 238)); d = ImageDraw.Draw(S)
        d.text((pad, 12), f'LifeQuest Fox V2 — Gate G1.1 · {cat} · runtime key frames (front | 3/4, three.js with effects)', fill=(22, 50, 74), font=FONT)
        y = 46
        for r in rs:
            for i, t in enumerate(r): S.paste(t, (pad + i * (tw + pad), y))
            y += th + pad + 4
        out = os.path.join(C.REN, f'fox_g1_1_runtime_keyframes_{cat}.png'); S.save(out); print(out)


if __name__ == '__main__':
    main()
