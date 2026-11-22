"""Gate G2.1 — side-by-side comparison videos G2 | G2.1 (same event-driven runtime capture, same frames).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_g2_vs_g2_1_compare.py
Reads   04_ANIMATIONS/g2_daily_life/previews/fox_g2_<clip>.mp4 and 04_ANIMATIONS/g2_1_deformation_polish/previews/fox_g2_1_<clip>.mp4
Writes  04_ANIMATIONS/g2_1_deformation_polish/compare/fox_g2_vs_g2_1_<clip>.mp4 (G2 on top, G2.1 below) + fox_g2_vs_g2_1_all.mp4
"""
import os, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
A = os.path.join(ROOT, '04_ANIMATIONS', 'g2_daily_life', 'previews'); B = os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'previews')
OUT = os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'compare'); os.makedirs(OUT, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
clips = sorted(f[len('fox_g2_1_'):-4] for f in os.listdir(B) if f.startswith('fox_g2_1_') and f.endswith('.mp4'))
outs = []
for c in clips:
    a, b = os.path.join(A, f'fox_g2_{c}.mp4'), os.path.join(B, f'fox_g2_1_{c}.mp4')
    if not os.path.exists(a): continue
    o = os.path.join(OUT, f'fox_g2_vs_g2_1_{c}.mp4')
    lab = lambda t: f"drawtext=fontfile={FONT}:text='{t}':x=w-tw-14:y=8:fontsize=26:fontcolor=0x16324A:box=1:boxcolor=0xFFFFFFCC:boxborderw=6"
    fc = (f"[0:v]scale=1280:-2,{lab('G2')}[a];[1:v]scale=1280:-2,{lab('G2.1')}[b];[a][b]vstack=inputs=2:shortest=1,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a, '-i', b, '-filter_complex', fc, '-map', '[v]', '-r', '24', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', o], check=True)
    outs.append(o); print(o, flush=True)
lst = os.path.join(OUT, '_list.txt'); open(lst, 'w').write(''.join(f"file '{o}'\n" for o in outs))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(OUT, 'fox_g2_vs_g2_1_all.mp4')], check=True)
os.remove(lst); print('all', len(outs))
