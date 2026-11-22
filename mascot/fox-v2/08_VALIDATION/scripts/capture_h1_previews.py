"""Gate H1 — outfit preview videos rendered by the actual three.js runtime (deterministic, headless SwiftShader).

Serve 07_WEB_PREVIEW/companion_sandbox_h1/dist on 127.0.0.1:4198, then:  python 08_VALIDATION/scripts/capture_h1_previews.py
Each clip is driven the way the application drives it (activity / streak / daily state / play). 12 fps (2 steps of 1/24 s
per frame). Per recorded frame the same pose is grabbed from two cameras (nothing is stepped in between).
Writes 08_VALIDATION/runtime_h1/previews/h1_<outfit>.mp4 (+ a 6-frame strip PNG per video).
SwiftShader (CPU) rendering: visuals are exact, timing is not real time.
"""
import asyncio, base64, io, os, shutil, subprocess
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'previews')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4198/index.html') + '?capture=1&seed=7#/h1'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
CHROME = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
BG = (255, 250, 245)
ALL = ['idle', 'walk', 'run', 'head_pet', 'tail_touch', 'quest_complete', 'level_up', 'streak_active', 'streak_lost', 'study_focus', 'sports_active',
       'sleep_enter', 'sleep_loop', 'sleep_wake', 'challenge_win', 'duo_celebrate', 'duo_celebrate_mirror']
KEY = ['idle', 'walk', 'run', 'level_up', 'study_focus', 'sleep_enter', 'challenge_win']
PLAN = [('all_slots_test', ALL, ['34', 'side']), ('student', KEY, ['34']), ('sports', KEY, ['34']), ('explorer', KEY, ['34'])]
ONLY = [p for p in os.environ.get('FOX_H1_OUTFITS', '').split(',') if p]          # re-run a subset (software rendering is slow)
PLAN = [p for p in PLAN if not ONLY or p[0] in ONLY]
MAX_S = float(os.environ.get('FOX_H1_MAX_S', '6.0'))   # the outfit videos use 3.5 s per clip


async def grab(pg):
    b64 = await pg.evaluate("() => document.querySelector('.h1-stage canvas').toDataURL('image/png').split(',')[1]")
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGBA')
    bg = Image.new('RGBA', im.size, BG + (255,)); bg.alpha_composite(im)
    w, h = bg.size
    return bg.convert('RGB').crop((int(w * 0.12), int(h * 0.02), int(w * 0.88), int(h * 0.98)))


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 1000})).new_page()
        await pg.goto(URL)
        await pg.wait_for_function("window.__h1 && window.__h1.controller()", timeout=120000)
        await pg.wait_for_timeout(1500)
        raf = "() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
        for outfit, clips, views in PLAN:
            tmp = os.path.join(OUT, f'_frames_{outfit}'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
            n = 0; strip = []
            for clip in clips:
                dur = await pg.evaluate(f"""async () => {{ const c = window.__h1.controller(); window.__h1.resetFox(); c.setLevel(20, {{ immediate: true }});
                    await c.setOutfit('{outfit}'); return window.__h1.startClip('{clip}'); }}""")
                frames = int(min(float(dur), MAX_S) * 12)
                for f in range(frames):
                    await pg.evaluate("() => { const c = window.__h1.controller(); c.debug.step(1/24); c.debug.step(1/24); }")
                    cells = []
                    for v in views:
                        await pg.evaluate(f"() => window.__h1.setCamera('{v}')"); await pg.evaluate(raf)
                        cells.append(await grab(pg))
                    w, h = cells[0].size
                    im = Image.new('RGB', (w * len(cells), h + 30), BG); d = ImageDraw.Draw(im)
                    for i, c in enumerate(cells): im.paste(c, (i * w, 30))
                    d.text((10, 7), f'H1 · outfit {outfit} · {clip} · Lv20 · {" / ".join("3/4" if v == "34" else v for v in views)}', fill=(60, 40, 30), font=FONT)
                    im.save(os.path.join(tmp, f'{n:05d}.png')); n += 1
                    if f == frames // 2: strip.append(im)
                await pg.evaluate("() => { const c = window.__h1.controller(); c.debug.daily.clear(); c.setStreak({ active: false }); }")
            mp4 = os.path.join(OUT, f'h1_{outfit}.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', os.path.join(tmp, '%05d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '23', mp4], check=True)
            sw = min(len(strip), 6); W, H = strip[0].size
            sh = Image.new('RGB', (W * min(sw, 3), H * ((sw + 2) // 3)), BG)
            for i, s in enumerate(strip[:sw]): sh.paste(s, ((i % 3) * W, (i // 3) * H))
            sh.thumbnail((2400, 2400)); sh.save(os.path.join(OUT, f'h1_{outfit}_strip.png'))
            shutil.rmtree(tmp)
            print(f'{outfit}: {n} frames → {mp4} ({os.path.getsize(mp4)} B)', flush=True)
        await b.close()


if __name__ == '__main__':
    asyncio.run(main())
