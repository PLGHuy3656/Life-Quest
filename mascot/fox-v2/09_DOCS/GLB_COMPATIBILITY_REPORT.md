# Fox V2 — GLB compatibility report

**Result: every GLB is valid glTF 2.0 and loads in two viewers that share no code with the Fox runtime.** The 12 files are
the base model, the 3 current animation modules and the 8 cosmetics.

The two viewers:
- **Babylon.js 9.37.1** (browser engine);
- **Blender 5.3's glTF importer.**

What they reproduce:
- the model, the 28-joint skeleton and the 28 facial morph targets;
- all 7 base clips and all 43 module clips;
- the cosmetics on the Fox skeleton.

The two viewers agree with each other to 0.001 mm on every sampled bone. The modules bind to the base model by node
name in both, with zero unbound tracks.

## 1. Khronos glTF-Validator (2.0.0-dev.3.10)

| File | Errors | Warnings | Notes |
|---|---|---|---|
| `06_EXPORTS/glb/fox_v2_anim_e2.glb` (base, approved E2) | 0 | 13 | `NODE_SKINNED_MESH_NON_ROOT` |
| `modules/fox_v2_g1_1_quest_reward_streak.anim.glb` | 0 | 0 | 9 animations |
| `modules/fox_v2_g2_1_daily_life.anim.glb` | 0 | 0 | 16 animations |
| `modules/fox_v2_g3_challenge_social.anim.glb` | 0 | 0 | 18 animations |
| `cosmetics/*.glb` (8) | 0 | 1 each | `NODE_SKINNED_MESH_NON_ROOT` |

`NODE_SKINNED_MESH_NON_ROOT` is the normal Blender exporter layout: skinned meshes sit under the armature node. That node
has an identity transform, so the warning has no visible effect. No file uses an extension, external buffer or image.

The results are identical on both machines. Reports:
- `08_VALIDATION/portability/container_run/gltf_validator.json`
- `08_VALIDATION/portability/second_machine/gltf_validator_device.json`

## 2. Independent viewer: Babylon.js

Files: `08_VALIDATION/portability/viewer/babylon_test.html` and `run_babylon.py`. Babylon is loaded from local npm
copies; no CDN is used.

**Base model**

| | Result |
|---|---|
| Meshes | 47 primitives, 38,268 vertices, 12 materials, 0 textures |
| Skeleton | 1 skin, 28 joints (`ROOT` … `FOOT_R`; the canonical names) |
| Morphs | 14 meshes carry morph targets, 28 targets in total |
| Animation groups | `happy`, `head_pet`, `idle`, `run`, `tail_touch`, `walk`, `wave` |

**Modules**

The documented procedure (`FOX_RUNTIME_CONTRACT_V2.md` §10) is: keep only the animations, and bind them to the base
model by node name. It was re-implemented for Babylon:
- every animation group is cloned with a target converter;
- joints map by node name;
- morph channels map by mesh name + morph index.

| Module | Animations | Joint tracks bound | Morph tracks bound | Unbound |
|---|---|---|---|---|
| G1.1 | 9 | 756 | 252 | 0 |
| G2.1 | 16 | 1,344 | 448 | 0 |
| G3 | 18 | 1,512 | 504 | 0 |

**Cosmetics.** All 8 have the same 28 joints, in the same order, as the Fox skin. In Babylon each mesh was given the Fox
skeleton and rendered posed. The contact sheet is `container_run/babylon_contact_sheet.png`: student outfit, 8 clips
including module clips, 3 views each.

**Network.** No request left 127.0.0.1, and there were no page errors.

## 3. Independent importer: Blender glTF import

Script: `08_VALIDATION/scripts/portability_gltf_reimport.py`.

- **Base:** the base GLB was imported into a factory Blender. It has 28 bones, 41 mesh objects and 28 shape keys, and
  the 7 actions play.
- **Modules:** each module was imported, and its actions were put on the **base** armature by bone name. All module
  armatures have exactly the base bone names.
- **Cosmetics:** all 8 import, and their joints match the Fox armature.

The results are identical on both machines.

## 4. Animation accuracy vs the Blender source

Method:
- Both viewers were posed at 6 frames per clip.
- Every bone head was compared with the Blender source pose.
- Ground truth: `fox_v2_e2_reference_poses.json`, regenerated on both machines (byte-identical), and the modules'
  shipped `*_reference_poses.json`.

| Set | Babylon max | Blender importer max | Worst |
|---|---|---|---|
| Base: idle / walk / wave / run / happy / head_pet | 1.10 / 0.18 / 1.16 / 3.38 / 3.86 / 4.17 mm | same | — |
| Base: tail_touch | **8.69 mm** | 8.69 mm | `EAR_L_02` (ear tip), frame 15 |
| G1.1 module | 4.51 mm | 4.51 mm | ear tip |
| G2.1 module | 5.20 mm | 5.20 mm | — |
| G3 module | 4.99 mm | 4.99 mm | — |

How to read this:
- The two independent decoders agree to 0.001 mm. The numbers therefore describe the GLB data, not either viewer.
- The module values match the fidelity reports from G1.1 to G3: G1.1 reported 4.51 mm.
- **tail_touch frame 15 (8.69 mm) is new information about the approved E2 GLB.** The E2 report gave 3.78 mm on fewer
  sample frames. The cause is the known one: the rig has bones that do not inherit scale, under a squashing parent.
  glTF stores translation / rotation / scale per joint and cannot carry the resulting shear, so the exporter
  compensates approximately, and the error peaks at the ear tips.
- This affects every glTF consumer equally, including the Fox runtime. It is not a portability defect. It is recorded
  here because it exceeds the 6 mm tolerance used for the module gates.

## 5. Known limits for other engines

- **Coordinates.** glTF is right-handed, Y-up, in metres.
  - Babylon wraps the model in a handedness-flipping `__root__`.
  - Unity and Godot convert on import.
  - Bone names survive in every importer tested.
- **Modules carry no body.** An engine must bind module animations to the loaded base by node name:
  - Babylon: `AnimationGroup.clone(name, targetConverter)`.
  - Blender: assign the action to the base armature.
  - three.js: `FoxModelLoader.bindModuleClips`.

  Unity / Unreal users must retarget by bone name. This was not tested.
- **Morph channels in modules** sit on 14 one-triangle carrier meshes named like the base face meshes. Map them by mesh
  name + morph index.
- **Cosmetics** are skins with the full 28-joint list. Any engine that can share a skeleton between meshes, or rebind by
  joint name, can use them.
- **Not tested:** Unity, Unreal, Godot, Sketchfab, and the online Khronos sample viewer (no external sites were used).
