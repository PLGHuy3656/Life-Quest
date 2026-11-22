"""Gate G3 — duo high-five and group-effects test videos from the real runtime (several Fox instances in ONE canvas).

Serve 07_WEB_PREVIEW/companion_sandbox_g3/dist on 127.0.0.1:4195, then:  python 08_VALIDATION/scripts/capture_g3_multi.py
Deterministic: the stage host loop is held (window.__g3multiHold) and the foxes are stepped (debug.step + manager.postUpdate).
Each recorded frame shows the same instant from the front and from a 3/4 camera, plus a HUD with clip time / contact data.
Writes 04_ANIMATIONS/g3_challenge_social/tests/fox_g3_duo_highfive_test.mp4 (Lv20+Lv20, Lv1+Lv30, cancel one, solo fallback)
       04_ANIMATIONS/g3_challenge_social/tests/fox_g3_group_effects_test.mp4 (1 fox + markers, 3 foxes multi, group streak)
       04_ANIMATIONS/g3_challenge_social/tests/fox_g3_duo_contact_closeup.png (contact frame close-ups)
"""
import asyncio, base64, io, json, os, shutil, subprocess
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, '04_ANIMATIONS', 'g3_challenge_social', 'tests')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4195/index.html') + '?capture=1&seed=7&stage=multi#/g3'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
SMALL = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)

PREP = """() => { window.__g3multiHold = true; const m = window.__g3multi; m.manager.cancelAll();
  m.foxes.forEach(f => { f.pause(); f.debug.anim.cancelOneShots(); f.debug.effects.clearTransient(); f.debug.effects.clearProps(); f.setStreak({active: false}); f.setGroupStreak(false);
    f.effects.setPropSuppressed('team_markers', false); f.setSharedCueHandler(null); f.object3D.position.set(0, 0, 0); f.object3D.visible = false; });
  window.__cur = null; }"""
STEP = """(n) => { const m = window.__g3multi; for (let i = 0; i < n; i++) { m.foxes.forEach(f => f.debug.step(1 / 24)); m.manager.postUpdate(1 / 24); } }"""
GRAB = """([pos, look]) => new Promise(r => { const m = window.__g3multi, cam = m.camera; cam.position.set(...pos); cam.lookAt(...look); cam.updateProjectionMatrix();
  requestAnimationFrame(() => requestAnimationFrame(() => r(document.querySelector('.g3-multi canvas').toDataURL('image/png')))); })"""
CAMS = {'front': ([0, 0.95, 4.3], [0, 0.48, 0]), '3/4': ([2.6, 1.15, 3.4], [0, 0.45, 0])}
CLOSE = {'front close': ([0, 0.55, 1.6], [0, 0.32, 0]), 'top': ([0, 2.4, 0.9], [0, 0.3, 0])}

async def grab(pg, cam):
    url = await pg.evaluate(GRAB, list(cam))
    im = Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
    bg = Image.new('RGBA', im.size, (247, 245, 240, 255)); bg.alpha_composite(im)
    return bg.convert('RGB')

def frame(ims, names, title, hud):
    h = 380; tiles = [im.resize((int(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(t.width for t in tiles) + 6 * (len(tiles) - 1)
    c = Image.new('RGB', (W + (W % 2), h + 56), (251, 250, 247)); d = ImageDraw.Draw(c); x = 0
    for t, n in zip(tiles, names): c.paste(t, (x, 30)); d.text((x + 8, 36), n, fill=(120, 128, 140), font=SMALL); x += t.width + 6
    d.text((8, 6), title, fill=(22, 50, 74), font=FONT); d.text((8, h + 34), hud, fill=(70, 80, 100), font=SMALL)
    return c

async def record(pg, fdir, start_js, seconds, title, cams=CAMS, hud_js="() => ''"):
    await pg.evaluate(PREP); await pg.evaluate(start_js); n0 = len(os.listdir(fdir))
    for k in range(int(round(seconds * 24))):
        ims = [await grab(pg, cam) for cam in cams.values()]
        hud = await pg.evaluate(hud_js)
        frame(ims, list(cams), title, hud).save(os.path.join(fdir, f'{n0 + k:05d}.png'))
        await pg.evaluate(STEP, 1)

def encode(fdir, mp4):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', os.path.join(fdir, '%05d.png'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
                    '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)

DUO_HUD = """() => { const m = window.__g3multi, d = window.__cur; if (!d) return ''; const f = m.foxes; const t = f.map(x => x.shot.time === null ? '—' : x.shot.time.toFixed(3));
  const c = d.report.contact; return `clip time A ${t[0]} s · B ${t[1]} s · Δ max ${d.report.maxClipTimeDeltaS.toFixed(4)} s · levels ${f[0].getState().level}/${f[1].getState().level} · mode ${d.report.mode}` +
  (c.measured ? ` · contact: paw distance ${c.distanceMm} mm (vertical ${c.verticalMm}) · shoulder correction A ${c.correctionDegA}° B ${c.correctionDegB}°` : ''); }"""
def duo_js(levels, solo=False, cancel_at=None):
    return f"""() => {{ const m = window.__g3multi; m.foxes.forEach((f, i) => f.setLevel([{levels[0]}, {levels[1]}, 20][i], {{immediate: true}})); m.foxes.forEach(f => f.debug.step(1/24));
      const d = window.__g3.duo([{levels[0]}, {levels[1]}], {'true' if solo else 'false'}); window.__cur = d; window.__cancelAt = {cancel_at if cancel_at else 'null'}; }}"""
GROUP_HUD = """() => { const g = window.__cur; if (!g) return ''; const m = window.__g3multi; const shown = m.foxes.filter(f => f.object3D.visible);
  return `mode ${g.report.mode} · foxes ${shown.length} · clip time ${shown.map(f => f.shot.time === null ? '—' : f.shot.time.toFixed(3)).join(' / ')} · Δ max ${g.report.maxClipTimeDeltaS.toFixed(4)} s · shared bursts ${g.report.sharedBursts} · ${JSON.stringify(window.__g3.measure())}`; }"""

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1400, 'height': 1300})
        await pg.goto(URL)
        await pg.wait_for_function("window.__g3multi && window.__g3multi.ready", timeout=120000)
        await pg.wait_for_timeout(1500)
        # ------------------------------------------------------------ duo
        fdir = os.path.join(OUT, '_f_duo'); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
        for lv, title in (([20, 20], 'DUO high-five — two Fox instances, one scene, Lv20 + Lv20 (frame-locked start, shared contact sparkle)'),
                          ([1, 30], 'DUO high-five — Lv1 + Lv30: layout from the contact points + shoulder correction (height difference)')):
            await record(pg, fdir, duo_js(lv), 4.4, title, hud_js=DUO_HUD)
        # cancel one at 1.0 s: the left fox continues solo
        await pg.evaluate(PREP); await pg.evaluate(duo_js([20, 20]))
        for k in range(int(4.4 * 24)):
            if k == 24: await pg.evaluate("() => window.__cur.cancel('b')")
            ims = [await grab(pg, cam) for cam in CAMS.values()]
            frame(ims, list(CAMS), 'DUO — cancel ONE participant at 1.0 s: B returns to idle (its effects cleaned), A finishes as a solo performance', await pg.evaluate(DUO_HUD)).save(os.path.join(fdir, f'{len(os.listdir(fdir)):05d}.png'))
            await pg.evaluate(STEP, 1)
        await record(pg, fdir, duo_js([20, 20], solo=True), 4.4, 'DUO — solo fallback (second fox not loaded): the same clip as a solo high-five, local contact sparkle', hud_js=DUO_HUD)
        encode(fdir, os.path.join(OUT, 'fox_g3_duo_highfive_test.mp4')); shutil.rmtree(fdir)
        # contact close-ups (front close / top) at the contact frame, both level pairs
        rows = []
        for lv in ([20, 20], [1, 30]):
            await pg.evaluate(PREP); await pg.evaluate(duo_js(lv)); await pg.evaluate(STEP, 35)
            ims = [await grab(pg, cam) for cam in CLOSE.values()]
            rows.append(frame(ims, list(CLOSE), f'contact frame (f36) — levels {lv[0]} + {lv[1]}', await pg.evaluate(DUO_HUD)))
            await pg.evaluate(STEP, 2)
            rows[-1] = frame(ims, list(CLOSE), f'contact frame (f36) — levels {lv[0]} + {lv[1]}', await pg.evaluate(DUO_HUD))
        W = max(r.width for r in rows); S = Image.new('RGB', (W, sum(r.height for r in rows)), (251, 250, 247)); y = 0
        for r in rows: S.paste(r, (0, y)); y += r.height
        S.save(os.path.join(OUT, 'fox_g3_duo_contact_closeup.png'))
        # ------------------------------------------------------------ group
        fdir = os.path.join(OUT, '_f_group'); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
        await record(pg, fdir, """() => { const m = window.__g3multi; m.foxes[0].setLevel(20, {immediate: true}); const g = window.__g3.group('symbolic'); window.__cur = g; }""", 5.6,
                     'GROUP victory — lightweight mode: ONE fox + 4 symbolic team markers (no extra Fox instance)', hud_js=GROUP_HUD)
        await record(pg, fdir, """() => { const m = window.__g3multi; [20, 1, 30].forEach((l, i) => m.foxes[i].setLevel(l, {immediate: true})); const g = window.__g3.group('multi'); window.__cur = g; }""", 5.6,
                     'GROUP victory — multi mode: 3 foxes (Lv20 / Lv1 / Lv30) frame-locked, one shared group aura + collective burst', hud_js=GROUP_HUD)
        await record(pg, fdir, """() => { const m = window.__g3multi, f = m.foxes[0]; f.object3D.visible = true; f.setLevel(20, {immediate: true}); m.manager.place('fox0', 0); f.setStreak({active: true, days: 16}); f.setGroup({members: 4});
            f.handleEvent('GROUP_STREAK_ACTIVE', {days: 16, members: 4}); window.__cur = null; }""", 4.2, 'GROUP streak active — the single G1.1 flame (tier purple) + team-linked ember arcs (persistent)')
        await pg.evaluate(STEP, 24)
        await record(pg, fdir, """() => { const m = window.__g3multi, f = m.foxes[0]; f.object3D.visible = true; m.manager.place('fox0', 0); f.setStreak({active: true, days: 16}); f.setGroup({members: 4}); f.setGroupStreak(true);
            for (let i = 0; i < 12; i++) f.debug.step(1/24); f.handleEvent('GROUP_STREAK_LOST'); window.__cur = null; }""", 5.0, 'GROUP streak lost — linked flames fade one by one, ring breaks, flame out in smoke (no lightning)')
        encode(fdir, os.path.join(OUT, 'fox_g3_group_effects_test.mp4')); shutil.rmtree(fdir)
        await pg.evaluate("() => { window.__g3multiHold = false; }")
        await b.close()
    print('done', os.listdir(OUT))

if __name__ == '__main__':
    asyncio.run(main())
