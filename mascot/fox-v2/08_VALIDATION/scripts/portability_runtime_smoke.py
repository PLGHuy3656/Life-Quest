"""Fox V2 runtime portability smoke test — OFFLINE (no internet, no Claude / Anthropic service, no CDN).

Serve a freshly built `07_WEB_PREVIEW/companion_sandbox_h1/dist` on 127.0.0.1:<port>, then
    python portability_runtime_smoke.py <port> <out_dir>
Chrome runs with every hostname except 127.0.0.1 resolving to NOTFOUND, and Playwright aborts any request that is not
to 127.0.0.1 (each attempt is recorded). Through the public controller API it exercises: the core E2 clips, the G1.1 /
G2.1 / G3 module clips (after checking every module bound), VFX objects appearing for an effect clip, cosmetics, and
level scaling. Software rendering: no performance claim.
"""
import asyncio, base64, io, json, os, sys, time
from playwright.async_api import async_playwright
from PIL import Image

PORT, OUT = sys.argv[1], sys.argv[2]
BASE = f'http://127.0.0.1:{PORT}'
CHROME = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
          '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1']
CLIPS = [('happy', 'core'), ('wave', 'core'), ('head_pet', 'core'), ('tail_touch', 'core'), ('quest_complete', 'g1'), ('level_up', 'g1'),
         ('streak_lost', 'g1'), ('study_start', 'g2'), ('alarm_success', 'g2'), ('challenge_win', 'g3'), ('friend_greet', 'g3'), ('duo_celebrate', 'g3')]

STEP = r"""async ([clip, outfit]) => {
  const c = window.__h1.controller(); window.__h1.resetFox(); if (outfit) await c.setOutfit(outfit); else c.resetOutfit();
  const r = c.play(clip, { priority: 90 }); let seen = false, fx = 0;
  for (let i = 0; i < 36; i++) { c.debug.step(1 / 24); if (c.debug.anim.currentShot === clip || c.debug.anim.getBase() === clip) seen = true;   // loop clips (alarm_ring) play as the base
    let n = 0; c.debug.effects.root.traverse(o => { if (o.visible && (o.isMesh || o.isPoints || o.isSprite) ) n++; }); fx = Math.max(fx, n); }
  return { result: r, playing: seen, fxObjects: fx };
}"""


async def main():
    os.makedirs(OUT, exist_ok=True)
    R = {'started': time.strftime('%Y-%m-%d %H:%M:%S'), 'url': BASE, 'network': 'offline: host-resolver NOTFOUND for every host except 127.0.0.1; non-local requests aborted', 'checks': []}
    def check(name, ok, **d):
        R['checks'].append({'name': name, 'pass': bool(ok), **d}); print(('PASS ' if ok else 'FAIL ') + name, json.dumps(d, default=str)[:300])
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        ctx = await b.new_context(viewport={'width': 1200, 'height': 1000})
        blocked, local, errors = [], [], []
        async def route(rt):
            u = rt.request.url
            if u.startswith(BASE): local.append(u.replace(BASE, '')); await rt.continue_()
            else: blocked.append(u); await rt.abort()
        await ctx.route('**/*', route)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        await pg.goto(BASE + '/index.html?seed=7#/h1')
        await pg.wait_for_function("window.__h1 && window.__h1.controller()", timeout=120000)
        await pg.wait_for_timeout(1500)
        st = await pg.evaluate("() => { const c = window.__h1.controller(); c.pause(); const s = c.getStats(); return { clips: s.availableClips, modules: s.modules, asset: s.asset && s.asset.url }; }")
        mods = st['modules'] or []
        check('Fox loads offline; every animation module binds (G1.1, G2.1, G3)', st['clips'] >= 50 and mods and all(m.get('ok') for m in mods),
              clips=st['clips'], modules=[{k: m.get(k) for k in ('id', 'ok', 'tracks', 'boundTracks', 'problems')} for m in mods])
        per = {}
        for clip, grp in CLIPS:
            per[clip] = await pg.evaluate(STEP, [clip, None]); per[clip]['group'] = grp
        check('Core + G1–G3 clips play through the public API (play() accepted, clip becomes current)', all(v['result'] in ('played', 'queued', 'merged', 'substituted', 'base') and v['playing'] for v in per.values()), clips=per)
        check('VFX objects appear during effect clips (level_up / quest_complete / challenge_win)', all(per[c]['fxObjects'] > 0 for c in ('level_up', 'quest_complete', 'challenge_win')),
              fx={c: per[c]['fxObjects'] for c in ('level_up', 'quest_complete', 'challenge_win')})
        states = await pg.evaluate("""async () => { const c = window.__h1.controller(); const out = {};
          for (const s of ['study', 'sleep', 'sports']) { window.__h1.resetFox(); c.enterState(s); for (let i = 0; i < 72; i++) c.debug.step(1/24); out[s] = c.getState().daily ? JSON.stringify(c.getState().daily).slice(0, 120) : null; c.debug.daily.clear(); }
          return out; }""")
        check('G2 daily states enter (study / sleep / sports)', all(v and s in v for s, v in states.items()), states=states)
        cos = await pg.evaluate("""async () => { const c = window.__h1.controller(); window.__h1.resetFox(); const r = await c.setOutfit('all_slots_test');
          for (let i = 0; i < 24; i++) c.debug.step(1/24); return { ok: r.map(x => x.ok), equipped: c.getEquippedItems().map(e => e.id) }; }""")
        check('Cosmetics load and equip offline (7-slot test outfit)', all(cos['ok']) and len([e for e in cos['equipped'] if not e.startswith('default')]) == 7, results=cos['ok'], equipped=cos['equipped'])
        lv = await pg.evaluate("() => { const c = window.__h1.controller(); c.setLevel(1, { immediate: true }); const a = c.scale; c.setLevel(30, { immediate: true }); const b = c.scale; c.setLevel(20, { immediate: true }); return [a, b]; }")
        check('Level scaling Lv1 / Lv30', abs(lv[0] - 0.8) < 1e-6 and abs(lv[1] - 1.1) < 1e-6, scales=lv)
        cells = []
        for clip in ('level_up', 'challenge_win', 'quest_complete'):
            await pg.evaluate(f"async () => {{ const c = window.__h1.controller(); window.__h1.resetFox(); await c.setOutfit('student'); c.play('{clip}', {{ priority: 90 }}); for (let i = 0; i < 30; i++) c.debug.step(1/24); window.__h1.setCamera('34'); }}")
            await pg.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            b64 = await pg.evaluate("() => document.querySelector('.h1-stage canvas').toDataURL('image/png').split(',')[1]")
            im = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGBA'); bg = Image.new('RGBA', im.size, (255, 250, 245, 255)); bg.alpha_composite(im); cells.append(bg.convert('RGB'))
        sh = Image.new('RGB', (sum(c.width for c in cells), cells[0].height), (255, 250, 245)); x = 0
        for c in cells: sh.paste(c, (x, 0)); x += c.width
        sh.thumbnail((2400, 900)); sh.save(os.path.join(OUT, 'offline_smoke.png'))
        other_err = [e for e in errors if 'favicon' not in e and not e.startswith('Failed to load resource: the server responded with a status of 404')]
        check('No request leaves 127.0.0.1 (no Claude / Anthropic / CDN / analytics call) and no page errors', not blocked and not other_err, blocked=blocked, errors=other_err[:5],
              local_requests=len(local), glb=sorted({u for u in local if u.endswith('.glb')}))
        await b.close()
    R['summary'] = f"{sum(c['pass'] for c in R['checks'])}/{len(R['checks'])}"
    json.dump(R, open(os.path.join(OUT, 'runtime_offline_smoke.json'), 'w'), indent=1, default=str)
    print(R['summary'])


asyncio.run(main())
