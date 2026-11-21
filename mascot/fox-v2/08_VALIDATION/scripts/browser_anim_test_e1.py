"""Gate E1 — interactive GLB test in a real browser (Google Chrome, WebGL) with REAL pointer input.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/browser_anim_test_e1.py [--three-dir PATH_TO_node_modules/three]
Serves the project folder over HTTP, opens 07_WEB_PREVIEW/fox_interactive_e1.html in headless
Chrome, runs window.runChecks() and then drives the page with Playwright's mouse (real
pointermove / pointerdown / pointerup events dispatched by the browser — no synthetic calls):
hover head / tail / body, click head, stroke head, click tail, look-at by moving the mouse,
priority while a clip owns the head, orbit drag, UI buttons (base loop, one-shot, expression,
level scale).  Time is stepped deterministically (window.__fox.step) so results do not depend on
the software-rendered frame rate.  Writes 08_VALIDATION/runtime_e1/anim_runtime_report.json + PNGs.
If the CDN is unreachable, cdn.jsdelivr.net/npm/three@0.170.0/ is answered from a local copy of the
SAME npm package version.
"""
import argparse
import functools
import http.server
import json
import os
import threading

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_e1')
CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/'


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--three-dir', default='/home/claude/work/web/node_modules/three')
    ap.add_argument('--chrome', default='/usr/bin/google-chrome')
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    srv = serve()
    url = f'http://127.0.0.1:{srv.server_address[1]}/07_WEB_PREVIEW/fox_interactive_e1.html'
    console, routed = [], {'count': 0}
    tests = []

    def rec(name, ok, detail):
        tests.append({'name': name, 'status': 'PASS' if ok else 'FAIL', 'detail': detail})
        print(('PASS ' if ok else 'FAIL ') + name + ' — ' + str(detail), flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chrome, headless=True,
                                    args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        page = browser.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        page.on('console', lambda m: console.append(f'{m.type}: {m.text}'))
        page.on('pageerror', lambda e: console.append(f'pageerror: {e}'))

        def route(r):
            path = os.path.join(args.three_dir, r.request.url[len(CDN):])
            if os.path.isfile(path):
                routed['count'] += 1
                r.fulfill(path=path, content_type='application/javascript')
            else:
                r.abort()
        page.route(CDN + '**', route)
        page.goto(url)
        page.wait_for_function('window.__foxReady === true', timeout=180000)
        info = page.evaluate("""() => { const gl = document.createElement('canvas').getContext('webgl2');
            const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
            return { userAgent: navigator.userAgent, webgl2: !!gl,
                     renderer: gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : null }; }""")
        # real-time frames first, so the HUD statistics are populated by the live loop
        page.wait_for_timeout(2500)
        stats_text = page.evaluate("document.getElementById('hud').textContent")
        page.screenshot(path=os.path.join(OUT, 'e1_01_loaded_ui.png'))

        page.evaluate('window.__fox.st.manual = true')
        report = page.evaluate('window.runChecks()')
        page.screenshot(path=os.path.join(OUT, 'e1_02_checks_ui.png'))
        view = page.locator('#view').bounding_box()

        def steps(n, dt=1 / 60):
            page.evaluate(f'(() => {{ for (let i = 0; i < {n}; i++) window.__fox.step({dt}); }})()')

        def st(expr):
            return page.evaluate(f'(() => {{ const F = window.__fox, S = F.st; return {expr}; }})()')

        def proj(js_obj):
            return page.evaluate(f'(() => {{ const F = window.__fox; return F.project({js_obj}); }})()')

        def tail_px():   # a screen point on the VISIBLE tail surface (sampled from the real tail mesh)
            return page.evaluate('''(() => { const F = window.__fox, r = F.renderer.domElement.getBoundingClientRect(); const v = F.visibleTailPoint();
                return [r.left + (v.ndc[0] + 1) / 2 * r.width, r.top + (1 - v.ndc[1]) / 2 * r.height]; })()''')

        def shot(name):
            page.wait_for_timeout(150)
            page.screenshot(path=os.path.join(OUT, name), clip=view)

        def reset():
            page.evaluate("""(() => { const F = window.__fox; F.setScale(1); F.setExpression('neutral'); F.setBase('idle');
                for (let i = 0; i < 400 && F.st.shot; i++) F.step(1 / 60); for (let i = 0; i < 40; i++) F.step(1 / 60); })()""")

        reset()
        page.mouse.move(view['x'] + 5, view['y'] + view['height'] - 5)
        steps(30)
        # ---------------------------------------------------------------- hover (real pointermove)
        head = proj('F.proxies.head')
        page.mouse.move(*head)
        steps(12)
        h = st("({ hover: S.hover, cursor: F.renderer.domElement.style.cursor, tag: document.getElementById('tag').textContent })")
        page.evaluate("document.getElementById('proxies').click()")
        steps(1)
        shot('e1_10_hover_head.png')
        tail = tail_px()
        page.mouse.move(*tail)
        steps(12)
        t = st("({ hover: S.hover, cursor: F.renderer.domElement.style.cursor })")
        shot('e1_11_hover_tail.png')
        belly = proj("F.bones.HIPS.getWorldPosition(new F.THREE.Vector3()).add(new F.THREE.Vector3(0, 0.05, 0.16))")
        page.mouse.move(*belly)
        steps(12)
        b = st("({ hover: S.hover, cursor: F.renderer.domElement.style.cursor })")
        page.evaluate("document.getElementById('proxies').click()")
        rec('hover detection via raycast (real pointer moves)',
            h['hover'] == 'head' and h['cursor'] == 'grab' and t['hover'] == 'tail' and t['cursor'] == 'pointer' and b['hover'] == 'none',
            f"head → {h['hover']} (cursor {h['cursor']}, tag '{h['tag']}'), tail → {t['hover']} (cursor {t['cursor']}), belly → {b['hover']}")
        # ---------------------------------------------------------------- click head
        reset()
        head = proj('F.proxies.head')
        page.mouse.move(*head)
        steps(4)
        page.mouse.click(*head)
        steps(1)
        c1 = st("({ shot: S.shot, trig: S.lastTrigger })")
        steps(40)
        mid = st("({ w: F.weightOf('head_pet'), look: S.look.w })")
        shot('e1_20_click_head_pet.png')
        for _ in range(20):
            if not st('S.shot'):
                break
            steps(30)
        end = st("({ shot: S.shot, idle: F.weightOf('idle') })")
        rec('click on the head → head_pet, then back to idle', c1['shot'] == 'head_pet' and mid['w'] > 0.99 and end['shot'] is None and end['idle'] > 0.99,
            f"after click: {c1['trig']}; mid-clip weight {mid['w']:.2f}, look weight {mid['look']:.3f}; afterwards idle weight {end['idle']:.2f}")
        # ---------------------------------------------------------------- stroke head (pet gesture)
        reset()
        head = proj('F.proxies.head')
        page.mouse.move(head[0] - 30, head[1] - 20)
        steps(3)
        page.mouse.down()
        for k in range(12):
            page.mouse.move(head[0] - 30 + k * 6, head[1] - 20 + (k % 2) * 3)
        s1 = st("({ shot: S.shot, trig: S.lastTrigger, orbit: F.controls.enabled })")
        page.mouse.up()
        rec('stroking the head (drag across it) → head_pet; camera does not orbit while petting',
            s1['shot'] == 'head_pet' and 'stroke' in (s1['trig'] or '') and s1['orbit'] is False,
            f"{s1['trig']}, orbit controls enabled during stroke: {s1['orbit']}")
        # ---------------------------------------------------------------- click tail
        reset()
        tail = tail_px()
        page.mouse.click(*tail)
        steps(1)
        c2 = st("({ shot: S.shot, trig: S.lastTrigger })")
        steps(20)
        shot('e1_21_click_tail_touch.png')
        steps(20)
        shot('e1_22_tail_touch_lookback.png')
        rec('click on the tail → tail_touch', c2['shot'] == 'tail_touch', f"after click: {c2['trig']}")
        # ---------------------------------------------------------------- body click / orbit drag: no trigger
        reset()
        cam0 = st('F.camera.position.toArray()')
        belly = proj("F.bones.HIPS.getWorldPosition(new F.THREE.Vector3()).add(new F.THREE.Vector3(0, 0.05, 0.16))")
        page.mouse.click(*belly)
        steps(2)
        nb = st('S.shot')
        x0, y0 = view['x'] + 120, view['y'] + 150
        page.mouse.move(x0, y0)
        page.mouse.down()
        for k in range(10):
            page.mouse.move(x0 + 12 * k, y0)
        page.mouse.up()
        steps(30)
        cam1 = st('F.camera.position.toArray()')
        moved = sum((a - b) ** 2 for a, b in zip(cam0, cam1)) ** 0.5
        rec('clicks on the body do nothing; dragging empty space orbits the camera', nb is None and moved > 0.05 and st('S.shot') is None,
            f"body click → {nb}; camera moved {moved:.2f} m by the drag, no clip triggered")
        page.evaluate("(() => { const F = window.__fox; F.camera.position.set(0.9, 0.75, 2.6); F.controls.target.set(0, 0.48, 0); F.controls.update(); })()")
        # ---------------------------------------------------------------- look-at with the real mouse
        reset()
        yaw_js = """(() => { const F = window.__fox, T = F.THREE; const qh = F.bones.HEAD.getWorldQuaternion(new T.Quaternion()),
            qs = F.bones.SPINE.getWorldQuaternion(new T.Quaternion()); const f = new T.Vector3(0, 0, 1).applyQuaternion(qs.invert().multiply(qh));
            return [T.MathUtils.radToDeg(Math.atan2(f.x, f.z)), T.MathUtils.radToDeg(Math.atan2(f.y, Math.hypot(f.x, f.z)))]; })()"""
        page.mouse.move(view['x'] + view['width'] - 4, view['y'] + view['height'] * 0.45)
        trace = []
        for _ in range(120):
            steps(1)
            trace.append(page.evaluate(yaw_js)[0])
        shot('e1_30_look_right.png')
        right = trace[-1]
        page.mouse.move(view['x'] + 4, view['y'] + view['height'] * 0.45)
        steps(120)
        left = page.evaluate(yaw_js)[0]
        shot('e1_31_look_left.png')
        page.mouse.move(view['x'] + view['width'] * 0.45, view['y'] + 4)
        steps(120)
        up = page.evaluate(yaw_js)[1]
        shot('e1_32_look_up.png')
        vel = [trace[i] - trace[i - 1] for i in range(1, len(trace))]
        acc = [vel[i] - vel[i - 1] for i in range(1, len(vel))]
        vmax, amax = max(abs(v) for v in vel), max(abs(a) for a in acc)
        rec('cursor-following head motion (real mouse), clamped and smoothly damped',
            right > 20 and left < -20 and max(abs(right), abs(left)) <= 40.5 and up <= 20.5 and vmax < 4.5 and amax < 0.8,
            f"mouse far right → head yaw {right:+.1f}°, far left → {left:+.1f}°, top → pitch {up:+.1f}° (limits ±40° / +20°); "
            f"after an ~80° target jump: peak speed {vmax:.2f}°/frame, peak acceleration {amax:.2f}°/frame² (critically damped, no velocity jump)")
        # ---------------------------------------------------------------- priority with the real mouse
        reset()
        page.mouse.click(*proj('F.proxies.head'))
        page.mouse.move(view['x'] + view['width'] - 4, view['y'] + view['height'] * 0.45)
        steps(60)
        pr = st("({ look: S.look.w, shot: S.shot, ctrl: F.control('head_control') })")
        rec('head tracking yields to a clip that controls the head (real mouse far right during head_pet)',
            pr['shot'] == 'head_pet' and pr['look'] < 0.05, f"look weight {pr['look']:.3f}, head_control {pr['ctrl']:.2f}")
        # ---------------------------------------------------------------- UI: base loops, one-shot buttons, expressions, scale
        reset()
        page.mouse.move(view['x'] + 5, view['y'] + view['height'] - 5)
        page.click('#base button[data-a="walk"]')
        steps(45)
        wk = st("({ base: S.base, w: F.weightOf('walk'), speed: S.groundSpeed })")
        shot('e1_40_walk.png')
        page.click('#base button[data-a="run"]')
        steps(45)
        rn = st("({ base: S.base, w: F.weightOf('run'), speed: S.groundSpeed })")
        shot('e1_41_run.png')
        page.click('#base button[data-a="idle"]')
        steps(30)
        page.click('#oneshot button[data-a="wave"]')
        steps(30)
        wv = st("({ shot: S.shot, w: F.weightOf('wave') })")
        shot('e1_42_wave.png')
        reset()
        page.click('#oneshot button[data-a="happy"]')
        steps(14)
        shot('e1_43_happy.png')
        reset()
        page.click('#exprs button[data-e="surprised"]')
        steps(30)
        ex = st("F.meshes.FOX_Eye_L.morphTargetInfluences[F.meshes.FOX_Eye_L.morphTargetDictionary.Wide]")
        shot('e1_44_expression_surprised.png')
        page.click('#exprs button[data-e="neutral"]')
        steps(30)
        page.evaluate("window.__fox.actions.idle.time = 0.6")   # outside the idle blinks, for a readable review image
        page.click('button[data-s="0.8"]')
        steps(2)
        s08 = st("({ s: S.scale, h: new F.THREE.Box3().setFromObject(F.root, true).getSize(new F.THREE.Vector3()).y })")
        shot('e1_45_scale_080.png')
        page.evaluate("window.__fox.actions.idle.time = 0.6")
        page.click('button[data-s="1.1"]')
        steps(2)
        s11 = st("({ s: S.scale, h: new F.THREE.Box3().setFromObject(F.root, true).getSize(new F.THREE.Vector3()).y })")
        shot('e1_46_scale_110.png')
        page.click('button[data-s="1"]')
        rec('UI: animation selector, one-shot buttons, expression controls, level scale buttons',
            wk['base'] == 'walk' and wk['w'] > 0.99 and abs(wk['speed'] - 0.22) < 0.01 and rn['w'] > 0.99 and abs(rn['speed'] - 0.4857) < 0.01
            and wv['shot'] == 'wave' and ex > 0.97 and abs(s11['h'] / s08['h'] - 1.1 / 0.8) < 0.01,
            f"walk weight {wk['w']:.2f} floor {wk['speed']:.3f} m/s · run {rn['w']:.2f} floor {rn['speed']:.3f} m/s · wave {wv['w']:.2f} · "
            f"surprised Wide {ex:.2f} · height ratio 1.1/0.8 = {s11['h'] / s08['h']:.3f}")
        rec('FPS and triangle statistics in the HUD (live loop)', 'fps' in stats_text and 'tris' in stats_text, stats_text.replace('\n', ' · '))
        errs = [c for c in console if c.startswith('error') or c.startswith('pageerror')]
        rec('no console errors during the interaction session', not errs, errs or 'none')
        browser.close()
    srv.shutdown()
    out = {'page': '07_WEB_PREVIEW/fox_interactive_e1.html', 'glb': '06_EXPORTS/glb/fox_v2_anim_e1.glb', 'browser': info,
           'three_cdn_routed_to_local_npm_copy': routed['count'] > 0, 'routed_requests': routed['count'],
           'page_checks': report, 'interaction_tests': tests,
           'passed': sum(r['status'] == 'PASS' for r in report) + sum(r['status'] == 'PASS' for r in tests),
           'failed': [r['name'] for r in report + tests if r['status'] == 'FAIL'], 'console': console[-20:]}
    json.dump(out, open(os.path.join(OUT, 'anim_runtime_report.json'), 'w'), indent=1)
    for r in report:
        print(r['status'], r['name'], '—', r['detail'][:220])
    print(json.dumps({k: out[k] for k in ('passed', 'failed')}, indent=1))


if __name__ == '__main__':
    main()
