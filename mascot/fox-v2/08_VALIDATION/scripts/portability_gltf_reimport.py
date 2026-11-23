"""Fox V2 GLB portability through Blender's own glTF importer (independent of three.js and of the export scripts).

  1. import fox_v2_anim_e2.glb into a factory-settings Blender; inventory meshes / joints / shape keys / actions
  2. play every base clip and compare the bone heads with the Blender source ground truth (reference poses JSON)
  3. import each animation module (G1.1, G2.1, G3), move its actions onto the BASE armature by bone name (the module
     procedure: animation data only, bound by name) and compare with the module reference poses
  4. import each cosmetic GLB and check its joints match the Fox armature

    python portability_gltf_reimport.py <LifeQuest_Fox_V2 root> <e2_reference.json> <out.json>
    blender -b --factory-startup --python portability_gltf_reimport.py -- <root> <e2_reference.json> <out.json>
"""
import json
import os
import sys

import bpy  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ROOT, E2REF, OUT = argv[0], argv[1], argv[2]
MODS = {'g1_1': ('fox_v2_g1_1_quest_reward_streak.anim.glb', 'fox_v2_g1_1_reference_poses.json'),
        'g2_1': ('fox_v2_g2_1_daily_life.anim.glb', 'fox_v2_g2_1_reference_poses.json'),
        'g3': ('fox_v2_g3_challenge_social.anim.glb', 'fox_v2_g3_reference_poses.json')}


def imp(path):
    before = set(bpy.data.objects)
    acts0 = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before], [a for a in bpy.data.actions if a not in acts0]


def play(arm, act):
    ad = arm.animation_data or arm.animation_data_create()
    ad.action = act
    slot = next((s for s in act.slots if s.target_id_type == 'OBJECT'), None)
    if slot:
        ad.action_slot = slot


def compare(arm, act, ref):
    play(arm, act)
    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    f0 = act.frame_range[0]
    mx, worst, n = 0.0, None, 0
    for f, s in ref.items():
        bpy.context.scene.frame_set(int(f0), subframe=0.0)
        fr = f0 + s['t'] * fps
        bpy.context.scene.frame_set(int(fr), subframe=fr - int(fr))
        M = arm.matrix_world
        for b, p in s['bones'].items():
            pb = arm.pose.bones.get(b)
            if not pb:
                continue
            h = M @ pb.head                                  # importer: glTF Y-up → Blender Z-up (x, -z, y)
            g = (h.x, h.z, -h.y)
            e = sum((g[i] - p[i]) ** 2 for i in range(3)) ** 0.5 * 1000
            n += 1
            if e > mx:
                mx, worst = e, {'frame': f, 'bone': b, 'mm': round(e, 3)}
    return {'maxMm': round(mx, 3), 'worst': worst, 'comparisons': n}


def clip_name(a):
    return a.name.split('_FOX_RIG')[0].split('|')[0]


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    R = {'blender': bpy.app.version_string, 'importer': 'io_scene_gltf2 (bundled)', 'base': {}, 'clips': {}, 'modules': {}, 'cosmetics': {}}
    objs, acts = imp(os.path.join(ROOT, '06_EXPORTS/glb/fox_v2_anim_e2.glb'))
    arm = next(o for o in objs if o.type == 'ARMATURE')
    meshes = [o for o in objs if o.type == 'MESH']
    R['base'] = {'armature': arm.name, 'bones': len(arm.data.bones), 'mesh_objects': len(meshes), 'materials': len({m for o in meshes for m in o.data.materials if m}),
                 'shape_key_meshes': sum(1 for o in meshes if o.data.shape_keys), 'shape_keys': sum(len(o.data.shape_keys.key_blocks) - 1 for o in meshes if o.data.shape_keys),
                 'skinned': sum(1 for o in meshes if any(m.type == 'ARMATURE' for m in o.modifiers)), 'actions': sorted(a.name for a in acts),
                 'images': len(bpy.data.images)}
    ref = json.load(open(E2REF))['clips']
    base_acts = {clip_name(a): a for a in acts if any(s.target_id_type == 'OBJECT' for s in a.slots)}
    for c, r in ref.items():
        R['clips'][c] = compare(arm, base_acts[c], r) if c in base_acts else {'missing': True}
    bone_names = {b.name for b in arm.data.bones}
    for mid, (glb, refn) in MODS.items():
        mobjs, macts = imp(os.path.join(ROOT, '06_EXPORTS/glb/modules', glb))
        marm = next(o for o in mobjs if o.type == 'ARMATURE')
        mref = json.load(open(os.path.join(ROOT, '06_EXPORTS/glb/modules', refn)))['clips']
        same = {b.name for b in marm.data.bones} == bone_names
        res = {'file': glb, 'actions': len([a for a in macts if any(s.target_id_type == 'OBJECT' for s in a.slots)]), 'same_bone_names': same, 'clips': {}}
        for a in macts:
            if not any(s.target_id_type == 'OBJECT' for s in a.slots):
                continue
            c = clip_name(a)
            res['clips'][c] = compare(arm, a, mref[c]) if c in mref else {'noReference': True}   # module action on the BASE armature
        for o in mobjs:
            bpy.data.objects.remove(o, do_unlink=True)
        R['modules'][mid] = res
    cdir = os.path.join(ROOT, '06_EXPORTS/glb/cosmetics')
    for f in sorted(os.listdir(cdir)):
        if not f.endswith('.glb'):
            continue
        cobjs, _ = imp(os.path.join(cdir, f))
        carm = next((o for o in cobjs if o.type == 'ARMATURE'), None)
        cm = [o for o in cobjs if o.type == 'MESH']
        groups = sorted({g.name for o in cm for g in o.vertex_groups})
        R['cosmetics'][f] = {'meshes': len(cm), 'joints_match_fox': bool(carm) and {b.name for b in carm.data.bones} == bone_names,
                             'weighted_groups': groups, 'triangles': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in cm)}
        for o in cobjs:
            bpy.data.objects.remove(o, do_unlink=True)
    json.dump(R, open(OUT, 'w'), indent=1)
    print('base', R['base']['bones'], 'bones', R['base']['mesh_objects'], 'meshes', R['base']['shape_keys'], 'shape keys', len(R['base']['actions']), 'actions')
    print('clips', {k: v.get('maxMm') for k, v in R['clips'].items()})
    for k, v in R['modules'].items():
        print(k, v['actions'], v['same_bone_names'], max((c.get('maxMm', 0) for c in v['clips'].values()), default=None))


main()
