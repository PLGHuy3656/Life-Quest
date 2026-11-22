"""Gate H1 helper — bring the H1 cosmetic prototypes into an (approved, read-only) animation blend for review / QA.

load_cosmetics()          append every COS_* object from 05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend and rebind it
                          (parent + Armature modifier) to the open scene's FOX_RIG; the appended duplicate rig is removed.
apply_outfit(item_ids)    show exactly those cosmetics, hide the default meshes each one replaces (catalog 'hides'),
                          everything else back to the approved default look.
The animation blend on disk is never saved by these helpers.
"""
import json
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
COS_BLEND = os.path.join(ROOT, '05_COSMETICS', 'h1_prototypes', 'fox_cosmetics_h1.blend')
CATALOG = json.load(open(os.path.join(ROOT, '05_COSMETICS', 'h1_prototypes', 'cosmetic_catalog_h1.json')))['items']


def _descendants(ob):
    out = [ob]
    for c in ob.children:
        out += _descendants(c)
    return out


def load_cosmetics():
    rig = bpy.data.objects['FOX_RIG']
    with bpy.data.libraries.load(COS_BLEND, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n.startswith('COS_')]
    sc = bpy.context.scene
    out = {}
    for ob in dst.objects:
        sc.collection.objects.link(ob)
        mw = ob.matrix_world.copy()
        ob.parent = rig
        ob.matrix_parent_inverse.identity()
        ob.matrix_world = mw
        for m in ob.modifiers:
            if m.type == 'ARMATURE':
                m.object = rig
        out[ob.name[4:]] = ob
    for o in list(bpy.data.objects):                       # the source rig came along as the old parent: drop it
        if o.type == 'ARMATURE' and o is not rig and o.users_scene == ():
            bpy.data.objects.remove(o)
    bpy.context.view_layer.update()
    return out


def default_meshes(hides):
    objs = []
    for n in hides:
        if n in bpy.data.objects:
            objs += _descendants(bpy.data.objects[n])
    return objs


def apply_outfit(cos, item_ids):
    hide = set()
    for iid, ob in cos.items():
        on = iid in item_ids
        ob.hide_render = not on
        ob.hide_viewport = not on
        if on:
            hide |= {o.name for o in default_meshes(CATALOG[iid]['hides'])}
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.startswith('FOX_'):
            h = o.name in hide
            o.hide_render = h
            o.hide_viewport = h
    bpy.context.view_layer.update()


def mirrored_left(ob):
    """Matrix-only test fixture: a copy of a right-paw item mirrored in X and weighted to PAW_L (never exported)."""
    m = ob.copy(); m.data = ob.data.copy(); m.name = 'COS_TEST_magnifier_left'
    bpy.context.scene.collection.objects.link(m)
    for v in m.data.vertices:
        v.co.x = -v.co.x
    m.data.flip_normals()
    for g in list(m.vertex_groups):
        g.name = g.name.replace('_R', '_L') if g.name.endswith('_R') else g.name
    m.hide_render = m.hide_viewport = False
    bpy.context.view_layer.update()
    return m
