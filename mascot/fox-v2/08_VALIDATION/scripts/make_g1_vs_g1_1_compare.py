"""Gate G1.1 — G1 vs G1.1 comparison video (front views side by side, clip by clip).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_g1_vs_g1_1_compare.py
Reads   04_ANIMATIONS/g1_quest_reward_streak/previews/fox_g1_<clip>.mp4   (approved G1 previews, read only)
        04_ANIMATIONS/g1_1_cinematic_polish/previews/fox_g1_1_<clip>.mp4   (G1.1, front panel = left part)
Writes  04_ANIMATIONS/g1_1_cinematic_polish/compare/fox_g1_vs_g1_1_<clip>.mp4 and fox_g1_vs_g1_1_all.mp4
The shorter clip holds its last frame so both finish together. Needs ffmpeg.
"""
import json, os, subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
G1 = os.path.join(ROOT, '04_ANIMATIONS', 'g1_quest_reward_streak', 'previews')
G11 = os.path.join(ROOT, '04_ANIMATIONS', 'g1_1_cinematic_polish', 'previews')
OUT = os.path.join(ROOT, '04_ANIMATIONS', 'g1_1_cinematic_polish', 'compare')
CLIPS = ['quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'level_up', 'achievement_unlock', 'streak_active', 'streak_lost', 'streak_cheer']
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def probe(p):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames', '-of', 'json', p], capture_output=True, text=True, check=True)
    s = json.loads(o.stdout)['streams'][0]
    return int(s['width']), int(s['height']), int(s['nb_frames'])


def main():
    os.makedirs(OUT, exist_ok=True)
    parts = []
    for c in CLIPS:
        a, b = os.path.join(G1, f'fox_g1_{c}.mp4'), os.path.join(G11, f'fox_g1_1_{c}.mp4')
        if not (os.path.exists(a) and os.path.exists(b)):
            print('skip', c); continue
        wa, ha, na = probe(a); wb, hb, nb = probe(b)
        n = max(na, nb); H = 500
        # G1.1 panel: keep the first (front) view = left 'H*0.665' of the multi-view frame, plus its title bar
        fc = (f"[0:v]scale=-2:{H},tpad=stop_mode=clone:stop={n - na},drawtext=fontfile={FONT}:text='G1 (approved, technical pass)':x=10:y=h-28:fontsize=18:fontcolor=0x16324A[l];"
              f"[1:v]crop=iw*{1.0 / (3 if c in ('level_up', 'streak_lost') else 2):.4f}+3:ih:0:0,scale=-2:{H},tpad=stop_mode=clone:stop={n - nb},"
              f"drawtext=fontfile={FONT}:text='G1.1 (cinematic polish)':x=10:y=h-28:fontsize=18:fontcolor=0xF26B3A[r];"
              f"[l][r]hstack=inputs=2,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]")
        out = os.path.join(OUT, f'fox_g1_vs_g1_1_{c}.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a, '-i', b, '-filter_complex', fc, '-map', '[v]', '-r', '24', '-c:v', 'libx264',
                        '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', out], check=True)
        parts.append(out); print(c, out, n, 'frames')
    # one reel: normalise sizes, then concatenate
    W = max(probe(p)[0] for p in parts); Hh = max(probe(p)[1] for p in parts)
    norm = []
    for p in parts:
        q = p.replace('.mp4', '._n.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-vf', f'pad={W}:{Hh}:0:0:color=0xFBFAF7', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', q], check=True)
        norm.append(q)
    lst = os.path.join(OUT, '_list.txt'); open(lst, 'w').write(''.join(f"file '{q}'\n" for q in norm))
    allp = os.path.join(OUT, 'fox_g1_vs_g1_1_all.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', allp], check=True)
    for q in norm: os.remove(q)
    os.remove(lst)
    print(allp)


if __name__ == '__main__':
    main()
