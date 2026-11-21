"""Gate G1 — runtime previews WITH effects, rendered by the actual three.js runtime (deterministic).

Serve 07_WEB_PREVIEW/companion_sandbox/dist on 127.0.0.1:4180, then:
    python 08_VALIDATION/scripts/capture_g1_previews.py [clip ...]
Each frame: controller.debug.step(1/24) → wait for a rendered frame → read the canvas (24 fps video).
Writes 04_ANIMATIONS/g1_quest_reward_streak/previews/fox_g1_<clip>.mp4 (+ _all.mp4) and
       04_ANIMATIONS/g1_quest_reward_streak/renders/fox_g1_runtime_keyframes_<category>.png
Headless SwiftShader (CPU) rendering: visuals are exact, timing is not real time.
"""
import asyncio, base64, io, json, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g1_quest_reward_streak')
PREV, REN = os.path.join(MOD, 'previews'), os.path.join(MOD, 'renders')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4180/index.html') + '?capture=1&seed=7#/g1'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g1.json')))

# clip → (setup JS, label, extra seconds after the clip, key frames for the sheet)
PLAN = {
    'quest_start': ("", 'quest_start', 0.4, [0, 8, 12, 20, 38, 58]),
    'quest_complete': ("", 'quest_complete', 0.6, [0, 9, 14, 20, 32, 60]),
    'quest_failed': ("", 'quest_failed', 0.4, [0, 14, 30, 44, 60, 86]),
    'receive_xp': ("", 'receive_xp', 0.6, [0, 6, 12, 17, 24, 40]),
    'level_up': ("c.setLevel(20, {immediate: true});", 'level_up  (LEVEL_UP → Lv 30, grows at the apex)', 0.6, [0, 12, 18, 23, 34, 60]),
    'achievement_unlock': ("", 'achievement_unlock', 0.6, [0, 10, 26, 38, 56, 76]),
    'streak_active': ("c.setStreak({active: true, tier: 'orange'});", 'streak_active · orange→blue→purple→crimson', 0.0, [0, 36, 72, 108, 144, 180]),
    'streak_lost': ("c.setStreak({active: true, tier: 'blue'});", 'streak_lost (lightning · char · flame out)', 0.8, [0, 10, 12, 14, 30, 80]),
    'streak_cheer': ("c.setStreak({active: true, tier: 'purple'});", 'streak_cheer (milestone · flame flare)', 0.6, [0, 8, 12, 24, 30, 50]),
}

async def grab(pg):
    url = await pg.evaluate("""() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('.g1-stage canvas').toDataURL('image/png')))))""")
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
    bg = Image.new('RGBA', im.size, (247, 245, 240, 255)); bg.alpha_composite(im)   # the canvas is transparent over the UI
    return bg.convert('RGB')

def label(im, text, sub):
    W = 520; im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS)
    c = Image.new('RGB', (W, im.height + 30), (251, 250, 247)); c.paste(im, (0, 30))
    d = ImageDraw.Draw(c); d.text((8, 7), text, fill=(22, 50, 74), font=FONT); d.text((W - 60, 7), sub, fill=(102, 112, 133), font=FONT)
    return c

async def main(clips):
    os.makedirs(PREV, exist_ok=True); os.makedirs(REN, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 860})
        await pg.goto(URL)
        await pg.wait_for_function("window.__g1 && window.__g1.controller()", timeout=60000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}')
        await pg.wait_for_timeout(1200)
        sheets = {}
        for clip in clips:
            setup, text, extra, keys = PLAN[clip]
            await pg.evaluate("""(setup) => { const c = window.__g1.controller(); c.pause(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient();
                c.setStreak({active: false}); c.setMood('neutral'); c.setLookAtEnabled(false); c.setIdleVariationEnabled(false);
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
                im = label(await grab(pg), text, f'f{k + 1}')
                im.save(os.path.join(fdir, f'{k:04d}.png'))
                if k in keys: frames.append((k, im))
                await pg.evaluate("() => window.__g1.controller().debug.step(1/24)")
            mp4 = os.path.join(PREV, f'fox_g1_{clip}.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', os.path.join(fdir, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast',
                            '-crf', '20', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
            shutil.rmtree(fdir)
            cat = SPEC['clips'][clip]['category']
            sheets.setdefault(cat, []).append((clip, frames))
            print(clip, mp4, total, 'frames', flush=True)
        await pg.evaluate("() => window.__g1.controller().resume()")
        await b.close()
    for cat, rows in sheets.items():
        tw = 260; th = None; pad = 6
        tiles = [[im.resize((tw, int(im.height * tw / im.width))) for _, im in fr] for _, fr in rows]
        th = tiles[0][0].height
        W = pad + 6 * (tw + pad); H = 46 + len(rows) * (th + pad + 4)
        S = Image.new('RGB', (W, H), (245, 243, 238)); d = ImageDraw.Draw(S)
        d.text((pad, 12), f'LifeQuest Fox V2 — Gate G1 · {cat} · runtime key frames (three.js, with effects)', fill=(22, 50, 74), font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20))
        y = 46
        for row in tiles:
            for i, t in enumerate(row): S.paste(t, (pad + i * (tw + pad), y))
            y += th + pad + 4
        out = os.path.join(REN, f'fox_g1_runtime_keyframes_{cat}.png'); S.save(out); print(out)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:] or list(PLAN)))
