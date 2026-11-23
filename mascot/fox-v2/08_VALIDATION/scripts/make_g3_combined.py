"""Gate G3 — one combined review video of all 17 G3 clips (+ the duo mirror variant) from the runtime previews.

Usage (from LifeQuest_Fox_V2/): python 08_VALIDATION/scripts/make_g3_combined.py
Reads   04_ANIMATIONS/g3_challenge_social/previews/fox_g3_<clip>.mp4 (capture_g3_previews.py)
Writes  04_ANIMATIONS/g3_challenge_social/previews/fox_g3_all_17_clips.mp4 — every clip in event order, front + 3/4 (+ side),
        each preceded by a 0.6 s title card, normalised to 1280 px wide (letterboxed, no stretching).
"""
import json, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g3_challenge_social')
PREV = os.path.join(MOD, 'previews')
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g3.json')))
ORDER = [c for cat in SPEC['categories'].values() for c in cat if c != 'duo_celebrate_mirror']
W, H = 1280, 560
F1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)

def card(path, i, clip):
    im = Image.new('RGB', (W, H), (251, 250, 247)); d = ImageDraw.Draw(im)
    c = SPEC['clips'][clip]
    d.text((60, 190), f'{i}/17  {clip}', fill=(22, 50, 74), font=F1)
    d.text((60, 250), f"{c['event']} · {c['category']} · {c['duration_s']:.2f} s" + (' · large motion' if c['large_motion'] else ''), fill=(102, 112, 133), font=F2)
    d.text((60, 300), 'LifeQuest Fox V2 — Gate G3 · runtime capture (three.js, props + effects) — for visual review, not auto-approved', fill=(150, 156, 168), font=F2)
    im.save(path)

def main():
    tmp = tempfile.mkdtemp(); parts = []
    vf = f'scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xFBFAF7,setsar=1,fps=24'
    for i, clip in enumerate(ORDER, 1):
        png = os.path.join(tmp, f'c{i}.png'); card(png, i, clip)
        cmp4 = os.path.join(tmp, f'c{i}.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-t', '0.6', '-i', png, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', cmp4], check=True)
        vmp4 = os.path.join(tmp, f'v{i}.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(PREV, f'fox_g3_{clip}.mp4'), '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', vmp4], check=True)
        parts += [cmp4, vmp4]
    lst = os.path.join(tmp, 'list.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    out = os.path.join(PREV, 'fox_g3_all_17_clips.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
    print(out)

if __name__ == '__main__':
    main()
