"""Gate H1 — cosmetic × animation compatibility matrix (Blender, runtime cage = subdivision off, i.e. the GLB geometry).

For every item and every clip (the 17 required clips at every 2nd frame, all other approved clips at every 4th frame)
the posed item vertices are tested against the posed Fox meshes the item could visibly intersect:
    depth(v) = distance to the nearest obstacle surface when v is INSIDE that obstacle (nearest-surface normal test),
    floor depth = max(0, -z) beyond the Fox's own deepest floor penetration in that frame (raw value also kept).
inside = majority vote (3 of 5) of ray-crossing parity along five fixed directions.
Rigidly coupled pairs (item rigid on HEAD vs FOX_Head / FOX_Tuft, both rigid on HEAD) keep their rest relation in every
frame by construction: they are measured once in the rest pose (a per-frame measurement could only add ray-parity noise).
Per (item, clip): max depth, p99 depth over all sampled item vertices × frames, the worst frame and obstacle.
Severity (fixed before measuring, not tuned): max depth < 2 mm OK · 2–8 mm MINOR · > 8 mm SEVERE.
Obstacles are the meshes that would show THROUGH the item or that the item would show through. A held item is not
tested against the paw holding it (the handle passes through the paw by design); the jacket sleeve is tested against
its own arm (an arm poking through the sleeve is exactly the clipping to catch).
Approved animation blends are opened read-only (never saved).

Usage: python 08_VALIDATION/scripts/cosmetics_matrix_h1.py   [FOX_H1_QUICK=1 → required clips only]
"""
import json
import os
import sys
import time

import bpy  # noqa: E402
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cosmetics_scene_h1 as CS  # noqa: E402

ROOT = CS.ROOT
OUT = os.path.join(ROOT, '08_VALIDATION', 'cosmetics_h1')
BLENDS = {
    'e2': os.path.join(ROOT, '04_ANIMATIONS', 'fox_anim_e2.blend'),
    'g1_1': os.path.join(ROOT, '04_ANIMATIONS', 'g1_1_cinematic_polish', 'fox_anim_g1_1.blend'),
    'g2_1': os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'fox_anim_g2_1.blend'),
    'g3': os.path.join(ROOT, '04_ANIMATIONS', 'g3_challenge_social', 'fox_anim_g3.blend'),
}
REQUIRED = {
    'e2': ['idle', 'walk', 'run', 'head_pet', 'tail_touch'],
    'g1_1': ['quest_complete', 'level_up', 'streak_active', 'streak_lost'],
    'g2_1': ['study_focus', 'sports_active', 'sleep_enter', 'sleep_loop', 'sleep_wake'],
    'g3': ['challenge_win', 'duo_celebrate', 'duo_celebrate_mirror'],
}
EXTRA = {
    'e2': ['happy', 'wave'],
    'g1_1': ['achievement_unlock', 'quest_failed', 'quest_start', 'receive_xp', 'streak_cheer'],
    'g2_1': ['alarm_ring', 'alarm_success', 'cooldown_complete', 'cooldown_wait', 'cooldown_wait_impatient', 'sports_complete',
             'sports_start', 'study_complete', 'study_start', 'wake_late', 'wake_start'],
    'g3': ['challenge_accept', 'challenge_draw', 'challenge_invite', 'challenge_lose', 'challenge_start', 'friend_greet',
           'friend_miss_you', 'friend_support', 'group_streak_active', 'group_streak_lost', 'group_victory', 'photo_reaction',
           'receive_comment', 'receive_like', 'team_encourage'],
}
TORSO = {'HIPS', 'SPINE', 'NECK'}
HEAD_OBS = ['FOX_Head', 'FOX_Ear_L', 'FOX_Ear_R', 'FOX_EarInner_L', 'FOX_EarInner_R', 'FOX_Arm_L', 'FOX_Arm_R', 'FLOOR']
# obstacle -> None (all item vertices) or the set of skin bones whose vertices are tested against it.
# Exclusions (each one is a contact the canonical Fox already has with ITSELF, so it is not cosmetic clipping):
#   * jacket TORSO part vs arms: the arms hang over / in front of the torso and their cage continues inside it;
#     an arm over the jacket is correct layering. The SLEEVES are tested against their own arm.
#   * sneaker tops vs the body: the leg cage itself enters the body there.
#   * the held magnifier vs the paw holding it (the handle passes through the paw by design).
OBSTACLES = {
    'student_glasses': {n: None for n in HEAD_OBS + ['FOX_Tuft']},
    'student_cap': {n: None for n in HEAD_OBS},                               # the tuft is hidden by the cap
    'sports_headband': {n: None for n in HEAD_OBS + ['FOX_Tuft']},
    'explorer_backpack': {n: None for n in ['FOX_Body', 'FOX_Head', 'FOX_Tail', 'FOX_Arm_L', 'FOX_Arm_R', 'FOX_Scarf_Roll', 'FLOOR']},
    'simple_jacket': {'FOX_Body': TORSO, 'FOX_Scarf_Roll': TORSO, 'FOX_Scarf_Flap': TORSO, 'FOX_Head': None,
                      'FOX_Arm_L': {'ARM_L', 'PAW_L'}, 'FOX_Arm_R': {'ARM_R', 'PAW_R'}, 'FLOOR': None},
    'explorer_magnifier': {n: None for n in ['FOX_Body', 'FOX_Head', 'FOX_Arm_L', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Tail', 'FOX_Scarf_Flap', 'FLOOR']},
    'slot_test_sneakers': {'FOX_Leg_L': {'FOOT_L', 'LEG_L'}, 'FOX_Leg_R': {'FOOT_R', 'LEG_R'}, 'FOX_Tail': None, 'FLOOR': None},
    'slot_test_tail_ribbon': {n: None for n in ['FOX_Tail', 'FOX_Body', 'FOX_Leg_L', 'FOX_Leg_R', 'FLOOR']},
    'TEST_magnifier_left': {n: None for n in ['FOX_Body', 'FOX_Head', 'FOX_Arm_R', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Tail', 'FOX_Scarf_Flap', 'FLOOR']},
}
# baselines: the approved default accessories measured with the same metric (what the canonical model already does)
BASELINES = {
    'DEFAULT_backpack': (['FOX_Backpack', 'FOX_Backpack_Flap', 'FOX_Backpack_Pocket_L', 'FOX_Backpack_Pocket_R', 'FOX_Backpack_Buckle',
                          'FOX_Backpack_Strap_L', 'FOX_Backpack_Strap_R'], OBSTACLES['explorer_backpack']),
    'DEFAULT_backpack_straps': (['FOX_Backpack_Strap_L', 'FOX_Backpack_Strap_R'], OBSTACLES['explorer_backpack']),
    'DEFAULT_scarf': (['FOX_Scarf_Roll', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem'],
                      {n: None for n in ['FOX_Body', 'FOX_Head', 'FOX_Arm_L', 'FOX_Arm_R', 'FLOOR']}),
    'DEFAULT_tail_on_floor': (['FOX_Tail'], {'FLOOR': None}),
    'DEFAULT_fox_on_floor': (['FOX_Body', 'FOX_Head', 'FOX_Tail', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Arm_L', 'FOX_Arm_R'], {'FLOOR': None}),
}
# vertices of an item that are an exact copy of approved default geometry with the same rigid binding (the explorer pack
# re-uses the default shoulder straps, re-coloured): measured separately as the DEFAULT_backpack_straps baseline.
INHERITED = {'explorer_backpack': ['FOX_Backpack_Strap_L', 'FOX_Backpack_Strap_R']}
OK_MM, MINOR_MM = 2.0, 8.0
RIGID_COUPLED = {'HEAD': {'FOX_Head', 'FOX_Tuft'}}     # obstacle meshes rigid on the same bone as a rigid item
TEST_ONLY = {'TEST_magnifier_left'}                    # matrix-only fixture: the magnifier mirrored onto PAW_L (left-paw clip rules)


def severity(mm):
    return 'OK' if mm < OK_MM else ('MINOR' if mm <= MINOR_MM else 'SEVERE')


RAY_DIRS = [Vector((0.0, 0.0, 1.0)), Vector((0.577, -0.577, 0.577)), Vector((-0.707, 0.0, -0.707)), Vector((0.0, 0.894, -0.447)), Vector((-0.6, -0.48, 0.64))]


def _crossings(T, p, d):
    n, o = 0, p.copy()
    for _ in range(24):
        loc, _, _, dist = T.ray_cast(o, d, 2.0)
        if loc is None:
            break
        n += 1
        o = loc + d * 1e-5
    return n


def inside(T, p):
    """Majority vote (3 of 5) of ray-crossing parity along five fixed directions. (The nearest-surface normal test gives false
    'inside' hits near concave edges / open shells, e.g. 15 cm 'inside' a 13.7 cm-radius tail — rejected.)"""
    return sum(_crossings(T, p, d) % 2 for d in RAY_DIRS) >= 3


def set_clip(rig, name):
    act = bpy.data.actions[name]
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    ad.action_slot = next(s for s in act.slots if s.target_id_type == 'OBJECT')
    for key in bpy.data.shape_keys:
        sl = next((s for s in act.slots if s.target_id_type == 'KEY' and s.name_display == key.name), None)
        if sl is None:
            continue
        kad = key.animation_data or key.animation_data_create()
        kad.action = act
        kad.action_slot = sl
    return act


def evaluated(ob, dg):
    e = ob.evaluated_get(dg)
    m = e.to_mesh()
    M = np.array(e.matrix_world)
    co = np.empty(len(m.vertices) * 3, dtype=np.float64)
    m.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3) @ M[:3, :3].T + M[:3, 3]
    polys = [tuple(p.vertices) for p in m.polygons]
    e.to_mesh_clear()
    return co, polys


def run():
    quick = os.environ.get('FOX_H1_QUICK') == '1'
    os.makedirs(OUT, exist_ok=True)
    results = {}
    t0 = time.time()
    for bk, path in BLENDS.items():
        bpy.ops.wm.open_mainfile(filepath=path)
        for m in [m for o in bpy.data.objects for m in o.modifiers if m.type == 'SUBSURF']:
            m.show_viewport = False                                           # runtime cage
        rig = bpy.data.objects['FOX_RIG']
        cos = CS.load_cosmetics()
        CS.apply_outfit(cos, list(cos))
        cos['TEST_magnifier_left'] = CS.mirrored_left(cos['explorer_magnifier'])
        obs_names = sorted({n for v in list(OBSTACLES.values()) + [b[1] for b in BASELINES.values()] for n in v if n != 'FLOOR'})
        clips = [(c, True) for c in REQUIRED[bk]] + ([] if quick else [(c, False) for c in EXTRA[bk]])
        for clip, req in clips:
            act = set_clip(rig, clip)
            f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
            step = 2 if req else 4
            frames = list(range(f0, f1 + 1, step))
            if frames[-1] != f1:
                frames.append(f1)
            subjects = {iid: ([ob], OBSTACLES[iid]) for iid, ob in cos.items()}
            subjects.update({k: ([bpy.data.objects[n] for n in v[0]], v[1]) for k, v in BASELINES.items()})
            masks = {}
            inherited_count = {}
            for k, (objs, spec) in subjects.items():
                dom = []
                for ob in objs:
                    names = {g.index: g.name for g in ob.vertex_groups}
                    for v in ob.data.vertices:
                        g = max(v.groups, key=lambda x: x.weight, default=None)
                        dom.append(names.get(g.group) if g else None)
                dom = np.array(dom, dtype=object)
                masks[k] = {n: (None if sel is None else np.isin(dom, list(sel))) for n, sel in spec.items()}   # None = all evaluated verts
                if k in INHERITED:
                    rig.data.pose_position = 'REST'                     # compare in the rest pose
                    bpy.context.view_layer.update()
                    ob = objs[0]
                    rest = np.array([ob.matrix_world @ v.co for v in ob.data.vertices])
                    ref = np.vstack([np.array([bpy.data.objects[n].matrix_world @ v.co for v in bpy.data.objects[n].data.vertices]) for n in INHERITED[k]])
                    rig.data.pose_position = 'POSE'
                    bpy.context.view_layer.update()
                    kd = KDTree(len(ref))
                    for i, x in enumerate(ref):
                        kd.insert(Vector(x), i)
                    kd.balance()
                    own = np.array([kd.find(Vector(x))[2] > 1e-4 for x in rest])
                    inherited_count[k] = int((~own).sum())
                    masks[k] = {n: (own if m is None else (m & own)) for n, m in masks[k].items()}
            # rigid items: their single skin bone; rigidly coupled obstacle depths measured once at rest
            rigid_bone = {}
            for k, (objs, _) in subjects.items():
                if len(objs) == 1 and len(objs[0].vertex_groups) == 1 and k in cos:
                    rigid_bone[k] = objs[0].vertex_groups[0].name
            rest_depth = {}
            rig.data.pose_position = 'REST'; bpy.context.view_layer.update()
            dg0 = bpy.context.evaluated_depsgraph_get()
            for k, b in rigid_bone.items():
                for n in RIGID_COUPLED.get(b, ()):
                    if n not in subjects[k][1]:
                        continue
                    co0 = evaluated(subjects[k][0][0], dg0)[0]; oc, opl = evaluated(bpy.data.objects[n], dg0)
                    T0 = BVHTree.FromPolygons([Vector(x) for x in oc], opl)
                    rest_depth[(k, n)] = np.array([T0.find_nearest(Vector(x))[3] if inside(T0, Vector(x)) else 0.0 for x in co0])
            rig.data.pose_position = 'POSE'; bpy.context.view_layer.update()
            acc = {k: {'max': 0.0, 'worst': None, 'depths': [], 'by_obstacle': {}} for k in subjects}
            for f in frames:
                bpy.context.scene.frame_set(f)
                dg = bpy.context.evaluated_depsgraph_get()
                obs = {}
                for n in obs_names:
                    co, pl = evaluated(bpy.data.objects[n], dg)
                    obs[n] = (BVHTree.FromPolygons([Vector(x) for x in co], pl), co.min(0) - 0.01, co.max(0) + 0.01)
                fco = np.vstack([evaluated(bpy.data.objects[n], dg)[0] for n in BASELINES['DEFAULT_fox_on_floor'][0]])
                fox_floor = max(0.0, float(-fco[:, 2].min()))
                for k, (objs, spec) in subjects.items():
                    co = np.vstack([evaluated(ob, dg)[0] for ob in objs])
                    depth = np.zeros(len(co))
                    who = np.full(len(co), '', dtype=object)
                    for n in spec:
                        msk = masks[k][n]
                        if msk is None:
                            msk = np.ones(len(co), bool)
                        if n in RIGID_COUPLED.get(rigid_bone.get(k), ()):
                            d = rest_depth[(k, n)]
                        elif n == 'FLOOR':
                            raw = np.where(msk, np.maximum(0.0, -co[:, 2]), 0.0)
                            acc[k]['floor_raw'] = max(acc[k].get('floor_raw', 0.0), float(raw.max()) * 1000)
                            # the approved clips themselves sink the Fox into the floor plane in places (e.g. the
                            # sleep transitions): an item is charged only for going deeper than the Fox does that frame
                            d = raw if k.startswith('DEFAULT_') else np.maximum(0.0, raw - fox_floor)
                        else:
                            T, lo, hi = obs[n]
                            d = np.zeros(len(co))
                            cand = np.where(msk & np.all((co > lo) & (co < hi), axis=1))[0]
                            for i in cand:
                                p = Vector(co[i])
                                if inside(T, p):
                                    d[i] = T.find_nearest(p)[3]
                        upd = d > depth
                        depth[upd] = d[upd]
                        who[upd] = n
                        acc[k]['by_obstacle'][n] = max(acc[k]['by_obstacle'].get(n, 0.0), float(d.max()) * 1000)
                    mx = float(depth.max()) * 1000
                    acc[k]['depths'].append(np.percentile(depth, 99) * 1000)
                    if mx > acc[k]['max']:
                        acc[k]['max'] = mx
                        acc[k]['worst'] = {'frame': f, 'obstacle': str(who[int(depth.argmax())]),
                                           'vertices_over_2mm': int((depth > 0.002).sum()), 'vertex_count': len(co)}
            for iid in subjects:
                a = acc[iid]
                results.setdefault(iid, {})[clip] = {
                    'blend': bk, 'required': req, 'frames_sampled': len(frames), 'step': step,
                    'max_depth_mm': round(a['max'], 2), 'p99_depth_mm_worst_frame': round(max(a['depths']), 2),
                    'severity': severity(a['max']), 'worst': a['worst'],
                    'max_by_obstacle_mm': {k: round(v, 2) for k, v in a['by_obstacle'].items()},
                    'floor_raw_mm': round(a.get('floor_raw', 0.0), 2), 'inherited_vertices_excluded': inherited_count.get(iid, 0)}
            print(f'  {bk:5s} {clip:24s} ' + ' '.join(f'{"".join(w[0] for w in iid.split("_"))}={results[iid][clip]["max_depth_mm"]:.1f}' for iid in subjects), f'({time.time() - t0:.0f}s)', flush=True)
    out = os.path.join(OUT, 'compatibility_matrix_h1' + ('_quick' if quick else '') + '.json')
    json.dump({'metric': 'penetration depth of posed item vertices into posed Fox meshes / the floor (runtime cage)',
               'severity_mm': {'OK': f'< {OK_MM}', 'MINOR': f'{OK_MM}–{MINOR_MM}', 'SEVERE': f'> {MINOR_MM}'},
               'obstacles': {k: {n: (sorted(v) if v else 'all') for n, v in spec.items()} for k, spec in list(OBSTACLES.items()) + [(b, BASELINES[b][1]) for b in BASELINES]},
               'baselines': {k: v[0] for k, v in BASELINES.items()}, 'results': results}, open(out, 'w'), indent=1)
    print('wrote', out)


if __name__ == '__main__':
    run()
