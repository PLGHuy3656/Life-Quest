"""Gate G1.1 — runtime previews WITH effects, rendered by the actual three.js runtime (deterministic).

Serve 07_WEB_PREVIEW/companion_sandbox_g1_1/dist on 127.0.0.1:4190, then:
    python 08_VALIDATION/scripts/capture_g1_1_previews.py [clip …]
Each frame: controller.debug.step(1/24) → the same pose is grabbed from the front and from 3/4
(the companion group is turned; nothing is stepped in between), plus a side view where the motion
needs it (level_up spin, streak_lost jolt). 24 fps.
Writes 04_ANIMATIONS/g1_1_cinematic_polish/previews/fox_g1_1_<clip>.mp4 and
       04_ANIMATIONS/g1_1_cinematic_polish/renders/fox_g1_1_runtime_keyframes_<category>.png
Headless SwiftShader (CPU) rendering: visuals are exact, timing is not real time.
"""
import asyncio, base64, io, json, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g1_1_cinematic_polish')
PREV, REN = os.path.join(MOD, 'previews'), os.path.join(MOD, 'renders')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4190/index.html') + '?capture=1&seed=7#/g1'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g1_1.json')))
VIEWS = {'front': 0.0, '3/4': -0.62, '3/4 R': 0.62, 'side': -1.5708}
CROP = (0.2, 0.03, 0.8, 0.98)                     # fraction of the stage canvas (fox + effects)

# clip → (setup JS, label, extra seconds after the clip, views, key frames for the sheet)
STREAK = "c.setStreak({active: true, tier: '%s'}); for (let i = 0; i < 48; i++) c.debug.step(1/24);"
PLAN = {
    'quest_start': ("", 'quest_start — curiosity → confident point', 0.3, ['front', '3/4 R'], [0, 10, 20, 31, 42, 60]),
    'quest_complete': ("", 'quest_complete — jump, burst at the apex', 0.6, ['front', '3/4'], [0, 12, 17, 21, 29, 44]),
    'quest_failed': ("", 'quest_failed — droop, supportive recovery', 0.3, ['front', '3/4'], [0, 6, 22, 40, 64, 74]),
    'receive_xp': ("", 'receive_xp — orbs on curved paths, eyes follow', 0.5, ['front', '3/4'], [0, 6, 12, 18, 26, 38]),
    'level_up': ("c.setLevel(20, {immediate: true});", 'level_up (LEVEL_UP → Lv 30 at the apex)', 0.5, ['front', '3/4', 'side'], [0, 18, 28, 35, 40, 70]),
    'achievement_unlock': ("", 'achievement_unlock — materialise, present, shine', 0.5, ['front', '3/4'], [0, 8, 24, 34, 50, 74]),
    'streak_active': (STREAK % 'orange', 'streak_active — flame held · orange→blue→purple→crimson', 0.0, ['front', '3/4'], [0, 36, 72, 108, 144, 180]),
    'streak_lost': (STREAK % 'blue', 'streak_lost — sputter, storm, strike, empty paw', 0.6, ['front', '3/4', 'side'], [0, 12, 26, 36, 38, 60]),
    'streak_cheer': (STREAK % 'purple', 'streak_cheer — flame presented, same flame grows', 0.6, ['front', '3/4'], [0, 9, 16, 26, 40, 70]),
}

async def grab(pg, yaw):
    url = await pg.evaluate("""(yaw) => new Promise(r => { const c = window.__g1.controller(); c.object3D.rotation.y = yaw;
        requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('.g1-stage canvas').toDataURL('image/png')))); })""", yaw)
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
    bg = Image.new('RGBA', im.size, (247, 245, 240, 255)); bg.alpha_composite(im)
    W, H = bg.size
    return bg.convert('RGB').crop((int(CROP[0] * W), int(CROP[1] * H), int(CROP[2] * W), int(CROP[3] * H)))

def panel(ims, names, text, sub):
    h = 470; tiles = [im.resize((int(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1)
    c = Image.new('RGB', (W + (W % 2), h + 30 + (h % 2)), (251, 250, 247)); x = 0
    d = ImageDraw.Draw(c)
    for t, n in zip(tiles, names):
        c.paste(t, (x, 30)); d.text((x + 8, 36), n, fill=(120, 128, 140), font=FONT); x += t.width + 6
    d.text((8, 7), text, fill=(22, 50, 74), font=FONT); d.text((W - 60, 7), sub, fill=(102, 112, 133), font=FONT)
    return c

async def main(clips):
    os.makedirs(PREV, exist_ok=True); os.makedirs(REN, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 860})
        await pg.goto(URL)
        await pg.wait_for_function("window.__g1 && window.__g1.controller()", timeout=60000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}')
        await pg.wait_for_timeout(1500)
        sheets = {}
        for clip in clips:
            setup, text, extra, views, keys = PLAN[clip]
            await pg.evaluate("""(setup) => { const c = window.__g1.controller(); c.pause(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient();
                c.setStreak({active: false}); c.setMood('neutral'); c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); c.object3D.rotation.y = 0;
                for (let i = 0; i < 40; i++) c.debug.step(1/24); eval(setup); for (let i = 0; i < 24; i++) c.debug.step(1/24); }""", setup)
            n = SPEC['clips'][clip]['frames'] + 1
            if clip == 'streak_active':
                total = 4 * 48
            else:
                total = n + int(extra * 24)
                start = "c.handleEvent('LEVEL_UP', {level: 30})" if clip == 'level_up' else f"c.play('{clip}', {{priority: 60}})"
                await pg.evaluate(f"() => {{ const c = window.__g1.controller(); {start}; }}")
            fdir = os.path.join(PREV, f'_f_{clip}'); os.makedirs(fdir, exist_ok=True)
            frames = []
            for k in range(total):
                if clip == 'streak_active' and k % 48 == 0:
                    tier = ['orange', 'blue', 'purple', 'crimson'][k // 48]
                    await pg.evaluate(f"() => window.__g1.controller().setStreak({{active: true, tier: '{tier}'}})")
                ims = [await grab(pg, VIEWS[v]) for v in views]
                im = panel(ims, views, text, f'f{k + 1}')
                im.save(os.path.join(fdir, f'{k:04d}.png'))
                if k in keys: frames.append((k, panel(ims[:2], views[:2], clip, f'f{k + 1}')))
                await pg.evaluate("() => window.__g1.controller().debug.step(1/24)")
            mp4 = os.path.join(PREV, f'fox_g1_1_{clip}.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', os.path.join(fdir, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast',
                            '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
            shutil.rmtree(fdir)
            cat = SPEC['clips'][clip]['category']
            sheets.setdefault(cat, []).append((clip, frames))
            print(clip, mp4, total, 'frames', flush=True)
        await pg.evaluate("() => { const c = window.__g1.controller(); c.object3D.rotation.y = 0; c.resume(); }")
        await b.close()
    for cat, rows in sheets.items():
        tw = 300; pad = 6
        tiles = [[im.resize((tw, int(im.height * tw / im.width))) for _, im in fr] for _, fr in rows]
        th = max(t.height for r in tiles for t in r)
        W = pad + 6 * (tw + pad); H = 46 + len(rows) * (th + pad + 4)
        S = Image.new('RGB', (W, H), (245, 243, 238)); d = ImageDraw.Draw(S)
        d.text((pad, 12), f'LifeQuest Fox V2 — Gate G1.1 · {cat} · runtime key frames (front | 3/4, three.js with effects)', fill=(22, 50, 74), font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20))
        y = 46
        for row in tiles:
            for i, t in enumerate(row): S.paste(t, (pad + i * (tw + pad), y))
            y += th + pad + 4
        out = os.path.join(REN, f'fox_g1_1_runtime_keyframes_{cat}.png'); S.save(out); print(out)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:] or list(PLAN)))
