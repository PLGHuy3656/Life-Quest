"""Gate D1.1 — load the GLB in a real browser (Google Chrome, WebGL) and run the viewer's checks.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/browser_rig_test.py [--three-dir PATH_TO_node_modules/three]
Serves the project folder over HTTP, opens 07_WEB_PREVIEW/rig_test.html in
headless Chrome (ANGLE/SwiftShader WebGL), calls window.runChecks(), captures
screenshots of rest / expressions / head turn / tail sway / scale, and writes
08_VALIDATION/runtime/rig_runtime_report.json + PNGs.
If the CDN is unreachable, requests to cdn.jsdelivr.net/npm/three@0.170.0/ are
answered from a local copy of the SAME npm package version (--three-dir).
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
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime')
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
    url = f'http://127.0.0.1:{srv.server_address[1]}/07_WEB_PREVIEW/rig_test.html'
    console, routed = [], {'count': 0}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chrome, headless=True,
                                    args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        page = browser.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        page.on('console', lambda m: console.append(f'{m.type}: {m.text}'))
        page.on('pageerror', lambda e: console.append(f'pageerror: {e}'))

        def route(r):
            rel = r.request.url[len(CDN):]
            path = os.path.join(args.three_dir, rel)
            if os.path.isfile(path):
                routed['count'] += 1
                r.fulfill(path=path, content_type='application/javascript')
            else:
                r.abort()
        page.route(CDN + '**', route)
        page.goto(url)
        page.wait_for_function('window.__foxReady === true', timeout=120000)
        info = page.evaluate("""() => { const gl = document.createElement('canvas').getContext('webgl2');
            const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
            return { userAgent: navigator.userAgent, webgl2: !!gl,
                     renderer: gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : null }; }""")
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(OUT, 'rt_01_loaded_ui.png'))
        report = page.evaluate('window.runChecks()')
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(OUT, 'rt_02_checks_ui.png'))

        def shot(name, js, wait=400, clip=True):
            page.evaluate(js)
            page.wait_for_timeout(wait)
            box = page.locator('#view').bounding_box() if clip else None
            page.screenshot(path=os.path.join(OUT, name), clip=box)

        cam = """(az, tx, ty, tz, d, h) => { const F = window.__fox; F.mixer.stopAllAction();
            const r = d; F.camera.position.set(tx + r * Math.sin(az), ty + h, tz + r * Math.cos(az));
            F.controls.target.set(tx, ty, tz); F.controls.update(); }"""
        page.evaluate(f'window.__cam = {cam}')
        shot('rt_10_rest_front.png', "window.__fox.setScale(1); window.__fox.setExpression('neutral'); window.__cam(0,0,0.5,0,2.6,0.1)")
        shot('rt_11_rest_34.png', "window.__cam(0.65,0,0.5,0,2.6,0.25)")
        shot('rt_12_rest_back.png', "window.__cam(Math.PI,0,0.5,0,2.6,0.2)")
        for e in ['neutral', 'blink', 'happy', 'proud', 'sad', 'surprised', 'sleepy']:
            shot(f'rt_2_expr_{e}.png', f"window.__cam(0,0,0.62,0,1.2,0); window.__fox.setExpression('{e}')", wait=250)
        page.evaluate("window.__fox.setExpression('neutral')")
        for f in (12, 36, 56):
            shot(f'rt_3_headturn_f{f}.png', f"window.__cam(0.4,0,0.5,0,2.6,0.2); (() => {{ const F = window.__fox; F.mixer.stopAllAction(); const a = F.actions['fox_head_turn_test']; a.reset().play(); F.mixer.setTime({f}/24); a.paused = true; }})()")
        for f in (13, 37):
            shot(f'rt_4_tail_f{f}.png', f"window.__cam(Math.PI,0,0.4,0,2.6,0.2); (() => {{ const F = window.__fox; F.mixer.stopAllAction(); const a = F.actions['fox_tail_sway_test']; a.reset().play(); F.mixer.setTime({f}/24); a.paused = true; }})()")
        shot('rt_5_blink_f9.png', "window.__cam(0,0,0.62,0,1.2,0); (() => { const F = window.__fox; F.mixer.stopAllAction(); const a = F.actions['fox_blink_test']; a.reset().play(); F.mixer.setTime(9/24); a.paused = true; })()")
        for s in (0.8, 1.1):
            shot(f'rt_6_scale_{s}.png', f"window.__fox.mixer.stopAllAction(); window.__fox.setScale({s}); window.__cam(0,0,0.5,0,2.6,0.1)")
        page.evaluate("window.__fox.setScale(1); Object.values(window.__fox.actions).forEach(a => a.paused = false)")
        perf = page.evaluate("""() => new Promise(res => { const F = window.__fox; F.play('fox_idle_test', 0); let n = 0; const t0 = performance.now();
            function tick() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res({ frames: n, seconds: (performance.now() - t0) / 1000 }); }
            requestAnimationFrame(tick); })""")
        browser.close()
    srv.shutdown()
    summary = {
        'page': '07_WEB_PREVIEW/rig_test.html', 'glb': '06_EXPORTS/glb/fox_v2_rig_test.glb',
        'browser': info, 'three_cdn_routed_to_local_npm_copy': routed['count'] > 0, 'routed_requests': routed['count'],
        'checks': report, 'passed': sum(1 for r in report if r['status'] == 'PASS'),
        'failed': [r['name'] for r in report if r['status'] == 'FAIL'],
        'console': console,
        'idle_playback_fps_headless_swiftshader': round(perf['frames'] / perf['seconds'], 1),
    }
    json.dump(summary, open(os.path.join(OUT, 'rig_runtime_report.json'), 'w'), indent=2)
    print(json.dumps({k: summary[k] for k in ('browser', 'passed', 'failed', 'idle_playback_fps_headless_swiftshader')}, indent=1))
    for r in report:
        print(f"{r['status']:5} {r['name']} — {r['detail'][:150]}")
    print('console:', console[:8])


if __name__ == '__main__':
    main()
