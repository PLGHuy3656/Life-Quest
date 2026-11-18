"""Gate D1 — mandatory deformation test sequences (keyframed into the rig file).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/rig_tests.py
Adds action "FOX_DeformationTest" (frames 1-372, 24 fps) with timeline
markers to 03_RIG/fox_rig_prototype.blend. Poses are deliberately strong so
deformation problems show up instead of being hidden.
"""
import math
import os
import bpy
from mathutils import Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
RIG_FILE = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_prototype.blend')

# test id: (label, first frame, last frame, key poses to inspect)
TESTS = {
    'T1': ('Head turn L/R, look up/down', 1, 72, [12, 36, 56, 64]),
    'T2': ('Ears tilt independently', 73, 120, [84, 108]),
    'T3': ('Tail sway left/right', 121, 180, [132, 156]),
    'T4': ('Arms lift and wave', 181, 252, [192, 206, 214]),
    'T5': ('Body squash and stretch', 253, 300, [264, 276]),
    'T6': ('Blink, smile, expressions', 301, 372, [304, 314, 326, 338, 350, 362]),
}
POSE_LABELS = {12: 'head turn +40°', 36: 'head turn −40°', 56: 'look up 22°', 64: 'look down 18°',
               84: 'L ear out 30° + tip 25°', 108: 'R ear fwd 22° + tip 15°, L ear back 20°',
               132: 'tail sway +20° chain (toward body)', 156: 'tail sway −28° chain',
               192: 'both arms up 60°', 206: 'wave (L arm 130°, paw +22°)', 214: 'wave (paw −22°)',
               264: 'squash 0.92 / 1.04', 276: 'stretch 1.07 / 0.97',
               304: 'blink', 314: 'happy', 326: 'proud', 338: 'sad', 350: 'surprised', 362: 'sleepy'}


def run():
    bpy.ops.wm.open_mainfile(filepath=RIG_FILE)
    sc = bpy.context.scene
    rig = bpy.data.objects['FOX_RIG']
    P = rig.pose.bones
    rig.animation_data_create()
    # idempotent: drop any previous test action and markers before re-keying
    for a in [a for a in bpy.data.actions if a.name.startswith('FOX_DeformationTest')]:
        bpy.data.actions.remove(a)
    sc.timeline_markers.clear()
    act = bpy.data.actions.new('FOX_DeformationTest')
    rig.animation_data.action = act
    sc.render.fps = 24
    sc.frame_start, sc.frame_end = 1, 372

    def wq(bname, axis, deg):
        """World-axis rotation expressed in the bone's local rest frame."""
        pb = P[bname]
        R = (rig.matrix_world.to_3x3() @ pb.bone.matrix_local.to_3x3()).to_quaternion()
        qw = Quaternion(Vector(axis).normalized(), math.radians(deg))
        return R.inverted() @ qw @ R

    def key_rot(frame, bname, axis=(0, 0, 1), deg=0.0, q=None):
        P[bname].rotation_quaternion = q if q is not None else wq(bname, axis, deg)
        P[bname].keyframe_insert('rotation_quaternion', frame=frame, group=bname)

    def key_rot2(frame, bname, rots):
        q = Quaternion()
        for axis, deg in rots:
            q = wq(bname, axis, deg) @ q
        key_rot(frame, bname, q=q)

    def key_scale(frame, bname, s):
        P[bname].scale = s
        P[bname].keyframe_insert('scale', frame=frame, group=bname)

    def rest(frame, names):
        for n in names:
            key_rot(frame, n, q=Quaternion())

    face = P['FACE']

    def key_face(frame, **vals):
        for k in ('eye_blink', 'eye_wide', 'eye_sad', 'eye_halflid', 'eye_proud', 'brow_sad', 'brow_proud',
                  'eyes_mode', 'mouth_mode', 'brows_visible'):
            default = 0 if isinstance(face[k], int) else 0.0
            face[k] = type(face[k])(vals.get(k, default))
            face.keyframe_insert(f'["{k}"]', frame=frame, group='FACE')

    ALL = [b.name for b in P if b.name not in ('FACE',) and not b.name.startswith('ATT_')]
    rest(1, ALL)
    key_scale(1, 'HIPS', (1, 1, 1))
    key_face(1)

    # T1 head turn/look; scarf flap lags slightly
    for f, yaw, pitch in ((12, 40, 0), (24, 0, 0), (36, -40, 0), (48, 0, 0), (56, 0, 22), (64, 0, -18), (72, 0, 0)):
        # look rotation split HEAD 55 % / NECK 45 %: the scarf roll rides on NECK,
        # so the chin moves less relative to the scarf
        key_rot2(f, 'HEAD', [((0, 0, 1), yaw * 0.55), ((1, 0, 0), -pitch * 0.55)])
        key_rot2(f, 'NECK', [((0, 0, 1), yaw * 0.45), ((1, 0, 0), -pitch * 0.45)])
        key_rot(f, 'SCARF_FLAP', (0, 0, 1), yaw * 0.12)

    # T2 ears, independent
    rest(73, ['EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02'])
    key_rot(84, 'EAR_L_01', (0, 1, 0), 30)
    key_rot(84, 'EAR_L_02', (0, 1, 0), 25)
    rest(84, ['EAR_R_01', 'EAR_R_02'])
    rest(96, ['EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02'])
    key_rot(108, 'EAR_R_01', (1, 0, 0), -22)
    key_rot(108, 'EAR_R_02', (1, 0, 0), -15)
    key_rot(108, 'EAR_L_01', (1, 0, 0), 20)
    rest(108, ['EAR_L_02'])
    rest(120, ['EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02'])

    # T3 tail sway with follow-through
    tails = ['TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04']
    rest(121, tails)
    # swing toward the body is kept smaller (the tail sits beside the rump)
    for f, sgn in ((132, 0.7), (144, 0), (156, -1), (168, 0)):
        for i, t in enumerate(tails):
            key_rot(f + i, t, (0, 0, 1), sgn * (10 if i == 0 else 6))
    rest(180, tails)

    # T4 arms lift + wave
    arms = ['ARM_L', 'PAW_L', 'ARM_R', 'PAW_R']
    rest(181, arms)
    key_rot(192, 'ARM_L', (0, 1, 0), -60)
    key_rot(192, 'ARM_R', (0, 1, 0), 60)
    key_rot(200, 'ARM_R', (0, 1, 0), 0)
    key_rot(200, 'ARM_L', (0, 1, 0), -130)
    for f, w in ((206, 22), (210, -22), (214, -22), (218, 22), (222, -22)):
        key_rot(f, 'PAW_L', (0, 1, 0), w)
    key_rot(206, 'ARM_L', (0, 1, 0), -130)
    key_rot(214, 'ARM_L', (0, 1, 0), -130)
    key_rot(222, 'ARM_L', (0, 1, 0), -130)
    rest(240, arms)
    rest(252, arms)

    # T5 squash & stretch on HIPS (NECK/ARMS/TAIL_01 ignore scale -> head stays undistorted)
    key_scale(253, 'HIPS', (1, 1, 1))
    # gentle squash & stretch (volume roughly preserved)
    key_scale(264, 'HIPS', (1.04, 0.92, 1.04))
    key_scale(276, 'HIPS', (0.97, 1.07, 0.97))
    key_scale(288, 'HIPS', (1, 1, 1))
    key_scale(300, 'HIPS', (1, 1, 1))
    key_rot(253, 'SCARF_FLAP', (1, 0, 0), 0)
    key_rot(266, 'SCARF_FLAP', (1, 0, 0), -10)   # flap lags behind the squash
    key_rot(278, 'SCARF_FLAP', (1, 0, 0), 8)
    key_rot(290, 'SCARF_FLAP', (1, 0, 0), 0)

    # T6 face
    key_face(301)
    key_face(304, eye_blink=1.0)
    key_face(307)
    key_face(314, eyes_mode=1, mouth_mode=1)                                     # happy
    key_face(326, eye_proud=1.0, brow_proud=1.0, brows_visible=1, mouth_mode=4)   # proud
    key_face(338, eye_sad=1.0, brow_sad=1.0, brows_visible=1, mouth_mode=3)       # sad
    key_face(350, eye_wide=1.0, mouth_mode=1)                                     # surprised
    key_face(362, eyes_mode=2, mouth_mode=2)                                      # sleepy
    key_face(372)

    from bpy_extras import anim_utils   # Blender 5: layered actions -> channelbag
    fcurves = anim_utils.action_get_channelbag_for_slot(act, rig.animation_data.action_slot).fcurves
    for fc in fcurves:
        if fc.data_path.endswith(('eyes_mode"]', 'mouth_mode"]', 'brows_visible"]')):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'
    for tid, (label, a, b, _) in TESTS.items():
        sc.timeline_markers.new(f'{tid} {label}', frame=a)
    sc.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=RIG_FILE, compress=True)
    print('tests keyed:', len(fcurves), 'fcurves')


if __name__ == '__main__':
    run()
