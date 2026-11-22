"""Fox V2 — Blender portability check (no Claude, no project scripts needed beyond this file).

Opens every Fox V2 source .blend in a factory-settings Blender and checks that it is self-contained and editable:
  * external references: linked libraries, images, fonts, sounds, movie clips, caches, volumes; absolute / missing paths
  * add-on / script dependencies: registered text blocks, PYTHON constraints, driver expressions, ID properties of add-ons
  * content inventory: meshes, materials, armatures / bones, shape keys, actions (+ slots), accessory attachments
  * playback: every action is assigned and evaluated at 5 frames; bones and deformed meshes must actually move
  * editing round trip (on a COPY in a temp dir): add a keyframe, change a shape key, save, reopen, verify
Never saves over the inspected files.

Run with Blender (Windows / macOS / Linux):
    blender -b --factory-startup --python 08_VALIDATION/scripts/portability_blender_check.py -- <LifeQuest_Fox_V2 root> [out.json]
or with the bpy module:
    python portability_blender_check.py <root> [out.json]
"""
import json
import os
import re
import sys
import tempfile
import time

import bpy  # noqa: E402

FILES = [  # current sources (the hand-off set); checkpoints / superseded files are listed with role 'history'
    ('02_MODEL/fox_master.blend', 'master model (modelling source)'),
    ('03_RIG/fox_rig_d1_1.blend', 'canonical rig + model (approved D1.1)'),
    ('04_ANIMATIONS/fox_anim_e2.blend', 'core animation source (E2, 13 clips)'),
    ('04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend', 'G1.1 quest / reward / streak clips'),
    ('04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend', 'G2.1 daily-life clips'),
    ('04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend', 'G3 challenge / social clips'),
    ('05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend', 'H1 cosmetic prototypes'),
]
ABS = re.compile(r'^(/|[A-Za-z]:[\\/]|\\\\)')
SUSPECT = re.compile(r'(home/claude|/tmp/|/mnt/|g2/work|Users[\\/]|OneDrive|Dropbox|Google Drive)', re.I)


def ext_refs():
    out = []
    for coll, kind in ((bpy.data.libraries, 'library'), (bpy.data.images, 'image'), (bpy.data.fonts, 'font'), (bpy.data.sounds, 'sound'),
                       (bpy.data.movieclips, 'movieclip'), (bpy.data.cache_files, 'cache'), (bpy.data.volumes, 'volume')):
        for idb in coll:
            fp = getattr(idb, 'filepath', '') or ''
            if kind == 'font' and fp == '<builtin>':
                continue
            if kind == 'image' and idb.source in ('GENERATED', 'VIEWER'):
                continue
            packed = bool(getattr(idb, 'packed_file', None)) or bool(getattr(idb, 'packed_files', None))
            absf = bpy.path.abspath(fp) if fp else ''
            out.append({'kind': kind, 'name': idb.name, 'filepath': fp, 'packed': packed, 'absolute': bool(ABS.match(fp)),
                        'exists': bool(absf) and os.path.exists(absf), 'suspect': bool(SUSPECT.search(fp))})
    return out


def script_deps():
    deps = []
    for t in bpy.data.texts:
        if t.use_module:
            deps.append(f'registered text block: {t.name}')
    for o in bpy.data.objects:
        for c in o.constraints:
            if c.type == 'PYTHON':
                deps.append(f'PYTHON constraint on {o.name}')
        if o.type == 'ARMATURE':
            for pb in o.pose.bones:
                for c in pb.constraints:
                    if c.type == 'PYTHON':
                        deps.append(f'PYTHON constraint on bone {pb.name}')
    drivers = 0
    for idb in list(bpy.data.objects) + list(bpy.data.shape_keys) + list(bpy.data.materials) + list(bpy.data.armatures):
        ad = getattr(idb, 'animation_data', None)
        for d in (ad.drivers if ad else []):
            drivers += 1
            if d.driver.type == 'SCRIPTED' and re.search(r'[A-Za-z_]\w*\s*\(', d.driver.expression or ''):
                deps.append(f'scripted driver with a function call on {idb.name}: {d.driver.expression}')
    addon_props = sorted({k for idb in list(bpy.data.objects) + list(bpy.data.armatures) + list(bpy.data.scenes)
                          for k in idb.keys() if k in ('rig_id', 'rigify_type', 'rigify_parameters') or k.startswith(('rigify', 'mmd_', 'xps_'))})
    deps += [f'add-on ID property: {k}' for k in addon_props]
    return deps, drivers


def inventory():
    rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    attach = []
    for o in bpy.data.objects:
        if o.parent_type == 'BONE':
            attach.append(f'{o.name} → bone {o.parent_bone}')
        for c in o.constraints:
            if c.type == 'CHILD_OF' and c.subtarget:
                attach.append(f'{o.name} → Child Of {c.subtarget}')
    return {
        'objects': len(bpy.data.objects), 'meshes': len(bpy.data.meshes), 'mesh_objects': sum(o.type == 'MESH' for o in bpy.data.objects),
        'materials': len(bpy.data.materials), 'materials_without_users': sum(m.users == 0 for m in bpy.data.materials),
        'armatures': len(rigs), 'bones': {r.name: len(r.data.bones) for r in rigs},
        'shape_keys': {k.user.name: len(k.key_blocks) for k in bpy.data.shape_keys if k.user},
        'actions': len(bpy.data.actions), 'action_names': sorted(a.name for a in bpy.data.actions),
        'skinned_meshes': sum(1 for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)),
        'bone_attached_objects': len(attach), 'attachments_sample': attach[:12],
        'missing_modifier_targets': [f'{o.name}.{m.name}' for o in bpy.data.objects for m in o.modifiers if m.type == 'ARMATURE' and m.object is None],
    }


def assign(rig, act):
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    slots = [s for s in getattr(act, 'slots', []) if s.target_id_type == 'OBJECT']
    if slots:
        ad.action_slot = slots[0]
    for key in bpy.data.shape_keys:
        sl = next((s for s in getattr(act, 'slots', []) if s.target_id_type == 'KEY' and s.name_display == key.name), None)
        if sl:
            kad = key.animation_data or key.animation_data_create()
            kad.action = act
            kad.action_slot = sl


def playback(rig):
    res, bad = {}, []
    if not rig:
        return res, bad
    skinned = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == rig for m in o.modifiers)]
    probe = max(skinned, key=lambda o: len(o.data.vertices)) if skinned else None
    for act in bpy.data.actions:
        if not any(s.target_id_type == 'OBJECT' for s in getattr(act, 'slots', [])) and not getattr(act, 'fcurves', None):
            continue
        assign(rig, act)
        f0, f1 = (int(x) for x in act.frame_range)
        moves, vmove, kmove, prev, prevv, prevk = 0.0, 0.0, 0.0, None, None, None
        # 9 frames at irregular fractions: evenly spaced samples can coincide with a loop's own period
        for f in sorted({int(round(f0 + (f1 - f0) * x)) for x in (0, 0.07, 0.19, 0.31, 0.43, 0.58, 0.71, 0.86, 1.0)}):
            bpy.context.scene.frame_set(f)
            mats = [pb.matrix.copy() for pb in rig.pose.bones]
            if prev is not None:
                moves = max(moves, max(sum(abs(a[i][j] - b[i][j]) for i in range(3) for j in range(4)) for a, b in zip(mats, prev)))
            prev = mats
            kv = [kb.value for k in bpy.data.shape_keys for kb in k.key_blocks]       # shape-key-only clips (blink)
            if prevk is not None and kv:
                kmove = max(kmove, max(abs(a - b) for a, b in zip(kv, prevk)))
            prevk = kv
            if probe:
                dg = bpy.context.evaluated_depsgraph_get()
                e = probe.evaluated_get(dg); m = e.to_mesh()
                v = [m.vertices[i].co.copy() for i in range(0, len(m.vertices), max(1, len(m.vertices) // 50))]
                e.to_mesh_clear()
                if prevv is not None:
                    vmove = max(vmove, max((a - b).length for a, b in zip(v, prevv)))
                prevv = v
        res[act.name] = {'frames': [f0, f1], 'bone_change': round(moves, 5), 'mesh_move_m': round(vmove, 5), 'shape_key_change': round(kmove, 4)}
        if moves < 1e-5 and vmove < 1e-5 and kmove < 1e-4 and f1 > f0:
            bad.append(act.name)
    return res, bad


def edit_roundtrip(path, rig):
    """On a copy: key a bone + a shape key, save, reopen, verify the edit is there and plays."""
    if not rig or not bpy.data.actions:
        return {'skipped': 'no rig / actions'}
    tmpd = tempfile.mkdtemp(prefix='fox_port_')
    copy = os.path.join(tmpd, 'edit_test.blend')
    act = bpy.data.actions[0]
    assign(rig, act)
    pb = rig.pose.bones.get('HEAD') or rig.pose.bones[0]
    f = int(act.frame_range[0]) + 3
    bpy.context.scene.frame_set(f)
    pb.rotation_mode = pb.rotation_mode
    pb.location = (0.0, 0.0, 0.0123)
    ok_key = pb.keyframe_insert('location', index=2, frame=f)
    sk = next((k for k in bpy.data.shape_keys if len(k.key_blocks) > 1), None)
    if sk:   # key it: an action may drive this shape key, so a plain value would be overridden on playback
        kb = sk.key_blocks[1]; kb.value = 0.37; kb.keyframe_insert('value', frame=f)
    names = (rig.name, act.name, pb.name, sk.name if sk else None, sk.key_blocks[1].name if sk else None)   # RNA refs die on reopen
    bpy.ops.wm.save_as_mainfile(filepath=copy, copy=True)
    bpy.ops.wm.open_mainfile(filepath=copy, load_ui=False)
    rig2 = bpy.data.objects[names[0]]
    assign(rig2, bpy.data.actions[names[1]])
    bpy.context.scene.frame_set(f)
    z = rig2.pose.bones[names[2]].location[2]
    sk2 = bpy.data.shape_keys[names[3]].key_blocks[names[4]].value if names[3] else None
    out = {'copy': 'temp dir (deleted)', 'action': names[1], 'bone': names[2], 'keyframe_inserted': bool(ok_key),
           'reopened_value': round(z, 5), 'keyframe_survived': abs(z - 0.0123) < 1e-6,
           'shape_key': f'{names[3]}/{names[4]}' if names[3] else None, 'shape_key_value_survived': (abs(sk2 - 0.37) < 1e-6) if names[3] else None}
    os.remove(copy); os.rmdir(tmpd)
    bpy.ops.wm.open_mainfile(filepath=path, load_ui=False)
    return out


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    root = os.path.abspath(argv[0]) if argv else os.getcwd()
    outp = argv[1] if len(argv) > 1 else None
    report = {'blender': bpy.app.version_string, 'root': root, 'started': time.strftime('%Y-%m-%d %H:%M:%S'),
              'factory_settings': True, 'enabled_addons': [], 'files': {}}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    report['enabled_addons'] = sorted(a.module for a in bpy.context.preferences.addons)
    only = os.environ.get('FOX_PORT_ONLY')            # optional: one file per run (slow / time-limited machines)
    for rel, role in FILES:
        if only and only not in rel:
            continue
        path = os.path.join(root, rel)
        r = {'role': role, 'exists': os.path.exists(path)}
        report['files'][rel] = r
        if not r['exists']:
            r['verdict'] = 'FAIL (missing)'; continue
        t0 = time.time()
        try:
            bpy.ops.wm.open_mainfile(filepath=path, load_ui=False)
        except Exception as e:  # noqa: BLE001
            r['verdict'] = f'FAIL (open: {e})'; continue
        r['open_s'] = round(time.time() - t0, 2)
        r['version_saved'] = '.'.join(map(str, bpy.data.version))
        r['external'] = ext_refs()
        r['script_deps'], r['drivers'] = script_deps()
        r['inventory'] = inventory()
        rig = bpy.data.objects.get('FOX_RIG') or next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        r['playback'], bad = playback(rig)
        r['edit'] = edit_roundtrip(path, rig)
        unresolved = [x for x in r['external'] if not x['packed'] and not x['exists']]
        absolute = [x for x in r['external'] if not x['packed'] and (x['absolute'] or x['suspect'])]
        problems = []
        if unresolved: problems.append(f'{len(unresolved)} missing external file(s)')
        if absolute: problems.append(f'{len(absolute)} absolute / machine path(s)')
        if r['script_deps']: problems.append('script / add-on dependency')
        if bad: problems.append(f'actions that do not move: {bad}')
        if r['inventory']['missing_modifier_targets']: problems.append('armature modifiers without target')
        e = r['edit']
        if 'skipped' not in e and not (e['keyframe_survived'] and e['shape_key_value_survived'] in (True, None)): problems.append('edit round trip failed')
        r['problems'] = problems
        r['verdict'] = 'PASS' if not problems else 'FAIL'
        print(f"{r['verdict']:4s} {rel}  actions {r['inventory']['actions']}  meshes {r['inventory']['meshes']}  ext {len(r['external'])}  {problems}", flush=True)
    report['finished'] = time.strftime('%Y-%m-%d %H:%M:%S')
    report['summary'] = {k: v['verdict'] for k, v in report['files'].items()}
    if outp:
        json.dump(report, open(outp, 'w'), indent=1)
        print('wrote', outp)


if __name__ == '__main__':
    main()
