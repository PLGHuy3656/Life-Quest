"""Gate D1.1 — deformation test action on the corrected rig (morph-based face).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/rig_tests_d1_1.py
Adds action "FOX_DeformationTest_D1_1" (frames 1-372) + markers to
03_RIG/fox_rig_d1_1.blend. Same six tests as D1, with the D1.1 changes:
tail sway around the view axis behind the fox, forward ear bend spread over
both ear bones, expressions keyed as morph-target weights.
Other scripts select this module with  FOX_TESTS=rig_tests_d1_1.
"""
import os
import sys

import bpy
from mathutils import Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from rig_d1_1 import Keyer, tail_pose, VISIBLE_PARTS, SWAP_PARTS, ROOT_DIR  # noqa: E402

RIG_FILE = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_d1_1.blend')
ACTION = 'FOX_DeformationTest_D1_1'
TESTS = {
    'T1': ('Head turn L/R, look up/down', 1, 72, [12, 36, 56, 64]),
    'T2': ('Ears tilt independently', 73, 120, [84, 108]),
    'T3': ('Tail sway left/right', 121, 180, [132, 156]),
    'T4': ('Arms lift and wave', 181, 252, [192, 206, 214]),
    'T5': ('Body squash and stretch', 253, 300, [264, 276]),
    'T6': ('Blink, smile, expressions', 301, 372, [304, 314, 326, 338, 350, 362]),
}
POSE_LABELS = {12: 'head turn +40°', 36: 'head turn −40°', 56: 'look up 22°', 64: 'look down 18°',
               84: 'L ear out 30° + tip 25°', 108: 'R ear fwd 28° + tip 10°, L ear back 20°',
               132: 'tail sway +30° (view axis)', 156: 'tail sway −30° (view axis)',
               192: 'both arms up 60°', 206: 'wave (L arm 130°, paw +22°)', 214: 'wave (paw −22°)',
               264: 'squash 0.92 / 1.04', 276: 'stretch 1.07 / 0.97',
               304: 'blink', 314: 'happy', 326: 'proud', 338: 'sad', 350: 'surprised', 362: 'sleepy'}


def run():
    bpy.ops.wm.open_mainfile(filepath=RIG_FILE)
    sc = bpy.context.scene
    O = bpy.data.objects
    for a in [a for a in bpy.data.actions if a.name.startswith(ACTION)]:
        bpy.data.actions.remove(a)
    sc.timeline_markers.clear()
    k = Keyer(ACTION, O)
    k.act.use_fake_user = False
    rig = O['FOX_RIG']
    bones = [b.name for b in rig.pose.bones if not b.name.startswith('ATT_')]
    for b in bones:
        k.rot(1, b)
    k.scale(1, 'HIPS', (1, 1, 1))
    k.expression(1, 'neutral')

    for f, yaw, pitch in ((12, 40, 0), (24, 0, 0), (36, -40, 0), (48, 0, 0), (56, 0, 22), (64, 0, -18), (72, 0, 0)):
        k.rot(f, 'HEAD', [((0, 0, 1), yaw * 0.55), ((1, 0, 0), -pitch * 0.55)])
        k.rot(f, 'NECK', [((0, 0, 1), yaw * 0.45), ((1, 0, 0), -pitch * 0.45)])
        k.rot(f, 'SCARF_FLAP', [((0, 0, 1), yaw * 0.12)])

    ears = ['EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02']
    for b in ears:
        k.rot(73, b)
    k.rot(84, 'EAR_L_01', [((0, 1, 0), 30)])
    k.rot(84, 'EAR_L_02', [((0, 1, 0), 25)])
    k.rot(84, 'EAR_R_01')
    k.rot(84, 'EAR_R_02')
    for b in ears:
        k.rot(96, b)
    # forward bend (tip toward the face = -Y; +X rotation): most of it at the
    # base, a little at the tip. NOTE: D1 used the opposite sign, so its
    # "forward" pose was really a backward bend (rim showing over the tip).
    k.rot(108, 'EAR_R_01', [((1, 0, 0), 28)])
    k.rot(108, 'EAR_R_02', [((1, 0, 0), 10)])
    k.rot(108, 'EAR_L_01', [((1, 0, 0), -20)])
    k.rot(108, 'EAR_L_02')
    for b in ears:
        k.rot(120, b)

    tail_pose(k, 121, 0)
    for f, a in ((132, 30), (144, 0), (156, -30), (168, 0)):
        tail_pose(k, f, a)
    tail_pose(k, 177, 0)

    arms = ['ARM_L', 'PAW_L', 'ARM_R', 'PAW_R']
    for b in arms:
        k.rot(181, b)
    k.rot(192, 'ARM_L', [((0, 1, 0), -60)])
    k.rot(192, 'ARM_R', [((0, 1, 0), 60)])
    k.rot(200, 'ARM_R')
    k.rot(200, 'ARM_L', [((0, 1, 0), -130)])
    for f, w in ((206, 22), (210, -22), (214, -22), (218, 22), (222, -22)):
        k.rot(f, 'PAW_L', [((0, 1, 0), w)])
    for f in (206, 214, 222):
        k.rot(f, 'ARM_L', [((0, 1, 0), -130)])
    for b in arms:
        k.rot(240, b)
        k.rot(252, b)

    k.scale(253, 'HIPS', (1, 1, 1))
    k.scale(264, 'HIPS', (1.04, 0.92, 1.04))
    k.scale(276, 'HIPS', (0.97, 1.07, 0.97))
    k.scale(288, 'HIPS', (1, 1, 1))
    k.scale(300, 'HIPS', (1, 1, 1))
    k.rot(253, 'SCARF_FLAP')
    k.rot(266, 'SCARF_FLAP', [((1, 0, 0), -10)])
    k.rot(278, 'SCARF_FLAP', [((1, 0, 0), 8)])
    k.rot(290, 'SCARF_FLAP')

    for f, e in ((301, 'neutral'), (304, 'blink'), (307, 'neutral'), (314, 'happy'), (320, 'happy'),
                 (326, 'proud'), (332, 'proud'), (338, 'sad'), (344, 'sad'), (350, 'surprised'),
                 (356, 'surprised'), (362, 'sleepy'), (368, 'sleepy'), (372, 'neutral')):
        k.expression(f, e)
    # expressions switch instantly (swap parts collapse/expand), blink eases
    from bpy_extras import anim_utils
    for slot in k.act.slots:
        cb = anim_utils.action_get_channelbag_for_slot(k.act, slot)
        if cb and slot.target_id_type == 'KEY':
            for fc in cb.fcurves:
                if fc.data_path.endswith('["show"].value') or fc.data_path.endswith('["hide"].value'):
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'CONSTANT'
    sc.frame_start, sc.frame_end = 1, 372
    for tid, (label, a, b, _) in TESTS.items():
        sc.timeline_markers.new(f'{tid} {label}', frame=a)
    sc.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=RIG_FILE, compress=True)
    print('keyed', ACTION, 'slots:', len(k.act.slots))


if __name__ == '__main__':
    run()
