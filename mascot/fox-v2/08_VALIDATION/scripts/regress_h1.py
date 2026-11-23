"""Gate H1 — re-run the approved E2 / F / G1.1 / G2.1 / G3 browser suites against the H1 runtime, unchanged.

Usage (from LifeQuest_Fox_V2/), with the servers started (see BUILD_H1.md):
    127.0.0.1:4198  07_WEB_PREVIEW/companion_sandbox_h1/dist            (H1 build, all modules — G3 suite)
    127.0.0.1:4199  same dist, index.html prefixed with window.__foxModuleFilter = ['g1_quest_reward_streak']
                    (= the G1.1 module set, so the G1.1-era clip-count expectations apply unchanged)
    127.0.0.1:4200  same dist, filter ['g1_quest_reward_streak', 'g2_daily_life'] (= the G2.1 module set for the G2.1 suite)
    python 08_VALIDATION/scripts/regress_h1.py [suite …]
The approved scripts are read and executed in memory with ONLY their URL and output folder redirected
(outputs go to 08_VALIDATION/runtime_h1/regress_<suite>/); no assertion, tolerance or expectation is
edited. Approved report folders (runtime_e2, runtime_f, runtime_g1, runtime_g1_1, runtime_g2_1, runtime_g3) are never written.
"""
import json, os, runpy, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUTROOT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1')
G1SET = 'http://127.0.0.1:4199/index.html'
G2SET = 'http://127.0.0.1:4200/index.html'
FULL = 'http://127.0.0.1:4198/index.html'

# suite: (script, args, env URL, {approved output dir → redirected dir})
SUITES = {
    # the E2 viewer imports three r170 from a CDN this sandbox cannot reach; the approved script already routes it to a
    # local three@0.170.0 copy (--three-dir) — pointed at the G2 sandbox node_modules (identical version)
    'e2': ('browser_anim_test_e2.py', ['--three-dir', os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_h1', 'node_modules', 'three')], None,
           {'runtime_e2': 'runtime_h1/regress_e2'}),
    'f_fallback': ('browser_companion_regress_g1_1.py', ['--mode', 'fallback'], G1SET, {'runtime_g1_1': 'runtime_h1/regress_f_fallback'}),
    'f_g1': ('browser_companion_regress_g1_1.py', ['--mode', 'g1'], G1SET, {'runtime_g1_1': 'runtime_h1/regress_f_g1'}),
    # only the OUTPUT folder is redirected; the approved G1.1 fidelity reference is still read from runtime_g1_1
    'g1_1': ('browser_g1_1_test.py', [], G1SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regress_g1_1')"}),
    'flame_g1_1': ('flame_attach_test_g1_1.py', [], G1SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regress_flame_g1_1')",
                   # its preview video normally goes to the G1.1 previews folder: redirected too
                   'RAW:C.PREV': "os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regress_flame_g1_1')"}),
    # G2.1 suite (approved at CP-G2): only its output folder is redirected; its references (G2.1 reference poses / fidelity) are read unchanged
    'g2_1': ('browser_g2_1_test.py', [], G2SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2_1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regress_g2_1')"}),
    # G3 suite (accepted as the animation prototype): full module set, only its output folder redirected
    'g3': ('browser_g3_test.py', [], FULL, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g3')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regress_g3')"}),
}

def run(name):
    script, args, url, redirect = SUITES[name]
    src = open(os.path.join(HERE, script)).read()
    for a, b in redirect.items():
        if a.startswith('RAW:'): src = src.replace(a[4:], b); continue
        src = src.replace(f"'{a}'", f"'{b}'").replace(f'"{a}"', f'"{b}"').replace(f'{a}/', f'{b}/')
    tmp = os.path.join(HERE, f'_regress_h1_{name}.py')
    open(tmp, 'w').write(src)
    env = dict(os.environ)
    if url: env['FOX_SANDBOX_URL'] = url
    t0 = time.time()
    p = subprocess.run([sys.executable, tmp, *args], cwd=ROOT, env=env, capture_output=True, text=True)
    os.remove(tmp)
    tail = [l for l in p.stdout.splitlines() if l.strip()][-3:]
    fails = [l[:300] for l in p.stdout.splitlines() if l.startswith('FAIL')]
    return {'suite': name, 'script': script, 'args': args, 'url': url or 'project folder (static E2 viewer)', 'exit': p.returncode,
            'summary': tail, 'fails': fails, 'seconds': round(time.time() - t0), 'stderr_tail': p.stderr.strip().splitlines()[-3:]}

if __name__ == '__main__':
    names = sys.argv[1:] or list(SUITES)
    os.makedirs(OUTROOT, exist_ok=True)
    out = os.path.join(OUTROOT, 'regressions_h1.json')
    res = json.load(open(out)) if os.path.exists(out) else {}
    for n in names:
        r = run(n); res[n] = r
        print(n, 'exit', r['exit'], r['summary'][-1] if r['summary'] else '', *r['fails'], sep='\n  ')
        json.dump(res, open(out, 'w'), indent=2)
