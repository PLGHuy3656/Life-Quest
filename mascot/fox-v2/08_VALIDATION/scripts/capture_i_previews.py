"""Gate I — runtime preview videos + contact sheet for the Voice Assistant -> Task sequence.

Serve 07_WEB_PREVIEW/companion_sandbox_i/dist on 127.0.0.1:4260, then:
    python 08_VALIDATION/scripts/capture_i_previews.py

Writes:
  - 04_ANIMATIONS/i_voice_assistant/previews/fox_i_voice_to_task_sequence.mp4  (complete end-to-end sequence + retry)
  - 04_ANIMATIONS/i_voice_assistant/renders/fox_i_voice_contact_sheet.png      (key frames across all 8 clips)
"""
import asyncio
import base64
import io
import os
import shutil
import subprocess
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOD = os.path.join(ROOT, '04_ANIMATIONS', 'i_voice_assistant')
PREV = os.path.join(MOD, 'previews')
REN = os.path.join(MOD, 'renders')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4260/index.html') + '?capture=1&seed=7#/voice'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
FONT_LG = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
VIEWS = {'front': 0.0, '3/4': -0.62}
CROP = (0.16, 0.03, 0.84, 0.98)


async def grab(pg, yaw):
    url = await pg.evaluate(
        """(yaw) => new Promise(r => {
            const c = window.__voice.controller();
            c.object3D.rotation.y = yaw;
            requestAnimationFrame(() => requestAnimationFrame(() =>
                r(document.querySelector('.voice-stage canvas').toDataURL('image/png'))
            ));
        })""",
        yaw,
    )
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
    bg = Image.new('RGBA', im.size, (247, 245, 240, 255))
    bg.alpha_composite(im)
    W, H = bg.size
    return bg.convert('RGB').crop((int(CROP[0] * W), int(CROP[1] * H), int(CROP[2] * W), int(CROP[3] * H)))


def panel(ims, names, text, sub, h=430):
    tiles = [im.resize((int(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1)
    c = Image.new('RGB', (W + (W % 2), h + 30 + (h % 2)), (251, 250, 247))
    x = 0
    d = ImageDraw.Draw(c)
    for t, n in zip(tiles, names):
        c.paste(t, (x, 30))
        d.text((x + 8, 36), n, fill=(120, 128, 140), font=FONT)
        x += t.width + 6
    d.text((8, 7), text, fill=(22, 50, 74), font=FONT)
    d.text((W - 90, 7), sub, fill=(102, 112, 133), font=FONT)
    return c


# Complete continuous Voice -> Task sequence + Retry stage
STAGES = [
    ('VOICE_LISTEN_STARTED', '1. Listening Start -> Loop (voice_listen_start -> voice_listening_loop)', 3.2, [0.4, 2.2]),
    ('VOICE_PROCESSING', '2. Processing (voice_processing)', 2.4, [0.8, 1.8]),
    ('TASK_SUGGESTION_READY', '3. Task Suggestion (task_suggestion)', 2.9, [0.7, 1.5]),
    ('TASK_NOTEBOOK_OPEN', '4. Notebook Open -> Write (task_notebook_open -> task_notebook_write)', 4.6, [1.2, 3.3]),
    ('TASK_CREATED', '5. App-Triggered Confirm (TASK_CREATED -> task_notebook_confirm)', 3.5, [0.5, 2.4]),
    ('VOICE_RETRY_REQUESTED', '6. Voice Retry (VOICE_RETRY_REQUESTED -> voice_retry)', 2.7, [0.8, 1.9]),
]


async def main():
    os.makedirs(PREV, exist_ok=True)
    os.makedirs(REN, exist_ok=True)
    fdir = os.path.join(PREV, '_frames_seq')
    shutil.rmtree(fdir, ignore_errors=True)
    os.makedirs(fdir)

    contact_tiles = []
    frame_idx = 0

    async with async_playwright() as p:
        b = await p.chromium.launch(
            executable_path='/usr/bin/google-chrome',
            args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
        )
        pg = await b.new_page(viewport={'width': 1300, 'height': 860})
        await pg.goto(URL)
        await pg.wait_for_function("window.__voice && window.__voice.controller()", timeout=120000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}')
        await pg.wait_for_timeout(1200)

        await pg.evaluate("""() => {
            const c = window.__voice.controller();
            c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots();
            c.debug.effects.clearTransient(); c.debug.effects.clearProps();
            c.setActivity('idle'); c.debug.anim.setBaseInstant('idle', 0);
            c.setStreak({active: false}); c.setMood('neutral'); c.setLevel(20, {immediate: true});
            c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); c.object3D.rotation.y = 0;
            for (let i = 0; i < 24; i++) c.debug.step(1/24);
        }""")

        for ev, label, sec, key_ts in STAGES:
            await pg.evaluate(f"() => window.__voice.controller().handleEvent('{ev}')")
            steps = int(round(sec * 12))  # 12 fps preview video (2x 1/24 steps per frame)
            key_frames = {int(round(t * 12)) for t in key_ts}
            for k in range(steps):
                ims = [await grab(pg, VIEWS['front']), await grab(pg, VIEWS['3/4'])]
                im = panel(ims, ['front', '3/4'], label, f't={k / 12:.1f}s')
                im.save(os.path.join(fdir, f'{frame_idx:04d}.png'))
                frame_idx += 1
                if k in key_frames:
                    contact_tiles.append((f'{ev} @ {k / 12:.1f}s', ims[1]))
                await pg.evaluate("() => { const c = window.__voice.controller(); c.debug.step(1/24); c.debug.step(1/24); }")
            print(f'captured stage {ev} ({steps} frames)', flush=True)

        await pg.evaluate("() => { const c = window.__voice.controller(); c.object3D.rotation.y = 0; c.resume(); }")
        await b.close()

    mp4 = os.path.join(PREV, 'fox_i_voice_to_task_sequence.mp4')
    subprocess.run(
        [
            'ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12',
            '-i', os.path.join(fdir, '%04d.png'),
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
            '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4,
        ],
        check=True,
    )
    shutil.rmtree(fdir)
    print('saved video:', mp4)

    # Build 4x3 contact sheet
    cols, tw, pad = 4, 300, 10
    rows = (len(contact_tiles) + cols - 1) // cols
    th = int(contact_tiles[0][1].height * tw / contact_tiles[0][1].width)
    W = pad + cols * (tw + pad)
    H = 54 + rows * (th + 26 + pad)
    sheet = Image.new('RGB', (W, H), (245, 243, 238))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 14), 'LifeQuest Fox V2 — Gate I Voice Assistant -> Task Creation (3/4 runtime preview, Lv20)', fill=(22, 50, 74), font=FONT_LG)
    for idx, (title, im) in enumerate(contact_tiles):
        r, c_ = divmod(idx, cols)
        x = pad + c_ * (tw + pad)
        y = 54 + r * (th + 26 + pad)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        d.text((x + 4, y + th + 4), title, fill=(22, 50, 74), font=FONT)
    out_sheet = os.path.join(REN, 'fox_i_voice_contact_sheet.png')
    sheet.save(out_sheet)
    print('saved contact sheet:', out_sheet)


if __name__ == '__main__':
    asyncio.run(main())
