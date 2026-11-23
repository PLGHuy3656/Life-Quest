# Fox V2 — Blender open test

**Result: 7 / 7 source files PASS on two machines.**
- Every file opens in a factory-settings Blender.
- No file needs an external file, an absolute or cloud path, or an add-on.
- Every action plays.
- A manual edit (keyframe + shape key) survives save and reopen.

Script: `08_VALIDATION/scripts/portability_blender_check.py`. It needs no other project code and never saves over the
inspected files; the edit test runs on a copy in a temp folder.

## How it was run

| | Machine A (build container) | Machine B (second machine) |
|---|---|---|
| Host | Ubuntu, isolated container | Windows device `lenovo-fox`, sandboxed Ubuntu 22.04 shell, files read straight from `D:\Development\LifeQuest\…\LifeQuest_Fox_V2` |
| Blender | `bpy` 5.3.0 module | `bpy` 5.3.0 module, freshly installed from the PyPI wheel (sha256 `5850cd39…c6a0`) into an empty venv |
| Files | fresh extraction of `LifeQuest_Fox_V2_GateH1.zip` into an empty folder | the synced Windows workspace (verified against `GATE_H1_SHA256SUMS.txt`) |
| User config | empty `HOME`, `BLENDER_USER_CONFIG` / `_SCRIPTS` pointing to empty folders, `read_factory_settings` | same |
| Add-ons enabled | Blender defaults only: `bl_pkg`, `cycles`, `io_anim_bvh`, `io_curve_svg`, `io_mesh_uv_layout`, `io_scene_fbx`, `io_scene_gltf2`, `pose_library` | same |

Command on any OS:
```
blender -b --factory-startup --python 08_VALIDATION/scripts/portability_blender_check.py -- <path to LifeQuest_Fox_V2> report.json
```

Reports:
- Machine A: `08_VALIDATION/portability/container_run/blender_open_container.json`
- Machine B: `08_VALIDATION/portability/second_machine/<file>.json`

The verdicts and counts are identical on both machines.

## Results per file

| File | Role | Meshes | Materials | Bones | Shape keys (meshes) | Actions | Skinned meshes | Bone-attached | External refs | Script / add-on deps | Edit round trip | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `02_MODEL/fox_master.blend` | master model (modelling source) | 40 | 19 | — | 18 (4) | 0 | 0 | 0 | 0 | none | n/a (no rig) | **PASS** |
| `03_RIG/fox_rig_d1_1.blend` | canonical rig + model | 40 | 19 | 28 | 42 (14) | 5 | 13 | 2 | 0 | none | key + shape key kept | **PASS** |
| `04_ANIMATIONS/fox_anim_e2.blend` | core clips (E2) | 40 | 19 | 28 | 42 (14) | 11 | 13 | 2 | 0 | none | kept | **PASS** |
| `04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend` | G1.1 clips | 40 | 19 | 28 | 42 (14) | 13 | 13 | 2 | 0 | none | kept | **PASS** |
| `04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend` | G2.1 clips | 40 | 19 | 28 | 42 (14) | 20 | 13 | 2 | 0 | none | kept | **PASS** |
| `04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend` | G3 clips | 40 | 19 | 28 | 42 (14) | 22 | 13 | 2 | 0 | none | kept | **PASS** |
| `05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend` | H1 cosmetics | 48 | 40 | 28 | 42 (14) | 5 | 21 | 2 | 0 | none | kept | **PASS** |

What each check means:
- **External refs:** linked libraries, images, fonts (other than the built-in font), sounds, movie clips, caches and
  volumes. Every count is 0: materials are node colours, with no image textures and no linked `.blend`.
- **Packing:** with no external resource there is nothing to pack, so no source file was re-saved.
- **Script / add-on deps:**
  - no registered text blocks;
  - no PYTHON constraints;
  - no drivers at all;
  - no Rigify or other add-on ID properties.
- **Accessory attachments:** `FOX_Head` is bone-parented to `HEAD` and `FOX_Backpack` to `SPINE`. Backpack children,
  scarf meshes and the other body meshes are skinned (Armature modifier). No Armature modifier is missing its target.
  The H1 cosmetics are skinned to the same rig (21 skinned meshes in that file).
- **Playback:** every action was assigned (object slot + shape-key slots) and evaluated at 9 irregular frames. Every one
  moves bones, the deformed body mesh or the shape keys. `fox_blink_test` is shape-key only; `sleep_loop` moves
  0.31 (bone-matrix change) / 4.2 mm (mesh).
- **Edit round trip:** on a copy, a `location` keyframe was added to `HEAD`, and the second shape key was keyed at 0.37.
  The copy was saved, reopened and evaluated at that frame. Both values came back exactly.

## What another developer needs

- **Blender 5.3 or newer.** The files were saved by 5.3 (file subversion 5.3.31) and use slotted actions, which were
  introduced in 4.4. Older Blender versions were not tested and should not be used.
- **The actions live in several files.** Each animation blend holds its own gate's clips, plus the rig test actions
  (`fox_*_test`). The full set of 50 approved clips is spread over the E2, G1.1, G2.1 and G3 files. There is no single
  file with every clip.
  - To edit a clip, open its gate's file.
  - To combine clips, append actions with *File → Append → Action*. They all use the same 28-bone `FOX_RIG`, so actions
    move between these files by bone name.
- **The checkpoint folders are history, not working files:** `02_MODEL/checkpoints/*`, `03_RIG/checkpoints/*`,
  `fox_rig_prototype.blend`, `fox_anim_e1.blend`, and the superseded `g1_quest_reward_streak/` and `g2_daily_life/`
  files.

## Not tested

- **Native Windows Blender (GUI).** Machine B reads the files from the Windows disk, but runs Blender inside a Linux
  shell. No Blender install was found on the Windows side. The handoff guide gives the one-line command to repeat the
  check there.
- **macOS.**
