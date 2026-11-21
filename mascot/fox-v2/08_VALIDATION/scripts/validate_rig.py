"""Gate D1 — technical validation of the rig prototype.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/validate_rig.py
Writes 03_RIG/rig_validation_results.json; exits non-zero on failure.
"""
import hashlib
import json
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
RIG = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_prototype.blend')
res = []


def check(name, ok, detail=''):
    res.append({'check': name, 'pass': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def main():
    master = os.path.join(ROOT_DIR, '02_MODEL', 'fox_master.blend')
    ckpt = os.path.join(ROOT_DIR, '02_MODEL', 'checkpoints', 'gateC_r4', 'fox_master.blend')
    check('fox_master.blend untouched (== gateC_r4 checkpoint)', sha(master) == sha(ckpt), sha(master)[:16])
    for f in ('fox_rig_prototype.blend', 'skeleton_spec.json', 'attachment_points.json'):
        check(f'exists 03_RIG/{f}', os.path.exists(os.path.join(ROOT_DIR, '03_RIG', f)))
    spec = json.load(open(os.path.join(ROOT_DIR, '03_RIG', 'skeleton_spec.json')))
    json.load(open(os.path.join(ROOT_DIR, '03_RIG', 'attachment_points.json')))

    bpy.ops.wm.open_mainfile(filepath=RIG)
    check('rig file opens', True)
    rig = bpy.data.objects.get('FOX_RIG')
    check('armature FOX_RIG in RIG collection', rig is not None and rig.users_collection[0].name == 'RIG')
    names = [b.name for b in rig.data.bones]
    check('bones match skeleton_spec.json', sorted(names) == sorted(b['name'] for b in spec['bones']), f'{len(names)} bones')
    req = ['ROOT', 'HIPS', 'SPINE', 'NECK', 'HEAD', 'EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02', 'ARM_L', 'PAW_L',
           'ARM_R', 'PAW_R', 'LEG_L', 'FOOT_L', 'LEG_R', 'FOOT_R', 'TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04',
           'SCARF_FLAP', 'FACE', 'ATT_HAT', 'ATT_GLASSES', 'ATT_SCARF', 'ATT_BACKPACK', 'ATT_HAND_L', 'ATT_HAND_R']
    check('required bones present', all(n in names for n in req))
    bad_parent = [b['name'] for b in spec['bones'] if b['parent'] and rig.data.bones[b['name']].parent.name != b['parent']]
    check('hierarchy matches spec', not bad_parent, ', '.join(bad_parent))
    check('NECK / ARM_* / TAIL_01 ignore body scale (head never squashes)',
          all(rig.data.bones[n].inherit_scale == 'NONE' for n in ('NECK', 'ARM_L', 'ARM_R', 'TAIL_01')))

    deform = {b.name for b in rig.data.bones if b.use_deform}
    skinned = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
    order = [o.name for o in skinned if o.modifiers[0].type != 'ARMATURE']
    check('armature modifier first on skinned meshes', not order, ', '.join(order))
    unknown, unweighted, unnorm = [], [], []
    for o in skinned:
        idx = {g.index: g.name for g in o.vertex_groups}
        unknown += [f'{o.name}:{n}' for n in idx.values() if n not in deform]
        for v in o.data.vertices:
            s = sum(g.weight for g in v.groups if idx[g.group] in deform)
            if s < 1e-4:
                unweighted.append(o.name)
                break
            if abs(s - 1) > 1e-3:
                unnorm.append(o.name)
                break
    check('vertex groups map to deform bones', not unknown, ', '.join(unknown[:5]))
    check('every skinned vertex weighted', not unweighted, ', '.join(unweighted))
    check('weights normalised (sum = 1)', not unnorm, ', '.join(unnorm))
    O = bpy.data.objects
    check('head rigid on HEAD bone', O['FOX_Head'].parent == rig and O['FOX_Head'].parent_type == 'BONE' and O['FOX_Head'].parent_bone == 'HEAD')
    check('backpack attached to SPINE bone', O['FOX_Backpack'].parent_type == 'BONE' and O['FOX_Backpack'].parent_bone == 'SPINE')
    face = rig.pose.bones['FACE']
    keys = ['eye_blink', 'eye_wide', 'eye_sad', 'eye_halflid', 'eye_proud', 'brow_sad', 'brow_proud', 'eyes_mode', 'mouth_mode', 'brows_visible']
    check('FACE control properties present', all(k in face.keys() for k in keys))
    bad_drv = []
    n_drv = 0
    for idb in list(bpy.data.objects) + [k for k in bpy.data.shape_keys]:
        ad = idb.animation_data
        if ad:
            for fc in ad.drivers:
                n_drv += 1
                if not fc.driver.is_valid:
                    bad_drv.append(f'{idb.name}:{fc.data_path}')
    check('all drivers valid', not bad_drv and n_drv > 0, f'{n_drv} drivers' + (f'; bad: {bad_drv[:3]}' if bad_drv else ''))
    act = rig.animation_data.action if rig.animation_data else None
    check('deformation test action present', act is not None and act.name == 'FOX_DeformationTest')
    check('test markers T1-T6', sorted(m.name[:2] for m in bpy.context.scene.timeline_markers) == ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'])
    json.dump({'blender': bpy.app.version_string, 'results': res}, open(os.path.join(ROOT_DIR, '03_RIG', 'rig_validation_results.json'), 'w'), indent=2)
    failed = [r for r in res if not r['pass']]
    print(f'{len(res) - len(failed)}/{len(res)} rig checks passed')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
