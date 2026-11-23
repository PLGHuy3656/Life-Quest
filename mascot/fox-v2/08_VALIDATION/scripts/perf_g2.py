"""Gate G2 — performance & effect budget per scenario (idle, study + props, sports, sleep, alarm VFX, cooldown timer),
normal and low-cost effects.

Serve 07_WEB_PREVIEW/companion_sandbox_g2/dist on 127.0.0.1:4191, then:  python 08_VALIDATION/scripts/perf_g2.py
Per scenario: the state is entered through its event, settled into its loop, then 72 deterministic steps of
1/24 s are rendered. Recorded: renderer.info draw calls / triangles (sandbox stats hook), effect objects,
props, state effects, and the CPU cost of FoxController.update (performance.now around debug.step).
The WebGL renderer string is recorded: in this environment it is SwiftShader (CPU rasteriser), so NO GPU frame
rate is claimed — draw calls / triangles / object counts are exact and portable, CPU update cost is indicative.
Writes 08_VALIDATION/runtime_g2/perf_g2.json
"""
import asyncio, json, os
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2', 'perf_g2.json')
URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4191/index.html') + '?capture=1&seed=7#/g2'
SCEN = {'idle': (None, 0), 'study_props': ('STUDY_STARTED', 3.2), 'sports': ('SPORTS_STARTED', 3.4), 'sleep': ('SLEEP_ENTERED', 5.4),
        'alarm_vfx': ('ALARM_STARTED', 1.0), 'cooldown_timer': ('COOLDOWN_STARTED', 1.0)}

JS = r"""async ([ev, settle, low]) => {
  const c = window.__g2.controller(); const inst = () => (window.__foxSandbox.instances().find(x => x.presentation === 'full') || window.__foxSandbox.instances()[0]).stats;
  c.pause(); c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.debug.effects.clearProps(); c.setActivity('idle');
  c.setLowCostEffects(low); c.setLookAtEnabled(false); c.setIdleVariationEnabled(true); for (let i = 0; i < 30; i++) c.debug.step(1/24);
  if (ev) c.handleEvent(ev, ev === 'COOLDOWN_STARTED' ? { durationS: 30 } : undefined);
  for (let t = 0; t < settle; t += 1/24) c.debug.step(1/24);
  const wait = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const m = { calls: 0, tris: 0, fxObjects: 0, fxActive: 0, props: 0, stateFx: [] }; const cpu = [];
  for (let k = 0; k < 72; k++) { const t0 = performance.now(); c.debug.step(1/24); cpu.push(performance.now() - t0); await wait();
    const i = inst(), e = c.getStats().effects; m.calls = Math.max(m.calls, i.calls); m.tris = Math.max(m.tris, i.triangles);
    m.fxObjects = Math.max(m.fxObjects, e.rootObjects); m.fxActive = Math.max(m.fxActive, e.active); m.props = Math.max(m.props, e.props.length); m.stateFx = e.stateFx; }
  cpu.sort((a, b) => a - b);
  const st = c.getState(); c.debug.daily.clear(); c.setLowCostEffects(false); for (let i = 0; i < 30; i++) c.debug.step(1/24);
  return { ...m, base: st.base, cpuUpdateMs: { median: +cpu[36].toFixed(3), p95: +cpu[68].toFixed(3), max: +cpu[71].toFixed(3) } };
}"""

async def main():
    res = {'note': 'SwiftShader (CPU) WebGL: counts exact; CPU update cost indicative; no GPU FPS measured or claimed.', 'scenarios': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1300, 'height': 860}); await pg.goto(URL)
        await pg.wait_for_function("window.__g2 && window.__g2.controller()", timeout=90000); await pg.wait_for_timeout(1500)
        res['renderer'] = await pg.evaluate("""() => { const g = document.createElement('canvas').getContext('webgl2'); const d = g && g.getExtension('WEBGL_debug_renderer_info');
            return { renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a', vendor: d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : 'n/a', webgpu: !!navigator.gpu }; }""")
        res['gpu_available'] = not any(s in res['renderer']['renderer'] for s in ('SwiftShader', 'llvmpipe', 'Software'))
        for name, (ev, settle) in SCEN.items():
            for low in (False, True):
                r = await pg.evaluate(JS, [ev, settle, low]); res['scenarios'][f'{name}{"_lowcost" if low else ""}'] = r; print(name, low, json.dumps(r), flush=True)
        await pg.evaluate("() => window.__g2.controller().resume()"); await b.close()
    os.makedirs(os.path.dirname(OUT), exist_ok=True); json.dump(res, open(OUT, 'w'), indent=1); print(OUT, res['renderer'])

if __name__ == '__main__':
    asyncio.run(main())
