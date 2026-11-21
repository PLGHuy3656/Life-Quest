"""Gate D1.1 — rig corrections + GLB-compatible facial system + prototype actions.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/rig_d1_1.py
Reads   03_RIG/fox_rig_prototype.blend     (D1, kept unchanged)
Writes  03_RIG/fox_rig_d1_1.blend, 03_RIG/face_morph_map.json,
        updates 03_RIG/skeleton_spec.json (D1.1 section)

PART A  deformation fixes (weights only, no new bones)
  * scarf roll / bandana top use EXACTLY the torso weight function at their
    height -> scarf and neck deform identically, the gap is preserved
  * ears: wider, smoother mid-ear blend (10 cm) for forward tip bends
  * shoulders: 5 cm SPINE blend for high arm raises
  * tail: sway is authored around the view axis behind the body (see tests)
PART B  facial system without Blender-only drivers
  * every expression part is a morph target: swap meshes get a collapsed
    basis + "show" key, default-visible parts get a "hide" key
  * all visibility / shape-key drivers and the FACE control bone are removed
  * prototype actions fox_idle_test, fox_blink_test, fox_head_turn_test,
    fox_tail_sway_test (armature + shape-key slots in one action each)
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_rig import chain_weights, assign, smoothstep, ROOT_DIR  # noqa: E402

SRC = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_prototype.blend')
OUT = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_d1_1.blend')

VISIBLE_PARTS = ['FOX_Eye_L', 'FOX_Eye_R', 'FOX_Mouth_Neutral']
SWAP_PARTS = ['FOX_EyeClosedHappy_L', 'FOX_EyeClosedHappy_R', 'FOX_EyeClosedSleepy_L', 'FOX_EyeClosedSleepy_R',
              'FOX_Mouth_Open', 'FOX_Mouth_Tongue', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown', 'FOX_Mouth_Smile',
              'FOX_Brow_L', 'FOX_Brow_R']
EYES = ['FOX_Eye_L', 'FOX_Eye_R']
BROWS = ['FOX_Brow_L', 'FOX_Brow_R']

# expression -> {mesh: {morph: weight}}; anything not listed = 0
EXPRESSIONS = {
    'neutral': {},
    'blink': {**{e: {'Blink': 1} for e in EYES}},
    'happy': {**{e: {'hide': 1} for e in EYES}, 'FOX_EyeClosedHappy_L': {'show': 1}, 'FOX_EyeClosedHappy_R': {'show': 1},
              'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Open': {'show': 1}, 'FOX_Mouth_Tongue': {'show': 1}},
    'proud': {**{e: {'Proud': 1} for e in EYES}, **{b: {'Proud': 1} for b in BROWS},
              'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Smile': {'show': 1}},
    'sad': {**{e: {'Sad': 1} for e in EYES}, **{b: {'Sad': 1} for b in BROWS},
            'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Frown': {'show': 1}},
    'surprised': {**{e: {'Wide': 1} for e in EYES}, 'FOX_Mouth_Neutral': {'hide': 1},
                  'FOX_Mouth_Open': {'show': 1}, 'FOX_Mouth_Tongue': {'show': 1}},
    'sleepy': {**{e: {'hide': 1} for e in EYES}, 'FOX_EyeClosedSleepy_L': {'show': 1}, 'FOX_EyeClosedSleepy_R': {'show': 1},
               'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
}


def body_w(p):
    """The torso weight function (identical to build_rig.build body weights)."""
    return chain_weights(p, [Vector((0, 0, 0.0)), Vector((0, 0, 0.24)), Vector((0, 0, 0.365)), Vector((0, 0, 0.50))],
                         ['HIPS', 'SPINE', 'NECK'], [0.05, 0.035])


def reweight(obj, fn):
    for g in list(obj.vertex_groups):
        obj.vertex_groups.remove(g)
    assign(obj, fn)


# ------------------------------------------------------------- PART A
def fix_weights(O):
    reweight(O['FOX_Scarf_Roll'], body_w)
    for n in ('FOX_Scarf_Flap', 'FOX_Scarf_Emblem'):
        def flap_w(p):
            f = smoothstep(0.37, 0.405, p.z)
            w = {'SCARF_FLAP': 1 - f}
            for k, v in body_w(p).items():
                w[k] = w.get(k, 0.0) + f * v
            return w
        reweight(O[n], flap_w)
    rig = O['FOX_RIG']
    M = rig.matrix_world
    for s, sx in (('L', 1), ('R', -1)):
        b1, b2 = rig.data.bones[f'EAR_{s}_01'], rig.data.bones[f'EAR_{s}_02']
        ex, mid, tip = M @ b1.head_local, M @ b2.head_local, M @ b2.tail_local
        base = O[f'FOX_Ear_{s}'].matrix_world.translation.copy()
        for nm in (f'FOX_Ear_{s}', f'FOX_EarInner_{s}'):
            reweight(O[nm], lambda p, base=base, ex=ex, mid=mid, tip=tip, s=s:
                     chain_weights(p, [base, ex, mid, tip], ['HEAD', f'EAR_{s}_01', f'EAR_{s}_02'], [0.03, 0.10]))
        a, pw = rig.data.bones[f'ARM_{s}'], rig.data.bones[f'PAW_{s}']
        sh, el, end = M @ a.head_local, M @ a.tail_local, M @ pw.tail_local
        p0 = Vector((sx * 0.095, 0.0, 0.365))
        reweight(O[f'FOX_Arm_{s}'], lambda p, p0=p0, sh=sh, el=el, end=end, s=s:
                 chain_weights(p, [p0, sh, el, end], ['SPINE', f'ARM_{s}', f'PAW_{s}'], [0.05, 0.035]))


# ------------------------------------------------------------- PART B
def strip_drivers_and_face_bone(O):
    removed = 0
    for idb in list(bpy.data.objects) + list(bpy.data.shape_keys):
        ad = idb.animation_data
        if ad:
            for fc in list(ad.drivers):
                ad.drivers.remove(fc)
                removed += 1
    rig = O['FOX_RIG']
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    rig.data.edit_bones.remove(rig.data.edit_bones['FACE'])
    bpy.ops.object.mode_set(mode='OBJECT')
    for a in [a for a in bpy.data.actions if a.name.startswith('FOX_DeformationTest')]:
        bpy.data.actions.remove(a)
    return removed


def ensure_basis(obj):
    if obj.data.shape_keys is None:
        obj.shape_key_add(name='Basis', from_mix=False)
    return obj.data.shape_keys


def add_hide_key(obj):
    ensure_basis(obj)
    c = sum((v.co for v in obj.data.vertices), Vector()) / len(obj.data.vertices)
    k = obj.shape_key_add(name='hide', from_mix=False)
    for d in k.data:
        d.co = c
    k.value = 0.0


def collapse_to_show(obj):
    """Basis collapses to a point (invisible); 'show' restores the part.
    Existing variant keys keep their absolute shapes, so each one is a
    complete alternative (e.g. brow Sad shows the sad brow on its own)."""
    keys = ensure_basis(obj)
    basis = keys.key_blocks[0]
    shown = [d.co.copy() for d in basis.data]
    others = {kb.name: [d.co.copy() for d in kb.data] for kb in keys.key_blocks[1:]}
    k = obj.shape_key_add(name='show', from_mix=False)
    for d, co in zip(k.data, shown):
        d.co = co
    c = sum(shown, Vector()) / len(shown)
    for d in basis.data:
        d.co = c
    for v in obj.data.vertices:
        v.co = c
    for name, cos in others.items():          # keep absolute variant shapes
        for d, co in zip(keys.key_blocks[name].data, cos):
            d.co = co
    for kb in keys.key_blocks[1:]:
        kb.value = 0.0
    # move 'show' right after Basis for a tidy morph order
    obj.active_shape_key_index = len(keys.key_blocks) - 1
    while obj.active_shape_key_index > 1:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shape_key_move(type='UP')


def convert_face(O):
    for n in VISIBLE_PARTS:
        add_hide_key(O[n])
    for n in SWAP_PARTS:
        collapse_to_show(O[n])
    for n in VISIBLE_PARTS + SWAP_PARTS:
        o = O[n]
        o.hide_render = False
        o.hide_viewport = False
        o.hide_set(False)
        for kb in o.data.shape_keys.key_blocks[1:]:
            kb.slider_min, kb.slider_max = 0.0, 1.0


# ------------------------------------------------------------- actions
class Keyer:
    """Keys an armature and several shape-key datablocks into ONE slotted
    action (Blender 5) so glTF exports bones + morph weights together."""

    def __init__(self, name, O):
        self.O = O
        self.rig = O['FOX_RIG']
        self.act = bpy.data.actions.new(name)
        self.act.use_fake_user = True
        self.rig.animation_data_create()
        self.rig.animation_data.action = self.act

    def wq(self, bname, axis, deg):
        pb = self.rig.pose.bones[bname]
        R = (self.rig.matrix_world.to_3x3() @ pb.bone.matrix_local.to_3x3()).to_quaternion()
        return R.inverted() @ Quaternion(Vector(axis).normalized(), math.radians(deg)) @ R

    def rot(self, f, bname, rots=()):
        q = Quaternion()
        for axis, deg in rots:
            q = self.wq(bname, axis, deg) @ q
        pb = self.rig.pose.bones[bname]
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = q
        pb.keyframe_insert('rotation_quaternion', frame=f, group=bname)

    def scale(self, f, bname, s):
        pb = self.rig.pose.bones[bname]
        pb.scale = s
        pb.keyframe_insert('scale', frame=f, group=bname)

    def morph(self, f, mesh, key, value):
        kd = self.O[mesh].data.shape_keys
        if kd.animation_data is None:
            kd.animation_data_create()
        if kd.animation_data.action != self.act:
            kd.animation_data.action = self.act
        kb = kd.key_blocks[key]
        kb.value = value
        kb.keyframe_insert('value', frame=f)

    def expression(self, f, name, parts=None):
        target = EXPRESSIONS[name]
        for mesh in (parts or (VISIBLE_PARTS + SWAP_PARTS)):
            for kb in self.O[mesh].data.shape_keys.key_blocks[1:]:
                self.morph(f, mesh, kb.name, float(target.get(mesh, {}).get(kb.name, 0.0)))

    def finish(self, start, end, cyclic=False):
        self.act.frame_range = (start, end)
        self.act.use_frame_range = True
        self.act.use_cyclic = cyclic


TAILS = ['TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04']
# Tail sway is authored around the camera/view axis behind the fox (world Y):
# the tail swings left/right across the back instead of yawing into the rump.
TAIL_AXIS = (0, 1, 0)


def tail_pose(k, f, amount):
    for i, t in enumerate(TAILS):
        # 'amount' = total chain rotation, spread 35 / 22 / 22 / 22 % (root gets a bit more)
        k.rot(f + i, t, [(TAIL_AXIS, amount * (0.35 if i == 0 else 0.22))])


def make_prototype_actions(O):
    acts = []
    # fox_idle_test — 72 f loop: breathing, head bob, ear/tail drift, one blink
    k = Keyer('fox_idle_test', O)
    for f, br, hb, ear, tl in ((1, 0, 0, 0, 0), (19, 1, 1, 1, 1), (37, 0, 0, 0, 0), (55, 1, -1, -1, -1), (73, 0, 0, 0, 0)):
        k.scale(f, 'HIPS', (1 + 0.008 * br, 1 + 0.018 * br, 1 + 0.008 * br))
        k.rot(f, 'HEAD', [((1, 0, 0), -2.5 * hb), ((0, 0, 1), 2 * hb)])
        k.rot(f, 'EAR_L_01', [((0, 1, 0), 4 * ear)])
        k.rot(f, 'EAR_R_01', [((0, 1, 0), -4 * ear)])
        tail_pose(k, f, 8 * tl) if f < 70 else tail_pose(k, f - 3, 0)
    for f, e in ((1, 'neutral'), (44, 'neutral'), (47, 'blink'), (50, 'neutral'), (73, 'neutral')):
        k.expression(f, e, parts=EYES)
    k.finish(1, 73, cyclic=True)
    acts.append(k.act)

    # fox_blink_test — 24 f, eyes only (morph targets)
    k = Keyer('fox_blink_test', O)
    k.rot(1, 'HEAD')
    for f, e in ((1, 'neutral'), (6, 'neutral'), (9, 'blink'), (12, 'neutral'), (16, 'neutral'), (18, 'blink'), (21, 'neutral'), (24, 'neutral')):
        k.expression(f, e, parts=EYES)
    k.finish(1, 24)
    acts.append(k.act)

    # fox_head_turn_test — 72 f
    k = Keyer('fox_head_turn_test', O)
    for f, yaw, pitch in ((1, 0, 0), (12, 40, 0), (24, 0, 0), (36, -40, 0), (48, 0, 0), (56, 0, 18), (64, 0, -15), (72, 0, 0)):
        k.rot(f, 'HEAD', [((0, 0, 1), yaw * 0.55), ((1, 0, 0), -pitch * 0.55)])
        k.rot(f, 'NECK', [((0, 0, 1), yaw * 0.45), ((1, 0, 0), -pitch * 0.45)])
        k.rot(f, 'SCARF_FLAP', [((0, 0, 1), yaw * 0.12)])
    k.finish(1, 72)
    acts.append(k.act)

    # fox_tail_sway_test — 48 f loop with follow-through
    k = Keyer('fox_tail_sway_test', O)
    for f, a in ((1, 0), (13, 1), (25, 0), (37, -1), (49, 0)):
        tail_pose(k, f if f > 1 else 1, 30 * a)
    k.finish(1, 49, cyclic=True)
    acts.append(k.act)

    # leave the armature on its rest pose; actions stay as fake-user assets
    O['FOX_RIG'].animation_data.action = None
    for n in VISIBLE_PARTS + SWAP_PARTS:
        ad = O[n].data.shape_keys.animation_data
        if ad:
            ad.action = None
    for pb in O['FOX_RIG'].pose.bones:
        pb.rotation_quaternion = Quaternion()
        pb.scale = (1, 1, 1)
    return acts


def main():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    fix_weights(O)
    n_drv = strip_drivers_and_face_bone(O)
    convert_face(O)
    acts = make_prototype_actions(O)
    bpy.context.scene['fox_gate'] = 'D1.1 rig correction + GLB compatibility'
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    json.dump({
        'asset': 'LifeQuest Fox V2', 'gate': 'D1.1',
        'mechanism': 'glTF morph targets only. Default-visible parts carry a "hide" morph (collapse to a point); swap parts have a collapsed basis and a "show" morph; brow variants Sad/Proud are complete alternatives (use instead of show). No visibility animation, no drivers.',
        'default_visible': VISIBLE_PARTS, 'swap_parts': SWAP_PARTS,
        'morphs': {n: [kb.name for kb in O[n].data.shape_keys.key_blocks[1:]] for n in VISIBLE_PARTS + SWAP_PARTS},
        'expressions': EXPRESSIONS,
        'runtime_note': 'Three.js: set mesh.morphTargetInfluences[mesh.morphTargetDictionary[name]]; set frustumCulled=false on collapsed-basis meshes (their bounding sphere is a point).',
    }, open(os.path.join(ROOT_DIR, '03_RIG', 'face_morph_map.json'), 'w'), indent=2)
    print('saved', OUT, '| drivers removed:', n_drv, '| actions:', [a.name for a in acts])


if __name__ == '__main__':
    main()
