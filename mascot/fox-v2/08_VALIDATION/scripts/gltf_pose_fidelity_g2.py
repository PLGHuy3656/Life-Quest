"""Gate G2 — glTF pose fidelity: what the GLB data itself encodes vs the Blender pose.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/gltf_pose_fidelity_g2.py

Why: the rig has bones with inherit_scale = NONE (NECK, ARM_L, ARM_R, TAIL_01) under a HIPS bone that
squashes non-uniformly. glTF / three.js always inherit scale fully and have no shear, so the exporter
writes a compensating local scale on those bones; when the child is also rotated relative to HIPS the
compensation can only be approximate (the exact result would need shear). The leaf bones (ear tips,
hand / hat / glasses sockets, tail tip) then sit a few millimetres away from Blender during squash.
This is a property of the export format, already present in the approved E2 GLB — not a binding fault.

This script separates the two questions:
  A. binding exactness — an independent numpy forward-kinematics evaluation of the module's own
     glTF channels (written to fox_v2_g2_gltf_fk_poses.json). The browser test requires three.js on
     the E2 Fox to reproduce THESE positions (to float precision).
  B. format fidelity — the same evaluation compared with the Blender pose, for the G1 module AND for
     the approved E2 GLB on its own clips, so the G1 deviation can be judged against the approved one.

Writes 06_EXPORTS/glb/modules/fox_v2_g2_gltf_fk_poses.json
       08_VALIDATION/runtime_g2/gltf_pose_fidelity_g2.json
"""
import json
import os
import struct
import sys

import numpy as np
import bpy  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anim_check_e2 as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
G1_GLB = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g2_daily_life.anim.glb')
G1_REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g2_reference_poses.json')
G1_FK = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_g2_gltf_fk_poses.json')
E2_GLB = os.path.join(ROOT, '06_EXPORTS', 'glb', 'fox_v2_anim_e2.glb')
E2_BLEND = os.path.join(ROOT, '04_ANIMATIONS', 'fox_anim_e2.blend')
E2_SPEC = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'anim_spec_e2.json')))
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2', 'gltf_pose_fidelity_g2.json')
FPS = 24


def load_glb(path):
    data = open(path, 'rb').read()
    n = struct.unpack('<I', data[12:16])[0]
    g = json.loads(data[20:20 + n])
    off = 20 + n
    bn = struct.unpack('<I', data[off:off + 4])[0]
    binc = data[off + 8:off + 8 + bn]
    return g, binc


def accessor(g, binc, i):
    a = g['accessors'][i]
    bv = g['bufferViews'][a['bufferView']]
    comp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    assert a['componentType'] == 5126 and 'sparse' not in a
    stride = bv.get('byteStride', 4 * comp)
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    raw = np.frombuffer(binc, dtype=np.uint8, count=stride * (a['count'] - 1) + 4 * comp, offset=start)
    out = np.empty((a['count'], comp), np.float64)
    for k in range(a['count']):
        out[k] = np.frombuffer(raw[k * stride:k * stride + 4 * comp].tobytes(), dtype='<f4')
    return out


def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def slerp(a, b, u):
    d = float(np.dot(a, b))
    if d < 0:
        b, d = -b, -d
    if d > 0.9995:
        r = a + (b - a) * u
        return r / np.linalg.norm(r)
    th = np.arccos(d)
    return (np.sin((1 - u) * th) * a + np.sin(u * th) * b) / np.sin(th)


class Gltf:
    def __init__(self, path):
        self.g, self.bin = load_glb(path)
        self.nodes = self.g['nodes']
        self.parent = {c: i for i, n in enumerate(self.nodes) for c in n.get('children', [])}
        self.by_name = {n.get('name'): i for i, n in enumerate(self.nodes)}
        self.anims = {}
        for a in self.g.get('animations', []):
            ch = []
            for c in a['channels']:
                s = a['samplers'][c['sampler']]
                ch.append((c['target']['node'], c['target']['path'], accessor(self.g, self.bin, s['input'])[:, 0],
                           accessor(self.g, self.bin, s['output']), s.get('interpolation', 'LINEAR')))
            self.anims[a['name']] = ch

    def pose(self, clip, t):
        trs = {i: [np.array(n.get('translation', [0, 0, 0]), float), np.array(n.get('rotation', [0, 0, 0, 1]), float),
                   np.array(n.get('scale', [1, 1, 1]), float)] for i, n in enumerate(self.nodes)}
        for node, path, tin, out, interp in self.anims[clip]:
            if path == 'weights':
                continue
            j = int(np.clip(np.searchsorted(tin, t, side='right') - 1, 0, len(tin) - 1))
            if interp == 'STEP' or j == len(tin) - 1 or t <= tin[0]:
                v = out[j if t > tin[0] else 0]
            else:
                u = (t - tin[j]) / (tin[j + 1] - tin[j])
                v = slerp(out[j], out[j + 1], u) if path == 'rotation' else out[j] + (out[j + 1] - out[j]) * u
            trs[node][{'translation': 0, 'rotation': 1, 'scale': 2}[path]] = np.array(v, float)
        return trs

    def bone_positions(self, clip, t, names):
        trs = self.pose(clip, t)
        frame = self.parent[self.by_name['ROOT']]
        cache = {}

        def mat(i):
            if i in cache:
                return cache[i]
            T, Rq, S = trs[i]
            M = np.eye(4)
            M[:3, :3] = qmat(Rq) @ np.diag(S)
            M[:3, 3] = T
            if i != frame and i in self.parent and self.parent[i] != frame:
                M = mat(self.parent[i]) @ M
            cache[i] = M
            return M
        return {nm: mat(self.by_name[nm])[:3, 3].tolist() for nm in names if nm in self.by_name}


def compare(ref, fk_fn):
    res, worst = {}, (0.0, None)
    for clip, samples in ref.items():
        cm, cw = 0.0, None
        for f, s in samples.items():
            pos = fk_fn(clip, s['t'], list(s['bones']))
            for bn, p in s['bones'].items():
                e = float(np.linalg.norm(np.array(pos[bn]) - np.array(p))) * 1000
                if e > cm:
                    cm, cw = e, {'frame': f, 'bone': bn}
        res[clip] = {'max_mm': round(cm, 3), 'at': cw}
        if cm > worst[0]:
            worst = (cm, {'clip': clip, **(cw or {})})
    return res, {'max_mm': round(worst[0], 3), 'at': worst[1]}


def e2_reference():
    bpy.ops.wm.open_mainfile(filepath=E2_BLEND)
    O = bpy.data.objects
    rig, sc = O['FOX_RIG'], bpy.context.scene
    out = {}
    for clip, c in E2_SPEC['clips'].items():
        if clip not in bpy.data.actions:
            continue
        C.set_clip(O, clip)
        n = c['frames'] + 1 if 'frames' in c else int(round(c['duration_s'] * FPS)) + 1
        frames = sorted({1, 2, max(1, n // 4), n // 2, (3 * n) // 4, n})
        out[clip] = {}
        for f in frames:
            sc.frame_set(f)
            out[clip][str(f)] = {'t': round((f - 1) / FPS, 5), 'bones': {pb.name: [p.x, p.z, -p.y] for pb in rig.pose.bones for p in [rig.matrix_world @ pb.head]}}
    return out


def main():
    g1 = Gltf(G1_GLB)
    ref = json.load(open(G1_REF))['clips']
    # A. expected positions straight from the module's glTF data
    fk = {clip: {f: {'t': s['t'], 'bones': {k: [round(x, 7) for x in v] for k, v in g1.bone_positions(clip, s['t'], list(s['bones'])).items()}}
                 for f, s in samples.items()} for clip, samples in ref.items()}
    json.dump({'note': 'Independent numpy FK of the module glTF channels (bone head positions, glTF Y-up metres, '
                       'armature frame, scale 1) at the same sample times as fox_v2_g2_reference_poses.json. '
                       'three.js must reproduce these exactly; see gltf_pose_fidelity_g2.py for why they can differ '
                       'from Blender by a few mm on leaf bones during squash.', 'clips': fk}, open(G1_FK, 'w'))
    g1_vs_blender, g1_worst = compare(ref, g1.bone_positions)
    # B. same measurement on the approved E2 GLB
    e2 = Gltf(E2_GLB)
    e2ref = e2_reference()
    e2_vs_blender, e2_worst = compare(e2ref, e2.bone_positions)
    rep = {'explanation': __doc__.split('This script')[0].strip(),
           'g2_module_vs_blender': {'worst': g1_worst, 'clips': g1_vs_blender},
           'e2_approved_glb_vs_blender': {'worst': e2_worst, 'clips': e2_vs_blender}}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(rep, open(OUT, 'w'), indent=2)
    print('G2 module glTF vs Blender  worst', g1_worst)
    print('E2 approved glTF vs Blender worst', e2_worst)
    for k, v in {**g1_vs_blender, **{'E2:' + a: b for a, b in e2_vs_blender.items()}}.items():
        print(f'  {k:22s} {v["max_mm"]:8.3f} mm  {v["at"]}')


if __name__ == '__main__':
    main()
