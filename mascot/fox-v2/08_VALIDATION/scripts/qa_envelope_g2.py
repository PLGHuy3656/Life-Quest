"""Gate G2 — deformation acceptance: every G2 metric must stay inside the envelope already approved
in Gates E2, G1 and G1.1 (per-metric maximum over all approved E2 + G1 clips, mirrored left / right — the rig
and mesh are symmetric, so an arm limit approved on one side is the limit for both).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/qa_envelope_g2.py
Reads   04_ANIMATIONS/anim_metrics_e2.json, g1_quest_reward_streak/anim_metrics_g1.json, g1_1_cinematic_polish/anim_metrics_g1_1.json (approved, read only)
        04_ANIMATIONS/g2_daily_life/anim_metrics_g2.json
Writes  08_VALIDATION/runtime_g2/deformation_envelope_g2.json   (exit code 1 on any failure)
Hard rules: start / end pose exact (≤ 0.01° / 0.01 mm against the declared start_pose / end_pose),
seamless loop, no foot sliding on grounded frames, no sole below the ground, no new scarf-in-body or
tail-in-body vertices.
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
E2 = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'anim_metrics_e2.json')))['clips']
G1 = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'g1_quest_reward_streak', 'anim_metrics_g1.json')))['clips']
G11 = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'g1_1_cinematic_polish', 'anim_metrics_g1_1.json')))['clips']
G2 = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'g2_daily_life', 'anim_metrics_g2.json')))['clips']


def mirror(k):
    return k.replace('_L', '_#').replace('_R', '_#')


def flat(c):
    out = {k: c.get(k, 0) for k in ('scarf_new_in_head', 'scarf_max_depth_mm', 'scarf_in_head_max_depth_mm', 'tail_max_depth_mm',
                                    'arm_new_in_head', 'arm_in_head_max_depth_mm')}
    for grp in ('stretch_p99_max', 'detached_root_verts', 'detached_root_max_out_mm'):
        for m, v in c[grp].items():
            out[f'{grp}.{m}'] = v
    return out


env, src = {}, {}
for gate, clips in (('E2', E2), ('G1', G1), ('G1.1', G11)):
    for n, c in clips.items():
        for k, v in flat(c).items():
            if v >= env.get(mirror(k), -1):
                env[mirror(k)], src[mirror(k)] = v, f'{gate}:{n}'
report, ok = {'envelope_from': 'all approved E2 + G1 + G1.1 clips, mirrored L/R', 'envelope': env, 'envelope_source': src, 'clips': {}}, True
for n, c in G2.items():
    fails = [{'metric': k, 'g2': v, 'approved_max': env[mirror(k)], 'approved_in': src[mirror(k)]}
             for k, v in flat(c).items() if v > env.get(mirror(k), 0) + 1e-9]
    hard = {'no_scarf_in_body': c['scarf_new_in_body'] == 0, 'no_tail_in_body': c['tail_new_in_body'] == 0,
            'sole_not_below_ground': c['sole_min_mm'] >= -0.01, 'body_not_below_ground': c.get('body_min_mm', 0) >= -0.05,
            'no_foot_slide': (c.get('foot_slide_mm_per_frame', {}).get('max') or 0) <= 0.05}
    if 'rest_match' in c:
        rm = c['rest_match']
        hard['start_end_pose_exact'] = max(rm['start_deg/mm'] + rm['end_deg/mm']) <= 0.01
    if 'loop_seam' in c:
        hard['loop_seam_exact'] = max(c['loop_seam']['pose_diff_deg'], c['loop_seam']['pose_diff_mm']) <= 0.01
    passed = not fails and all(hard.values())
    ok &= passed
    report['clips'][n] = {'pass': passed, 'envelope_failures': fails, 'hard_rules': hard}
    print(f'{n:24s} {"PASS" if passed else "FAIL"}  {[(f["metric"], f["g2"], f["approved_max"]) for f in fails]}  {[k for k, v in hard.items() if not v]}')
report['pass'] = bool(ok)
os.makedirs(os.path.join(ROOT, '08_VALIDATION', 'runtime_g2'), exist_ok=True)
json.dump(report, open(os.path.join(ROOT, '08_VALIDATION', 'runtime_g2', 'deformation_envelope_g2.json'), 'w'), indent=1)
sys.exit(0 if ok else 1)
