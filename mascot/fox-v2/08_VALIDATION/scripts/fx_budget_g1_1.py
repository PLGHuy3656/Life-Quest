"""Gate G1.1 — effect budget: draw calls, triangles, particles and effect objects per clip, G1 vs G1.1.

Serve the approved G1 sandbox build on 127.0.0.1:4180 and the G1.1 build on 127.0.0.1:4190, then:
    python 08_VALIDATION/scripts/fx_budget_g1_1.py
For every clip (streak on for the streak clips) it steps the runtime at 1/24 s and records, per frame,
renderer.info.render.calls / triangles (sandbox stats hook), active effects and fx-root objects; reports the maxima.
Headless SwiftShader: counts are exact, timings are not GPU timings.
Writes 08_VALIDATION/runtime_g1_1/fx_budget_g1_1.json
"""
import asyncio, json, os
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1', 'fx_budget_g1_1.json')
BUILDS = {'G1': 'http://127.0.0.1:4180/index.html?capture=1&seed=7#/g1', 'G1.1': 'http://127.0.0.1:4190/index.html?capture=1&seed=7#/g1'}
CLIPS = ['quest_start', 'quest_complete', 'quest_failed', 'receive_xp', 'level_up', 'achievement_unlock', 'streak_active', 'streak_lost', 'streak_cheer']

JS = r"""async (clip) => {
  const c = window.__g1.controller(); const info = () => { const i = window.__foxSandbox.instances().find(x => x.presentation === 'full') || window.__foxSandbox.instances()[0]; return i.stats; };
  c.pause(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient(); c.setStreak({active: false});
  c.setLookAtEnabled(false); c.setIdleVariationEnabled(false); for (let i = 0; i < 30; i++) c.debug.step(1/24);
  if (clip.startsWith('streak')) { c.setStreak({active: true, tier: 'blue'}); for (let i = 0; i < 30; i++) c.debug.step(1/24); }
  const wait = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
  await wait(); const i0 = info(); const base = { calls: i0.calls, tris: i0.triangles };
  if (clip !== 'streak_active') c.play(clip, {priority: 60});
  const n = clip === 'streak_active' ? 48 : Math.ceil(c.debug.anim.actions[clip].getClip().duration * 24) + 6;
  const m = { calls: 0, tris: 0, fxActive: 0, fxObjects: 0 };
  for (let k = 0; k < n; k++) { c.debug.step(1/24); await wait(); const st = c.getStats().effects;
    const i = info(); m.calls = Math.max(m.calls, i.calls); m.tris = Math.max(m.tris, i.triangles);
    m.fxActive = Math.max(m.fxActive, st.active); m.fxObjects = Math.max(m.fxObjects, st.rootObjects); }
  for (let i = 0; i < 48; i++) c.debug.step(1/24); await wait();
  const after = c.getStats().effects;
  return { base, max: m, extraCalls: m.calls - base.calls, afterActive: after.active, afterObjects: after.rootObjects };
}"""

async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for name, url in BUILDS.items():
            pg = await b.new_page(viewport={'width': 1300, 'height': 860}); await pg.goto(url)
            await pg.wait_for_function("window.__g1 && window.__g1.controller()", timeout=60000); await pg.wait_for_timeout(1200)
            res[name] = {}
            for clip in CLIPS:
                res[name][clip] = await pg.evaluate(JS, clip); print(name, clip, json.dumps(res[name][clip]), flush=True)
            await pg.evaluate("() => window.__g1.controller().resume()"); await pg.close()
        await b.close()
    json.dump(res, open(OUT, 'w'), indent=1); print(OUT)

if __name__ == '__main__':
    asyncio.run(main())
