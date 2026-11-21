"""Gate G1 — quest / reward / streak module validation in three.js (headless Chrome, real mouse).

Serves 07_WEB_PREVIEW/companion_sandbox/dist on 127.0.0.1:4180 (start it first) and checks, on the
technical test harness (#/g1):
  1. the animation-only module loads and every track binds to the existing E2 Fox (no 2nd mesh)
  2. pose equivalence: each module clip evaluated on the E2 Fox reproduces the Blender ground truth
     (fox_v2_g1_reference_poses.json — bone head positions + facial morph values at sample frames)
  3. the in-page deterministic suite (runG1Tests: playback, face, effect cleanup, return-to-base,
     priorities, queue, level apex, streak base + petting, interruption cleanup, material
     immutability, tiers, effects-off logic, reduced motion, clip count)
  4. uniform level scaling: Lv1 and Lv30 — the effect root follows the fox scale and the fox stays
     inside the canvas during every G1 clip
  5. real mouse head-pet while streak_active loops (flame keeps burning, head is free)
  6. GPU resource cleanup (renderer.info geometries / textures back to baseline after all clips)
  7. ?modules=0 → module absent: G1 events fall back to their F reactions, no 'unavailable' plays
SwiftShader has no GPU: no FPS claims are made from this script.

Output: 08_VALIDATION/runtime_g1/g1_runtime_report.json + g1_*.png
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

BASE = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4180/index.html')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1')
REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g1_reference_poses.json')
FK = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g1_gltf_fk_poses.json')
FIDELITY = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1', 'gltf_pose_fidelity_g1.json')
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
  c() { return window.__g1.controller(); },
  inst() { return window.__foxSandbox.instances()[0]; },
  canvas() { return document.querySelector('.g1-canvas canvas') || document.querySelector('canvas'); },
  project(v) { const cam = this.c().debug.camera, r = this.canvas().getBoundingClientRect(); const q = v.clone().project(cam);
    return [r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height]; },
  step(s, dt = 1 / 24) { const c = this.c(); for (let t = 0; t < s - 1e-9; t += dt) c.debug.step(dt); return c.getState(); },
  headPoint() { const P = this.c().debug.interaction.proxies.head; return this.project(P.getWorldPosition(P.position.clone())); },
  reset() { const c = this.c(); c.pause(); c.debug.anim.cancelOneShots(); c.setStreak({ active: false }); c.setIdleVariationEnabled(false); c.setLookAtEnabled(false); this.step(1.2); },
};
"""

POSE_JS = r"""([ref, fk]) => {
  const c = window.__t.c(), A = c.debug.anim, fox = c.debug.fox;
  c.pause(); A.cancelOneShots(); c.setStreak({ active: false }); window.__t.step(0.5);
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
  c.setLevel(lv, { immediate: true }); T.step(0.3);
  const r = T.canvas().getBoundingClientRect();
  const names = ['streak_active', 'quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'achievement_unlock', 'streak_lost', 'streak_cheer'];
  const res = { level: lv, clips: {} }; let minMargin = 1e9, maxScaleErr = 0, minTop = 1e9;
  const pts = []; fox.traverse(o => { if (o.isBone) pts.push(o); });
  for (const n of names) {
    T.reset(); c.setLevel(lv, { immediate: true });
    if (n === 'streak_active') c.setStreak({ active: true, tier: 'purple' }); else { if (n === 'streak_lost' || n === 'streak_cheer') c.setStreak({ active: true, tier: 'blue' }); c.play(n, { priority: 60 }); }
    let m = 1e9, se = 0, top = 1e9;
    for (let t = 0; t < 4.2; t += 1 / 24) {
      c.debug.step(1 / 24);
      const fs = new fox.scale.constructor(); fox.getWorldScale(fs); const es = new fox.scale.constructor(); FX.root.getWorldScale(es);
      se = Math.max(se, Math.abs(es.x - fs.x) / fs.x);
      for (const b of pts) { const [x, y] = T.project(b.getWorldPosition(b.position.clone()));
        m = Math.min(m, x - r.left, r.right - x, y - r.top, r.bottom - y); top = Math.min(top, y - r.top); }
    }
    res.clips[n] = { minMarginPx: +m.toFixed(1), topMarginPx: +top.toFixed(1), effectScaleErr: +se.toExponential(2) }; minMargin = Math.min(minMargin, m); minTop = Math.min(minTop, top); maxScaleErr = Math.max(maxScaleErr, se);
  }
  const fs = new fox.scale.constructor(); fox.getWorldScale(fs); res.foxScale = +fs.x.toFixed(4);
  res.minMarginPx = +minMargin.toFixed(1); res.minTopMarginPx = +minTop.toFixed(1); res.maxEffectScaleErr = maxScaleErr;
  T.reset(); c.setLevel(20, { immediate: true }); T.step(0.2); return res;
}"""

async def main():
    ref = json.load(open(REF)); fk = json.load(open(FK)); fid = json.load(open(FIDELITY))
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        ctx = await browser.new_context(viewport={'width': 1400, 'height': 900}, device_scale_factor=1)
        pg = await ctx.new_page()
        errors, glb = [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)
        pg.on('request', lambda r: glb.append(r.url.split('/')[-1]) if r.url.endswith('.glb') else None)
        missing = []
        pg.on('response', lambda r: missing.append(r.url) if r.status == 404 else None)
        await pg.goto(BASE + '?seed=7#/g1')
        await pg.wait_for_function("window.__g1 && window.__g1.controller() && window.__foxSandbox && window.__foxSandbox.instances().length >= 1", timeout=90000)
        await pg.evaluate(HELPERS); await pg.wait_for_timeout(1500)

        # ---------------------------------------------------------------- 1. module binding
        st = await pg.evaluate("() => { const s = window.__t.c().getStats(); const names = []; window.__t.c().debug.fox.traverse(o => { if (o.isSkinnedMesh && o.name.includes('Body')) names.push(o.name + (o.parent && o.parent.isSkinnedMesh ? ' (child of ' + o.parent.name + ')' : '')); }); let skeletons = new Set(); window.__t.c().debug.fox.traverse(o => { if (o.isSkinnedMesh) skeletons.add(o.skeleton.bones[0].uuid); }); return { modules: s.modules, clips: window.__t.c().availableClips(), tris: window.__t.inst().stats.triangles, bodyMeshes: names, skeletons: skeletons.size, foxMeshes: new Set(names.filter(n => !n.includes('child of')).map(n => n.replace(/_\\d+$/, ''))).size }; }")
        R['measurements']['module'] = st
        m = st['modules'][0] if st['modules'] else {}
        check('Animation module loaded and every track binds to the existing E2 Fox node / property / morph count',
              m.get('ok') and m.get('boundTracks') == m.get('tracks') and m.get('tracks', 0) > 0, module=m)
        check('16 clips available (7 E2 core + 9 G1); the module adds no Fox mesh (one FOX_Body — split per material by three — one bone set, E2 triangle budget)',
              len(st['clips']) == 16 and st['foxMeshes'] == 1 and st['skeletons'] == 1 and 73000 < st['tris'] < 76000,
              clips=len(st['clips']), fox_body_meshes=st['foxMeshes'], body_mesh_names=st['bodyMeshes'], skeletons=st['skeletons'], triangles=st['tris'], glb_requests=sorted(set(glb)))

        # ---------------------------------------------------------------- 2. pose equivalence
        pose = await pg.evaluate(POSE_JS, [ref, fk])
        R['measurements']['pose_equivalence'] = pose
        complete = pose['samples'] == sum(len(v) for v in ref['clips'].values()) and not pose['missingNodes']
        check(f'Binding exactness: module clips on the E2 Fox reproduce the module glTF data (independent numpy FK) ≤ {BIND_TOL_MM} mm; morphs = Blender ≤ {MORPH_TOL}',
              complete and pose['maxBindMm'] <= BIND_TOL_MM and pose['maxMorph'] <= MORPH_TOL,
              samples=pose['samples'], max_vs_gltf_fk_mm=round(pose['maxBindMm'], 5), max_morph=round(pose['maxMorph'], 5), worst=pose['worstBind'], missing=pose['missingNodes'][:8])
        e2w = fid['e2_approved_glb_vs_blender']['worst']['max_mm']
        check(f'Format fidelity vs Blender ≤ {BLENDER_TOL_MM} mm on every sampled bone (glTF has no shear; approved E2 GLB on its own clips: {e2w} mm)',
              complete and pose['maxBoneMm'] <= BLENDER_TOL_MM, max_vs_blender_mm=round(pose['maxBoneMm'], 3), worst=pose['worst'], e2_reference_mm=e2w,
              per_clip={k: v.get('vsBlenderMm') for k, v in pose['clips'].items()})

        # ---------------------------------------------------------------- 3. in-page suite
        tests = await pg.evaluate("() => window.__g1.runTests()")
        R['measurements']['in_page_tests'] = tests
        for t in tests: check('[harness] ' + t['name'], t['pass'], **{k: v for k, v in t['detail'].items()} if isinstance(t['detail'], dict) else {})

        # ---------------------------------------------------------------- 4. level scaling
        lv = {}
        for L in (1, 30):
            lv[L] = await pg.evaluate(LEVEL_JS, L)
        R['measurements']['level_scaling'] = lv
        check('Uniform level scaling: effect root follows the fox scale exactly at Lv1 and Lv30',
              lv[1]['maxEffectScaleErr'] < 1e-6 and lv[30]['maxEffectScaleErr'] < 1e-6 and lv[30]['foxScale'] > lv[1]['foxScale'],
              lv1_scale=lv[1]['foxScale'], lv30_scale=lv[30]['foxScale'], err=[lv[1]['maxEffectScaleErr'], lv[30]['maxEffectScaleErr']])
        check('Lv1 and Lv30: every bone stays inside the canvas through all G1 clips (fixed camera)',
              lv[1]['minMarginPx'] > 0 and lv[30]['minMarginPx'] > 0 and lv[30]['minTopMarginPx'] < lv[1]['minTopMarginPx'], lv1_margin=lv[1]['minMarginPx'], lv30_margin=lv[30]['minMarginPx'], lv1_top_margin=lv[1]['minTopMarginPx'], lv30_top_margin=lv[30]['minTopMarginPx'], note='min edge margin is the feet (scale origin), the top margin shows the scale')
        # level_up from Lv20 → 30: scale applied at the apex cue, mid-clip
        lu = await pg.evaluate("""() => { const T = window.__t, c = T.c(); T.reset(); c.setLevel(20, { immediate: true }); T.step(0.3);
          const s0 = c.getState().level; c.handleEvent('LEVEL_UP', { level: 30 }); T.step(0.75); const sMid = c.getState().level; T.step(0.6); const sApex = c.getState().level; T.step(3.5);
          const end = c.getState(); c.setLevel(20, { immediate: true }); T.step(0.2); return { before: s0, at0_75s: sMid, after1_35s: sApex, end: end.level, oneShotEnd: end.oneShot }; }""")
        R['measurements']['level_up_apex'] = lu
        check('LEVEL_UP: new level held until the apex cue (f23 ≈ 0.92 s), then applied; clip returns to base',
              lu['before'] == 20 and lu['at0_75s'] == 20 and lu['after1_35s'] == 30 and lu['end'] == 30 and not lu['oneShotEnd'], **lu)
        await pg.screenshot(path=os.path.join(OUT, 'g1_01_harness.png'))

        # ---------------------------------------------------------------- 5. real mouse pet during streak_active
        await pg.evaluate("() => { const T = window.__t, c = T.c(); T.reset(); c.setStreak({ active: true, tier: 'orange', days: 5 }); T.step(1.5); }")
        hx, hy = await pg.evaluate("window.__t.headPoint()")
        await pg.mouse.move(hx - 90, hy + 150); await pg.mouse.move(hx, hy, steps=10)
        s = await pg.evaluate("() => window.__t.step(0.3)")
        hover = s.get('hover')
        await pg.mouse.down(); await pg.mouse.up()
        s1 = await pg.evaluate("() => { const s = window.__t.step(0.15); return { oneShot: s.oneShot, base: window.__t.c().debug.anim.base, flame: window.__t.c().debug.effects.getStats().streak }; }")
        await pg.evaluate("() => window.__t.step(0.5)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(OUT, 'g1_02_streak_pet.png'), clip={'x': hx - 260, 'y': hy - 200, 'width': 520, 'height': 560})
        s2 = await pg.evaluate("() => { const s = window.__t.step(4.0); return { oneShot: s.oneShot, base: window.__t.c().debug.anim.base, flame: window.__t.c().debug.effects.getStats().streak }; }")
        R['measurements']['streak_pet'] = {'hover': hover, 'during': s1, 'after': s2}
        check('Real mouse: hover + click head during streak_active → head_pet; flame keeps burning; returns to streak_active',
              hover == 'head' and s1['oneShot'] == 'head_pet' and s1['flame'].get('flameVisible') and s2['oneShot'] in (None, '') and s2['base'] == 'streak_active' and s2['flame'].get('flameVisible'),
              hover=hover, during=s1, after=s2)
        await pg.mouse.move(20, 20)

        # ---------------------------------------------------------------- 6. GPU resource cleanup
        RUN_ALL = """async () => { const T = window.__t, c = T.c(), raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const names = ['quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'level_up', 'achievement_unlock', 'streak_lost', 'streak_cheer'];
          for (const n of names) { T.reset(); if (n.startsWith('streak')) c.setStreak({ active: true, tier: 'crimson' }); c.play(n, { priority: 60 });
            for (let i = 0; i < 110; i += 6) { T.step(6 / 24); await raf(); } }
          c.setStreak({ active: true, tier: 'blue' }); T.step(1); await raf(); c.setStreak({ active: false }); T.step(1.5); T.reset(); c.setLevel(20, { immediate: true }); T.step(0.5);
          await raf(); await raf(); const s = T.inst().stats, fx = c.debug.effects.getStats(); return { geometries: s.geometries, textures: s.textures, programs: s.programs, fxActive: fx.active, fxRootObjects: fx.rootObjects, char: fx.char }; }"""
        warm = await pg.evaluate(RUN_ALL)
        base = await pg.evaluate("async () => { await new Promise(r => setTimeout(r, 300)); const s = window.__t.inst().stats; return { geometries: s.geometries, textures: s.textures }; }")
        again = await pg.evaluate(RUN_ALL)
        again2 = await pg.evaluate(RUN_ALL)
        R['measurements']['gpu_cleanup'] = {'after_warmup': warm, 'baseline': base, 'after_pass2': again, 'after_pass3': again2}
        check('All G1 effects clean up: renderer geometries / textures do not grow across repeated full passes; no active fx, char overlay off',
              again['geometries'] == warm['geometries'] == again2['geometries'] and again['textures'] == warm['textures'] == again2['textures'] and again2['fxActive'] == 0 and not again2['char'],
              warm=warm, pass2=again, pass3=again2)
        real = [e for e in errors if not ('404' in e and all(u.endswith('favicon.ico') for u in missing))]
        check('No page errors on the G1 harness (a missing favicon.ico 404 from the static test server is ignored)', not real, errors=real[:5], http_404=missing)

        # ---------------------------------------------------------------- 7. module absent → fallbacks
        fp = await ctx.new_page(); ferr = []
        fp.on('pageerror', lambda e: ferr.append(str(e)))
        await fp.goto(BASE + '?modules=0&seed=7#/g1')
        await fp.wait_for_function("window.__g1 && window.__g1.controller() && window.__foxSandbox && window.__foxSandbox.instances().length >= 1", timeout=90000)
        await fp.evaluate(HELPERS); await fp.wait_for_timeout(800)
        fb = await fp.evaluate("""() => { const T = window.__t, c = T.c(), reg = window.__foxSandbox.registry, out = { clips: c.availableClips().length, events: {} };
          for (const name of ['QUEST_STARTED', 'QUEST_COMPLETED', 'QUEST_EXPIRED', 'XP_GAINED', 'LEVEL_UP', 'ACHIEVEMENT_UNLOCKED', 'STREAK_UPDATED', 'STREAK_MILESTONE', 'STREAK_LOST']) {
            T.reset(); const r = c.handleEvent(name, name === 'LEVEL_UP' ? { level: 21 } : (name.startsWith('STREAK') ? { days: 8 } : undefined)); T.step(0.1);
            out.events[name] = { result: r.result, play: r.play ?? null, steps: (r.steps || []).map(s => s.kind + ':' + (s.clip || s.mood || s.activity || (s.active !== undefined ? s.active : ''))), oneShot: c.getState().oneShot, mood: c.getState().mood }; }
          T.reset(); c.setLevel(20, { immediate: true }); return out; }""")
        R['measurements']['fallback_modules_off'] = fb
        bad = {k: v for k, v in fb['events'].items() if v['play'] == 'unavailable' or (v['oneShot'] and v['oneShot'] not in ('happy', 'wave', 'head_pet', 'tail_touch'))}
        check('?modules=0: 7 core clips only; G1 events run their F-era fallback reactions (no unavailable / fabricated clips)',
              fb['clips'] == 7 and not bad and fb['events']['QUEST_COMPLETED']['oneShot'] == 'happy' and fb['events']['STREAK_LOST']['mood'] == 'sad' and not ferr,
              clips=fb['clips'], bad=bad, quest=fb['events']['QUEST_COMPLETED'], streak_lost=fb['events']['STREAK_LOST'], errors=ferr[:3])
        await fp.screenshot(path=os.path.join(OUT, 'g1_03_modules_off.png'))
        await browser.close()

    n = len(R['checks']); ok = sum(c['pass'] for c in R['checks'])
    R['summary'] = f'{ok}/{n} PASS'
    print(R['summary'])
    json.dump(R, open(os.path.join(OUT, 'g1_runtime_report.json'), 'w'), indent=2, default=str)
    return 0 if ok == n else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
