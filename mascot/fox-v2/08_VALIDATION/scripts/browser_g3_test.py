"""Gate G3 — challenge / duo-group / private-social module validation in three.js (headless Chrome).

Serve 07_WEB_PREVIEW/companion_sandbox_g3/dist on 127.0.0.1:4195 (start it first). Checks, on the technical harness (#/g3):
  1. the G3 animation-only module loads and every track binds to the existing E2 Fox (no 2nd mesh); G1.1 / G2.1 still bound
  2. pose equivalence: every G3 clip evaluated on the E2 Fox reproduces the Blender ground truth (bones + facial morphs)
  3. in-page deterministic suite (runG3Tests): 17 events, cue timing, pops, cleanup, interruption, cancel, pause, countdown data,
     group data + group streak (single flame), reduced motion, Lv1 / Lv30, coalescing, effects off, material immutability
  4. multi-fox suite (runG3MultiTests): duo synchronisation with two instances, contact mismatch, different levels, cancel one /
     both, solo fallback, group symbolic + multi
  5. render counts (draw calls / geometries / textures / JS heap) for 1 fox vs 3 foxes — counts only, no GPU timing claims
  6. Lv1 / Lv30: effects root follows the fox scale, every bone inside the canvas through all 17 events
  7. GPU resource cleanup: renderer geometries / textures stable across repeated passes of all 17 events
  8. dispose, no page errors, module missing → documented fallbacks (G3 filtered out, and ?modules=0)
SwiftShader has no GPU: no FPS claims.
Output: 08_VALIDATION/runtime_g3/g3_runtime_report.json + g3_*.png
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

BASE = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4195/index.html')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g3')
REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g3_reference_poses.json')
FK = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g3_gltf_fk_poses.json')
FIDELITY = os.path.join(ROOT, '08_VALIDATION', 'runtime_g3', 'gltf_pose_fidelity_g3.json')
os.makedirs(OUT, exist_ok=True)
CHROME = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
R = {'meta': {'url': BASE, 'renderer': 'headless Chrome + SwiftShader (no GPU)', 'started': time.strftime('%Y-%m-%d %H:%M:%S')}, 'checks': [], 'measurements': {}}
BIND_TOL_MM = 0.05
BLENDER_TOL_MM = 6.0
MORPH_TOL = 0.002

def check(name, ok, **detail):
    R['checks'].append({'name': name, 'pass': bool(ok), **detail})
    print(('PASS ' if ok else 'FAIL ') + name, json.dumps(detail, default=str)[:400])

HELPERS = r"""
window.__t = {
  c() { return window.__g3.controller(); },
  inst() { return window.__foxSandbox.instances()[0]; },
  canvas() { return document.querySelector('.g3-stage canvas'); },
  project(v) { const cam = this.c().debug.camera, r = this.canvas().getBoundingClientRect(); const q = v.clone().project(cam);
    return [r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height]; },
  step(s, dt = 1 / 24) { const c = this.c(); for (let t = 0; t < s - 1e-9; t += dt) c.debug.step(dt); return c.getState(); },
  reset() { const c = this.c(); c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.debug.effects.clearProps(); c.setActivity('idle'); c.setStreak({ active: false }); c.setGroupStreak(false); c.setIdleVariationEnabled(false); c.setLookAtEnabled(false); c.setReducedMotion(false); this.step(1.0); },
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

G3_EVENTS = ['CHALLENGE_INVITED', 'CHALLENGE_ACCEPTED', 'CHALLENGE_STARTED', 'CHALLENGE_WON', 'CHALLENGE_LOST', 'CHALLENGE_DRAW', 'DUO_CELEBRATION', 'GROUP_VICTORY',
             'TEAM_ENCOURAGEMENT', 'GROUP_STREAK_ACTIVE', 'GROUP_STREAK_LOST', 'FRIEND_GREETING', 'PHOTO_REACTION', 'SOCIAL_LIKE_RECEIVED', 'SOCIAL_COMMENT_RECEIVED', 'FRIEND_SUPPORT', 'FRIEND_MISS_YOU']
LEVEL_JS = r"""async ([lv, events]) => {
  const T = window.__t, c = T.c(), FX = c.debug.effects, fox = c.debug.fox;
  const r = T.canvas().getBoundingClientRect(); const res = { level: lv, clips: {} }; let minMargin = 1e9, maxScaleErr = 0;
  const pts = []; fox.traverse(o => { if (o.isBone) pts.push(o); });
  for (const e of events) {
    T.reset(); c.setLevel(lv, { immediate: true }); if (e === 'GROUP_STREAK_LOST') { c.setStreak({ active: true, days: 9 }); c.setGroupStreak(true); T.step(0.5); }
    c.handleEvent(e, e === 'GROUP_STREAK_ACTIVE' ? { days: 9, members: 4 } : undefined);
    let m = 1e9, se = 0; const dur = (c.shot.clip ? 5.2 : 1);
    for (let t = 0; t < dur; t += 1 / 24) { c.debug.step(1 / 24);
      const fs = new fox.scale.constructor(); fox.getWorldScale(fs); const es = new fox.scale.constructor(); FX.root.getWorldScale(es); se = Math.max(se, Math.abs(es.x - fs.x) / fs.x);
      for (const bn of pts) { const [x, y] = T.project(bn.getWorldPosition(bn.position.clone())); m = Math.min(m, x - r.left, r.right - x, y - r.top, r.bottom - y); } }
    res.clips[e] = { minMarginPx: +m.toFixed(1), effectScaleErr: +se.toExponential(2) }; minMargin = Math.min(minMargin, m); maxScaleErr = Math.max(maxScaleErr, se);
  }
  const fs = new fox.scale.constructor(); fox.getWorldScale(fs); res.foxScale = +fs.x.toFixed(4);
  res.minMarginPx = +minMargin.toFixed(1); res.maxEffectScaleErr = maxScaleErr;
  T.reset(); c.setLevel(20, { immediate: true }); T.step(0.2); return res;
}"""

READY = "window.__g3 && window.__g3.controller() && window.__foxSandbox && window.__foxSandbox.instances().length >= 1"
MREADY = "window.__g3multi && window.__g3multi.ready"

async def main():
    ref = json.load(open(REF)); fk = json.load(open(FK)); fid = json.load(open(FIDELITY))
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        ctx = await browser.new_context(viewport={'width': 1400, 'height': 1300}, device_scale_factor=1)
        pg = await ctx.new_page()
        errors, glb, missing = [], [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
        pg.on('request', lambda r: glb.append(r.url.split('/')[-1]) if r.url.endswith('.glb') else None)
        pg.on('response', lambda r: missing.append(r.url) if r.status == 404 else None)
        await pg.goto(BASE + '?seed=7#/g3')
        await pg.wait_for_function(READY, timeout=120000)
        await pg.wait_for_function(MREADY, timeout=120000)
        await pg.evaluate(HELPERS); await pg.wait_for_timeout(1500)

        # 1. module binding
        st = await pg.evaluate("() => { const c = window.__t.c(), s = c.getStats(); const names = []; c.debug.fox.traverse(o => { if (o.isSkinnedMesh && o.name.includes('Body')) names.push(o.name); }); const sk = new Set(); c.debug.fox.traverse(o => { if (o.isSkinnedMesh) sk.add(o.skeleton.bones[0].uuid); }); return { modules: s.modules, clips: c.availableClips(), tris: window.__t.inst().stats.triangles, skeletons: sk.size, foxMeshes: new Set(names.map(n => n.replace(/_\\d+$/, ''))).size }; }")
        R['measurements']['module'] = st
        m3 = next((m for m in st['modules'] if m.get('id') == 'g3_challenge_social'), {})
        m2 = next((m for m in st['modules'] if m.get('id') == 'g2_daily_life'), {})
        m1 = next((m for m in st['modules'] if m.get('id') == 'g1_quest_reward_streak'), {})
        check('G3 animation module loaded; every track binds to the existing E2 Fox (node / property / morph count); G1.1 and G2.1 modules still bound',
              m3.get('ok') and m3.get('boundTracks') == m3.get('tracks') and m3.get('tracks', 0) > 0 and m2.get('ok') and m1.get('ok'), g3=m3, g2=m2, g1=m1)
        check('50 clips available (7 E2 core + 9 G1 + 16 G2 + 18 G3); no extra Fox mesh / skeleton; E2 triangle budget',
              len(st['clips']) == 50 and st['foxMeshes'] == 1 and st['skeletons'] == 1 and 73000 < st['tris'] < 76000,
              clips=len(st['clips']), fox_body_meshes=st['foxMeshes'], skeletons=st['skeletons'], triangles=st['tris'], glb_requests=sorted(set(glb)))

        # 2. pose equivalence
        pose = await pg.evaluate(POSE_JS, [ref, fk])
        R['measurements']['pose_equivalence'] = pose
        complete = pose['samples'] == sum(len(v) for v in ref['clips'].values()) and not pose['missingNodes']
        check(f'Binding exactness: G3 clips on the E2 Fox reproduce the module glTF data (independent numpy FK) ≤ {BIND_TOL_MM} mm; facial morphs = Blender ≤ {MORPH_TOL}',
              complete and pose['maxBindMm'] <= BIND_TOL_MM and pose['maxMorph'] <= MORPH_TOL,
              samples=pose['samples'], max_vs_gltf_fk_mm=round(pose['maxBindMm'], 5), max_morph=round(pose['maxMorph'], 5), worst=pose['worstBind'], missing=pose['missingNodes'][:8])
        e2w = fid['e2_approved_glb_vs_blender']['worst']['max_mm']
        check(f'Format fidelity vs Blender ≤ {BLENDER_TOL_MM} mm on every sampled bone (same tolerance as G1.1 / G2.1; approved E2 GLB: {e2w} mm)',
              complete and pose['maxBoneMm'] <= BLENDER_TOL_MM, max_vs_blender_mm=round(pose['maxBoneMm'], 3), worst=pose['worst'], e2_reference_mm=e2w,
              per_clip={k: v.get('vsBlenderMm') for k, v in pose['clips'].items()})

        # 3. in-page single-fox suite
        tests = await pg.evaluate("() => window.__g3.runTests()")
        R['measurements']['in_page_tests'] = tests
        for t in tests: check('[harness] ' + t['name'], t['pass'], **(t['detail'] if isinstance(t['detail'], dict) else {}))

        # 4. multi-fox suite
        mt = await pg.evaluate("() => window.__g3.runMultiTests()")
        R['measurements']['multi_tests'] = mt
        for t in mt: check('[multi] ' + t['name'], t['pass'], **(t['detail'] if isinstance(t['detail'], dict) else {}))

        # 5. render counts (software renderer: counts only)
        render = {}
        for label, js in (('1 fox (symbolic group)', "window.__g3.group('symbolic')"), ('3 foxes (multi group)', "window.__g3.group('multi')")):
            await pg.evaluate(f"() => {{ {js}; }}"); await pg.wait_for_timeout(2500)
            render[label] = await pg.evaluate("() => window.__g3.measure()")
        await pg.wait_for_timeout(4000)
        render['idle after'] = await pg.evaluate("() => window.__g3.measure()")
        R['measurements']['render_counts'] = render
        check('Render counts measured for 1 fox + markers vs 3 foxes in ONE canvas (draw calls / geometries / textures / heap — software renderer, no timing claim)',
              all(v['calls'] > 0 for v in render.values()), **render)

        # 6. level scaling
        lv = {L: await pg.evaluate(LEVEL_JS, [L, G3_EVENTS]) for L in (1, 30)}
        R['measurements']['level_scaling'] = lv
        check('Uniform level scaling: G3 props / effects root follows the fox scale exactly at Lv1 and Lv30 through all 17 events',
              lv[1]['maxEffectScaleErr'] < 1e-6 and lv[30]['maxEffectScaleErr'] < 1e-6 and lv[30]['foxScale'] > lv[1]['foxScale'],
              lv1_scale=lv[1]['foxScale'], lv30_scale=lv[30]['foxScale'], err=[lv[1]['maxEffectScaleErr'], lv[30]['maxEffectScaleErr']])
        check('Lv1 and Lv30: every bone stays inside the canvas through all 17 G3 events (fixed camera)', lv[1]['minMarginPx'] > 0 and lv[30]['minMarginPx'] > 0, lv1=lv[1]['clips'], lv30=lv[30]['clips'])
        await pg.screenshot(path=os.path.join(OUT, 'g3_01_harness.png'))

        # 7. GPU resource cleanup
        RUN_ALL = """async (events) => { const T = window.__t, c = T.c(), raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          for (const e of events) { T.reset(); if (e === 'GROUP_STREAK_LOST') { c.setStreak({ active: true, days: 9 }); c.setGroupStreak(true); }
            c.handleEvent(e, e === 'GROUP_STREAK_ACTIVE' ? { days: 9, members: 4 } : undefined);
            for (let t = 0; t < 6; t += 0.25) { T.step(0.25); await raf(); } }
          T.reset(); T.step(1); await raf(); await raf(); const st = T.inst().stats, fx = c.debug.effects.getStats();
          return { geometries: st.geometries, textures: st.textures, programs: st.programs, fxActive: fx.active, fxRootObjects: fx.rootObjects, props: fx.props.length, stateFx: fx.stateFx.length, embers: fx.groupEmbers }; }"""
        warm = await pg.evaluate(RUN_ALL, G3_EVENTS); again = await pg.evaluate(RUN_ALL, G3_EVENTS); again2 = await pg.evaluate(RUN_ALL, G3_EVENTS)
        R['measurements']['gpu_cleanup'] = {'after_warmup': warm, 'after_pass2': again, 'after_pass3': again2}
        check('All G3 props / effects clean up: renderer geometries / textures stable across repeated passes of the 17 events; nothing left active',
              again['geometries'] == warm['geometries'] == again2['geometries'] and again['textures'] == warm['textures'] == again2['textures'] and again2['fxActive'] == 0 and again2['props'] == 0 and not again2['embers'],
              warm=warm, pass2=again, pass3=again2)

        # 8. dispose with an active group streak + multi stage
        disp = await pg.evaluate("""async () => { const T = window.__t, c = T.c(); T.reset(); c.setStreak({ active: true, days: 9 }); c.setGroupStreak(true); T.step(1); const before = c.getStats().effects.props.length;
            const mgr = window.__g3multi.manager;
            location.hash = '#/dashboard'; await new Promise(r => setTimeout(r, 1500)); return { before, disposed: c.isDisposed, fxParent: !!c.debug.effects.root.parent, props: c.debug.effects.propState().length, choreoParent: !!mgr.root.parent, participants: mgr.stats().participants }; }""")
        R['measurements']['dispose'] = disp
        check('Leaving the page: single controller disposed (group markers released), choreography stage disposed (participants removed)',
              disp['before'] >= 1 and disp['disposed'] and not disp['fxParent'] and disp['props'] == 0 and not disp['choreoParent'] and disp['participants'] == 0, **disp)
        real = [e for e in errors if not ('404' in e and all(u.endswith('favicon.ico') for u in missing))]
        check('No page errors on the G3 harness (a missing favicon.ico 404 from the static test server is ignored)', not real, errors=real[:5], http_404=missing)

        # 9. module absent → documented fallbacks (G3 filtered out; all modules off)
        for label, url, init in (('G3 module filtered out', BASE + '?seed=7#/g3', "window.__foxModuleFilter = ['g1_quest_reward_streak', 'g2_daily_life'];"),
                                 ('modules=0', BASE + '?modules=0&seed=7#/g3', '')):
            fp = await ctx.new_page(); ferr = []
            fp.on('pageerror', lambda e: ferr.append(str(e)))
            if init: await fp.add_init_script(init)
            await fp.goto(url)
            await fp.wait_for_function(READY, timeout=120000); await fp.wait_for_timeout(800)
            fb = await fp.evaluate("() => window.__g3.runFallbackTests()")
            R['measurements'][f'fallback_{label}'] = fb
            for t in fb: check(f'[{label}] ' + t['name'], t['pass'] and not ferr, **t['detail'], errors=ferr[:3])
            await fp.close()
        await browser.close()

    n = len(R['checks']); ok = sum(c['pass'] for c in R['checks'])
    R['summary'] = f'{ok}/{n} PASS'
    print(R['summary'])
    json.dump(R, open(os.path.join(OUT, 'g3_runtime_report.json'), 'w'), indent=2, default=str)
    return 0 if ok == n else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
