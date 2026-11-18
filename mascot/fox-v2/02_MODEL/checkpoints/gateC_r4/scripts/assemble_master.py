"""Assemble 02_MODEL/fox_master.blend from the eight module files.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/assemble_master.py
"""
import os
import sys
import json
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import foxlib as fl  # noqa: E402
from build_modules import MODULES, MODULE_FILES, MODULE_DIR, ROOT  # noqa: E402

P = json.load(open(os.path.join(ROOT, '01_DESIGN', 'proportions.json')))
OUT = os.path.join(ROOT, '02_MODEL', 'fox_master.blend')


def append_collection(path, name):
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.collections = [c for c in src.collections if c == name]
    return dst.collections[0]


def setup_preview_lighting(col):
    def light(name, kind, energy, loc, rot, size=1.0, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, kind)
        ld.energy = energy
        ld.color = color
        if kind == 'AREA':
            ld.size = size
        o = bpy.data.objects.new(name, ld)
        o.location = loc
        o.rotation_euler = rot
        col.objects.link(o)
        return o
    import math
    # Gate C r2: large soft sources with strong fill. render_turnaround.py
    # rotates this whole rig with the camera, so every view gets identical
    # key/fill/rim relative to the camera and colours stay consistent.
    light('LGT_Key', 'AREA', 70, (-1.6, -2.2, 2.4), (math.radians(52), 0, math.radians(-36)), 3.5, (1.0, 0.97, 0.93))
    light('LGT_Fill', 'AREA', 55, (2.0, -2.0, 1.2), (math.radians(70), 0, math.radians(45)), 4.0, (1.0, 0.98, 0.96))
    light('LGT_Bounce', 'AREA', 18, (0.0, -2.2, -0.3), (math.radians(100), 0, 0), 4.0, (1.0, 0.95, 0.9))
    light('LGT_Rim', 'AREA', 40, (0.5, 2.4, 2.0), (math.radians(-55), 0, math.radians(170)), 3.0, (1.0, 0.95, 0.9))
    light('LGT_Top', 'AREA', 22, (0, 0, 3.0), (0, 0, 0), 3.0)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    master = bpy.data.collections.new('FOX_MASTER')
    scene.collection.children.link(master)
    for m in MODULES:
        col = append_collection(os.path.join(MODULE_DIR, MODULE_FILES[m] + '.blend'), 'GEO_' + m)
        master.children.link(col)
    for name in ('RIG', 'ATTACHMENTS', 'LIGHTING_PREVIEW'):
        master.children.link(bpy.data.collections.new(name))

    # root transform used for uniform level scaling (see 09_DOCS once Gate D lands)
    root = bpy.data.objects.new('FOX_ROOT', None)
    root.empty_display_type = 'PLAIN_AXES'
    root.empty_display_size = 0.3
    master.objects.link(root)

    head = bpy.data.objects['FOX_Head']
    for o in bpy.data.collections['GEO_FACE'].objects:
        if o.parent is None:
            fl.parent_keep(o, head)
    for o in bpy.data.objects:
        if o.type in {'MESH'} and o.parent is None:
            fl.parent_keep(o, root)

    setup_preview_lighting(bpy.data.collections['LIGHTING_PREVIEW'])
    scene['fox_version'] = P['_meta']['version']
    scene['fox_level_scale_map'] = json.dumps(P['level_scale']['map'])
    scene.render.engine = 'CYCLES'
    scene.view_settings.view_transform = 'Standard'
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    print('saved', OUT, 'objects:', len(bpy.data.objects))


if __name__ == '__main__':
    main()
