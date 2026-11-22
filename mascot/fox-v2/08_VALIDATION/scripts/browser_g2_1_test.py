"""Gate G2.1 — corrected daily-life module validation in three.js (headless Chrome, real mouse).

Serve 07_WEB_PREVIEW/companion_sandbox_g2_1/dist on 127.0.0.1:4193 (start it first). Checks, on the
technical test harness (#/g2):
  1. the animation-only module loads and every track binds to the existing E2 Fox (no 2nd mesh)
  2. pose equivalence: each module clip evaluated on the E2 Fox reproduces the Blender ground truth
     (fox_v2_g2_1_reference_poses.json — bone head positions + facial morph values at sample frames)
  3. the in-page deterministic suite (runG2Tests: the five round trips, loop alignment, wake / alarm paths,
     priorities + resume, interruptions + prop cancellation, interactions never ending a state, event
     thresholds, idle-variation gating, cooldown data + impatience, reduced motion, level scale,
     pause, cleanup, material immutability, no unknown cues)
  4. uniform level scaling: Lv1 and Lv30 — props / effects follow the fox scale, fox inside the canvas
  5. real mouse head-pet during study (procedural reaction, state kept) and during the alarm (head_pet, alarm kept)
  6. GPU resource cleanup (renderer.info geometries / textures stable across repeated full state passes)
  7. dispose: leaving the page disposes the controller, its props and state effects
  8. ?modules=0 → G2 events answer with their documented fallbacks (runG2FallbackTests)
SwiftShader has no GPU: no FPS claims are made from this script.

Output: 08_VALIDATION/runtime_g2_1/g2_1_runtime_report.json + g2_*.png
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

BASE = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4193/index.html')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2_1')
REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g2_1_reference_poses.json')
FK = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g2_1_gltf_fk_poses.json')
FIDELITY = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2_1', 'gltf_pose_fidelity_g2_1.json')
os.makedirs(OUT, exist_ok=True)
CHROME = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
R = {'meta': {'url': BASE, 'renderer': 'headless Chrome + SwiftShader (no GPU)', 'started': time.strftime('%Y-%m-%d %H:%M:%S')}, 'checks': [], 'measurements': {}}
BIND_TOL_MM = 0.05     # three.js vs independent FK of the module's own glTF data (binding exactness)
BLENDER_TOL_MM = 6.0   # glTF format fidelity vs Blender (no shear in glTF; approved E2 GLB: 3.78 mm) — see gltf_pose_fidelity_g1.py
MORPH_TOL = 0.002

def check(name, ok, **detail):
    R['checks'].append({'name': name, 'pass': bool(ok), **detail})
    print(('PASS ' if ok else 'FAIL ') + name, json.dumps(detail, default=str)[:400])

HELPERS = r"""
window.__t = {
  c() { return window.__g2.controller(); },
  inst() { return window.__foxSandbox.instances()[0]; },
  canvas() { return document.querySelector('.g2-stage canvas') || document.querySelector('canvas'); },
  project(v) { const cam = this.c().debug.camera, r = this.canvas().getBoundingClientRect(); const q = v.clone().project(cam);
    return [r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height]; },
  step(s, dt = 1 / 24) { const c = this.c(); for (let t = 0; t < s - 1e-9; t += dt) c.debug.step(dt); return c.getState(); },
  headPoint() { const P = this.c().debug.interaction.proxies.head; return this.project(P.getWorldPosition(P.position.clone())); },
  reset() { const c = this.c(); c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearProps(); c.setActivity('idle'); c.setStreak({ active: false }); c.setIdleVariationEnabled(false); c.setLookAtEnabled(false); this.step(1.2); },
};
"""

POSE_JS = r"""([ref, fk]) => {
  const c = window.__t.c(), A = c.debug.anim, fox = c.debug.fox;
  window.__t.reset(); window.__t.step(0.5);
  // reference frame = parent of the ROOT bone (armature node, scale-normalised)
  const rootBone = fox.getObjectByName('ROOT'), frame = rootBone.parent;
  const meshes = {}; fox.traverse(o => { if (o.isMesh && o.morphTargetDictionary && o.name.startsWith('FOX_')) (meshes[o.name] ??= o); });
  const out = { clips: {}, maxBoneMm: 0, maxBindMm: 0, maxMorph: 0, samples: 0, worst: null, worstBind: null, worstMorph: null, missingNodes: [] };
  const saved = []; fox.traverse(o => saved.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]));
  const savedMorph = Object.values(meshes).map(m => [m, m.morphTargetInfluences.slice()]);
  for (const [name, samples] of Object.entries(ref.clips)) {
    const action = A.actions[name]; if (!action) { out.clips[name] = { missing: true }; continue; }
    const clip = action.getClip(); const ints = clip.tracks.map(tr => {
      const dot = tr.name.lastIndexOf('.'); const node = tr.name.slice(0, dot), prop = tr.name.slice(dot + 1);
      return { node, prop, obj: prop === 'morphTargetInfluences' ? null : fox.getObjectByName(node), interp: tr.createInterpolant() }; });
    let cmax = 0, mmax = 0, bmax = 0;
    for (const [frameNo, s] of Object.entries(samples)) {
      const morphVals = {};
      for (const it of ints) {
        const v = it.interp.evaluate(Math.min(s.t, clip.duration));
        if (it.prop === 'morphTargetInfluences') { morphVals[it.node] = Array.from(v); continue; }
        if (!it.obj) { out.missingNodes.push(it.node); continue; }
        it.obj[it.prop].fromArray(v);
      }
      fox.updateMatrixWorld(true);
      const inv = frame.matrixWorld.clone().invert();
      for (const [bn, p] of Object.entries(s.bones)) {
        const b = fox.getObjectByName(bn); if (!b) { out.missingNodes.push(bn); continue; }
        const w = b.getWorldPosition(b.position.clone()).applyMatrix4(inv);
        const e = Math.hypot(w.x - p[0], w.y - p[1], w.z - p[2]) * 1000;
        if (e > cmax) cmax = e; if (e > out.maxBoneMm) { out.maxBoneMm = e; out.worst = { clip: name, frame: frameNo, bone: bn, mm: e }; }
        const q = fk.clips[name][frameNo].bones[bn]; const eb = Math.hypot(w.x - q[0], w.y - q[1], w.z - q[2]) * 1000;
        if (eb > bmax) bmax = eb; if (eb > out.maxBindMm) { out.maxBindMm = eb; out.worstBind = { clip: name, frame: frameNo, bone: bn, mm: eb }; }
      }
      for (const [mn, keys] of Object.entries(s.morphs)) {
        const m = meshes[mn], vals = morphVals[mn]; if (!m || !vals) { out.missingNodes.push(mn + '(morph)'); continue; }
        for (const [k, val] of Object.entries(keys)) {
          const idx = m.morphTargetDictionary[k]; if (idx === undefined) { out.missingNodes.push(mn + ':' + k); continue; }
          const e = Math.abs(vals[idx] - val); if (e > mmax) mmax = e;
          if (e > out.maxMorph) { out.maxMorph = e; out.worstMorph = { clip: name, frame: frameNo, mesh: mn, key: k, got: vals[idx], want: val }; }
        }
      }
      out.samples++;
    }
    out.clips[name] = { vsBlenderMm: +cmax.toFixed(4), vsGltfFkMm: +bmax.toFixed(5), maxMorph: +mmax.toFixed(5), samples: Object.keys(samples).length };
  }
  for (const [o, p, q, s] of saved) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(s); }
  for (const [m, v] of savedMorph) m.morphTargetInfluences.splice(0, v.length, ...v);
  out.missingNodes = [...new Set(out.missingNodes)];
  window.__t.step(0.2);
  return out;
}"""

LEVEL_JS = r"""async (lv) => {
  const T = window.__t, c = T.c(), FX = c.debug.effects, fox = c.debug.fox; T.reset();
  const plans = [['STUDY_STARTED', 6, 'STUDY_COMPLETED'], ['SPORTS_STARTED', 5, 'SPORTS_COMPLETED'], ['SLEEP_ENTERED', 6, 'SLEEP_ENDED'], ['ALARM_STARTED', 2, 'ALARM_DISMISSED'], ['COOLDOWN_STARTED', 2, 'COOLDOWN_COMPLETED'], ['WAKE_LATE', 3.8, null]];
  const r = T.canvas().getBoundingClientRect(); const res = { level: lv, clips: {} }; let minMargin = 1e9, maxScaleErr = 0, minTop = 1e9;
  const pts = []; fox.traverse(o => { if (o.isBone) pts.push(o); });
  for (const [a, sec, b] of plans) {
    T.reset(); c.setLevel(lv, { immediate: true }); c.handleEvent(a, a === 'COOLDOWN_STARTED' ? { progress: 0.3 } : undefined);
    let m = 1e9, se = 0, top = 1e9;
    const run = (s) => { for (let t = 0; t < s; t += 1 / 24) { c.debug.step(1 / 24);
      const fs = new fox.scale.constructor(); fox.getWorldScale(fs); const es = new fox.scale.constructor(); FX.root.getWorldScale(es); se = Math.max(se, Math.abs(es.x - fs.x) / fs.x);
      for (const bn of pts) { const [x, y] = T.project(bn.getWorldPosition(bn.position.clone())); m = Math.min(m, x - r.left, r.right - x, y - r.top, r.bottom - y); top = Math.min(top, y - r.top); } } };
    run(sec); if (b) { c.handleEvent(b); run(4.5); }
    res.clips[a] = { minMarginPx: +m.toFixed(1), topMarginPx: +top.toFixed(1), effectScaleErr: +se.toExponential(2) }; minMargin = Math.min(minMargin, m); minTop = Math.min(minTop, top); maxScaleErr = Math.max(maxScaleErr, se);
  }
  const fs = new fox.scale.constructor(); fox.getWorldScale(fs); res.foxScale = +fs.x.toFixed(4);
  res.minMarginPx = +minMargin.toFixed(1); res.minTopMarginPx = +minTop.toFixed(1); res.maxEffectScaleErr = maxScaleErr;
  T.reset(); c.setLevel(20, { immediate: true }); T.step(0.2); return res;
}"""

READY = "window.__g2 && window.__g2.controller() && window.__foxSandbox && window.__foxSandbox.instances().length >= 1"

async def main():
    ref = json.load(open(REF)); fk = json.load(open(FK)); fid = json.load(open(FIDELITY))
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        ctx = await browser.new_context(viewport={'width': 1400, 'height': 900}, device_scale_factor=1)
        pg = await ctx.new_page()
        errors, glb, missing = [], [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
        pg.on('request', lambda r: glb.append(r.url.split('/')[-1]) if r.url.endswith('.glb') else None)
        pg.on('response', lambda r: missing.append(r.url) if r.status == 404 else None)
        await pg.goto(BASE + '?seed=7#/g2')
        await pg.wait_for_function(READY, timeout=90000)
        await pg.evaluate(HELPERS); await pg.wait_for_timeout(1500)

        # 1. module binding -------------------------------------------------------------------------
        st = await pg.evaluate("() => { const c = window.__t.c(), s = c.getStats(); const names = []; c.debug.fox.traverse(o => { if (o.isSkinnedMesh && o.name.includes('Body')) names.push(o.name); }); const sk = new Set(); c.debug.fox.traverse(o => { if (o.isSkinnedMesh) sk.add(o.skeleton.bones[0].uuid); }); return { modules: s.modules, clips: c.availableClips(), tris: window.__t.inst().stats.triangles, skeletons: sk.size, foxMeshes: new Set(names.map(n => n.replace(/_\\d+$/, ''))).size }; }")
        R['measurements']['module'] = st
        m2 = next((m for m in st['modules'] if m.get('id') == 'g2_daily_life'), {})
        m1 = next((m for m in st['modules'] if m.get('id') == 'g1_quest_reward_streak'), {})
        check('G2 animation module loaded; every track binds to the existing E2 Fox (node / property / morph count); G1.1 module still bound',
              m2.get('ok') and m2.get('boundTracks') == m2.get('tracks') and m2.get('tracks', 0) > 0 and m1.get('ok'), g2=m2, g1=m1)
        check('32 clips available (7 E2 core + 9 G1 + 16 G2); no extra Fox mesh / skeleton; E2 triangle budget',
              len(st['clips']) == 32 and st['foxMeshes'] == 1 and st['skeletons'] == 1 and 73000 < st['tris'] < 76000,
              clips=len(st['clips']), fox_body_meshes=st['foxMeshes'], skeletons=st['skeletons'], triangles=st['tris'], glb_requests=sorted(set(glb)))

        # 2. pose equivalence -------------------------------------------------------------------------
        pose = await pg.evaluate(POSE_JS, [ref, fk])
        R['measurements']['pose_equivalence'] = pose
        complete = pose['samples'] == sum(len(v) for v in ref['clips'].values()) and not pose['missingNodes']
        check(f'Binding exactness: G2 clips on the E2 Fox reproduce the module glTF data (independent numpy FK) ≤ {BIND_TOL_MM} mm; morphs = Blender ≤ {MORPH_TOL}',
              complete and pose['maxBindMm'] <= BIND_TOL_MM and pose['maxMorph'] <= MORPH_TOL,
              samples=pose['samples'], max_vs_gltf_fk_mm=round(pose['maxBindMm'], 5), max_morph=round(pose['maxMorph'], 5), worst=pose['worstBind'], missing=pose['missingNodes'][:8])
        e2w = fid['e2_approved_glb_vs_blender']['worst']['max_mm']
        check(f'Format fidelity vs Blender ≤ {BLENDER_TOL_MM} mm on every sampled bone (same tolerance as G1.1; approved E2 GLB: {e2w} mm)',
              complete and pose['maxBoneMm'] <= BLENDER_TOL_MM, max_vs_blender_mm=round(pose['maxBoneMm'], 3), worst=pose['worst'], e2_reference_mm=e2w,
              per_clip={k: v.get('vsBlenderMm') for k, v in pose['clips'].items()})

        # 3. in-page suite ---------------------------------------------------------------------------
        tests = await pg.evaluate("() => window.__g2.runTests()")
        R['measurements']['in_page_tests'] = tests
        for t in tests: check('[harness] ' + t['name'], t['pass'], **(t['detail'] if isinstance(t['detail'], dict) else {}))

        # 4. level scaling ---------------------------------------------------------------------------
        lv = {L: await pg.evaluate(LEVEL_JS, L) for L in (1, 30)}
        R['measurements']['level_scaling'] = lv
        check('Uniform level scaling: props / effects root follows the fox scale exactly at Lv1 and Lv30 through every state',
              lv[1]['maxEffectScaleErr'] < 1e-6 and lv[30]['maxEffectScaleErr'] < 1e-6 and lv[30]['foxScale'] > lv[1]['foxScale'],
              lv1_scale=lv[1]['foxScale'], lv30_scale=lv[30]['foxScale'], err=[lv[1]['maxEffectScaleErr'], lv[30]['maxEffectScaleErr']])
        check('Lv1 and Lv30: every bone stays inside the canvas through every state round trip (fixed camera)',
              lv[1]['minMarginPx'] > 0 and lv[30]['minMarginPx'] > 0, lv1=lv[1]['clips'], lv30=lv[30]['clips'])
        await pg.screenshot(path=os.path.join(OUT, 'g2_01_harness.png'))

        # 5. real mouse pet during study (reaction) and alarm (head_pet) --------------------------------
        mouse = {}
        for enter, wait, expect in (('STUDY_STARTED', 3.2, 'reaction'), ('ALARM_STARTED', 1.0, 'head_pet')):
            await pg.evaluate(f"() => {{ const T = window.__t, c = T.c(); T.reset(); c.handleEvent('{enter}'); T.step({wait}); window.__taps = []; c.on(e => {{ if (e.type === 'tap') window.__taps.push(e.result); }}); }}")
            hx, hy = await pg.evaluate("window.__t.headPoint()")
            await pg.mouse.move(hx - 90, hy + 150); await pg.mouse.move(hx, hy, steps=10)
            await pg.evaluate("() => window.__t.step(0.3)")
            await pg.mouse.down(); await pg.mouse.up()
            s1 = await pg.evaluate("() => { const s = window.__t.step(0.2); return { taps: window.__taps, oneShot: s.oneShot, base: s.base, visible: s.daily.visible, reactions: window.__t.c().debug.daily.reactions.log.length }; }")
            await pg.screenshot(path=os.path.join(OUT, f'g2_02_pet_{enter.lower()}.png'), clip={'x': hx - 260, 'y': hy - 200, 'width': 520, 'height': 560})
            s2 = await pg.evaluate("() => { const s = window.__t.step(3.5); return { oneShot: s.oneShot, base: s.base, visible: s.daily.visible }; }")
            mouse[enter] = {'during': s1, 'after': s2}
            await pg.mouse.move(20, 20)
        R['measurements']['mouse_pet'] = mouse
        st_, al = mouse['STUDY_STARTED'], mouse['ALARM_STARTED']
        check('Real mouse: head click while studying → procedural / face reaction (no standing clip), study loop kept; during the alarm → head_pet, alarm loop resumes',
              st_['during']['taps'] == ['reaction'] and st_['during']['oneShot'] is None and st_['after']['base'] == 'study_focus' and st_['after']['visible'] == 'study'
              and al['during']['oneShot'] == 'head_pet' and al['after']['base'] == 'alarm_ring' and al['after']['visible'] == 'alarm', **mouse)

        # 6. GPU resource cleanup ---------------------------------------------------------------------
        RUN_ALL = """async () => { const T = window.__t, c = T.c(), raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const plans = [['STUDY_STARTED', 'STUDY_COMPLETED', 4], ['SPORTS_STARTED', 'SPORTS_COMPLETED', 4], ['SLEEP_ENTERED', 'SLEEP_ENDED', 6], ['ALARM_STARTED', 'ALARM_DISMISSED', 2], ['COOLDOWN_STARTED', 'COOLDOWN_COMPLETED', 2], ['WAKE_LATE', null, 0]];
          for (const [a, b, s] of plans) { T.reset(); c.handleEvent(a, a === 'COOLDOWN_STARTED' ? { progress: 0.5 } : undefined);
            for (let t = 0; t < s + 3; t += 0.25) { T.step(0.25); await raf(); } if (b) { c.handleEvent(b); for (let t = 0; t < 5; t += 0.25) { T.step(0.25); await raf(); } } }
          T.reset(); T.step(1); await raf(); await raf(); const st = T.inst().stats, fx = c.debug.effects.getStats();
          return { geometries: st.geometries, textures: st.textures, programs: st.programs, fxActive: fx.active, fxRootObjects: fx.rootObjects, props: fx.props.length, stateFx: fx.stateFx.length }; }"""
        warm = await pg.evaluate(RUN_ALL); again = await pg.evaluate(RUN_ALL); again2 = await pg.evaluate(RUN_ALL)
        R['measurements']['gpu_cleanup'] = {'after_warmup': warm, 'after_pass2': again, 'after_pass3': again2}
        check('All G2 props / effects clean up: renderer geometries / textures stable across repeated full state passes; nothing left active',
              again['geometries'] == warm['geometries'] == again2['geometries'] and again['textures'] == warm['textures'] == again2['textures'] and again2['fxActive'] == 0 and again2['props'] == 0 and again2['stateFx'] == 0,
              warm=warm, pass2=again, pass3=again2)

        # 7. dispose with an active state (leave the page) ---------------------------------------------
        disp = await pg.evaluate("""async () => { const T = window.__t, c = T.c(); T.reset(); c.handleEvent('SLEEP_ENTERED'); T.step(6); const before = c.getStats().effects.props.length;
            location.hash = '#/dashboard'; await new Promise(r => setTimeout(r, 1500)); return { before, disposed: c.isDisposed, fxParent: !!c.debug.effects.root.parent, props: c.debug.effects.propState().length }; }""")
        R['measurements']['dispose'] = disp
        check('Dispose with an active sleep state: controller disposed, effects root detached, props released', disp['before'] >= 2 and disp['disposed'] and not disp['fxParent'] and disp['props'] == 0, **disp)
        real = [e for e in errors if not ('404' in e and all(u.endswith('favicon.ico') for u in missing))]
        check('No page errors on the G2 harness (a missing favicon.ico 404 from the static test server is ignored)', not real, errors=real[:5], http_404=missing)

        # 8. module absent → documented fallbacks -------------------------------------------------------
        fp = await ctx.new_page(); ferr = []
        fp.on('pageerror', lambda e: ferr.append(str(e)))
        await fp.goto(BASE + '?modules=0&seed=7#/g2')
        await fp.wait_for_function(READY, timeout=90000); await fp.wait_for_timeout(800)
        fb = await fp.evaluate("() => window.__g2.runFallbackTests()")
        R['measurements']['fallback_modules_off'] = fb
        for t in fb: check('[modules=0] ' + t['name'], t['pass'] and not ferr, **t['detail'], errors=ferr[:3])
        await fp.screenshot(path=os.path.join(OUT, 'g2_03_modules_off.png'))
        await browser.close()

    n = len(R['checks']); ok = sum(c['pass'] for c in R['checks'])
    R['summary'] = f'{ok}/{n} PASS'
    print(R['summary'])
    json.dump(R, open(os.path.join(OUT, 'g2_1_runtime_report.json'), 'w'), indent=2, default=str)
    return 0 if ok == n else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
