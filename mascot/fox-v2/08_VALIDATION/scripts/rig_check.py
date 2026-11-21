"""Gate D1 — numeric deformation checks at every key pose of the test action.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/rig_check.py
Writes 03_RIG/deformation_metrics.json and prints a summary.

Measured per pose (compared with the rest pose, frame 1):
* stretch: per-edge length ratio on each skinned mesh (evaluated, incl. subdivision)
* face attachment: face-decal distance to the head surface (must equal rest)
* scarf -> neck penetration: roll/flap vertices newly inside the body or head
* tail -> body intersection: tail vertices newly inside the body
* backpack attachment: pack inner face distance to the body surface
* detachment: buried roots (ear bases, arm/leg roots, tail root) leaving their host
* chain smoothness: angle between consecutive ear/tail bones
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib  # noqa: E402
_T = importlib.import_module(os.environ.get('FOX_TESTS', 'rig_tests'))  # rig_tests (D1) or rig_tests_d1_1
TESTS, POSE_LABELS, RIG_FILE = _T.TESTS, _T.POSE_LABELS, _T.RIG_FILE

ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
SKINNED = ['FOX_Body', 'FOX_Arm_L', 'FOX_Arm_R', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Ear_L', 'FOX_Ear_R',
           'FOX_EarInner_L', 'FOX_EarInner_R', 'FOX_Tail', 'FOX_Scarf_Roll', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem']
DECALS = ['FOX_Eye_L', 'FOX_Eye_R', 'FOX_Blush_L', 'FOX_Blush_R', 'FOX_Mouth_Neutral', 'FOX_Nose']


def evaluated(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    mw = obj.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    edges = [tuple(e.vertices) for e in me.edges]
    polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return verts, edges, polys


def bvh(obj):
    v, _, p = evaluated(obj)
    return BVHTree.FromPolygons(v, p)


def signed(tree, p):
    loc, n, _, _ = tree.find_nearest(p)
    return (p - loc).dot(n)


def snapshot():
    snap = {'verts': {}, 'edges': {}}
    for n in dict.fromkeys(SKINNED + DECALS + ['FOX_Backpack', 'FOX_Head', 'FOX_Eye_L', 'FOX_Eye_R']):
        v, e, _ = evaluated(bpy.data.objects[n])
        snap['verts'][n] = v
        snap['edges'][n] = e
    snap['bvh'] = {n: bvh(bpy.data.objects[n]) for n in ('FOX_Body', 'FOX_Head')}
    rig = bpy.data.objects['FOX_RIG']
    snap['bones'] = {pb.name: ((rig.matrix_world @ pb.tail) - (rig.matrix_world @ pb.head)).normalized()
                     for pb in rig.pose.bones}
    return snap


def angle(a, b):
    return math.degrees(a.angle(b)) if a.length and b.length else 0.0


def main():
    bpy.ops.wm.open_mainfile(filepath=RIG_FILE)
    sc = bpy.context.scene
    sc.frame_set(1)
    rest = snapshot()
    body_r, head_r = rest['bvh']['FOX_Body'], rest['bvh']['FOX_Head']
    # rest-state classification of vertices that must keep their relation
    inside_rest = {
        'scarf_in_body': {n: [signed(body_r, p) < -0.001 for p in rest['verts'][n]] for n in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap')},
        'scarf_in_head': {n: [signed(head_r, p) < -0.001 for p in rest['verts'][n]] for n in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap')},
        'tail_in_body': [signed(body_r, p) < -0.001 for p in rest['verts']['FOX_Tail']],
        'roots': {n: [signed(host, p) < -0.002 for p in rest['verts'][n]]
                  for n, host in (('FOX_Ear_L', head_r), ('FOX_Ear_R', head_r), ('FOX_Arm_L', body_r),
                                  ('FOX_Arm_R', body_r), ('FOX_Leg_L', body_r), ('FOX_Leg_R', body_r), ('FOX_Tail', body_r))},
    }
    # parts with a 'hide' morph collapse by design during expressions -> rigid-drift check
    # only on decals that never hide (blush, nose); eyes get the clearance check
    global DECALS
    DECALS = [n for n in DECALS if not (bpy.data.objects[n].data.shape_keys and
                                        'hide' in bpy.data.objects[n].data.shape_keys.key_blocks)]
    decal_rest = {n: [signed(head_r, p) for p in rest['verts'][n]] for n in DECALS}
    pack_rest = [signed(body_r, p) for p in rest['verts']['FOX_Backpack']]
    pack_near = [i for i, d in enumerate(pack_rest) if d < 0.03]  # inner face of the pack

    results = {}
    frames = [f for _, (_, _, _, poses) in TESTS.items() for f in poses]
    for f in frames:
        sc.frame_set(f)
        cur = snapshot()
        body, head = cur['bvh']['FOX_Body'], cur['bvh']['FOX_Head']
        r = {'label': POSE_LABELS.get(f, '')}
        st = {}
        for n in SKINNED:
            v0, v1 = rest['verts'][n], cur['verts'][n]
            ratios = sorted(((v1[a] - v1[b]).length / max(1e-9, (v0[a] - v0[b]).length)) for a, b in rest['edges'][n])
            dev = [abs(x - 1) for x in ratios]
            dev.sort()
            st[n] = {'max_dev': round(dev[-1], 3), 'p99_dev': round(dev[int(0.99 * (len(dev) - 1))], 3)}
        r['stretch'] = st
        # rigid decals must not drift; shape-keyed eyes may change dome height
        # by design, so for them only clipping (distance < 0.3 mm) is checked
        r['face_decal_drift_mm'] = round(max(abs(signed(head, p) - d0) for n in DECALS if not n.startswith('FOX_Eye')
                                             for p, d0 in zip(cur['verts'][n], decal_rest[n])) * 1000, 3)
        r['eye_min_clearance_mm'] = round(min(signed(head, p) for n in ('FOX_Eye_L', 'FOX_Eye_R')
                                              for p in cur['verts'][n]) * 1000, 2)
        r['expression'] = POSE_LABELS.get(f, '') if f >= 301 else ''
        pen = {}
        for n in ('FOX_Scarf_Roll', 'FOX_Scarf_Flap'):
            nb = [signed(body, p) for p, was in zip(cur['verts'][n], inside_rest['scarf_in_body'][n]) if not was]
            nh = [signed(head, p) for p, was in zip(cur['verts'][n], inside_rest['scarf_in_head'][n]) if not was]
            pen[n] = {'new_in_body': sum(1 for d in nb if d < -0.002), 'max_depth_body_mm': round(-min([0] + nb) * 1000, 1),
                      'new_in_head': sum(1 for d in nh if d < -0.002), 'max_depth_head_mm': round(-min([0] + nh) * 1000, 1)}
        r['scarf_penetration'] = pen
        tb = [signed(body, p) for p, was in zip(cur['verts']['FOX_Tail'], inside_rest['tail_in_body']) if not was]
        r['tail_into_body'] = {'new_inside': sum(1 for d in tb if d < -0.002), 'max_depth_mm': round(-min([0] + tb) * 1000, 1)}
        gaps = [signed(body, cur['verts']['FOX_Backpack'][i]) - pack_rest[i] for i in pack_near]
        r['backpack_gap_change_mm'] = {'max_open': round(max([0] + gaps) * 1000, 1), 'max_sink': round(-min([0] + gaps) * 1000, 1)}
        det = {}
        for n, flags in inside_rest['roots'].items():
            host = head if 'Ear' in n else body
            out = [signed(host, p) for p, was in zip(cur['verts'][n], flags) if was]
            det[n] = sum(1 for d in out if d > 0.002)
        r['detached_root_verts'] = det
        B = cur['bones']
        r['chain_angles_deg'] = {
            'EAR_L': round(angle(B['EAR_L_01'], B['EAR_L_02']), 1), 'EAR_R': round(angle(B['EAR_R_01'], B['EAR_R_02']), 1),
            'TAIL': [round(angle(B[f'TAIL_0{i}'], B[f'TAIL_0{i + 1}']), 1) for i in range(1, 4)]}
        results[f] = r
        print(f, r['label'], '| stretch max', max(v['max_dev'] for v in st.values()),
              '| decal', r['face_decal_drift_mm'], '| scarf', {k: (v['new_in_body'], v['new_in_head']) for k, v in pen.items()},
              '| tail', r['tail_into_body'], '| pack', r['backpack_gap_change_mm'], '| detach', sum(det.values()))
    out = os.path.join(ROOT_DIR, '03_RIG', os.environ.get('FOX_METRICS', 'deformation_metrics.json'))
    json.dump({'rig_file': os.path.relpath(RIG_FILE, ROOT_DIR).replace(os.sep, '/'), 'rest_frame': 1, 'poses': results}, open(out, 'w'), indent=1)
    print(out)


if __name__ == '__main__':
    main()
