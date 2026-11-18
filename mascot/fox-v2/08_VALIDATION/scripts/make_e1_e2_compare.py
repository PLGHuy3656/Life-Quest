"""Gate E2 — before/after videos: E1 (left) | E2 (right), same camera, same size.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_e1_e2_compare.py
Inputs  04_ANIMATIONS/renders_e1/fox_e1_<view>.mp4 (approved E1 previews) or
        04_ANIMATIONS/renders_compare/e1/fox_e1_<view>.mp4 (E1 views rendered for E2), and
        04_ANIMATIONS/renders_e2/fox_e2_<view>.mp4
Writes  04_ANIMATIONS/renders_compare/fox_e1_vs_e2_<view>.mp4 and fox_e1_vs_e2_all.mp4
The shorter side holds its last frame so both play to the end.
"""
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
A = os.path.join(ROOT, '04_ANIMATIONS')
OUT = os.path.join(A, 'renders_compare')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
VIEWS = ['idle', 'walk_front', 'walk_34', 'walk_side', 'run_front', 'run_34', 'run_side', 'happy', 'wave', 'head_pet', 'tail_touch']


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode())


def main():
    made = []
    for v in VIEWS:
        e1 = next((p for p in (os.path.join(A, 'renders_e1', f'fox_e1_{v}.mp4'), os.path.join(OUT, 'e1', f'fox_e1_{v}.mp4')) if os.path.exists(p)), None)
        e2 = os.path.join(A, 'renders_e2', f'fox_e2_{v}.mp4')
        if not e1 or not os.path.exists(e2):
            print('skip', v, e1, os.path.exists(e2))
            continue
        d = max(dur(e1), dur(e2))
        out = os.path.join(OUT, f'fox_e1_vs_e2_{v}.mp4')
        lab = lambda t, c: (f"drawtext=fontfile={FONT}:text='{t}':x=(w-tw)/2:y=4:fontsize=15:fontcolor={c}")  # noqa: E731
        fc = (f"[0:v]fps=24,scale=-2:286,tpad=stop_mode=clone:stop_duration={d},trim=duration={d},pad=iw:ih+24:0:24:color=0xFDF6F1,{lab('E1 approved', '0x7a6355')}[a];"
              f"[1:v]fps=24,scale=-2:286,tpad=stop_mode=clone:stop_duration={d},trim=duration={d},pad=iw:ih+24:0:24:color=0xFDF6F1,{lab('E2 polish', '0xE8742A')}[b];"
              f"[a][b]hstack=inputs=2,pad=iw+0:ih:0:0[o]")
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', e1, '-i', e2, '-filter_complex', fc, '-map', '[o]',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], check=True)
        made.append(out)
        print(v, out, round(d, 2), 's')
    if made:
        lst = os.path.join(OUT, '_list.txt')
        open(lst, 'w').write(''.join(f"file '{p}'\n" for p in made))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c:v', 'libx264', '-preset', 'veryfast',
                        '-crf', '20', '-pix_fmt', 'yuv420p', os.path.join(OUT, 'fox_e1_vs_e2_all.mp4')], check=True)
        os.remove(lst)
        print('all', os.path.join(OUT, 'fox_e1_vs_e2_all.mp4'))


if __name__ == '__main__':
    main()
