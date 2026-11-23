"""Gate G2.1 — runtime previews WITH props and effects, rendered by the actual three.js runtime (deterministic).

Serve 07_WEB_PREVIEW/companion_sandbox_g2_1/dist on 127.0.0.1:4193, then:
    python 08_VALIDATION/scripts/capture_g2_1_previews.py [clip …]
Each clip is driven exactly as the application would drive it (handleEvent / setCooldown), so the
previews show the real state transitions, prop timing and loop effects. Per recorded frame the same pose
is grabbed from the front, 3/4 and — for locomotion / lying — the side (the companion group is turned;
nothing is stepped in between). One-shots at 24 fps; state loops at 12 fps (2 steps per frame).
Writes 04_ANIMATIONS/g2_1_deformation_polish/previews/fox_g2_1_<clip>.mp4 and
       04_ANIMATIONS/g2_1_deformation_polish/renders/fox_g2_1_runtime_keyframes_<category>.png
Headless SwiftShader (CPU) rendering: visuals are exact, timing is not real time.
"""
import asyncio, base64, io, json, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish')
PREV, REN = os.path.join(MOD, 'previews'), os.path.join(MOD, 'renders')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4193/index.html') + '?capture=1&seed=7#/g2'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g2_1.json')))
VIEWS = {'front': 0.0, '3/4': -0.62, '3/4 R': 0.62, 'side': -1.5708}
CROP = (0.16, 0.03, 0.84, 0.98)
D = {k: (v['frames']) / 24 for k, v in SPEC['clips'].items()}

def ev(name, payload='undefined'): return f"c.handleEvent('{name}', {payload});"
def run(sec): return f"for (let t = 0; t < {sec:.3f}; t += 1/24) c.debug.step(1/24);"
STUDY, SPORTS, SLEEP, ALARM = ev('STUDY_STARTED') + run(D['study_start'] + 0.6), ev('SPORTS_STARTED') + run(D['sports_start'] + 0.6), ev('SLEEP_ENTERED') + run(D['sleep_enter'] + 0.6), ev('ALARM_STARTED') + run(0.8)
COOL = ev('COOLDOWN_STARTED', '{durationS: 14, progress: 0.2}') + run(0.8)
# clip → (setup JS, start JS, seconds, views, label, loop, key frames for the sheet [recorded frame indices])
PLAN = {
    'study_start': ('', ev('STUDY_STARTED'), D['study_start'] + 0.5, ['front', '3/4'], 'study_start — notebook pops in, sits, opens it, takes the pencil', False, [0, 9, 22, 34, 44, 58]),
    'study_focus': (STUDY, '', 7.0, ['front', '3/4'], 'study_focus — read · write · think (pencil to chin) · aha · write (7 s loop)', True, [0, 12, 30, 46, 54, 70]),
    'study_complete': (STUDY, ev('STUDY_COMPLETED'), D['study_complete'] + 0.6, ['front', '3/4'], 'study_complete — last stroke, claps the book shut, stretch, stands proud', False, [0, 9, 25, 40, 64, 76]),
    'sports_start': ('', ev('SPORTS_STARTED'), D['sports_start'] + 0.5, ['front', '3/4', 'side'], 'sports_start — overhead stretch, side bends, fist-in-palm, warm-up hops', False, [0, 11, 19, 34, 45, 62]),
    'sports_active': (SPORTS, '', 4.0, ['front', '3/4', 'side'], 'sports_active — jog in place, alternating knees, arm pumps, sweat (4 s loop)', True, [0, 2, 4, 6, 24, 36]),
    'sports_complete': (SPORTS, ev('SPORTS_COMPLETED'), D['sports_complete'] + 0.6, ['front', '3/4', 'side'], 'sports_complete — slows, hands on knees, wipes forehead, flex + wink', False, [0, 14, 30, 48, 64, 80]),
    'sleep_enter': ('', ev('SLEEP_ENTERED'), D['sleep_enter'] + 0.6, ['front', '3/4', 'side'], 'sleep_enter — droop, big yawn, rub eye, sit, pillow + mat, lies down', False, [0, 14, 32, 52, 78, 104]),
    'sleep_loop': (SLEEP, '', 8.0, ['front', '3/4', 'side'], 'sleep_loop — slow breathing, ear twitch, tail flick, dream smile, Z + glow (8 s loop)', True, [0, 16, 32, 48, 70, 90]),
    'sleep_wake': (SLEEP, ev('SLEEP_ENDED'), D['sleep_wake'] + 0.6, ['front', '3/4', 'side'], 'sleep_wake — stretch lying, rolls up to sit, rubs eyes, stands, shake', False, [0, 18, 38, 56, 76, 90]),
    'wake_start': (SLEEP, ev('WAKE_REQUESTED'), D['wake_start'] + 0.6, ['front', '3/4', 'side'], 'wake_start — alarm rings, one eye peeks… snooze… eyes pop, rub, stretch, wave', False, [0, 20, 37, 52, 66, 86]),
    'wake_late': ('', ev('WAKE_LATE'), D['wake_late'] + 0.5, ['front', '3/4 R'], 'wake_late — racing clock, double take, giggle, finger wag, wink + thumbs-up', False, [0, 9, 20, 40, 60, 75]),
    'alarm_ring': (ALARM, '', 4.0, ['front', '3/4'], 'alarm_ring — points at the ringing clock, urgent bounces (persistent loop)', True, [0, 6, 12, 18, 30, 42]),
    'alarm_success': (ALARM, ev('ALARM_DISMISSED'), D['alarm_success'] + 0.6, ['front', '3/4'], 'alarm_success — wind-up, slaps the button, relief, proud thumbs-up hop', False, [0, 8, 13, 30, 58, 76]),
    'cooldown_wait': (COOL, '', 5.0, ['front', '3/4'], 'cooldown_wait — patient, glances at the timer; progress ring = app data (5 s loop)', True, [0, 12, 18, 30, 44, 56]),
    'cooldown_wait_impatient': (COOL + "c.setDailyTuning({impatienceAfterS: 0});" + run(0.9), '', 4.0, ['front', '3/4'], 'cooldown_wait_impatient — after the runtime delay: arms crossed, foot taps, sigh', True, [0, 8, 16, 26, 34, 44]),
    'cooldown_complete': (COOL + "c.setCooldown({progress: 0.97});" + run(0.5), ev('COOLDOWN_COMPLETED'), D['cooldown_complete'] + 0.6, ['front', '3/4'], 'cooldown_complete — timer dings, ears up, fist pump hop, timer bursts', False, [0, 4, 12, 19, 30, 50]),
}

async def grab(pg, yaw):
    url = await pg.evaluate("""(yaw) => new Promise(r => { const c = window.__g2.controller(); c.object3D.rotation.y = yaw;
        requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('.g2-stage canvas').toDataURL('image/png')))); })""", yaw)
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
    bg = Image.new('RGBA', im.size, (247, 245, 240, 255)); bg.alpha_composite(im)
    W, H = bg.size
    return bg.convert('RGB').crop((int(CROP[0] * W), int(CROP[1] * H), int(CROP[2] * W), int(CROP[3] * H)))

def panel(ims, names, text, sub, h=430):
    tiles = [im.resize((int(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1)
    c = Image.new('RGB', (W + (W % 2), h + 30 + (h % 2)), (251, 250, 247)); x = 0; d = ImageDraw.Draw(c)
    for t, n in zip(tiles, names): c.paste(t, (x, 30)); d.text((x + 8, 36), n, fill=(120, 128, 140), font=FONT); x += t.width + 6
    d.text((8, 7), text, fill=(22, 50, 74), font=FONT); d.text((W - 70, 7), sub, fill=(102, 112, 133), font=FONT)
    return c

async def main(clips):
    os.makedirs(PREV, exist_ok=True); os.makedirs(REN, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 860})
        await pg.goto(URL)
        await pg.wait_for_function("window.__g2 && window.__g2.controller()", timeout=90000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}')
        await pg.wait_for_timeout(1500)
        sheets = {}
        for clip in clips:
            setup, start, sec, views, text, loop, keys = PLAN[clip]
            await pg.evaluate("""(setup) => { const c = window.__g2.controller(); c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.debug.effects.clearProps();
                c.setActivity('idle'); c.debug.anim.setBaseInstant('idle', 0); c.setDailyTuning({impatienceAfterS: 20}); c.setStreak({active: false}); c.setMood('neutral');
                c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); c.object3D.rotation.y = 0;
                for (let i = 0; i < 30; i++) c.debug.step(1/24); eval(setup); }""", setup)
            if start: await pg.evaluate(f"() => {{ const c = window.__g2.controller(); {start} }}")
            stepn = 2 if loop else 1
            total = int(round(sec * 24 / stepn))
            fdir = os.path.join(PREV, f'_f_{clip}'); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
            frames = []
            for k in range(total):
                ims = [await grab(pg, VIEWS[v]) for v in views]
                im = panel(ims, views, text, f'{"t" if loop else "f"}{k * stepn + 1}')
                im.save(os.path.join(fdir, f'{k:04d}.png'))
                if k in keys: frames.append((k, panel(ims[:2], views[:2], clip, f'f{k * stepn + 1}')))
                await pg.evaluate(f"() => {{ const c = window.__g2.controller(); for (let i = 0; i < {stepn}; i++) c.debug.step(1/24); }}")
            mp4 = os.path.join(PREV, f'fox_g2_1_{clip}.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(24 // stepn), '-i', os.path.join(fdir, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast',
                            '-crf', '21', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
            shutil.rmtree(fdir)
            sheets.setdefault(SPEC['clips'][clip]['category'], []).append((clip, frames))
            print(clip, mp4, total, 'frames', flush=True)
        await pg.evaluate("() => { const c = window.__g2.controller(); c.object3D.rotation.y = 0; c.resume(); }")
        await b.close()
    for cat, rows in sheets.items():
        tw, pad = 300, 6
        tiles = [[im.resize((tw, int(im.height * tw / im.width))) for _, im in fr] for _, fr in rows]
        th = max(t.height for r in tiles for t in r)
        S = Image.new('RGB', (pad + 6 * (tw + pad), 46 + len(rows) * (th + pad + 4)), (245, 243, 238)); d = ImageDraw.Draw(S)
        d.text((pad, 12), f'LifeQuest Fox V2 — Gate G2.1 · {cat} · runtime key frames (front | 3/4, three.js with props + effects)', fill=(22, 50, 74), font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20))
        y = 46
        for row in tiles:
            for i, t in enumerate(row): S.paste(t, (pad + i * (tw + pad), y))
            y += th + pad + 4
        out = os.path.join(REN, f'fox_g2_1_runtime_keyframes_{cat}.png'); S.save(out); print(out)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:] or list(PLAN)))
