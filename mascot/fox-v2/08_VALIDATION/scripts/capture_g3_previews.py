"""Gate G3 — runtime previews WITH props and effects, rendered by the actual three.js runtime (deterministic).

Serve 07_WEB_PREVIEW/companion_sandbox_g3/dist on 127.0.0.1:4195, then:
    python 08_VALIDATION/scripts/capture_g3_previews.py [clip …]
Each clip is driven exactly as the application would drive it (handleEvent / setCooldown), so the
previews show the real state transitions, prop timing and loop effects. Per recorded frame the same pose
is grabbed from the front, 3/4 and — for locomotion / lying — the side (the companion group is turned;
nothing is stepped in between). One-shots at 24 fps; state loops at 12 fps (2 steps per frame).
Writes 04_ANIMATIONS/g3_challenge_social/previews/fox_g3_<clip>.mp4 and
       04_ANIMATIONS/g3_challenge_social/renders/fox_g3_runtime_keyframes_<category>.png
Headless SwiftShader (CPU) rendering: visuals are exact, timing is not real time.
"""
import asyncio, base64, io, json, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'g3_challenge_social')
PREV, REN = os.path.join(MOD, 'previews'), os.path.join(MOD, 'renders')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4195/index.html') + '?capture=1&seed=7&stage=single#/g3'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g3.json')))
VIEWS = {'front': 0.0, '3/4': -0.62, '3/4 R': 0.62, 'side': -1.5708}
CROP = (0.16, 0.03, 0.84, 0.98)
D = {k: (v['frames']) / 24 for k, v in SPEC['clips'].items()}

def ev(name, payload='undefined'): return f"c.handleEvent('{name}', {payload});"
def run(sec): return f"for (let t = 0; t < {sec:.3f}; t += 1/24) c.debug.step(1/24);"
GROUP_ON = "c.setStreak({active: true, days: 9}); c.setGroup({members: 4}); c.setGroupStreak(true);" + run(0.8)
K6 = lambda n: [0, n // 6, n // 3, n // 2, (2 * n) // 3, (5 * n) // 6]
# clip -> (setup JS, start JS, seconds, views, label, key frames)
PLAN = {
    'challenge_invite': ('', ev('CHALLENGE_INVITED'), D['challenge_invite'] + 0.4, ['front', '3/4'], 'challenge_invite — one ear, then the other; token forms over the paw; presents it, cheeky smile', [0, 6, 22, 30, 40, 52]),
    'challenge_accept': ('', ev('CHALLENGE_ACCEPTED'), D['challenge_accept'] + 0.4, ['front', '3/4'], 'challenge_accept — eyes widen, paws clench (streaks), stomp-step, decisive nod, ready aura', [0, 5, 14, 25, 37, 46]),
    'challenge_start': ('c.setChallengeCountdown(null);', ev('CHALLENGE_STARTED'), D['challenge_start'] + 0.4, ['front', '3/4', 'side'], 'challenge_start — crouch, stance, countdown pulses (app data), launch hop', [0, 16, 21, 44, 52, 70]),
    'challenge_win': ('', ev('CHALLENGE_WON'), D['challenge_win'] + 0.4, ['front', '3/4', 'side'], 'challenge_win — surprise, paws up, jump + full turn, trophy, starburst, confetti', [0, 14, 26, 32, 50, 70]),
    'challenge_lose': ('', ev('CHALLENGE_LOST'), D['challenge_lose'] + 0.4, ['front', '3/4', 'side'], 'challenge_lose — droop, brief crouch, emblem fades, looks up, determined, spark', [0, 14, 28, 46, 64, 80]),
    'challenge_draw': ('', ev('CHALLENGE_DRAW'), D['challenge_draw'] + 0.4, ['front', '3/4'], 'challenge_draw — looks at both emblems, tilt, shrug, equal sign, friendly paw', [0, 10, 20, 38, 48, 66]),
    'duo_celebrate': ('', "c.playDuo({side: 'left'});", D['duo_celebrate'] + 0.4, ['front', '3/4'], 'duo_celebrate (solo view) — look to partner, raise paw, HIGH-FIVE at f36, double bounce', [0, 10, 28, 35, 44, 66]),
    'group_victory': ('c.setGroup({members: 4});', ev('GROUP_VICTORY', '{members: 4}'), D['group_victory'] + 0.4, ['front', '3/4'], 'group_victory — notices, paws up, 120 bpm dance, team emblems orbit, collective burst', [0, 12, 30, 54, 99, 106]),
    'team_encourage': ('', ev('TEAM_ENCOURAGEMENT'), D['team_encourage'] + 0.4, ['front', '3/4'], 'team_encourage — notices, paw over heart, reassuring nod, reaches out (link line)', [0, 10, 32, 44, 60, 72]),
    'group_streak_active': ("c.setStreak({active: true, days: 9});" + run(0.6), ev('GROUP_STREAK_ACTIVE', '{days: 9, members: 4}'), D['group_streak_active'] + 0.8, ['front', '3/4'], 'group_streak_active — raises the flame paw, team embers link in, flare, synced bounce', [0, 12, 28, 36, 48, 80]),
    'group_streak_lost': (GROUP_ON, ev('GROUP_STREAK_LOST'), D['group_streak_lost'] + 0.6, ['front', '3/4'], 'group_streak_lost — flame flickers, shields it, linked flames fade, smoke, droop', [0, 12, 30, 46, 70, 90]),
    'friend_greet': ('', ev('FRIEND_GREETING'), D['friend_greet'] + 0.4, ['front', '3/4 R'], 'friend_greet — ears up, turns to the notification, enthusiastic wave, warm smile', [0, 5, 14, 22, 32, 48]),
    'photo_reaction': ('', ev('PHOTO_REACTION'), D['photo_reaction'] + 0.4, ['front', '3/4 R'], 'photo_reaction — blank frame floats in, tilt, delighted hop, paw by the frame', [0, 10, 24, 32, 46, 58]),
    'receive_like': ('', ev('SOCIAL_LIKE_RECEIVED'), D['receive_like'] + 0.4, ['front', '3/4'], 'receive_like — reaches for the heart, pop, playful bounce (2 s, frequent)', [0, 6, 14, 20, 27, 36]),
    'receive_comment': ('', ev('SOCIAL_COMMENT_RECEIVED'), D['receive_comment'] + 0.4, ['front', '3/4 R'], 'receive_comment — chat bubble with typing dots, lean in, nod, gesture', [0, 8, 20, 32, 44, 54]),
    'friend_support': ('', ev('FRIEND_SUPPORT'), D['friend_support'] + 0.4, ['front', '3/4'], 'friend_support — quieter: concern, paw to chest, palm-up reassurance, slow nod', [0, 14, 30, 48, 56, 70]),
    'friend_miss_you': ('', ev('FRIEND_MISS_YOU'), D['friend_miss_you'] + 0.4, ['front', '3/4'], 'friend_miss_you — looks around, holds a friend icon close, sparkle, hopeful wave', [0, 8, 18, 40, 58, 70]),
}

async def grab(pg, yaw):
    url = await pg.evaluate("""(yaw) => new Promise(r => { const c = window.__g3.controller(); c.object3D.rotation.y = yaw;
        requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('.g3-stage canvas').toDataURL('image/png')))); })""", yaw)
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
        await pg.wait_for_function("window.__g3 && window.__g3.controller()", timeout=90000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}')
        await pg.wait_for_timeout(1500)
        sheets = {}
        for clip in clips:
            setup, start, sec, views, text, keys = PLAN[clip]; loop = False
            await pg.evaluate("""(setup) => { const c = window.__g3.controller(); c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.debug.effects.clearProps();
                c.setActivity('idle'); c.debug.anim.setBaseInstant('idle', 0); c.setStreak({active: false}); c.setGroupStreak(false); c.setGroup({members: 3}); c.setMood('neutral'); c.setLevel(20, {immediate: true});
                c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); c.object3D.rotation.y = 0;
                for (let i = 0; i < 30; i++) c.debug.step(1/24); eval(setup); }""", setup)
            if start: await pg.evaluate(f"() => {{ const c = window.__g3.controller(); {start} }}")
            stepn = 2 if loop else 1
            total = int(round(sec * 24 / stepn))
            fdir = os.path.join(PREV, f'_f_{clip}'); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
            frames = []
            for k in range(total):
                ims = [await grab(pg, VIEWS[v]) for v in views]
                im = panel(ims, views, text, f'{"t" if loop else "f"}{k * stepn + 1}')
                im.save(os.path.join(fdir, f'{k:04d}.png'))
                if k in keys: frames.append((k, panel(ims[:2], views[:2], clip, f'f{k * stepn + 1}')))
                await pg.evaluate(f"() => {{ const c = window.__g3.controller(); for (let i = 0; i < {stepn}; i++) c.debug.step(1/24); }}")
            mp4 = os.path.join(PREV, f'fox_g3_{clip}.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(24 // stepn), '-i', os.path.join(fdir, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast',
                            '-crf', '21', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
            shutil.rmtree(fdir)
            sheets.setdefault(SPEC['clips'][clip]['category'], []).append((clip, frames))
            print(clip, mp4, total, 'frames', flush=True)
        await pg.evaluate("() => { const c = window.__g3.controller(); c.object3D.rotation.y = 0; c.resume(); }")
        await b.close()
    for cat, rows in sheets.items():
        tw, pad = 300, 6
        tiles = [[im.resize((tw, int(im.height * tw / im.width))) for _, im in fr] for _, fr in rows]
        th = max(t.height for r in tiles for t in r)
        S = Image.new('RGB', (pad + 6 * (tw + pad), 46 + len(rows) * (th + pad + 4)), (245, 243, 238)); d = ImageDraw.Draw(S)
        d.text((pad, 12), f'LifeQuest Fox V2 — Gate G3 · {cat} · runtime key frames (front | 3/4, three.js with props + effects)', fill=(22, 50, 74), font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20))
        y = 46
        for row in tiles:
            for i, t in enumerate(row): S.paste(t, (pad + i * (tw + pad), y))
            y += th + pad + 4
        out = os.path.join(REN, f'fox_g3_runtime_keyframes_{cat}.png'); S.save(out); print(out)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1:] or list(PLAN)))
