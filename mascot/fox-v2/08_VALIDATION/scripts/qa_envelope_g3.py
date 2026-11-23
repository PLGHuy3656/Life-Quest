"""Gate G3 — deformation acceptance of the challenge / duo-group / social clips (same rules as G2.1, no new exception).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/qa_envelope_g3.py
Reads   approved metrics (read only): 04_ANIMATIONS/anim_metrics_e2.json, g1_quest_reward_streak/anim_metrics_g1.json,
        g1_1_cinematic_polish/anim_metrics_g1_1.json; their visible-edge re-measurement in 08_VALIDATION/runtime_g2_1/diag/;
        04_ANIMATIONS/g3_challenge_social/anim_metrics_g3.json
Writes  08_VALIDATION/runtime_g3/deformation_envelope_g3.json (exit code 1 if the RAW check fails anywhere)

The approved envelope is E2 + G1 + G1.1 only: the G2.1 hidden-leg exceptions are NOT part of it, so a G3 clip can only pass RAW
without relying on them.

Two verdicts per clip, both reported:
  RAW (unchanged rule of qa_envelope_g1_1 / qa_envelope_g2): every metric ≤ the approved E2 + G1 + G1.1 maximum (mirrored L/R) and
  every hard rule (exact start / end pose, seamless loop, no foot slide on standing frames, nothing below the floor, no scarf- or
  tail-in-body).
  VISIBLE (added in G2.1, justified in deformation_report_g2_1.md): identical, except that EDGE STRETCH is measured only on edges with a
  visible endpoint (outside the opaque torso and head by > 1 mm), against the approved clips measured the SAME way. Penetration,
  detachment, foot and pose rules are the same as RAW. This only differs from RAW where stretched edges are hidden inside the torso.
"""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
J = lambda *p: json.load(open(os.path.join(ROOT, *p)))['clips']
APPROVED = {'E2': J('04_ANIMATIONS', 'anim_metrics_e2.json'), 'G1': J('04_ANIMATIONS', 'g1_quest_reward_streak', 'anim_metrics_g1.json'),
            'G1.1': J('04_ANIMATIONS', 'g1_1_cinematic_polish', 'anim_metrics_g1_1.json')}
APPROVED_VIS = {g: J('08_VALIDATION', 'runtime_g2_1', 'diag', f'metrics_{f}_approved.json') for g, f in (('E2', 'e2'), ('G1', 'g1'), ('G1.1', 'g1_1'))}
G21 = J(*os.environ.get('FOX_METRICS', '04_ANIMATIONS/g3_challenge_social/anim_metrics_g3.json').split('/'))
mirror = lambda k: k.replace('_L', '_#').replace('_R', '_#')
PEN = ('scarf_new_in_head', 'scarf_max_depth_mm', 'scarf_in_head_max_depth_mm', 'tail_max_depth_mm', 'arm_new_in_head', 'arm_in_head_max_depth_mm')


def flat(c, vis=False):
    out = {k: c.get(k, 0) for k in PEN}
    for grp in (('vis_stretch_p99_max',) if vis else ('stretch_p99_max',)) + ('detached_root_verts', 'detached_root_max_out_mm'):
        for m, v in c.get(grp, {}).items():
            out[f'{grp.replace("vis_", "")}.{m}'] = v
    return out


def envelope(sets, vis):
    env, src = {}, {}
    for gate, clips in sets.items():
        for n, c in clips.items():
            for k, v in flat(c, vis).items():
                if v >= env.get(mirror(k), -1):
                    env[mirror(k)], src[mirror(k)] = v, f'{gate}:{n}'
    return env, src


ENV, SRC = envelope(APPROVED, False)
ENVV, SRCV = envelope(APPROVED_VIS, True)
rep = {'raw_envelope': ENV, 'raw_source': SRC, 'visible_envelope': ENVV, 'visible_source': SRCV, 'clips': {}}
ok_raw = ok_vis = True
for n, c in G21.items():
    hard = {'no_scarf_in_body': c['scarf_new_in_body'] == 0, 'no_tail_in_body': c['tail_new_in_body'] == 0,
            'sole_not_below_ground': c['sole_min_mm'] >= -0.01, 'body_not_below_ground': c.get('body_min_mm', 0) >= -0.05,
            'no_foot_slide': (c.get('foot_slide_mm_per_frame', {}).get('max') or 0) <= 0.05}
    if 'rest_match' in c:
        rm = c['rest_match']; hard['start_end_pose_exact'] = max(rm['start_deg/mm'] + rm['end_deg/mm']) <= 0.01
    if 'loop_seam' in c:
        hard['loop_seam_exact'] = max(c['loop_seam']['pose_diff_deg'], c['loop_seam']['pose_diff_mm']) <= 0.01
    fr = [{'metric': k, 'g3': v, 'approved_max': ENV[mirror(k)], 'approved_in': SRC[mirror(k)]} for k, v in flat(c).items() if v > ENV.get(mirror(k), 0) + 1e-9]
    fv = [{'metric': k, 'g3': v, 'approved_max': ENVV.get(mirror(k), 0), 'approved_in': SRCV.get(mirror(k))} for k, v in flat(c, True).items() if v > ENVV.get(mirror(k), 0) + 1e-9]
    pr, pv = not fr and all(hard.values()), not fv and all(hard.values())
    ok_raw &= pr; ok_vis &= pv
    rep['clips'][n] = {'raw_pass': pr, 'visible_pass': pv, 'raw_failures': fr, 'visible_failures': fv, 'hard_rules': hard}
    print(f'{n:24s} RAW {"PASS" if pr else "FAIL"}  VISIBLE {"PASS" if pv else "FAIL"}  raw:{[(f["metric"], f["g3"], f["approved_max"]) for f in fr]}  vis:{[(f["metric"], f["g3"], f["approved_max"]) for f in fv]}  hard:{[k for k, v in hard.items() if not v]}')
rep['raw_pass'], rep['visible_pass'] = ok_raw, ok_vis
os.makedirs(os.path.join(ROOT, '08_VALIDATION', 'runtime_g3'), exist_ok=True)
json.dump(rep, open(os.path.join(ROOT, '08_VALIDATION', 'runtime_g3', os.environ.get('FOX_ENV_OUT', 'deformation_envelope_g3.json')), 'w'), indent=1)
print('RAW', 'PASS' if ok_raw else 'FAIL', '| VISIBLE', 'PASS' if ok_vis else 'FAIL')
sys.exit(0 if ok_raw else 1)
