"""Gate G1.1 — streak flame attachment test (numeric + video), on the real three.js runtime.

Serve 07_WEB_PREVIEW/companion_sandbox_g1_1/dist on 127.0.0.1:4190, then:
    python 08_VALIDATION/scripts/flame_attach_test_g1_1.py
Sequence, at Level 1 and at Level 30, streak tier changing every few seconds:
    streak_active loop → head_pet (petting) → streak_cheer (flare) → quest_complete (arms up) →
    tail_touch → wave → walk → idle
Every frame (24 fps, deterministic steps):
  * attachment error = | flame base − (ATT_HAND_L world + q·offset·scale) | in fx-root space  (must be ≈ 0)
  * rigidity = distance flame base ↔ PAW_L joint in fx-root space (already scale-free: the fx root carries
    the level scale), must stay constant — the flame rides the paw — and equal at Lv1 and Lv30
  * screen distance flame base ↔ paw, in % of the Fox's on-screen height (front view)
  * exactly one flame object exists; it stays visible while the streak is active (no detach, no duplicate)
Writes 08_VALIDATION/runtime_g1_1/flame_attachment_g1_1.json (+ first / worst frame PNGs) and
       04_ANIMATIONS/g1_1_cinematic_polish/previews/fox_g1_1_flame_attachment_test.mp4
"""
import asyncio, json, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capture_g1_1_previews as C  # noqa: E402  (grab / panel helpers, same capture settings)

ROOT = C.ROOT
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1')
MP4 = os.path.join(C.PREV, 'fox_g1_1_flame_attachment_test.mp4')
SEQ = [('streak_active', 2.0, None), ('head_pet', None, "c.debug.anim.request('head_pet', {priority: 20, source: 'interaction'})"),
       ('streak_cheer', None, "c.play('streak_cheer', {priority: 60})"), ('quest_complete', None, "c.play('quest_complete', {priority: 60})"),
       ('tail_touch', None, "c.debug.anim.request('tail_touch', {priority: 20, source: 'interaction'})"), ('wave', None, "c.play('wave', {priority: 30})"),
       ('walk', 1.5, "c.setActivity('walk')"), ('idle', 1.2, "c.setActivity('idle')")]
TIERS = ['orange', 'blue', 'purple', 'crimson']

MEASURE = r"""() => {
  const c = window.__g1.controller(), B = c.debug.bones, fx = c.debug.effects, fl = fx.flame, root = fx.root;
  const V = B.PAW_L.position.constructor, Q = B.PAW_L.quaternion.constructor;
  const s = new V(), q = new Q(), sc = new V(), p = new V(); B.ATT_HAND_L.getWorldPosition(s); B.ATT_HAND_L.getWorldQuaternion(q); root.getWorldScale(sc);
  const off = new V(...window.__flameOffset).applyQuaternion(q).multiplyScalar(sc.y); const exp = root.worldToLocal(s.clone().add(off));
  const base = fl.basePoint(new V()); const paw = root.worldToLocal(B.PAW_L.getWorldPosition(new V()));
  const cam = c.debug.camera, canvas = document.querySelector('.g1-stage canvas').getBoundingClientRect();
  const proj = v => { const w = root.localToWorld(v.clone()).project(cam); return [(w.x + 1) / 2 * canvas.width, (1 - w.y) / 2 * canvas.height]; };
  const head = root.worldToLocal(B.HEAD.getWorldPosition(new V())), foot = new V(0, 0, 0);
  const pb = proj(base), pp = proj(paw), ph = proj(head.clone().add(new V(0, 0.25, 0))), pf = proj(foot);
  let flames = 0; root.traverse(o => { if (o.name === 'FX_streak_flame') flames++; });
  return { err_mm: base.distanceTo(exp) * 1000, rigid_mm: base.distanceTo(paw) * 1000, screen_pct: Math.hypot(pb[0] - pp[0], pb[1] - pp[1]) / Math.abs(pf[1] - ph[1]) * 100,
    flames, visible: fl.visible, streak: c.getStreak().active, shot: c.getState().oneShot, base: c.getState().base, scale: c.getState().scale, flaring: fl.flaring };
}"""

async def main():
    os.makedirs(OUT, exist_ok=True); os.makedirs(C.PREV, exist_ok=True)
    fdir = os.path.join(C.PREV, '_f_flame'); shutil.rmtree(fdir, ignore_errors=True); os.makedirs(fdir)
    rows, k = [], 0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 860})
        await pg.goto(C.URL); await pg.wait_for_function("window.__g1 && window.__g1.controller()", timeout=60000)
        await pg.add_style_tag(content='.g1-hud{display:none!important}'); await pg.wait_for_timeout(1500)
        src = open(os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_g1_1', 'src', 'mascot', 'foxContract.ts')).read()
        offset = json.loads(src.split('FLAME_SOCKET = {')[1].split('offset: ')[1].split(' as ')[0])   # the contract value the runtime uses
        await pg.evaluate(f"() => {{ window.__flameOffset = {json.dumps(offset)}; }}")
        for lv in (1, 30):
            await pg.evaluate(f"""() => {{ const c = window.__g1.controller(); c.pause(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.setActivity('idle');
                c.setMood('neutral'); c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); c.object3D.rotation.y = 0; c.setLevel({lv}, {{immediate: true}});
                c.setStreak({{active: true, tier: 'orange'}}); for (let i = 0; i < 36; i++) c.debug.step(1/24); }}""")
            for i, (name, secs, js) in enumerate(SEQ):
                tier = TIERS[i % 4]
                await pg.evaluate(f"() => {{ const c = window.__g1.controller(); c.setStreak({{active: true, tier: '{tier}'}}); {js or ''}; }}")
                n = int(round((secs if secs is not None else 0) * 24))
                if secs is None:
                    dur = await pg.evaluate(f"() => window.__g1.controller().debug.anim.actions['{name}'].getClip().duration")
                    n = int(dur * 24) + 10
                for f in range(n):
                    m = await pg.evaluate(MEASURE); m.update(level=lv, segment=name, tier=tier, frame=k); rows.append(m)
                    if f % 2 == 0:                                   # video at 12 fps sampling keeps the file small, every frame is measured
                        ims = [await C.grab(pg, C.VIEWS[v]) for v in ('front', '3/4')]
                        C.panel(ims, ['front', '3/4'], f'flame attachment · Lv {lv} · {name} · {tier}', f'#{k}').save(os.path.join(fdir, f'{len(os.listdir(fdir)):04d}.png'))
                    await pg.evaluate("() => window.__g1.controller().debug.step(1/24)"); k += 1
        await pg.evaluate("() => { const c = window.__g1.controller(); c.object3D.rotation.y = 0; c.setLevel(20, {immediate: true}); c.resume(); }")
        await b.close()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', os.path.join(fdir, '%04d.png'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                    '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', MP4], check=True)
    shutil.rmtree(fdir)
    res = {'frames_measured': len(rows), 'sequence': [s[0] for s in SEQ], 'levels': [1, 30], 'offset_socket_local_m': offset}
    for lv in (1, 30):
        r = [x for x in rows if x['level'] == lv]
        rig = [x['rigid_mm'] for x in r]                    # fx-root space = Fox space at scale 1
        res[f'lv{lv}'] = {'max_attach_err_mm': round(max(x['err_mm'] for x in r), 4),
                          'rigid_mm_fox_space_min_max': [round(min(rig), 2), round(max(rig), 2)],
                          'max_screen_dist_pct_of_fox_height': round(max(x['screen_pct'] for x in r), 2),
                          'flame_objects_min_max': [min(x['flames'] for x in r), max(x['flames'] for x in r)],
                          'frames_flame_hidden_while_streak_active': sum(1 for x in r if x['streak'] and not x['visible']),
                          'flare_frames': sum(1 for x in r if x['flaring'])}
    checks = {
        'attached_every_frame (err ≤ 0.01 mm)': all(res[f'lv{l}']['max_attach_err_mm'] <= 0.01 for l in (1, 30)),
        'rigid on the paw (spread ≤ 6 mm at scale 1)': all(res[f'lv{l}']['rigid_mm_fox_space_min_max'][1] - res[f'lv{l}']['rigid_mm_fox_space_min_max'][0] <= 6 for l in (1, 30)),
        'same placement at Lv1 and Lv30 (scale-normalised, ≤ 1 mm)': abs(res['lv1']['rigid_mm_fox_space_min_max'][0] - res['lv30']['rigid_mm_fox_space_min_max'][0]) <= 1,
        'exactly one flame object (no duplicate during the flare)': all(res[f'lv{l}']['flame_objects_min_max'] == [1, 1] for l in (1, 30)),
        'flame never hidden / detached while the streak is active': all(res[f'lv{l}']['frames_flame_hidden_while_streak_active'] == 0 for l in (1, 30)),
    }
    res['checks'] = checks; res['pass'] = all(checks.values()); res['video'] = os.path.relpath(MP4, ROOT)
    json.dump(res, open(os.path.join(OUT, 'flame_attachment_g1_1.json'), 'w'), indent=1)
    json.dump(rows, open(os.path.join(OUT, 'flame_attachment_g1_1_frames.json'), 'w'))
    print(json.dumps(res, indent=1))

if __name__ == '__main__':
    asyncio.run(main())
