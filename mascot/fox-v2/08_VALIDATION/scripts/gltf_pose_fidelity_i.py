"""Gate I — glTF pose fidelity: what the Voice Assistant GLB data encodes vs the Blender pose.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/gltf_pose_fidelity_i.py
Writes 06_EXPORTS/glb/modules/fox_v2_i_gltf_fk_poses.json
       08_VALIDATION/runtime_i/gltf_pose_fidelity_i.json
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gltf_pose_fidelity_g3 as F  # noqa: E402

ROOT = F.ROOT
I_GLB = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_i_voice_assistant.anim.glb')
I_REF = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_i_reference_poses.json')
I_FK = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules', 'fox_v2_i_gltf_fk_poses.json')
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_i', 'gltf_pose_fidelity_i.json')


def main():
    gi = F.Gltf(I_GLB)
    ref = json.load(open(I_REF))['clips']
    fk = {
        clip: {
            f: {
                't': s['t'],
                'bones': {k: [round(x, 7) for x in v] for k, v in gi.bone_positions(clip, s['t'], list(s['bones'])).items()},
            }
            for f, s in samples.items()
        }
        for clip, samples in ref.items()
    }
    json.dump(
        {
            'note': 'Independent numpy FK of the Gate I module glTF channels (bone head positions, glTF Y-up metres, '
                    'armature frame, scale 1) at the same sample times as fox_v2_i_reference_poses.json.',
            'clips': fk,
        },
        open(I_FK, 'w'),
    )
    i_vs_blender, i_worst = F.compare(ref, gi.bone_positions)
    e2 = F.Gltf(F.E2_GLB)
    e2ref = F.e2_reference()
    e2_vs_blender, e2_worst = F.compare(e2ref, e2.bone_positions)
    rep = {
        'i_module_vs_blender': {'worst': i_worst, 'clips': i_vs_blender},
        'e2_approved_glb_vs_blender': {'worst': e2_worst, 'clips': e2_vs_blender},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(rep, open(OUT, 'w'), indent=2)
    print('Gate I module glTF vs Blender worst:', i_worst)
    print('E2 approved glTF vs Blender worst:', e2_worst)
    for k, v in i_vs_blender.items():
        print(f'  {k:24s} {v["max_mm"]:8.3f} mm  {v["at"]}')


if __name__ == '__main__':
    main()
