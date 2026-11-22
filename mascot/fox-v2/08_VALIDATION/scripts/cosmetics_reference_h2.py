"""Gate H2 — Blender ground truth for the runtime attachment test of the 12 H2 library items (cosmetics_reference_h1.py
method, unchanged: same trackers, carriers, clips and frames rule).

For every item: 6 tracker vertices (extremes along the three axes, so a rotation or a detachment cannot hide), their rest
positions, and their posed positions in every required clip at 6 sample frames (+ the clip's worst clipping frame from the
compatibility matrix). Coordinates: glTF Y-up metres relative to the character root at scale 1 (Blender (x, y, z) →
(x, z, -y)), runtime cage (subdivision off) = the GLB geometry. The browser test evaluates the same clip at the same time
on the E2 Fox with the item bound by joint name and compares the skinned tracker vertices.

Output: 06_EXPORTS/glb/cosmetics/cosmetic_reference_h2.json
"""
import json
import os
import sys

import bpy  # noqa: E402
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cosmetics_scene_h2 as CS  # noqa: E402
import cosmetics_matrix_h1 as M  # noqa: E402

OUT = os.path.join(CS.ROOT, '06_EXPORTS', 'glb', 'cosmetics', 'cosmetic_reference_h2.json')
H2 = ['sports_jersey', 'sports_sneakers', 'explorer_hat', 'mage_hat', 'mage_capelet', 'mage_wand', 'ninja_headband', 'ninja_gi', 'ninja_scroll', 'tet_khan_dong', 'tet_ao_dai', 'tet_lixi']
# the Fox surface each item sits on: for every tracker the nearest vertex of these meshes is recorded too, so the runtime
# test can compare the item's deviation from Blender with the approved Fox's own deviation at the same place (glTF stores
# TRS per joint and cannot carry the shear of non-uniform squash: points far from a joint deviate for the Fox itself)
CARRIER = {'student_glasses': ['FOX_Head'], 'student_cap': ['FOX_Head'], 'sports_headband': ['FOX_Head'], 'explorer_backpack': ['FOX_Body'],
           'simple_jacket': ['FOX_Body', 'FOX_Arm_L', 'FOX_Arm_R'], 'explorer_magnifier': ['FOX_Arm_R'], 'slot_test_sneakers': ['FOX_Leg_L', 'FOX_Leg_R'],
           'slot_test_tail_ribbon': ['FOX_Tail'],
           'explorer_hat': ['FOX_Head'], 'mage_hat': ['FOX_Head'], 'ninja_headband': ['FOX_Head'], 'tet_khan_dong': ['FOX_Head'],
           'sports_jersey': ['FOX_Body'], 'ninja_gi': ['FOX_Body', 'FOX_Arm_L', 'FOX_Arm_R'], 'tet_ao_dai': ['FOX_Body', 'FOX_Arm_L', 'FOX_Arm_R'],
           'mage_capelet': ['FOX_Body'], 'ninja_scroll': ['FOX_Body'], 'mage_wand': ['FOX_Arm_R'], 'tet_lixi': ['FOX_Arm_R'], 'sports_sneakers': ['FOX_Leg_L', 'FOX_Leg_R']}
FPS = 24


def gl(p):
    return [round(float(p[0]), 6), round(float(p[2]), 6), round(float(-p[1]), 6)]


def main():
    matrix = None
    mp = os.path.join(CS.ROOT, '08_VALIDATION', 'cosmetics_h2', 'compatibility_matrix_h2.json')
    if os.path.exists(mp):
        matrix = json.load(open(mp))['results']
    out = {'note': __doc__.strip().split('\n')[0], 'fps': FPS, 'items': {}, 'clips': {}}
    trackers = None
    for bk, path in M.BLENDS.items():
        bpy.ops.wm.open_mainfile(filepath=path)
        for m in [m for o in bpy.data.objects for m in o.modifiers if m.type == 'SUBSURF']:
            m.show_viewport = False
        rig = bpy.data.objects['FOX_RIG']
        cos = {k: v for k, v in CS.load_cosmetics().items() if k in H2}
        CS.apply_outfit(cos, list(cos))
        if trackers is None:
            rig.data.pose_position = 'REST'
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            trackers, carriers = {}, {}
            for iid, ob in cos.items():
                co, _ = M.evaluated(ob, dg)
                idx = sorted({int(co[:, a].argmin()) for a in range(3)} | {int(co[:, a].argmax()) for a in range(3)})
                trackers[iid] = idx
                cands = [(n, M.evaluated(bpy.data.objects[n], dg)[0]) for n in CARRIER[iid]]
                car = []
                for i in idx:
                    best = min(((n, int(np.linalg.norm(c - co[i], axis=1).argmin()), float(np.linalg.norm(c - co[i], axis=1).min())) for n, c in cands), key=lambda x: x[2])
                    car.append(best)
                carriers[iid] = car
                out['items'][iid] = {'rest': [gl(co[i]) for i in idx], 'carrier': [{'mesh': n, 'rest': gl(dict(cands)[n][k]), 'distMm': round(d * 1000, 2)} for n, k, d in car]}
            rig.data.pose_position = 'POSE'
            bpy.context.view_layer.update()
        for clip in M.REQUIRED[bk]:
            act = M.set_clip(rig, clip)
            f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
            frames = sorted({int(round(x)) for x in np.linspace(f0, f1, 6)} |
                            ({matrix[i][clip]['worst']['frame'] for i in cos if matrix and matrix[i][clip]['worst']} if matrix else set()))
            rec = {}
            for f in frames:
                bpy.context.scene.frame_set(f)
                dg = bpy.context.evaluated_depsgraph_get()
                cache = {}
                def ev(n):
                    if n not in cache:
                        cache[n] = M.evaluated(bpy.data.objects[n], dg)[0]
                    return cache[n]
                rec[str(f)] = {'t': round((f - f0) / FPS, 6), 'items': {iid: [gl(M.evaluated(ob, dg)[0][i]) for i in trackers[iid]] for iid, ob in cos.items()},
                               'carrier': {iid: [gl(ev(n)[k]) for n, k, _ in carriers[iid]] for iid in cos}}
            out['clips'][clip] = rec
            print(f'  {bk:5s} {clip:22s} frames {frames}', flush=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w'))
    print('wrote', OUT, os.path.getsize(OUT), 'B')


if __name__ == '__main__':
    main()
