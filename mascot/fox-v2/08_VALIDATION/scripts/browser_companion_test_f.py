"""Gate F — companion sandbox runtime validation (headless Chrome, real mouse input).

Serves 07_WEB_PREVIEW/companion_sandbox/dist on 127.0.0.1:4180 (start it first) and checks the
controller API, priorities, interaction (actual raycasting), look-at noise filtering, idle
variation gating, level scaling + framing, the event registry, reduced motion, WebGL / GLB
failure fallbacks, repeated mount / unmount, tab pause / resume and offscreen render stop.
SwiftShader has no GPU: FPS numbers from this script are NOT performance evidence.

Output: 08_VALIDATION/runtime_f/companion_runtime_report_f.json + f_*.png
"""
import asyncio, json, math, os, sys, time
from playwright.async_api import async_playwright

BASE = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4180/index.html')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_f')
os.makedirs(OUT, exist_ok=True)
CHROME = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
R = {'meta': {'url': BASE, 'renderer': 'headless Chrome + SwiftShader (no GPU)', 'started': time.strftime('%Y-%m-%d %H:%M:%S')}, 'checks': [], 'measurements': {}}

def check(name, ok, **detail):
    R['checks'].append({'name': name, 'pass': bool(ok), **detail})
    print(('PASS ' if ok else 'FAIL ') + name, json.dumps(detail, default=str)[:300])

HELPERS = r"""
window.__t = {
  inst(p) { return window.__foxSandbox.instances().find(i => i.presentation === p); },
  ctrl(p) { const i = this.inst(p); return i && window.__foxSandbox.controller(i.id); },
  canvas(p) { return document.querySelector(`[data-presentation="${p}"] canvas`); },
  project(p, v) {
    const c = this.ctrl(p), cam = c.debug.camera, r = this.canvas(p).getBoundingClientRect();
    const q = v.clone().project(cam); return [r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height];
  },
  // deterministic stepping (the host loop keeps rendering, the controller is advanced here)
  step(p, seconds, dt = 1 / 30) { const c = this.ctrl(p); for (let t = 0; t < seconds - 1e-9; t += dt) c.debug.step(dt); return c.getState(); },
  hold(p) { this.ctrl(p).pause(); }, release(p) { this.ctrl(p).resume(); },
  headPoint(p) { const c = this.ctrl(p); const P = c.debug.interaction.proxies.head; const v = P.getWorldPosition(P.position.clone()); return this.project(p, v); },
};
"""

# robust tail picking done in page with the controller's own pick()
TAIL_JS = r"""(p) => {
  const T = window.__t, c = T.ctrl(p), I = c.debug.interaction, cam = c.debug.camera, r = T.canvas(p).getBoundingClientRect();
  const V2 = I.pointerNdc.constructor; const best = [];
  for (const cap of I.proxies.tail) {
    const pos = cap.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const v = cap.localToWorld(cap.position.clone().set(pos.getX(i) * 0.5, pos.getY(i) * 0.5, pos.getZ(i) * 0.5));
      const q = v.clone().project(cam); if (Math.abs(q.x) > .92 || Math.abs(q.y) > .92) continue;
      if (I.pick(new V2(q.x, q.y)).target === 'tail') best.push([r.left + (q.x + 1) / 2 * r.width, r.top + (1 - q.y) / 2 * r.height, v.y]);
    }
  }
  best.sort((a, b) => a[2] - b[2]);
  return best.length ? { pt: best[Math.floor(best.length / 2)], n: best.length } : null;
}"""

async def wait_ready(pg, n=1, timeout=60000):
    await pg.wait_for_function(f"window.__foxSandbox && window.__foxSandbox.instances && window.__foxSandbox.instances().length >= {n}", timeout=timeout)
    await pg.evaluate(HELPERS)

async def state(pg, p):
    return await pg.evaluate("p => window.__t.inst(p).state", p)

async def heap(cdp):
    await cdp.send('HeapProfiler.collectGarbage'); await asyncio.sleep(0.3); await cdp.send('HeapProfiler.collectGarbage')
    m = await cdp.send('Performance.getMetrics'); d = {x['name']: x['value'] for x in m['metrics']}
    return d.get('JSHeapUsedSize', 0)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=CHROME)
        ctx = await browser.new_context(viewport={'width': 1400, 'height': 900}, device_scale_factor=1)
        pg = await ctx.new_page()
        errors, glb_requests = [], []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'favicon' not in m.text and '404' not in m.text else None)
        pg.on('request', lambda r: glb_requests.append(r.url) if r.url.endswith('.glb') else None)

        # ------------------------------------------------------------ 1. dashboard: two instances, one model
        t0 = time.time()
        await pg.goto(BASE + '?seed=7#/dashboard')
        await wait_ready(pg, 2)
        R['measurements']['dashboard_ready_s'] = round(time.time() - t0, 2)
        await pg.wait_for_timeout(1500)
        insts = await pg.evaluate("window.__foxSandbox.instances().map(i => ({id: i.id, p: i.presentation, canvas: i.stats.canvas, calls: i.stats.calls, tris: i.stats.triangles, asset: i.stats.asset}))")
        R['measurements']['dashboard_instances'] = insts
        check('Dashboard Mini + Companion Widget mounted from the same FoxController class', {i['p'] for i in insts} == {'mini', 'widget'}, instances=[(i['id'], i['p'], i['canvas']) for i in insts])
        check('Fox GLB downloaded once for both instances (shared parse, no duplicated geometry)', len(glb_requests) == 1, requests=len(glb_requests))
        shared = await pg.evaluate("""() => { const cs = window.__foxSandbox.controllers(); const geo = c => { const s = new Set(); c.debug.fox.traverse(o => o.isMesh && !o.name.startsWith('PROXY_') && s.add(o.geometry.uuid)); return s; };
            const a = geo(cs[0]), b = geo(cs[1]); let same = 0; a.forEach(u => b.has(u) && same++); return { a: a.size, b: b.size, same }; }""")
        check('Instances share every Fox BufferGeometry (SkeletonUtils clone; only the 5 small hit proxies are per instance)', shared['same'] == shared['a'] == shared['b'] and shared['a'] > 0, **shared)
        sizes = await pg.evaluate("['mini','widget'].map(p => { const r = document.querySelector(`[data-presentation=${p}]`).getBoundingClientRect(); return [p, Math.round(r.width), Math.round(r.height)]; })")
        check('Presentation sizes: Mini 200×200, Widget 360×440', sizes == [['mini', 200, 200], ['widget', 360, 440]], sizes=sizes)
        tri = insts[0]['tris']; calls = insts[0]['calls']
        R['measurements']['per_instance_render'] = {'triangles': tri, 'draw_calls': calls}
        check('Triangles / draw calls per companion match the E2 budget (≈73.8k tris, ≤ 50 calls)', 73000 < tri < 75000 and calls <= 50, triangles=tri, calls=calls)
        await pg.screenshot(path=os.path.join(OUT, 'f_01_dashboard.png'))

        # ------------------------------------------------------------ 2. API
        api = await pg.evaluate("""async () => {
          const T = window.__t, c = T.ctrl('widget'), out = {}; const wait = ms => new Promise(r => setTimeout(r, ms));
          T.hold('widget');
          out.play = c.play('wave'); T.step('widget', 0.3); out.playing = c.getState().oneShot;
          out.unknown = c.play('dance'); c.debug.anim.cancelOneShots();
          c.setMood('happy'); T.step('widget', 0.5); out.mood = c.getState().mood; c.setMood('neutral');
          c.setActivity('walk'); out.walkW = T.step('widget', 0.6).weights.walk;
          c.setActivity('idle'); out.idleW = T.step('widget', 0.6).weights.idle;
          c.setLevel(10); out.scale10 = T.step('widget', 1.2).scale; c.setLevel(20); T.step('widget', 1.2);
          c.setLookAtEnabled(false); out.lookOff = T.step('widget', 0.8).lookWeight; c.setLookAtEnabled(true);
          c.setInteractionEnabled(false); out.interOff = c.getState().interaction; c.setInteractionEnabled(true);
          T.release('widget');
          c.pause(); const f0 = window.__t.inst('widget').stats.frames; await wait(600); out.paused = c.getState().paused;
          out.renderWhilePausedFrames = window.__t.inst('widget').stats.frames - f0;   // host may keep drawing the frozen pose
          c.resume(); out.resumed = !c.getState().paused;
          return out; }""")
        R['measurements']['api'] = api
        check('play("wave") plays a one-shot; unknown clip is refused', api['play'] == 'played' and api['playing'] == 'wave' and api['unknown'] == 'unknown', **api)
        check('setMood / setActivity / setLevel / setLookAtEnabled / setInteractionEnabled / pause / resume',
              api['mood'] == 'happy' and api['walkW'] > 0.95 and api['idleW'] > 0.95 and abs(api['scale10'] - 0.92) < 0.005 and api['lookOff'] < 0.05 and api['interOff'] is False and api['paused'] and api['resumed'], **api)

        # ------------------------------------------------------------ 3. priorities
        pri = await pg.evaluate("""async () => {
          const T = window.__t, c = T.ctrl('widget'), A = c.debug.anim, out = {};
          T.hold('widget'); A.cancelOneShots(); T.step('widget', 0.1);
          out.major = c.handleEvent('QUEST_COMPLETED').play; T.step('widget', 0.3);
          out.tapDuringMajor = A.request('head_pet', { priority: 20, source: 'interaction' });
          out.equalEventQueued = c.handleEvent('FRIEND_CHEER').play;
          out.queue = A.queued.map(q => q.name);
          out.stillMajor = A.currentShot;
          T.step('widget', 2.6); out.queuedPlaysAfterMajor = A.currentShot;
          A.cancelOneShots(); T.step('widget', 0.1);
          out.pet = A.request('head_pet', { priority: 20, source: 'interaction' }); T.step('widget', 0.5);
          out.petAgainDebounced = A.request('head_pet', { priority: 20, source: 'interaction' });
          out.tailReplacesPet = A.request('tail_touch', { priority: 20, source: 'interaction' }); T.step('widget', 1 / 30);
          const w = c.getState().weights; out.crossfade = { head_pet: w.head_pet, tail_touch: w.tail_touch };
          T.step('widget', 0.3); const w2 = c.getState().weights; out.afterFade = { head_pet: w2.head_pet, tail_touch: w2.tail_touch };
          out.levelUpInterrupts = c.handleEvent('LEVEL_UP', { level: 21 }).play; T.step('widget', 0.1); out.after = A.currentShot;
          A.cancelOneShots(); c.setLevel(20, { immediate: true }); T.step('widget', 0.2); T.release('widget'); return out; }""")
        R['measurements']['priorities'] = pri
        check('Major event (50) is not interrupted by a tap (20); equal-priority event is queued',
              pri['major'] == 'played' and pri['tapDuringMajor'] == 'rejected' and pri['equalEventQueued'] == 'queued' and pri['stillMajor'] == 'happy' and pri['queuedPlaysAfterMajor'] == 'wave', **pri)
        check('Repeated tap debounced; a new interaction cross-fades the previous one; LEVEL_UP (50) interrupts',
              pri['petAgainDebounced'] == 'debounced' and pri['tailReplacesPet'] == 'played' and 0.3 < pri['crossfade']['head_pet'] < 1 and pri['afterFade']['head_pet'] == 0 and pri['afterFade']['tail_touch'] == 1 and pri['levelUpInterrupts'] == 'played' and pri['after'] == 'happy', **pri)

        # ------------------------------------------------------------ 4. idle variation never interrupts one-shots
        iv = await pg.evaluate("""async () => {
          const T = window.__t, c = T.ctrl('mini'), I = c.debug.idle; T.hold('mini');
          T.step('mini', 30, 1 / 60);   // 30 s of idle: variation events must happen
          const idleEvents = I.log.filter(e => e.type !== 'tempo').length;
          const n0 = idleEvents; let maxW = 0;
          c.play('head_pet'); T.step('mini', 0.25, 1 / 60);
          for (let i = 0; i < 160; i++) { c.debug.step(1 / 60); maxW = Math.max(maxW, I.weight); }   // rest of the clip
          const n1 = I.log.filter(e => e.type !== 'tempo').length;
          T.step('mini', 3); const after = I.weight; T.release('mini');
          return { idleEventsIn30s: idleEvents, eventsDuringShot: n1 - n0, maxIdleWeightDuringShot: maxW, weightAfter: after, log: I.log.slice(-6) }; }""")
        R['measurements']['idle_variation'] = iv
        check('Idle variation gate stays closed during a one-shot (no random reactions)', iv['idleEventsIn30s'] >= 4 and iv['eventsDuringShot'] == 0 and iv['maxIdleWeightDuringShot'] < 0.05 and iv['weightAfter'] > 0.8, **{k: iv[k] for k in ('idleEventsIn30s', 'eventsDuringShot', 'maxIdleWeightDuringShot', 'weightAfter')})

        # ------------------------------------------------------------ 5. real mouse: hover / pet / tail (widget)
        STEP = "([p, s]) => window.__t.step(p, s)"
        await pg.evaluate("() => { const T = window.__t, c = T.ctrl('widget'); T.hold('widget'); c.debug.anim.cancelOneShots(); c.setIdleVariationEnabled(false); T.step('widget', 1); }")
        hx, hy = await pg.evaluate("window.__t.headPoint('widget')")
        await pg.mouse.move(hx - 80, hy + 140); await pg.mouse.move(hx, hy, steps=10)
        s = await pg.evaluate(STEP, ['widget', 0.4])
        check('Hover head detected by raycast (real mouse)', s['hover'] == 'head', hover=s['hover'], at=[round(hx), round(hy)])
        await pg.screenshot(path=os.path.join(OUT, 'f_10_widget_hover_head.png'), clip={'x': hx - 230, 'y': hy - 140, 'width': 380, 'height': 460})
        await pg.mouse.down(); await pg.mouse.up()
        s = await pg.evaluate(STEP, ['widget', 0.1])
        check('Click head → head_pet', s['oneShot'] == 'head_pet', oneShot=s['oneShot'])
        await pg.evaluate(STEP, ['widget', 0.9]); await pg.wait_for_timeout(700)
        await pg.screenshot(path=os.path.join(OUT, 'f_11_widget_head_pet.png'), clip={'x': hx - 230, 'y': hy - 140, 'width': 380, 'height': 460})
        t_before = await pg.evaluate("window.__t.ctrl('widget').debug.anim.current.t")
        await pg.mouse.down(); await pg.mouse.up()
        await pg.evaluate(STEP, ['widget', 1 / 30])
        t_after = await pg.evaluate("window.__t.ctrl('widget').debug.anim.current.t")
        st2 = await pg.evaluate("window.__t.ctrl('widget').getStats()")
        check('A second click during head_pet does not restart the clip (debounce)', t_after > t_before, clip_time_before=round(t_before, 3), clip_time_after=round(t_after, 3), taps=st2['taps'], ignored=st2['ignoredTaps'])
        await pg.evaluate("() => { const T = window.__t; T.step('widget', 3.5); }")
        await pg.mouse.move(hx - 260, hy - 200, steps=3); await pg.evaluate(STEP, ['widget', 0.5])
        tail = await pg.evaluate(TAIL_JS, 'widget')
        if tail:
            tx, ty = tail['pt'][0], tail['pt'][1]
            await pg.mouse.move(tx, ty, steps=8)
            sh = await pg.evaluate(STEP, ['widget', 0.4])
            await pg.mouse.down(); await pg.mouse.up()
            s = await pg.evaluate(STEP, ['widget', 0.1])
            check('Hover + click tail (visible, not occluded by the body) → tail_touch', sh['hover'] == 'tail' and s['oneShot'] == 'tail_touch', hover=sh['hover'], oneShot=s['oneShot'], candidates=tail['n'])
            await pg.evaluate(STEP, ['widget', 0.5]); await pg.wait_for_timeout(700)
            await pg.screenshot(path=os.path.join(OUT, 'f_12_widget_tail_touch.png'), clip={'x': hx - 230, 'y': hy - 140, 'width': 380, 'height': 460})
        else:
            check('Hover + click tail → tail_touch', False, reason='no visible tail point found')
        await pg.evaluate(STEP, ['widget', 3])

        # ------------------------------------------------------------ 6. look-at: dead zone + tiny moves + return
        await pg.evaluate("() => { const c = window.__t.ctrl('widget'); c.debug.anim.cancelOneShots(); window.__t.step('widget', 0.5); }")
        r = await pg.evaluate("(() => { const r = document.querySelector('[data-presentation=widget] canvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
        cx, cy = r[0] + r[2] * 0.92, r[1] + r[3] * 0.35
        # settle 1.6 s then 24 jitter frames (0.8 s): stays inside the 2.5 s "pointer resting" window,
        # so any head motion here would come from the jitter, not from the intended gentle return
        await pg.mouse.move(cx, cy, steps=6); await pg.evaluate(STEP, ['widget', 1.6])
        d0 = (await state(pg, 'widget'))['headDirection']
        jit = []
        for i in range(24):
            await pg.mouse.move(cx + (1.5 if i % 2 else -1.5), cy + (1 if i % 3 else -1))
            jit.append((await pg.evaluate(STEP, ['widget', 1 / 30]))['headDirection'])
        spread = max(math.hypot(a[0] - d0[0], a[1] - d0[1]) for a in jit)
        check('Look-at ignores ±1.5 px cursor jitter (dead zone + low-pass)', spread < 0.8, max_head_change_deg=round(spread, 3))
        await pg.mouse.move(r[0] + r[2] * 0.08, cy, steps=12); await pg.evaluate(STEP, ['widget', 1.5])
        d1 = (await state(pg, 'widget'))['headDirection']
        check('Look-at follows a real move (head turns toward the cursor side)', d1[0] - d0[0] < -10, yaw_before=round(d0[0], 1), yaw_after=round(d1[0], 1))
        await pg.mouse.move(r[0] - 60, r[1] - 60, steps=4); await pg.evaluate(STEP, ['widget', 3.0])
        sl = await state(pg, 'widget')
        check('Pointer leaves → gentle return to neutral (look offset ≈ 0)', abs(sl['lookYaw']) < 2.5 and not sl['pointerInside'], lookYaw=sl['lookYaw'])
        await pg.evaluate("() => { const c = window.__t.ctrl('widget'); c.setIdleVariationEnabled(true); window.__t.release('widget'); }")

        # ------------------------------------------------------------ 7. pointer overhead
        await pg.evaluate("() => { const s = window.__t.ctrl('widget').debug.interaction.stats; s.picks = 0; s.pickMsTotal = 0; s.pickMsMax = 0; }")
        u0 = await pg.evaluate("window.__t.inst('widget').stats.updateMs")
        for i in range(60):
            await pg.mouse.move(r[0] + r[2] * (0.2 + 0.6 * (i % 20) / 20), r[1] + r[3] * (0.3 + 0.004 * i)); await pg.wait_for_timeout(16)
        st = await pg.evaluate("window.__t.inst('widget').stats")
        R['measurements']['pointer_overhead'] = {'picks': st['picks'], 'pick_ms_avg': round(st['pickMsAvg'], 4), 'pick_ms_max': round(st['pickMsMax'], 3), 'update_ms_idle': u0, 'update_ms_while_moving': st['updateMs']}
        check('Raycast cost per pick is small (< 1 ms avg on SwiftShader CPU)', st['pickMsAvg'] < 1.0, **R['measurements']['pointer_overhead'])

        # ------------------------------------------------------------ 8. level scaling + framing + hitboxes
        lv = await pg.evaluate("""async () => {
          const T = window.__t, c = T.ctrl('widget'), out = {}; T.hold('widget');
          const cam = c.debug.camera, camPos = cam.position.toArray();
          const proxyScale = () => { const v = c.debug.interaction.proxies.head.getWorldScale(cam.position.clone()); return +v.x.toFixed(5); };
          const ps20 = proxyScale();
          for (const L of [1, 10, 20, 30, 45]) { c.setLevel(L); T.step('widget', 1.5); out['L' + L] = { scale: c.getState().scale, proxyRatio: +(proxyScale() / ps20).toFixed(4) }; }
          out.cameraUnchanged = cam.position.toArray().every((v, i) => Math.abs(v - camPos[i]) < 1e-9);
          // fit at the largest scale during the biggest clip (happy hops)
          c.setLevel(30, { immediate: true }); c.play('happy'); let minMargin = 1e9; const canvas = window.__t.canvas('widget'), r = canvas.getBoundingClientRect();
          for (let k = 0; k < 26; k++) { T.step('widget', 0.1); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
            c.debug.fox.traverse(o => { if (!o.isSkinnedMesh) return; const p = o.geometry.attributes.position, v = cam.position.clone();
              for (let i = 0; i < p.count; i += 9) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld).project(cam);
                const X = (v.x + 1) / 2 * r.width, Y = (1 - v.y) / 2 * r.height; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } });
            minMargin = Math.min(minMargin, x0, y0, r.width - x1, r.height - y1); }
          out.fitMarginPxAtLv30Happy = +minMargin.toFixed(1); c.debug.anim.cancelOneShots(); c.setLevel(20, { immediate: true }); T.step('widget', 0.2); T.release('widget'); return out; }""")
        R['measurements']['level_scale'] = lv
        exp = {'L1': 0.8, 'L10': 0.92, 'L20': 1.0, 'L30': 1.1, 'L45': 1.1}
        check('Uniform level scale: Lv1 0.80 · Lv10 0.92 · Lv20 1.00 · Lv30+ 1.10; hit proxies scale with it',
              all(abs(lv[k]['scale'] - v) < 0.003 and abs(lv[k]['proxyRatio'] - v) < 0.003 for k, v in exp.items()), **{k: lv[k] for k in exp})
        check('Camera framing fixed for all levels; Lv30 fox stays inside the widget during happy', lv['cameraUnchanged'] and lv['fitMarginPxAtLv30Happy'] > 0, camera_unchanged=lv['cameraUnchanged'], min_margin_px=lv['fitMarginPxAtLv30Happy'])

        # ------------------------------------------------------------ 9. event registry
        ev = await pg.evaluate("""async () => {
          const c = window.__t.ctrl('widget'), reg = window.__foxSandbox.registry, wait = ms => new Promise(r => setTimeout(r, ms)), out = { events: [] };
          const clips = new Set(['happy', 'wave', 'head_pet', 'tail_touch']);
          for (const e of reg.list()) out.events.push({ name: e.name, coverage: e.coverage, priority: e.priority, plays: e.steps.filter(s => s.kind === 'play').map(s => s.clip), planned: e.plannedClip || null,
            validClips: e.steps.every(s => s.kind !== 'play' || clips.has(s.clip)) });
          c.debug.anim.cancelOneShots();
          out.unknown = c.handleEvent('NOT_A_REAL_EVENT').result;
          out.alias = c.handleEvent('quest.completed').canonical;
          c.debug.anim.cancelOneShots(); await wait(50);
          const s1 = c.handleEvent('STREAK_LOST'); out.fallbackPlays = s1.play ?? null; out.fallbackMood = c.getState().mood;
          out.coalesced = c.handleEvent('STREAK_LOST').result;
          let threw = false; try { reg.register('X_TEST', { priority: 1, steps: [], coverage: 'fallback', note: '', aliases: ['task.completed'] }); } catch { threw = true; } out.aliasCollisionRejected = threw;
          return out; }""")
        R['measurements']['event_registry'] = ev
        check('Every registered event uses only clips that exist in the E2 contract', all(e['validClips'] for e in ev['events']), events=len(ev['events']))
        check('Fallback events play no fabricated clip (face-only), unknown events are refused, aliases resolve, repeats coalesce',
              ev['unknown'] == 'unknown' and ev['alias'] == 'QUEST_COMPLETED' and ev['fallbackPlays'] is None and ev['fallbackMood'] == 'sad' and ev['coalesced'] == 'coalesced' and ev['aliasCollisionRejected'],
              **{k: ev[k] for k in ('unknown', 'alias', 'fallbackPlays', 'fallbackMood', 'coalesced', 'aliasCollisionRejected')})
        # QUEST_COMPLETED through the real dashboard button (business → bus → controllers)
        await pg.evaluate("() => window.__foxSandbox.controllers().forEach(c => { c.debug.anim.cancelOneShots(); c.debug.step(0.05); })")
        await pg.wait_for_timeout(5500)
        await pg.evaluate("() => window.__foxSandbox.controllers().forEach(c => c.debug.anim.cancelOneShots())")
        await pg.click('text=Hoàn thành Quest')
        both = await pg.evaluate("window.__foxSandbox.instances().map(i => [i.presentation, i.state.oneShot])")
        check('Dashboard "Hoàn thành Quest" publishes QUEST_COMPLETED → every mounted fox reacts', all(o == 'happy' for _, o in both), instances=both)
        await pg.screenshot(path=os.path.join(OUT, 'f_02_dashboard_quest_completed.png'))
        await pg.wait_for_timeout(3500)

        # ------------------------------------------------------------ 10. tab pause / resume
        f0 = await pg.evaluate("window.__foxSandbox.instances().map(i => i.stats.frames)")
        # headless Chrome keeps every tab "visible"; simulate the browser's visibilitychange (real tab switch is checked on the GPU machine)
        SETVIS = "v => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); }"
        await pg.evaluate(SETVIS, 'hidden'); await asyncio.sleep(1.5)
        vis_hidden = await pg.evaluate("document.visibilityState")
        f1 = await pg.evaluate("window.__foxSandbox.instances().map(i => [i.stats.frames, i.state.paused])")
        await asyncio.sleep(1.0)
        f2 = await pg.evaluate("window.__foxSandbox.instances().map(i => i.stats.frames)")
        await pg.evaluate(SETVIS, 'visible'); await asyncio.sleep(1.5)
        f3 = await pg.evaluate("window.__foxSandbox.instances().map(i => [i.stats.frames, i.state.paused])")
        stopped = vis_hidden == 'hidden' and all(a[1] for a in f1) and [a[0] for a in f1] == f2
        check('Tab hidden (simulated visibilitychange) → render loop stops and controllers pause; visible → resumes', stopped and all(not a[1] for a in f3) and all(f3[i][0] > f2[i] for i in range(len(f2))),
              visibility=vis_hidden, frames_hidden=[f1, f2], resumed=f3)

        # ------------------------------------------------------------ 11. full companion page
        await pg.goto(BASE + '?seed=7#/companion'); await wait_ready(pg, 1); await pg.wait_for_timeout(2500)
        full = await pg.evaluate("window.__t.inst('full')")
        check('Full Companion View uses the same controller (cached GLB, no 2nd download)', full is not None and len(glb_requests) == 1, cached=full['stats']['asset']['fromCache'] if full else None, glb_requests=len(glb_requests))
        await pg.screenshot(path=os.path.join(OUT, 'f_03_full_companion.png'))
        hx, hy = await pg.evaluate("window.__t.headPoint('full')")
        await pg.mouse.move(hx + 260, hy - 80, steps=8); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=os.path.join(OUT, 'f_04_full_lookat.png'))
        await pg.mouse.move(hx, hy, steps=8); await pg.mouse.down(); await pg.mouse.up()
        await pg.evaluate("() => { window.__t.hold('full'); window.__t.step('full', 1.2); }"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=os.path.join(OUT, 'f_05_full_head_pet.png'))
        check('Full view: click head → head_pet', (await state(pg, 'full'))['oneShot'] == 'head_pet')
        await pg.evaluate("() => window.__t.release('full')")
        await pg.wait_for_timeout(2500)

        # ------------------------------------------------------------ 12. offscreen + mount / unmount (lab)
        cdp = await ctx.new_cdp_session(pg); await cdp.send('Performance.enable')
        await pg.goto(BASE + '#/lab'); await wait_ready(pg, 2); await pg.wait_for_timeout(2000)
        off = await pg.evaluate("window.__foxSandbox.instances().map(i => [i.label, i.stats.frames, i.stats.active, i.state.paused])")
        offscreen = [o for o in off if 'ngoài' in o[0]]
        check('Offscreen companion: no frames rendered, controller paused', offscreen and offscreen[0][1] <= 1 and offscreen[0][2] is False and offscreen[0][3] is True, instances=off)
        await pg.evaluate("document.getElementById('offscreen-fox').scrollIntoView()"); await pg.wait_for_timeout(1500)
        on = await pg.evaluate("window.__foxSandbox.instances().filter(i => i.label.includes('ngoài')).map(i => [i.stats.frames, i.stats.active])")
        check('Scrolled into view → starts rendering', on and on[0][0] >= 2 and on[0][1] is True, instances=on)
        await pg.evaluate("window.scrollTo(0, 0)"); await pg.wait_for_timeout(500)

        LISTENERS = """() => { const c = window.__foxSandbox.controllers()[0]; let g = 0, m = 0; const seen = new Set();
          c.debug.fox.traverse(o => { if (!o.isMesh || o.name.startsWith('PROXY_')) return; g += o.geometry._listeners?.dispose?.length ?? 0;
            for (const mat of [o.material].flat()) if (!seen.has(mat)) { seen.add(mat); m += mat._listeners?.dispose?.length ?? 0; } }); return [g, m]; }"""
        async def gl_state():
            return await pg.evaluate("({ canvases: document.querySelectorAll('canvas').length, cache: window.__foxLab.cache(), instances: window.__foxSandbox.instances().length })")
        async def cycle(n):
            for i in range(n):
                await pg.evaluate("window.__foxLab.setMounted(false)"); await pg.wait_for_timeout(150)
                await pg.evaluate("window.__foxLab.setMounted(true)")
                await pg.wait_for_function("window.__foxSandbox.instances().length >= 2", timeout=30000); await pg.wait_for_timeout(150)
        hs = await heap(cdp); l0 = await pg.evaluate(LISTENERS); g0 = await gl_state()
        WARM, CYCLES = 10, 30
        await cycle(WARM)
        h0 = await heap(cdp)
        t0 = time.time(); await cycle(CYCLES); cyc_s = time.time() - t0
        await pg.wait_for_timeout(800)
        h1 = await heap(cdp); g1 = await gl_state(); l1 = await pg.evaluate(LISTENERS)
        await pg.evaluate("window.__foxLab.setMounted(false)"); await pg.wait_for_timeout(300)
        g2 = await gl_state()
        R['measurements']['mount_unmount'] = {'warmup_cycles': WARM, 'measured_cycles': CYCLES, 'seconds': round(cyc_s, 1), 'heap_start_mb': round(hs / 1048576, 2), 'heap_after_warmup_mb': round(h0 / 1048576, 2), 'heap_after_mb': round(h1 / 1048576, 2),
            'heap_growth_per_cycle_kb': round((h1 - h0) / CYCLES / 1024, 1), 'shared_dispose_listeners_before': l0, 'shared_dispose_listeners_after': l1, 'before': g0, 'after': g1, 'unmounted': g2}
        check(f'{WARM + CYCLES}× mount / unmount: no leaked controllers, canvases or renderer listeners; heap flat after warm-up (< 40 KB / cycle)',
              g1['canvases'] == g0['canvases'] and g1['instances'] == g0['instances'] and l1 == l0 and (h1 - h0) / CYCLES < 40 * 1024 and g2['instances'] == 1, **R['measurements']['mount_unmount'])
        # release of the shared GLB once nobody uses it
        await pg.evaluate("window.__foxLab.setMounted(true)"); await pg.wait_for_timeout(1200)
        await pg.goto(BASE + '#/lab'); await wait_ready(pg, 2)
        await pg.evaluate("window.__foxLab.setMounted(false)"); await pg.wait_for_timeout(200)
        refs = await pg.evaluate("window.__foxLab.cache()")
        check('Shared GLB stays cached while any instance uses it (refcount)', refs and refs[0]['refs'] == 1, cache=refs)

        # ------------------------------------------------------------ 13. reduced motion (OS preference)
        rm = await browser.new_context(viewport={'width': 1400, 'height': 900}, reduced_motion='reduce')
        rp = await rm.new_page(); await rp.goto(BASE + '#/companion'); await wait_ready(rp, 1); await rp.wait_for_timeout(2500)
        res = await rp.evaluate("""async () => { const c = window.__t.ctrl('full'), wait = ms => new Promise(r => setTimeout(r, ms));
          const s = c.getState(); const tail = c.play('tail_touch'); const happy = c.handleEvent('QUEST_COMPLETED'); await wait(400);
          const wave = c.play('wave'); c.debug.anim.cancelOneShots();
          return { reduced: s.reducedMotion, look: s.lookWeight, idleVar: s.idleVariationWeight, tail, questPlay: happy.play ?? null, questSteps: happy.steps.map(x => x.kind + ':' + (x.clip || x.mood || '')), moodAfter: c.getState().mood, wave }; }""")
        R['measurements']['reduced_motion'] = res
        check('prefers-reduced-motion: look-at + idle variation off, jumps/hops replaced by face reactions, gentle clips allowed',
              res['reduced'] and res['look'] < 0.05 and res['idleVar'] < 0.05 and res['tail'] == 'substituted' and res['questPlay'] is None and res['wave'] == 'played', **res)
        await rp.screenshot(path=os.path.join(OUT, 'f_06_reduced_motion.png')); await rm.close()

        # ------------------------------------------------------------ 14. GLB failure
        ep = await ctx.new_page(); await ep.goto(BASE + '?glb=./models/missing.glb#/dashboard'); await ep.wait_for_timeout(3000)
        fb = await ep.evaluate("[...document.querySelectorAll('.fox-fallback')].map(e => e.dataset.reason)")
        btn = await ep.locator('text=Thử lại').count()
        check('Missing GLB → poster fallback with "Thử lại", page keeps working', len(fb) >= 1 and all(r == 'load' for r in fb) and btn >= 1, fallbacks=fb, retry_buttons=btn)
        await ep.screenshot(path=os.path.join(OUT, 'f_07_glb_error.png')); await ep.close()

        # ------------------------------------------------------------ 15. mobile layout (viewport only)
        mp = await browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        mpage = await mp.new_page(); await mpage.goto(BASE + '#/dashboard'); await wait_ready(mpage, 2); await mpage.wait_for_timeout(2500)
        await mpage.screenshot(path=os.path.join(OUT, 'f_08_mobile_viewport_dashboard.png'))
        await mpage.evaluate("document.querySelector('[data-presentation=mini]').scrollIntoView({block: 'center'})"); await mpage.wait_for_timeout(1500)
        tap = await mpage.evaluate("window.__t.headPoint('mini')")
        await mpage.evaluate("window.__t.hold('mini')")
        await mpage.touchscreen.tap(tap[0], tap[1])
        ms = await mpage.evaluate("window.__t.step('mini', 0.1)")
        check('Touch tap on the head (emulated mobile viewport) → head_pet', ms['oneShot'] == 'head_pet', oneShot=ms['oneShot'])
        await mp.close()

        check('No page errors / console errors during the run', not errors, errors=errors[:10])
        await browser.close()

    # ------------------------------------------------------------ 16. WebGL unavailable (real: 3D APIs disabled)
    async with async_playwright() as pw:
        b2 = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--disable-3d-apis', '--disable-gpu', '--disable-software-rasterizer'])
        p2 = await b2.new_page(viewport={'width': 1400, 'height': 900}); errs = []
        p2.on('pageerror', lambda e: errs.append(str(e)))
        await p2.goto(BASE + '#/dashboard'); await p2.wait_for_timeout(2500)
        fb = await p2.evaluate("[...document.querySelectorAll('.fox-fallback')].map(e => e.dataset.reason)")
        cv = await p2.evaluate("document.querySelectorAll('canvas').length")
        check('WebGL unavailable (Chrome --disable-3d-apis) → static poster, no canvas, no crash', len(fb) == 2 and all(r == 'webgl' for r in fb) and cv == 0 and not errs, fallbacks=fb, canvases=cv, errors=errs)
        await p2.screenshot(path=os.path.join(OUT, 'f_09_no_webgl.png'))
        await b2.close()

    n = len(R['checks']); ok = sum(c['pass'] for c in R['checks'])
    R['summary'] = f'{ok}/{n} PASS'
    print(R['summary'])
    json.dump(R, open(os.path.join(OUT, 'companion_runtime_report_f.json'), 'w'), indent=2, default=str)
    return 0 if ok == n else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
