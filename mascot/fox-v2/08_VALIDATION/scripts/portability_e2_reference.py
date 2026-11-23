"""Blender ground truth for the E2 base clips, in the same format as the module reference poses
(bone heads in glTF Y-up metres relative to the character root at scale 1, at 6 sample frames per clip).
Used by the independent-viewer test (Babylon.js) and the Blender glTF re-import test.

    python portability_e2_reference.py <LifeQuest_Fox_V2 root> <out.json>
"""
import json
import os
import sys

import bpy  # noqa: E402

root, out = sys.argv[-2], sys.argv[-1]
m = json.load(open(os.path.join(root, '06_EXPORTS/glb/fox_v2_anim_e2_manifest.json')))
clips = list(m['durations_s'].keys()) if isinstance(m.get('durations_s'), dict) else list(m['animations'].keys())
bpy.ops.wm.open_mainfile(filepath=os.path.join(root, '04_ANIMATIONS/fox_anim_e2.blend'), load_ui=False)
rig = bpy.data.objects['FOX_RIG']
res = {'note': 'Blender ground truth (fox_anim_e2.blend): bone head positions in glTF Y-up metres relative to the character root at scale 1, at sample frames (t = seconds from clip start).', 'fps': 24, 'clips': {}}
for c in clips:
    act = bpy.data.actions.get(c)
    if not act:
        continue
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    ad.action_slot = next(s for s in act.slots if s.target_id_type == 'OBJECT')
    f0, f1 = (int(x) for x in act.frame_range)
    rec = {}
    for f in sorted({int(round(f0 + (f1 - f0) * x)) for x in (0, 0.2, 0.4, 0.6, 0.8, 1.0)}):
        bpy.context.scene.frame_set(f)
        rec[str(f)] = {'t': round((f - f0) / 24, 6), 'bones': {pb.name: [round(pb.head[0], 6), round(pb.head[2], 6), round(-pb.head[1], 6)] for pb in rig.pose.bones}}
    res['clips'][c] = rec
json.dump(res, open(out, 'w'))
print('clips', len(res['clips']), list(res['clips']))
