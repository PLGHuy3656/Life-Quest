"""Gate H2 — outfit library validation in three.js (headless Chrome, SwiftShader: no GPU claims).

Serve 07_WEB_PREVIEW/companion_sandbox_h2/dist on 127.0.0.1:4250 first. On the technical harness (#/h1, which lists the
outfit_* presets):
  1. attachment of the 12 new items vs Blender (TRACK_JS and criteria of browser_h1_test.py, imported unchanged)
  2. in-page outfit suite (runH2Tests): library definition, per-outfit equip + hides, 30 outfit switches, item lifecycle,
     persistence through the 17 required clips, Lv1 / Lv30 scaling, layering, hand busy, cleanup
  3. every outfit at Lv1 / Lv30: no item leaves the fixed 3/4 frame further than the approved Fox itself does
  4. render counts per outfit; renderer resources stable over outfit cycles
  5. contact sheets: 6 outfits × front / side / 3/4 / back (Lv20), Lv1 / Lv20 / Lv30, per-clip sheets per outfit
Output: 08_VALIDATION/runtime_h2/h2_runtime_report.json + PNGs
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import browser_h1_test as B  # noqa: E402  (helpers + TRACK_JS; its main() is not run)
from PIL import ImageFont  # noqa: E402
_DJV = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
B.ImageFont.load_default = lambda *a, **k: ImageFont.truetype(_DJV, 14)   # sheet labels need Unicode (Tết, —)

BASE = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4250/index.html')
ROOT = B.ROOT
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h2')
REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'cosmetics', 'cosmetic_reference_h2.json')
OUTFITS = ['outfit_student', 'outfit_sports', 'outfit_explorer', 'outfit_mage', 'outfit_ninja', 'outfit_tet']
NAMES = ['Student', 'Sports', 'Explorer', 'Mage', 'Ninja', 'Tết']
R = {'meta': {'url': BASE, 'renderer': 'headless Chrome + SwiftShader (no GPU)', 'started': time.strftime('%Y-%m-%d %H:%M:%S')}, 'checks': [], 'measurements': {}}


def check(name, ok, **d):
    R['checks'].append({'name': name, 'pass': bool(ok), **d})
    print(('PASS ' if ok else 'FAIL ') + name, json.dumps(d, default=str)[:400])


LEVEL_JS = r"""async ([lv, clips]) => {
  // per clip: smallest distance (px) of any item vertex and of any approved Fox vertex to the canvas edge, fixed 3/4 camera
  const T = window.__t, c = T.c(), fox = c.debug.fox, r = T.canvas().getBoundingClientRect(); const V = fox.position.constructor;
  const res = { level: lv, items: {}, fox: {} };
  const marg = (o, p, every) => { const n = o.geometry.attributes.position.count, s = Math.max(1, Math.floor(n / every)); let m = 1e9;
    for (let i = 0; i < n; i += s) { o.getVertexPosition(i, p); p.applyMatrix4(o.matrixWorld); const [x, y] = T.project(p); m = Math.min(m, x - r.left, r.right - x, y - r.top, r.bottom - y); } return m; };
  for (const clip of clips) {
    T.reset(); await c.setOutfit(window.__h2outfit); c.setLevel(lv, { immediate: true }); window.__h1.setCamera('34');
    const dur = Math.min(window.__h1.startClip(clip), 8); let mi = 1e9, mf = 1e9; const p = new V();
    for (let t = 0; t < dur; t += 2 / 24) { T.step(2 / 24); fox.updateMatrixWorld(true);
      for (const s of ['HEAD', 'FACE', 'BODY', 'BACK', 'HAND_LEFT', 'HAND_RIGHT', 'FEET', 'TAIL']) { const d = c.cosmetics.debugSlot(s); if (!d || !d.root.visible) continue; for (const m of d.meshes) mi = Math.min(mi, marg(m, p, 60)); }
      fox.traverse(o => { if (o.isSkinnedMesh && !o.userData.cosmetic && o.name.startsWith('FOX_') && o.visible) mf = Math.min(mf, marg(o, p, 200)); }); }
    c.debug.daily.clear(); c.setStreak({ active: false });
    res.items[clip] = +mi.toFixed(1); res.fox[clip] = +mf.toFixed(1);
  }
  T.reset(); c.setLevel(20, { immediate: true }); c.resetOutfit(); T.step(0.2); return res;
}"""


async def main():
    os.makedirs(OUT, exist_ok=True)
    ref = json.load(open(REF))
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=B.CHROME)
        pg = await (await browser.new_context(viewport={'width': 1400, 'height': 1300}, device_scale_factor=1)).new_page()
        errors, missing = [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('response', lambda r: missing.append(r.url) if r.status == 404 else None)
        await pg.goto(BASE + '?seed=7&capture=1#/h1')
        await pg.wait_for_function("window.__h1 && window.__h1.controller() && window.__foxSandbox && window.__foxSandbox.instances().length >= 1", timeout=120000)
        await pg.evaluate(B.HELPERS); await pg.wait_for_timeout(1500)

        # 1. attachment (H1 criteria)
        items = list(ref['items'])
        groups = [['explorer_hat', 'sports_jersey', 'sports_sneakers', 'mage_capelet', 'mage_wand'], ['mage_hat', 'ninja_gi', 'ninja_scroll', 'tet_lixi'], ['ninja_headband', 'tet_ao_dai'], ['tet_khan_dong']]
        assert sorted(sum(groups, [])) == sorted(items)
        track = {}
        for i, g in enumerate(groups):
            track[i] = await pg.evaluate(B.TRACK_JS, [ref, g])
        R['measurements']['attachment_vs_blender'] = track
        nsamp = sum(len(v) for v in ref['clips'].values())
        ok = all('error' not in t and t['samples'] == nsamp and not t['unmatched'] for t in track.values())
        rg = max(t.get('rigidMaxMm', 1e9) for t in track.values())
        near, far = {}, {}
        for t in track.values():
            for key, v in t.get('perTracker', {}).items():
                iid, k = key.split('#'); car = ref['items'][iid]['carrier'][int(k)]
                held = iid in ('mage_wand', 'tet_lixi')
                (near if car['distMm'] <= B.NEAR_MM and not held else far)[key] = {**v, 'carrierDistMm': car['distMm'], 'held': held}
        fx = max(v['excess'] for v in near.values()); fworst = max(near.items(), key=lambda kv: kv[1]['excess'])
        surface = max(v['at']['foxSurfaceMm'] for v in near.values() if v['at'])
        cr = {}
        for t in track.values(): cr.update(t.get('carrierRigid', {}))
        head_same = {k: v for k, v in cr.items() if k.endswith(':FOX_Head')}
        check(f'Attachment (runtime): rigid item points fixed in their bone frame through all {nsamp} poses (≤ {B.RIGID_TOL_MM} mm); head items share the exact FOX_Head transform',
              ok and rg <= B.RIGID_TOL_MM and head_same and max(head_same.values()) <= B.RIGID_TOL_MM, rigid_max_mm=round(rg, 5), fox_head_frame_mm={k: round(v, 5) for k, v in head_same.items()},
              errors=[t.get('error') for t in track.values() if 'error' in t], unmatched=[t.get('unmatched') for t in track.values() if t.get('unmatched')])
        check(f'Attachment vs Blender: {len(near)} tracker vertices with Fox surface ≤ {B.NEAR_MM:.0f} mm: ≤ {B.FOLLOW_TOL_MM} mm more deviation than the Fox surface under them',
              ok and fx <= B.FOLLOW_TOL_MM, worst_excess_mm=round(fx, 3), worst={fworst[0]: fworst[1]}, fox_surface_max_mm=round(surface, 3))
        held = {k: v for k, v in far.items() if v['held']}; hmax = max(v['abs'] for v in held.values())
        check(f'Held items (wand, lì xì): Blender deviation ≤ the approved Fox surface max in the same poses ({surface:.1f} mm)', hmax <= surface, held_max_mm=round(hmax, 3),
              per_tracker={k: round(v['abs'], 3) for k, v in held.items()})
        heads = {'explorer_hat', 'mage_hat', 'ninja_headband', 'tet_khan_dong'}
        other = {k: v for k, v in far.items() if not v['held'] and k.split('#')[0] not in heads}
        omax = max([v['abs'] for v in other.values()], default=0.0)
        R['measurements']['head_far_points_vs_blender_mm'] = {k: round(v['abs'], 3) for k, v in far.items() if k.split('#')[0] in heads}
        check(f'Other item points without Fox surface within {B.NEAR_MM:.0f} mm: Blender deviation ≤ {B.BLENDER_TOL_MM} mm', omax <= B.BLENDER_TOL_MM, max_mm=round(omax, 3),
              per_tracker={k: round(v['abs'], 3) for k, v in other.items()}, head_far_points_reported_mm=R['measurements']['head_far_points_vs_blender_mm'])

        # 2. in-page suite
        tests = await pg.evaluate("() => window.__h1.runH2Tests()")
        R['measurements']['in_page_tests'] = tests
        for t in tests: check('[harness] ' + t['name'], t['pass'], **(t['detail'] if isinstance(t['detail'], dict) else {}))

        # 3. Lv1 / Lv30 canvas
        clips = await pg.evaluate("() => window.__h1.clips")
        # The fixed harness camera crops the approved Fox itself at the Lv30 jump apex (ears: level_up −58 px, challenge_win
        # −83 px). Criterion (set after the first run showed this): per clip, an item may leave the frame only where the Fox
        # itself does, and not further — item margin ≥ min(0, Fox margin) — and must stay in frame wherever the Fox is fully in frame.
        lv, worst = {}, {}
        for o in OUTFITS:
            await pg.evaluate(f"() => {{ window.__h2outfit = '{o}'; }}")
            lv[o] = {}
            for L in (1, 30):
                r = await pg.evaluate(LEVEL_JS, [L, clips])
                lv[o][L] = {c: [r['items'][c], r['fox'][c]] for c in clips}
                worst[f'{o}@Lv{L}'] = min((r['items'][c] - min(0.0, r['fox'][c]), c) for c in clips)
        R['measurements']['level_canvas_px_item_vs_fox'] = lv
        check('Every outfit at Lv1 and Lv30 through the 17 required clips (+ mirror): no item leaves the fixed 3/4 frame further than the approved Fox itself does in that clip',
              all(v[0] >= 0 for v in worst.values()), worst_margin_px={k: [round(v[0], 1), v[1]] for k, v in worst.items()},
              fox_out_of_frame={f'{o}@Lv{L}': {c: v[1] for c, v in lv[o][L].items() if v[1] < 0} for o in OUTFITS[:1] for L in (1, 30)})

        # 4. render counts + resource cycles
        rc = {}
        for o in ['default'] + OUTFITS:
            js = "c.resetOutfit()" if o == 'default' else f"await c.setOutfit('{o}')"
            rc[o] = await pg.evaluate(f"""async () => {{ const T = window.__t, c = T.c(); T.reset(); {js}; for (let k = 0; k < 4; k++) {{ T.step(0.05); await T.raf(); }} const s = T.inst().stats; return {{ calls: s.calls, triangles: s.triangles, geometries: s.geometries, textures: s.textures }}; }}""")
        R['measurements']['render_counts'] = rc
        check('Render counts per outfit measured (software renderer: counts only)', all(v['calls'] > 0 for v in rc.values()), **rc)
        cyc = await pg.evaluate(f"""async () => {{ const T = window.__t, c = T.c(); T.reset(); c.resetOutfit(); for (let k = 0; k < 3; k++) await T.raf();
          const s0 = T.inst().stats; for (let k = 0; k < 2; k++) for (const o of {json.dumps(OUTFITS)}) {{ await c.setOutfit(o); for (let f = 0; f < 2; f++) {{ T.step(0.1); await T.raf(); }} }}
          c.resetOutfit(); window.__h1.purge(); for (let k = 0; k < 4; k++) {{ T.step(0.05); await T.raf(); }} const s1 = T.inst().stats;
          return {{ before: {{ geometries: s0.geometries, textures: s0.textures, programs: s0.programs }}, after: {{ geometries: s1.geometries, textures: s1.textures, programs: s1.programs }}, cache: window.__h1.cacheState() }}; }}""")
        R['measurements']['gpu_cleanup'] = cyc
        check('Renderer resources back to the default-look baseline after 12 outfit changes while rendering; item cache empty',
              cyc['after']['geometries'] <= cyc['before']['geometries'] and cyc['after']['textures'] <= cyc['before']['textures'] and not cyc['cache'], **cyc)

        # 5. contact sheets
        views = ['front', 'side', '34', 'back']; cells = []
        for o in OUTFITS:
            await pg.evaluate(f"async () => {{ const T = window.__t, c = T.c(); T.reset(); c.setLevel(20, {{ immediate: true }}); await c.setOutfit('{o}'); T.step(0.3); }}")
            for v in views:
                await pg.evaluate(f"() => window.__h1.setCamera('{v}')"); await pg.evaluate("() => window.__t.raf()"); await pg.wait_for_timeout(120)
                cells.append(await B.canvas_png(pg))
        B.sheet(cells, 4, NAMES, ['front', 'side', '3/4', 'back'], 'Gate H2 — outfit library (Lv20, idle). Approved Fox V2 + H1 slot system', os.path.join(OUT, 'h2_contact_outfits.png'))
        cells = []
        for o in OUTFITS:
            for L in (1, 20, 30):
                await pg.evaluate(f"async () => {{ const T = window.__t, c = T.c(); T.reset(); await c.setOutfit('{o}'); c.setLevel({L}, {{ immediate: true }}); T.step(0.3); window.__h1.setCamera('34'); }}")
                await pg.evaluate("() => window.__t.raf()"); await pg.wait_for_timeout(100)
                cells.append(await B.canvas_png(pg))
        B.sheet(cells, 3, NAMES, ['Lv1', 'Lv20', 'Lv30'], 'Gate H2 — outfits at Lv1 / Lv20 / Lv30 (fixed 3/4 camera)', os.path.join(OUT, 'h2_contact_levels.png'), 260, 260)
        for o, nm in zip(OUTFITS, NAMES):
            cells = []
            for clip in clips:
                await pg.evaluate(f"async () => {{ const T = window.__t, c = T.c(); T.reset(); c.setLevel(20, {{ immediate: true }}); await c.setOutfit('{o}'); window.__h1.setCamera('34'); }}")
                dur = min(float(await pg.evaluate(f"() => window.__h1.startClip('{clip}')")), 8.0)
                prev = 0.0
                for frac in (0.25, 0.6):
                    await pg.evaluate(f"() => window.__t.step({dur * frac - prev})"); prev = dur * frac
                    await pg.evaluate("() => window.__t.raf()"); await pg.wait_for_timeout(50)
                    cells.append(await B.canvas_png(pg))
                await pg.evaluate("() => { const c = window.__t.c(); c.debug.daily.clear(); c.setStreak({ active: false }); }")
            B.sheet(cells, 6, ['\n'.join(clips[i:i + 3]) for i in range(0, len(clips), 3)],      # 3 clips per row (2 cells each)
                    ['25 %', '60 %'] * 3, f'Gate H2 — {nm} outfit through the 17 required clips + mirror (3/4, Lv20)', os.path.join(OUT, f'h2_clips_{o}.png'), 200, 200)
        await pg.evaluate("() => { const T = window.__t, c = T.c(); T.reset(); c.resetOutfit(); c.resume(); }")
        intentional = [u for u in missing if '__does_not_exist' in u]
        other_err = [e for e in errors if not e.startswith('Failed to load resource: the server responded with a status of 404')]
        n404 = len(errors) - len(other_err)               # counted before the favicon probe below (which itself logs a 404)
        fav = await pg.evaluate("async () => (await fetch('/favicon.ico')).status")
        check('no page errors / unexpected 404s (static server favicon only)', not other_err and not [u for u in missing if u not in intentional and not u.endswith('favicon.ico')] and n404 <= len(intentional) + (1 if fav == 404 else 0),
              errors=other_err[:6], console_404=n404, missing=missing)
        await browser.close()
    R['meta']['finished'] = time.strftime('%Y-%m-%d %H:%M:%S')
    R['summary'] = {'checks': len(R['checks']), 'passed': sum(c['pass'] for c in R['checks'])}
    json.dump(R, open(os.path.join(OUT, 'h2_runtime_report.json'), 'w'), indent=1, default=str)
    print(f"\n{R['summary']['passed']}/{R['summary']['checks']} checks passed")


if __name__ == '__main__':
    asyncio.run(main())
