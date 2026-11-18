"""Gate D1.1 — export the GLB compatibility test.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/export_glb_d1_1.py
Reads   03_RIG/fox_rig_d1_1.blend (not modified — all prep happens in memory)
Writes  06_EXPORTS/glb/fox_v2_rig_test.glb, 06_EXPORTS/glb/fox_v2_rig_test_manifest.json

Export prep (runtime LOD for the test):
* every Subdivision modifier evaluated at level FOX_EXPORT_LEVEL (default 0 = base cage,
  ~55k tris; the source keeps its subdivision for renders)
* face decals re-fitted to the level-1 head surface with their original clearance
  (they were projected onto the level-2 surface, which lies inside the cage)
* review lights/camera and the internal deformation-test action are not exported
"""
import json
import os
import struct
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_d1_1.blend')
OUT_DIR = os.path.join(ROOT_DIR, '06_EXPORTS', 'glb')
OUT = os.path.join(OUT_DIR, 'fox_v2_rig_test.glb')
EXPORT_ACTIONS = ['fox_idle_test', 'fox_blink_test', 'fox_head_turn_test', 'fox_tail_sway_test']


def head_bvh():
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    o = bpy.data.objects['FOX_Head']
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    t = BVHTree.FromPolygons([o.matrix_world @ v.co for v in me.vertices], [tuple(p.vertices) for p in me.polygons])
    ev.to_mesh_clear()
    return t


def signed(tree, p):
    loc, n, _, _ = tree.find_nearest(p)
    return (p - loc).dot(n), loc, n


def refit_decals(bvh_hi, bvh_lo):
    moved = {}
    face_objs = [o for o in bpy.data.collections['GEO_FACE'].all_objects if o.type == 'MESH']
    for o in face_objs:
        mw, mwi = o.matrix_world, o.matrix_world.inverted()
        if o.name == 'FOX_Nose':          # closed blob: shift rigidly by its centre's delta
            c = mw @ (sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices))
            d_hi = signed(bvh_hi, c)[0]
            d_lo, _, n = signed(bvh_lo, c)
            o.location += n * (d_hi - d_lo) if o.parent is None else (o.parent.matrix_world.inverted().to_3x3() @ (n * (d_hi - d_lo)))
            moved[o.name] = round((d_hi - d_lo) * 1000, 2)
            continue
        blocks = o.data.shape_keys.key_blocks if o.data.shape_keys else None
        sets = [[d for d in kb.data] for kb in blocks] if blocks else [list(o.data.vertices)]
        mx = 0.0
        for items in sets:
            for it in items:
                p = mw @ it.co
                d_hi = signed(bvh_hi, p)[0]
                d_lo, _, n = signed(bvh_lo, p)
                delta = n * (d_hi - d_lo)
                it.co = mwi @ (p + delta)
                mx = max(mx, delta.length)
        if blocks:   # keep mesh verts in sync with the basis key
            for v, d in zip(o.data.vertices, blocks[0].data):
                v.co = d.co
        moved[o.name] = round(mx * 1000, 2)
    return moved


def glb_json(path):
    with open(path, 'rb') as f:
        data = f.read()
    length = struct.unpack('<I', data[12:16])[0]
    return json.loads(data[20:20 + length])


def main():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    rig = O['FOX_RIG']
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    for o in [o for o in O if o.type in ('LIGHT', 'CAMERA') or o.name.startswith('REVIEW_')]:
        bpy.data.objects.remove(o, do_unlink=True)
    for a in [a for a in bpy.data.actions if a.name not in EXPORT_ACTIONS]:
        bpy.data.actions.remove(a)
    for sk in bpy.data.shape_keys:
        if sk.animation_data:
            sk.animation_data.action = None
        for kb in sk.key_blocks[1:]:
            kb.value = 0.0
    # glTF exporter (ACTIONS mode) finds morph animation through the shape-key
    # datablock: give every Key one NLA track per action slot that targets it,
    # and the armature one track per action, so channels merge by action name
    rig.animation_data_create()
    for act in [a for a in bpy.data.actions if a.name in EXPORT_ACTIONS]:
        for slot in act.slots:
            if slot.target_id_type == 'OBJECT':
                tr = rig.animation_data.nla_tracks.new()
                tr.name = act.name
                st = tr.strips.new(act.name, int(act.frame_range[0]), act)
                st.action_slot = slot
                tr.mute = True
        for key in bpy.data.shape_keys:
            sl = next((s for s in act.slots if s.target_id_type == 'KEY' and s.name_display == key.name), None)
            if sl is None:
                continue
            key.animation_data_create()
            tr = key.animation_data.nla_tracks.new()
            tr.name = act.name
            st = tr.strips.new(act.name, int(act.frame_range[0]), act)
            st.action_slot = sl
            tr.mute = True

    # module appends left duplicate materials (MAT_X.001 ...); identical values,
    # so map every duplicate onto its canonical material for a clean GLB
    import re
    remapped = 0
    for o in O:
        if o.type != 'MESH':
            continue
        for slot in o.material_slots:
            m = slot.material
            if m and re.search(r'\.\d{3}$', m.name):
                base = bpy.data.materials.get(re.sub(r'\.\d{3}$', '', m.name))
                if base:
                    slot.material = base
                    remapped += 1

    bvh_hi = head_bvh()
    level = int(os.environ.get('FOX_EXPORT_LEVEL', '0'))
    # the wavy scarf roll / bandana read crumpled at cage level -> one level up
    overrides = {'FOX_Scarf_Roll': 1, 'FOX_Scarf_Flap': 1}
    for o in O:
        for m in o.modifiers:
            if m.type == 'SUBSURF':
                m.levels = overrides.get(o.name, level)
                m.render_levels = m.levels
    bvh_lo = head_bvh()
    moved = refit_decals(bvh_hi, bvh_lo)

    dg = bpy.context.evaluated_depsgraph_get()
    tris = 0
    for o in O:
        if o.type == 'MESH':
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()
            me.calc_loop_triangles()
            tris += len(me.loop_triangles)
            ev.to_mesh_clear()

    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=False, use_visible=False,
        export_apply=True, export_yup=True, export_texcoords=True, export_normals=True,
        export_materials='EXPORT', export_skins=True, export_def_bones=False,
        export_morph=True, export_morph_normal=True, export_morph_animation=True,
        export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
        export_lights=False, export_cameras=False, export_extras=True)

    g = glb_json(OUT)
    anims = {a.get('name'): {'channels': len(a['channels']),
                             'weights_channels': sum(1 for c in a['channels'] if c['target']['path'] == 'weights'),
                             'nodes': sorted({g['nodes'][c['target']['node']].get('name', '?') for c in a['channels']
                                              if c['target']['path'] == 'weights'})}
             for a in g.get('animations', [])}
    meshes = {m.get('name'): {'primitives': len(m['primitives']),
                              'morph_targets': len(m['primitives'][0].get('targets', [])),
                              'target_names': m.get('extras', {}).get('targetNames', [])}
              for m in g['meshes']}
    manifest = {
        'file': '06_EXPORTS/glb/fox_v2_rig_test.glb', 'bytes': os.path.getsize(OUT),
        'source': '03_RIG/fox_rig_d1_1.blend', 'blender': bpy.app.version_string,
        'export_lod': f'Subdivision level {level} (0 = base cage); scarf roll + bandana at level 1', 'triangles_exported_estimate': tris,
        'decal_refit_mm': moved, 'duplicate_material_slots_remapped': remapped,
        'nodes': len(g['nodes']), 'skins': len(g.get('skins', [])),
        'joints': len(g['skins'][0]['joints']) if g.get('skins') else 0,
        'materials': [m.get('name') for m in g.get('materials', [])],
        'textures': len(g.get('textures', [])), 'images': len(g.get('images', [])),
        'extensions_used': g.get('extensionsUsed', []),
        'animations': anims, 'meshes': meshes,
    }
    json.dump(manifest, open(os.path.join(OUT_DIR, 'fox_v2_rig_test_manifest.json'), 'w'), indent=2)
    print(json.dumps({k: manifest[k] for k in ('bytes', 'triangles_exported_estimate', 'nodes', 'joints', 'animations', 'extensions_used')}, indent=1))


if __name__ == '__main__':
    main()
