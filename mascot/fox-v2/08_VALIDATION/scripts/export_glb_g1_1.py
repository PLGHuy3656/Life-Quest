"""Gate G1.1 — export the Quest / Reward / Streak clips as an ANIMATION-ONLY GLB module.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/export_glb_g1_1.py
Reads   04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend (not modified)
Writes  06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim.glb
        06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim_manifest.json
        06_EXPORTS/glb/modules/fox_v2_g1_1_reference_poses.json   (Blender ground truth for the binding test)

The module contains NO Fox body: only the canonical armature (same 28 joint names and rest pose as
the approved E2 GLB) and the 14 facial-feature nodes reduced to a single triangle each, which keep
their full morph-target list in the original order — they exist only to carry the morph-weight
channels. No materials, no textures. At runtime the clips are bound to the already-loaded E2 Fox by
node name (FoxModelLoader validates every track; the browser test compares poses with the
reference file — export success alone is not taken as proof of compatibility).
"""
import json
import os
import struct
import sys

import bpy
import bmesh  # noqa: E402  (must come after bpy with the pip module)

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anim_check_e2 as C  # noqa: E402  (set_clip)

ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
MOD = os.path.join(ROOT_DIR, '04_ANIMATIONS', 'g1_1_cinematic_polish')
SRC = os.path.join(MOD, 'fox_anim_g1_1.blend')
SPEC = json.load(open(os.path.join(MOD, 'anim_spec_g1_1.json')))
OUT_DIR = os.path.join(ROOT_DIR, '06_EXPORTS', 'glb', 'modules')
OUT = os.path.join(OUT_DIR, 'fox_v2_g1_1_quest_reward_streak.anim.glb')
CLIPS = list(SPEC['clips'])
FACE = ['FOX_Eye_L', 'FOX_Eye_R', 'FOX_Mouth_Neutral', 'FOX_EyeClosedHappy_L', 'FOX_EyeClosedHappy_R', 'FOX_EyeClosedSleepy_L',
        'FOX_EyeClosedSleepy_R', 'FOX_Mouth_Open', 'FOX_Mouth_Tongue', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown', 'FOX_Mouth_Smile',
        'FOX_Brow_L', 'FOX_Brow_R']


def glb_json(path):
    with open(path, 'rb') as f:
        data = f.read()
    n = struct.unpack('<I', data[12:16])[0]
    return json.loads(data[20:20 + n])


def reference_poses(O):
    """Bone head positions (glTF Y-up metres) + facial morph values at sample frames, per clip."""
    rig, sc = O['FOX_RIG'], bpy.context.scene
    out = {}
    for clip, c in SPEC['clips'].items():
        C.set_clip(O, clip)
        n = c['frames'] + 1
        frames = sorted({1, 2, max(1, n // 4), n // 2, (3 * n) // 4, n})
        out[clip] = {}
        for f in frames:
            sc.frame_set(f)
            bones = {}
            for pb in rig.pose.bones:
                p = rig.matrix_world @ pb.head
                bones[pb.name] = [round(p.x, 6), round(p.z, 6), round(-p.y, 6)]
            morphs = {o: {kb.name: round(kb.value, 5) for kb in O[o].data.shape_keys.key_blocks[1:]} for o in FACE}
            out[clip][str(f)] = {'t': round((f - 1) / SPEC['fps'], 5), 'bones': bones, 'morphs': morphs}
    return out


def main():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    for o in O:
        for m in o.modifiers:
            if m.type == 'SUBSURF':
                m.show_viewport = False
    ref = reference_poses(O)
    rig = O['FOX_RIG']
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    # strip everything that is not the armature or a facial morph carrier
    for o in [o for o in O if o.name != 'FOX_RIG' and o.name not in FACE]:
        bpy.data.objects.remove(o, do_unlink=True)
    for a in [a for a in bpy.data.actions if a.name not in CLIPS]:
        bpy.data.actions.remove(a)
    carriers = {}
    for name in FACE:
        o = O[name]
        o.modifiers.clear()
        o.data.materials.clear()
        nkeys = len(o.data.shape_keys.key_blocks) - 1
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.faces.ensure_lookup_table()
        keep = set(bm.faces[0].verts)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in keep], context='VERTS')
        bm.to_mesh(o.data)
        bm.free()
        carriers[name] = {'verts': len(o.data.vertices), 'morph_targets': nkeys, 'names': [kb.name for kb in o.data.shape_keys.key_blocks[1:]]}
    for sk in bpy.data.shape_keys:
        if sk.animation_data:
            sk.animation_data.action = None
        for kb in sk.key_blocks[1:]:
            kb.value = 0.0
    rig.animation_data_create()
    for act in [a for a in bpy.data.actions if a.name in CLIPS]:
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
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=False, use_visible=False,
        export_apply=False, export_yup=True, export_texcoords=False, export_normals=False,
        export_materials='NONE', export_skins=True, export_def_bones=False,
        export_morph=True, export_morph_normal=False, export_morph_animation=True,
        export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True, export_anim_slide_to_zero=True,
        export_optimize_animation_size=False, export_lights=False, export_cameras=False, export_extras=True)
    g = glb_json(OUT)
    anims = {a['name']: {'channels': len(a['channels']), 'weights_channels': sum(c['target']['path'] == 'weights' for c in a['channels']),
                         'duration_s': round(max(g['accessors'][s['input']]['max'][0] for s in a['samplers']), 4)} for a in g.get('animations', [])}
    meshes = {m.get('name'): {'morph_targets': len(m['primitives'][0].get('targets', [])), 'target_names': m.get('extras', {}).get('targetNames', [])}
              for m in g.get('meshes', [])}
    manifest = {
        'file': '06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim.glb', 'bytes': os.path.getsize(OUT),
        'kind': 'animation-only module (no Fox body; bind to 06_EXPORTS/glb/fox_v2_anim_e2.glb by node name)',
        'source': '04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend', 'blender': bpy.app.version_string,
        'nodes': len(g['nodes']), 'joints': len(g['skins'][0]['joints']) if g.get('skins') else 0,
        'materials': len(g.get('materials', [])), 'textures': len(g.get('textures', [])),
        'morph_carriers': carriers, 'meshes': meshes, 'animations': anims, 'clip_contract': SPEC['clips'],
        'categories': SPEC['categories'],
    }
    json.dump(manifest, open(os.path.join(OUT_DIR, 'fox_v2_g1_1_quest_reward_streak.anim_manifest.json'), 'w'), indent=2)
    json.dump({'note': 'Blender ground truth: bone head positions in glTF Y-up metres relative to the character root at scale 1, '
                       'and facial morph values, at sample frames (t = seconds from clip start).', 'clips': ref},
              open(os.path.join(OUT_DIR, 'fox_v2_g1_1_reference_poses.json'), 'w'))
    print(json.dumps({k: manifest[k] for k in ('bytes', 'nodes', 'joints', 'materials', 'animations')}, indent=1))


if __name__ == '__main__':
    main()
