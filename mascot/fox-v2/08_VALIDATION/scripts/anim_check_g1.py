"""Gate G1 — numeric animation QA of the G1 clips (same metrics as E1/E2) on the evaluated meshes (Blender).

Added for G1: grounded foot sliding on every clip (sole vertices in ground contact on consecutive
frames must not move: the clips are in place), and loop velocity continuity for streak_active.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_check_g1.py
Writes 04_ANIMATIONS/g1_quest_reward_streak/anim_metrics_g1.json

Per clip, every frame (idle: every 2nd), compared with the rest pose:
* scarf roll/flap vertices newly inside the body or head        (scarf penetration)
* tail vertices newly inside the body                            (tail/body intersection)
* arm vertices newly inside the head / body                      (paw through head)
* joint roots (vertices weighted ≥ 50 % to the host bone: SPINE for arms, HIPS for legs,
  HEAD for ears, HIPS for the tail) that are buried at rest and leave the host surface
  (shoulder / hip / ear / tail-root detachment). Evaluated on the runtime cage (subdivision off),
  i.e. the geometry that is exported to the GLB
* per-edge stretch p99 / max on the skinned meshes               (chibi proportions)
* foot sole height (ground penetration) and, for walk/run, the world-space slide of
  sole vertices in contact while the character travels at speed_mps   (foot sliding)
* loop seam: last frame == first frame and velocity continuity (loops);
  first and last frame == rest pose (one-shots, for clean transitions)
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
MOD = os.path.join(ROOT_DIR, '04_ANIMATIONS', 'g1_quest_reward_streak')
SRC = os.path.join(MOD, 'fox_anim_g1.blend')
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g1.json')))
SKINNED = ['FOX_Body', 'FOX_Arm_L', 'FOX_Arm_R', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Ear_L', 'FOX_Ear_R', 'FOX_Tail',
           'FOX_Scarf_Roll', 'FOX_Scarf_Flap']
TOL = 0.002   # 2 mm


def ev_verts(o, polys=False):
    dg = bpy.context.evaluated_depsgraph_get()
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    mw = o.matrix_world
    v = [mw @ x.co for x in me.vertices]
    ed = [tuple(x.vertices) for x in me.edges]
    p = [tuple(x.vertices) for x in me.polygons] if polys else None
    e.to_mesh_clear()
    return v, ed, p


def snapshot(O):
    s = {'v': {}, 'e': {}}
    for n in SKINNED:
        v, e, _ = ev_verts(O[n])
        s['v'][n], s['e'][n] = v, e
    for n in ('FOX_Body', 'FOX_Head'):
        v, _, p = ev_verts(O[n], polys=True)
        s[n] = BVHTree.FromPolygons(v, p)
    rig = O['FOX_RIG']
    s['bones'] = {pb.name: (rig.matrix_world @ pb.matrix) for pb in rig.pose.bones}
    return s


HOST = {'Arm': 'SPINE', 'Leg': 'HIPS', 'Ear': 'HEAD', 'Tail': 'HIPS'}


def host_w(o, i):
    host = next(v for k, v in HOST.items() if k in o.name)
    g = o.vertex_groups.get(host)
    if g is None:
        return 0.0
    for e in o.data.vertices[i].groups:
        if e.group == g.index:
            return e.weight
    return 0.0


def sd(tree, p):
    loc, n, _, _ = tree.find_nearest(p)
    return (p - loc).dot(n)


def set_clip(O, name):
    rig = O['FOX_RIG']
    act = bpy.data.actions[name]
    rig.animation_data.action = act
    rig.animation_data.action_slot = next(s for s in act.slots if s.target_id_type == 'OBJECT')
    for key in bpy.data.shape_keys:
        sl = next((s for s in act.slots if s.target_id_type == 'KEY' and s.name_display == key.name), None)
        if sl:
            ad = key.animation_data or key.animation_data_create()
            ad.action = act
            ad.action_slot = sl


def bone_delta(a, b):
    worst_ang, worst_pos = 0.0, 0.0
    for n in a:
        qa, qb = a[n].to_quaternion(), b[n].to_quaternion()
        ang = math.degrees(qa.rotation_difference(qb).angle)
        worst_ang = max(worst_ang, min(ang, 360.0 - ang))
        worst_pos = max(worst_pos, (a[n].translation - b[n].translation).length)
    return worst_ang, worst_pos * 1000


def main():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    sc = bpy.context.scene
    for o in O:                              # runtime cage = exported GLB geometry; vertex indices = weights
        for m in o.modifiers:
            if m.type == 'SUBSURF':
                m.show_viewport = False
    rig = O['FOX_RIG']
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    sc.frame_set(1)
    rest = snapshot(O)
    B, H = rest['FOX_Body'], rest['FOX_Head']
    cls = {
        'scarf_body': {n: [sd(B, p) < -0.001 for p in rest['v'][n]] for n in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap')},
        'scarf_head': {n: [sd(H, p) < -0.001 for p in rest['v'][n]] for n in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap')},
        'tail_body': [sd(B, p) < -0.001 for p in rest['v']['FOX_Tail']],
        # only arm surface that is visible at rest (outside head AND body) can be visibly cut by the head
        'arm_head': {n: [sd(H, p) < -0.001 or sd(B, p) < 0 for p in rest['v'][n]] for n in ('FOX_Arm_L', 'FOX_Arm_R')},
        # note: on the cage, roots counted only where the host-bone weight is ≥ 0.5
        'roots': {n: [sd(H if 'Ear' in n else B, p) < -TOL and host_w(O[n], i) >= 0.5 for i, p in enumerate(rest['v'][n])]
                  for n in ('FOX_Arm_L', 'FOX_Arm_R', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Ear_L', 'FOX_Ear_R', 'FOX_Tail')},
    }
    z0 = {s: min(p.z for p in rest['v'][f'FOX_Leg_{s}']) for s in 'LR'}
    sole_idx = {s: [i for i, p in enumerate(rest['v'][f'FOX_Leg_{s}']) if p.z < z0[s] + 0.004] for s in 'LR'}
    results = {}
    for clip, c in SPEC['clips'].items():
        set_clip(O, clip)
        n = c['frames']
        last = n + 1 if c['loop'] else n + 1
        frames = list(range(1, last + 1))
        if frames[-1] != last:
            frames.append(last)
        v = c.get('speed_mps', 0.0)
        grounded = True
        agg = {'scarf_new_in_body': 0, 'scarf_new_in_head': 0, 'scarf_max_depth_mm': 0.0, 'tail_new_in_body': 0,
               'tail_max_depth_mm': 0.0, 'arm_new_in_head': 0, 'detached_root_verts': {}, 'stretch_p99_max': {},
               'stretch_max': {}, 'sole_min_mm': 1e9, 'worst_frames': {}}
        prev_sole = {}
        slides = []
        bones = {}
        for f in frames:
            sc.frame_set(f)
            cur = snapshot(O)
            Bc, Hc = cur['FOX_Body'], cur['FOX_Head']
            bones[f] = cur['bones']
            for nm in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap'):
                db = [sd(Bc, p) for p, was in zip(cur['v'][nm], cls['scarf_body'][nm]) if not was]
                dh = [sd(Hc, p) for p, was in zip(cur['v'][nm], cls['scarf_head'][nm]) if not was]
                nb, nh = sum(d < -TOL for d in db), sum(d < -TOL for d in dh)
                agg['scarf_in_head_max_depth_mm'] = round(max(agg.get('scarf_in_head_max_depth_mm', 0.0), -min([0] + dh) * 1000), 2)
                if nb > agg['scarf_new_in_body']:
                    agg['worst_frames']['scarf_body'] = f
                agg['scarf_new_in_body'] = max(agg['scarf_new_in_body'], nb)
                agg['scarf_new_in_head'] = max(agg['scarf_new_in_head'], nh)
                agg['scarf_max_depth_mm'] = max(agg['scarf_max_depth_mm'], -min([0] + db) * 1000)
            dt = [sd(Bc, p) for p, was in zip(cur['v']['FOX_Tail'], cls['tail_body']) if not was]
            nt = sum(d < -TOL for d in dt)
            if nt > agg['tail_new_in_body']:
                agg['worst_frames']['tail_body'] = f
            agg['tail_new_in_body'] = max(agg['tail_new_in_body'], nt)
            agg['tail_max_depth_mm'] = max(agg['tail_max_depth_mm'], -min([0] + dt) * 1000)
            for nm in ('FOX_Arm_L', 'FOX_Arm_R'):
                # visible arm surface only: vertices inside the torso are hidden anyway (buried arm root)
                da = [sd(Hc, p) for p, was in zip(cur['v'][nm], cls['arm_head'][nm]) if not was]
                agg['arm_new_in_head'] = max(agg['arm_new_in_head'], sum(d < -TOL for d in da))
                agg['arm_in_head_max_depth_mm'] = round(max(agg.get('arm_in_head_max_depth_mm', 0.0), -min([0] + da) * 1000), 2)
            for nm, flags in cls['roots'].items():
                host = Hc if 'Ear' in nm else Bc
                # a root that leaves its host but ends up inside the (opaque) head is still hidden
                ds = [sd(host, p) for p, was in zip(cur['v'][nm], flags) if was and ('Ear' in nm or sd(Hc, p) > 0)]
                out = sum(1 for d in ds if d > TOL)
                if out > agg['detached_root_verts'].get(nm, 0):
                    agg['worst_frames'][f'detach_{nm}'] = f
                agg['detached_root_verts'][nm] = max(agg['detached_root_verts'].get(nm, 0), out)
                agg.setdefault('detached_root_max_out_mm', {})
                agg['detached_root_max_out_mm'][nm] = round(max(agg['detached_root_max_out_mm'].get(nm, 0), max([0] + ds) * 1000), 2)
            for nm in SKINNED:
                v0, v1 = rest['v'][nm], cur['v'][nm]
                dev = sorted(abs((v1[a] - v1[b]).length / max(1e-9, (v0[a] - v0[b]).length) - 1) for a, b in rest['e'][nm])
                agg['stretch_p99_max'][nm] = round(max(agg['stretch_p99_max'].get(nm, 0), dev[int(0.99 * (len(dev) - 1))]), 3)
                agg['stretch_max'][nm] = round(max(agg['stretch_max'].get(nm, 0), dev[-1]), 3)
            travel = Vector((0, -v * (f - 1) / 24, 0))
            for s in 'LR':
                pts = [cur['v'][f'FOX_Leg_{s}'][i] for i in sole_idx[s]]
                agg['sole_min_mm'] = min(agg['sole_min_mm'], (min(p.z for p in pts) - z0[s]) * 1000)
                if v > 0 or grounded:
                    world = [p + travel for p in pts]
                    contact = {i: w for i, w, p in zip(sole_idx[s], world, pts) if p.z < z0[s] + 0.0015}
                    if s in prev_sole and f - prev_sole[s][0] == 1:
                        for i, w in contact.items():
                            if i in prev_sole[s][1]:
                                d = w - prev_sole[s][1][i]
                                slides.append(math.hypot(d.x, d.y) * 1000)
                    prev_sole[s] = (f, contact)
        for k_ in ('scarf_max_depth_mm', 'tail_max_depth_mm', 'sole_min_mm'):
            agg[k_] = round(agg[k_], 2)
        if v > 0 or grounded:
            slides.sort()
            agg['foot_slide_mm_per_frame'] = {'samples': len(slides), 'max': round(slides[-1], 3) if slides else None,
                                              'p95': round(slides[int(0.95 * (len(slides) - 1))], 3) if slides else None}
        first, lastb = bones[frames[0]], bones[frames[-1]]
        if c['loop']:
            ang, pos = bone_delta(first, lastb)
            agg['loop_seam'] = {'pose_diff_deg': round(ang, 4), 'pose_diff_mm': round(pos, 4)}
            if clip == 'streak_active':
                L = frames[-1]
                a1, p1 = bone_delta(bones[2], bones[1]); a2, p2 = bone_delta(bones[L], bones[L - 1])
                agg['loop_seam']['step_into_loop_deg/mm'] = [round(a1, 3), round(p1, 3)]
                agg['loop_seam']['step_out_of_loop_deg/mm'] = [round(a2, 3), round(p2, 3)]
            # velocity continuity: step into the loop vs step out of it
            if clip not in ('idle', 'streak_active'):
                # two identical gait cycles per clip: every frame must equal the frame one cycle later,
                # so the wrap (last -> first) is the same transition as the internal cycle boundary
                T = c['cycle_frames']
                per = [bone_delta(bones[f], bones[f + T]) for f in frames if f + T in bones]
                agg['loop_seam']['periodicity_max_deg/mm'] = [round(max(a for a, _ in per), 4), round(max(p for _, p in per), 4)]
                a1, p1 = bone_delta(bones[frames[1]], first)
                a2, p2 = bone_delta(bones[T + 2], bones[T + 1])
                agg['loop_seam']['step_after_wrap_deg/mm'] = [round(a1, 3), round(p1, 3)]
                agg['loop_seam']['step_after_internal_boundary_deg/mm'] = [round(a2, 3), round(p2, 3)]
        else:
            rest_b = rest['bones']
            a0, p0 = bone_delta(first, rest_b)
            a1, p1 = bone_delta(lastb, rest_b)
            agg['rest_match'] = {'start_deg/mm': [round(a0, 4), round(p0, 4)], 'end_deg/mm': [round(a1, 4), round(p1, 4)]}
        agg['frames_checked'] = len(frames)
        results[clip] = agg
        print(clip, json.dumps({k: agg[k] for k in agg if k not in ('stretch_max', 'worst_frames')}), flush=True)
    out = os.path.join(MOD, 'anim_metrics_g1.json')
    json.dump({'source': '04_ANIMATIONS/g1_quest_reward_streak/fox_anim_g1.blend', 'tolerance_mm': TOL * 1000, 'clips': results}, open(out, 'w'), indent=1)
    print(out)


if __name__ == '__main__':
    main()
