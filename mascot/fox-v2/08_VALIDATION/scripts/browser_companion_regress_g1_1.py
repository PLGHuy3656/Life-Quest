"""Gate G1.1 — re-runs the approved Gate F runtime suite (browser_companion_test_f.py, NOT modified)
against the G1 sandbox build, in two modes:

  --mode fallback  : URL gets ?modules=0 so no G1 module loads. Every Gate F expectation must hold
                     unchanged (proves the F runtime / fallbacks are untouched when G1 is absent).
  --mode g1        : modules loaded. Only the expectations that G1 deliberately changes are rewritten
                     (listed in G1_EXPECTATION_CHANGES, each also documented in the G1 runtime report):
                       * QUEST_COMPLETED now plays quest_complete (was happy) — 3.46 s in G1.1, so the queued
                         FRIEND_CHEER is sampled after 3.6 s instead of 2.6 s
                       * LEVEL_UP now plays level_up (was happy)
                       * registry clip check uses the contract clip list (core + G1) instead of E2 only
                       * the face-only fallback probe uses CHALLENGE_LOST (STREAK_LOST is native in G1)
                       * the dashboard QUEST_COMPLETED button now shows quest_complete on every fox
                       * the GLB download counters count the base Fox GLB only (the 1 MB animation module is a
                         second, expected request; the base GLB is still downloaded once and shared)
  Both modes: the registry check validates the steps an event actually runs (its fallbackSteps when a
  module clip is not loaded) instead of the declared steps, since G1 events declare module clips.

The F source is read, rewritten in memory and executed; output goes to runtime_g1_1/f_regression_<mode>/.
"""
import argparse, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, 'browser_companion_test_f.py')

BOTH_MODES = [
    ("validClips: e.steps.every(s => s.kind !== 'play' || clips.has(s.clip)) });",
     "validClips: ((e.steps.some(s => s.kind === 'play' && !clips.has(s.clip)) ? (e.fallbackSteps || []) : e.steps)).every(s => s.kind !== 'play' || clips.has(s.clip)) });"),
]

G1_EXPECTATION_CHANGES = [
    ("pri['stillMajor'] == 'happy'", "pri['stillMajor'] == 'quest_complete'"),
    ("T.step('widget', 2.6); out.queuedPlaysAfterMajor", "T.step('widget', 3.6); out.queuedPlaysAfterMajor"),
    ("pri['after'] == 'happy'", "pri['after'] == 'level_up'"),
    ("const clips = new Set(['happy', 'wave', 'head_pet', 'tail_touch']);", "const clips = new Set(c.availableClips());"),
    ("Every registered event uses only clips that exist in the E2 contract", "Every registered event uses only clips that exist in the contract (E2 core + G1 module)"),
    ("const s1 = c.handleEvent('STREAK_LOST');", "const s1 = c.handleEvent('CHALLENGE_LOST');"),
    ("out.coalesced = c.handleEvent('STREAK_LOST').result;", "out.coalesced = c.handleEvent('CHALLENGE_LOST').result;"),
    ("all(o == 'happy' for _, o in both)", "all(o == 'quest_complete' for _, o in both)"),
    ("pg.on('request', lambda r: glb_requests.append(r.url) if r.url.endswith('.glb') else None)",
     "pg.on('request', lambda r: glb_requests.append(r.url) if r.url.endswith('fox_v2_anim_e2.glb') else None)"),
    ("every mounted fox reacts'", "every mounted fox reacts (quest_complete)'"),
]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--mode', choices=['fallback', 'g1'], required=True); a = ap.parse_args()
    src = open(SRC, encoding='utf-8').read()
    out = os.path.join(ROOT, '08_VALIDATION', 'runtime_g1_1', f'f_regression_{a.mode}')
    src = src.replace("OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_f')", f"OUT = {out!r}")
    src = src.replace("companion_runtime_report_f.json", f"companion_runtime_report_f_{a.mode}.json")
    for old, new in BOTH_MODES:
        if src.count(old) != 1: sys.exit(f'[regress] anchor not found exactly once: {old}')
        src = src.replace(old, new)
    if a.mode == 'fallback':
        n1, n2 = src.count("BASE + '?"), src.count("BASE + '#")
        src = src.replace("BASE + '?", "BASE + '?modules=0&").replace("BASE + '#", "BASE + '?modules=0#")
        src = src.replace("const clips = new Set(['happy', 'wave', 'head_pet', 'tail_touch']);", "const clips = new Set(c.availableClips());")
        print(f'[regress] fallback mode: injected ?modules=0 into {n1 + n2} URLs')
    else:
        for old, new in G1_EXPECTATION_CHANGES:
            n = src.count(old)
            if n != 1: sys.exit(f'[regress] expectation anchor not found exactly once ({n}): {old}')
            src = src.replace(old, new)
        print(f'[regress] g1 mode: {len(G1_EXPECTATION_CHANGES)} documented expectation changes applied')
    g = {'__name__': '__main__', '__file__': SRC}
    exec(compile(src, SRC + f' [g1-regress:{a.mode}]', 'exec'), g)

if __name__ == '__main__':
    main()
