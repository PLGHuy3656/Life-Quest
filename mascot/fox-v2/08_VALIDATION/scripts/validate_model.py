"""Technical validation for Gates A-C (modules + master).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/validate_model.py
Writes 08_VALIDATION/validation_results.json and exits non-zero on failure.
Visual approval is NOT decided here — see validation_report.md.
"""
import json
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import foxlib as fl  # noqa: E402
from build_modules import MODULES, MODULE_FILES, MODULE_DIR, ROOT  # noqa: E402

results = []


def check(name, ok, detail=''):
    results.append({'check': name, 'pass': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))


def eval_tris(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    ev.to_mesh_clear()
    return n


def main():
    # ---------------------------------------------------------- Gate A files
    for f in ['00_REFERENCE/FOX_V2_BASELINE.png', '00_REFERENCE/visual_spec.md',
              '01_DESIGN/character_master_spec.md', '01_DESIGN/proportions.json', '01_DESIGN/materials.json']:
        check(f'exists {f}', os.path.exists(os.path.join(ROOT, f)))
    for f in ['01_DESIGN/proportions.json', '01_DESIGN/materials.json']:
        try:
            json.load(open(os.path.join(ROOT, f)))
            check(f'valid JSON {f}', True)
        except Exception as e:  # noqa: BLE001
            check(f'valid JSON {f}', False, str(e))

    # ---------------------------------------------------------- modules
    for m in MODULES:
        p = os.path.join(MODULE_DIR, MODULE_FILES[m] + '.blend')
        ok = os.path.exists(p)
        detail = ''
        if ok:
            bpy.ops.wm.open_mainfile(filepath=p)
            col = bpy.data.collections.get('GEO_' + m)
            meshes = [o for o in bpy.data.objects if o.type == 'MESH']
            ok = col is not None and len(meshes) > 0 and all(len(o.data.polygons) > 0 for o in meshes)
            detail = f'{len(meshes)} mesh objects'
        check(f'module {MODULE_FILES[m]}.blend opens with geometry', ok, detail)

    # ---------------------------------------------------------- master
    master = os.path.join(ROOT, '02_MODEL', 'fox_master.blend')
    bpy.ops.wm.open_mainfile(filepath=master)
    check('fox_master.blend opens', True)
    fm = bpy.data.collections.get('FOX_MASTER')
    expected = ['GEO_' + m for m in MODULES] + ['RIG', 'ATTACHMENTS', 'LIGHTING_PREVIEW']
    kids = [c.name for c in fm.children] if fm else []
    check('collection hierarchy FOX_MASTER/*', fm is not None and kids == expected, ', '.join(kids))

    meshes = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith('REVIEW_')]
    lights_in_geo = [o.name for c in fm.children if c.name.startswith('GEO_') for o in c.all_objects if o.type != 'MESH']
    check('preview lighting separated from geometry', not lights_in_geo, ', '.join(lights_in_geo))

    no_mat = [o.name for o in meshes if not o.data.materials or any(s is None for s in o.data.materials)]
    check('every mesh has materials', not no_mat, ', '.join(no_mat))
    used_bad = []
    for o in meshes:
        n = len(o.data.materials)
        if any(p.material_index >= n for p in o.data.polygons):
            used_bad.append(o.name)
    check('material indices valid', not used_bad, ', '.join(used_bad))
    imgs = [i.name for i in bpy.data.images if i.source == 'FILE' and not os.path.exists(bpy.path.abspath(i.filepath))]
    check('no missing textures', not imgs, 'textureless asset' if not bpy.data.images else ', '.join(imgs))

    bad_scale = [o.name for o in meshes if (Vector(o.scale) - Vector((1, 1, 1))).length > 1e-6
                 or Vector(o.rotation_euler).length > 1e-6]
    check('clean transforms (rot 0, scale 1)', not bad_scale, ', '.join(bad_scale))
    orphans = [o.name for o in meshes if o.parent is None]
    check('all meshes parented under FOX_ROOT hierarchy', not orphans, ', '.join(orphans))
    broken = [o.name for o in bpy.data.objects if o.parent is not None and o.parent.name not in bpy.data.objects]
    check('no broken object references', not broken)

    # normals: closed volumes must be manifold with outward normals
    import bmesh
    inward = []
    for o in meshes:
        if o.name.startswith(('FOX_Eye', 'FOX_Blush', 'FOX_Mouth', 'FOX_Brow', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem')):
            continue  # open decal shells by design
        bm = bmesh.new()
        bm.from_mesh(o.data)
        c = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
        score = sum((f.calc_center_median() - c).dot(f.normal) * f.calc_area() for f in bm.faces)
        if score <= 0:
            inward.append(o.name)
        bm.free()
    check('normals point outward on closed parts', not inward, ', '.join(inward))

    # face decals must sit ON the head (no clipping, no floating)
    head = bpy.data.objects['FOX_Head']
    bvh = fl.bvh_for(head)
    worst = {}
    for o in meshes:
        if not o.name.startswith(('FOX_Eye_', 'FOX_Blush', 'FOX_Mouth_Neutral')):
            continue
        ds = []
        for v in o.data.vertices:
            p = o.matrix_world @ v.co
            loc, nrm, _, _ = bvh.find_nearest(p)
            ds.append((p - loc).dot(nrm))
        worst[o.name] = (round(min(ds), 4), round(max(ds), 4))
    clip = {k: v for k, v in worst.items() if v[0] < 0.0003 or v[1] > 0.012}
    check('face decals sit on head surface (0.3 mm .. 12 mm)', not clip, json.dumps(worst))

    # ears independent, backpack detachable
    for n in ('FOX_Ear_L', 'FOX_Ear_R'):
        o = bpy.data.objects.get(n)
        check(f'{n} independent object with base pivot', o is not None and o.location.z > 0.6)
    bp = bpy.data.objects.get('FOX_Backpack')
    check('backpack is a separate detachable hierarchy', bp is not None and bp.parent.name == 'FOX_ROOT'
          and all(c.name.startswith('FOX_Backpack') for c in bp.children))
    keys = bpy.data.objects['FOX_Eye_L'].data.shape_keys
    names = [k.name for k in keys.key_blocks] if keys else []
    check('eye shape keys present', names == ['Basis', 'Blink', 'Wide', 'Sad', 'HalfLid', 'Proud'], ', '.join(names))
    bk = bpy.data.objects['FOX_Brow_L'].data.shape_keys
    bn = [k.name for k in bk.key_blocks] if bk else []
    check('brow shape keys present', bn == ['Basis', 'Sad', 'Proud'], ', '.join(bn))
    check('expression swap meshes present', all(n in bpy.data.objects for n in (
        'FOX_EyeClosedHappy_L', 'FOX_EyeClosedSleepy_L', 'FOX_Mouth_Open', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown', 'FOX_Mouth_Smile', 'FOX_Brow_L')))

    # dimensions
    dg = bpy.context.evaluated_depsgraph_get()
    zs = []
    for o in meshes:
        if o.hide_render:
            continue
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        zs += [(o.matrix_world @ v.co).z for v in me.vertices]
        ev.to_mesh_clear()
    height = max(zs) - min(zs)
    check('total height 1.00 m +-3%', abs(height - 1.0) < 0.03, f'{height:.3f} m, min z {min(zs):.3f}')
    check('nothing below the ground plane (z >= -1 mm)', min(zs) >= -0.001, f'min z {min(zs):.4f}')

    def cage_tris(o):
        o.data.calc_loop_triangles()
        return len(o.data.loop_triangles)
    cage = sum(cage_tris(o) for o in meshes if not o.hide_render)
    tris = sum(eval_tris(o) for o in meshes if not o.hide_render)
    check('base cage (pre-subdivision) <= 60k tris — web export LOD is decided in Gate F', cage <= 60000,
          f'{cage} cage tris; {tris} tris with live subdivision (source/render quality, NOT the web budget)')
    out = os.path.join(ROOT, '08_VALIDATION', 'validation_results.json')
    json.dump({'blender': bpy.app.version_string, 'results': results}, open(out, 'w'), indent=2)
    failed = [r for r in results if not r['pass']]
    print(f'{len(results) - len(failed)}/{len(results)} checks passed')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
