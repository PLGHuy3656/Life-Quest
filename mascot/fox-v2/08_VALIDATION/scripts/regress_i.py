"""Gate I — re-run the approved E2 / F / G1.1 / G2.1 / G3 / H1 / H2 suites against the Gate I runtime, unchanged.

Serves 07_WEB_PREVIEW/companion_sandbox_i/dist with module filters so each legacy suite sees its exact expected clip count:
    127.0.0.1:4260  companion_sandbox_i/dist (full 58 clips — Gate I + H1 + H2)
    127.0.0.1:4261  filter ['g1_quest_reward_streak'] (F + G1.1)
    127.0.0.1:4262  filter ['g1_quest_reward_streak', 'g2_daily_life'] (G2.1)
    127.0.0.1:4263  filter ['g1_quest_reward_streak', 'g2_daily_life', 'g3_challenge_social'] (G3 = 50 clips)
"""
import http.server
import json
import os
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUTROOT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i')

FULL = 'http://127.0.0.1:4260/index.html'
G1SET = 'http://127.0.0.1:4261/index.html'
G2SET = 'http://127.0.0.1:4262/index.html'
G3SET = 'http://127.0.0.1:4263/index.html'

SUITES = {
    'e2': ('browser_anim_test_e2.py', ['--three-dir', os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_i', 'node_modules', 'three')], None,
           {'runtime_e2': 'runtime_i/regress_e2'}),
    'f_fallback': ('browser_companion_regress_g1_1.py', ['--mode', 'fallback'], G1SET, {'runtime_g1_1': 'runtime_i/regress_f_fallback'}),
    'f_g1': ('browser_companion_regress_g1_1.py', ['--mode', 'g1'], G1SET, {'runtime_g1_1': 'runtime_i/regress_f_g1'}),
    'g1_1': ('browser_g1_1_test.py', [], G1SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'regress_g1_1')"}),
    'g2_1': ('browser_g2_1_test.py', [], G2SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2_1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'regress_g2_1')"}),
    'g3': ('browser_g3_test.py', [], G3SET, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g3')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'regress_g3')"}),
    'h1': ('browser_h1_test.py', [], FULL, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'regress_h1')"}),
    'h2': ('browser_h2_test.py', [], FULL, {"RAW:OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_h2')": "OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'regress_h2')"}),
}


def run(name):
    script, args, url, redirect = SUITES[name]
    src = open(os.path.join(HERE, script)).read()
    for a, b in redirect.items():
        if a.startswith('RAW:'):
            src = src.replace(a[4:], b)
            continue
        src = src.replace(f"'{a}'", f"'{b}'").replace(f'"{a}"', f'"{b}"').replace(f'{a}/', f'{b}/')
    tmp = os.path.join(HERE, f'_regress_i_{name}.py')
    open(tmp, 'w').write(src)
    env = dict(os.environ)
    if url:
        env['FOX_SANDBOX_URL'] = url
    t0 = time.time()
    p = subprocess.run([sys.executable, tmp, *args], cwd=ROOT, env=env, capture_output=True, text=True)
    os.remove(tmp)
    tail = [l for l in p.stdout.splitlines() if l.strip()][-3:]
    fails = [l[:300] for l in p.stdout.splitlines() if l.startswith('FAIL')]
    return {
        'suite': name, 'script': script, 'args': args, 'url': url or 'static E2 viewer',
        'exit': p.returncode, 'summary': tail, 'fails': fails,
        'seconds': round(time.time() - t0), 'stderr_tail': p.stderr.strip().splitlines()[-3:],
    }


def _start_servers():
    dist = os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_i', 'dist')
    tmp_root = tempfile.mkdtemp(prefix='fox_i_reg_')
    dirs = {4260: dist}
    for port, flt in (
        (4261, ['g1_quest_reward_streak']),
        (4262, ['g1_quest_reward_streak', 'g2_daily_life']),
        (4263, ['g1_quest_reward_streak', 'g2_daily_life', 'g3_challenge_social']),
    ):
        d = os.path.join(tmp_root, f'dist_{port}')
        os.makedirs(d, exist_ok=True)
        for name in os.listdir(dist):
            src, dst = os.path.join(dist, name), os.path.join(d, name)
            if name == 'index.html':
                html = open(src, encoding='utf-8').read()
                inj = f'<script>window.__foxModuleFilter ??= {json.dumps(flt)};</script>'
                open(dst, 'w', encoding='utf-8').write(html.replace('<head>', '<head>' + inj, 1))
            else:
                os.symlink(src, dst)
        dirs[port] = d

    servers = []
    for port, directory in dirs.items():
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *a, _dir=directory, **kw):
                super().__init__(*a, directory=_dir, **kw)
            def log_message(self, *a):
                pass
        socketserver.TCPServer.allow_reuse_address = True
        srv = socketserver.TCPServer(('127.0.0.1', port), QuietHandler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        servers.append(srv)
    return servers, tmp_root


if __name__ == '__main__':
    args = sys.argv[1:]
    serve = '--serve' in args
    names = [a for a in args if a != '--serve'] or list(SUITES)
    servers, tmp_root = (_start_servers() if serve else ([], None))
    try:
        os.makedirs(OUTROOT, exist_ok=True)
        out = os.path.join(OUTROOT, 'regressions_i.json')
        res = json.load(open(out)) if os.path.exists(out) else {}
        for n in names:
            r = run(n)
            res[n] = r
            print(n, 'exit', r['exit'], r['summary'][-1] if r['summary'] else '', *r['fails'], sep='\n  ', flush=True)
            json.dump(res, open(out, 'w'), indent=2)
    finally:
        for s in servers:
            s.shutdown()
        if tmp_root:
            shutil.rmtree(tmp_root, ignore_errors=True)
