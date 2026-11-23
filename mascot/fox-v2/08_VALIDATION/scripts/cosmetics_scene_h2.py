"""Gate H2 helper — the H1 helper (cosmetics_scene_h1, unchanged) extended to the H1 + H2 cosmetic blends.

load_cosmetics()          append every COS_* object of fox_cosmetics_h1.blend and fox_cosmetics_h2.blend into the open
                          (approved, read-only) animation blend and rebind it to its FOX_RIG
apply_outfit(cos, ids)    as in H1, with the merged H1 + H2 catalogue
OUTFITS                   the six H2 outfits (slot → item), mirrored in the runtime contract
"""
import json
import os

import bpy  # noqa: E402

import cosmetics_scene_h1 as S1

ROOT = S1.ROOT
H2_BLEND = os.path.join(ROOT, '05_COSMETICS', 'h2_outfits', 'fox_cosmetics_h2.blend')
CATALOG = dict(S1.CATALOG)
CATALOG.update(json.load(open(os.path.join(ROOT, '05_COSMETICS', 'h2_outfits', 'cosmetic_catalog_h2.json')))['items'])
OUTFITS = {
    'student': {'HEAD': 'student_cap', 'FACE': 'student_glasses', 'BODY': 'simple_jacket'},
    'sports': {'HEAD': 'sports_headband', 'BODY': 'sports_jersey', 'FEET': 'sports_sneakers'},
    'explorer': {'HEAD': 'explorer_hat', 'BACK': 'explorer_backpack', 'HAND_RIGHT': 'explorer_magnifier'},
    'mage': {'HEAD': 'mage_hat', 'BACK': 'mage_capelet', 'HAND_RIGHT': 'mage_wand'},
    'ninja': {'HEAD': 'ninja_headband', 'BODY': 'ninja_gi', 'BACK': 'ninja_scroll'},
    'tet': {'HEAD': 'tet_khan_dong', 'BODY': 'tet_ao_dai', 'HAND_RIGHT': 'tet_lixi'},
}
mirrored_left = S1.mirrored_left


def _load(blend, rig):
    with bpy.data.libraries.load(blend, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n.startswith('COS_')]
    out = {}
    for ob in dst.objects:
        bpy.context.scene.collection.objects.link(ob)
        mw = ob.matrix_world.copy()
        ob.parent = rig; ob.matrix_parent_inverse.identity(); ob.matrix_world = mw
        for m in ob.modifiers:
            if m.type == 'ARMATURE':
                m.object = rig
        out[ob.name[4:]] = ob
    return out


def load_cosmetics():
    rig = bpy.data.objects['FOX_RIG']
    cos = _load(S1.COS_BLEND, rig)
    cos.update(_load(H2_BLEND, rig))
    for o in list(bpy.data.objects):
        if o.type == 'ARMATURE' and o is not rig and o.users_scene == ():
            bpy.data.objects.remove(o)
    bpy.context.view_layer.update()
    return cos


def apply_outfit(cos, item_ids):
    S1.CATALOG = CATALOG                              # the H1 function reads its module catalogue
    S1.apply_outfit(cos, item_ids)
