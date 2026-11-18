# LifeQuest Fox V2 — Reproducible Build

## Requirements

| Item | Version |
|---|---|
| Blender | **5.3.0** (tested via the `bpy` 5.3.0 Python module; Blender 5.x desktop should also work) |
| Python | 3.13 (bundled with Blender 5.3 / required by `pip install bpy==5.3.0`) |
| Add-ons | none |
| Python packages | `Pillow`, `numpy` (comparison sheet + metrics only) |

Option A — desktop Blender (Windows example):

```powershell
cd D:\Development\LifeQuest\LifeQuest_Assets\Mascot\LifeQuest_Fox_V2
& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup -P 08_VALIDATION\scripts\build_modules.py
& "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup -P 08_VALIDATION\scripts\assemble_master.py
```

Option B — Python module:

```bash
pip install bpy==5.3.0 pillow numpy
cd LifeQuest_Fox_V2
python 08_VALIDATION/scripts/build_modules.py      # -> 02_MODEL/modules/*.blend
python 08_VALIDATION/scripts/assemble_master.py    # -> 02_MODEL/fox_master.blend
```

## Review renders and checks

```bash
python 08_VALIDATION/scripts/render_turnaround.py --samples 96 --res 724   # 01_DESIGN/turnaround/*.png + 08_VALIDATION/masks
python 08_VALIDATION/scripts/make_comparison.py fox_reference_vs_model_r4.png   # 01_DESIGN/comparisons/<name> (default fox_reference_vs_model.png)
python 08_VALIDATION/scripts/render_face_controls.py fox_face_controls_r4.png  # 01_DESIGN/comparisons/<name> (default fox_face_controls_test.png)
python 08_VALIDATION/scripts/validate_model.py                            # 08_VALIDATION/validation_results.json
```

(With desktop Blender use `blender -b -P <script> -- <args>`.) A full rebuild
takes ~3 s; the 724 px / 96-sample turnaround ~3 min on 2 CPU cores.

## Rig prototype (Gate D1)

```bash
python 08_VALIDATION/scripts/build_rig.py        # 03_RIG/fox_rig_prototype.blend + skeleton_spec.json + attachment_points.json
python 08_VALIDATION/scripts/rig_tests.py        # keys action FOX_DeformationTest (T1-T6, frames 1-372); idempotent
python 08_VALIDATION/scripts/rig_check.py        # 03_RIG/deformation_metrics.json
python 08_VALIDATION/scripts/validate_rig.py     # 03_RIG/rig_validation_results.json
python 08_VALIDATION/scripts/rig_render.py sheet    # 03_RIG/renders/fox_rig_contact_sheet.png (~5 min)
python 08_VALIDATION/scripts/rig_render.py preview  # 03_RIG/renders/fox_rig_preview.mp4 + .gif (~8 min, needs ffmpeg)
```

The rig is built from a copy of `02_MODEL/fox_master.blend`; the master is
never written. Run `build_rig.py` before `rig_tests.py`.

## Rig correction + GLB test (Gate D1.1)

```bash
python 08_VALIDATION/scripts/rig_d1_1.py            # 03_RIG/fox_rig_d1_1.blend + face_morph_map.json (weights fixed, morph-target face, 4 prototype actions)
python 08_VALIDATION/scripts/rig_tests_d1_1.py      # keys FOX_DeformationTest_D1_1 (T1-T6) into the d1_1 file
FOX_TESTS=rig_tests_d1_1 FOX_METRICS=deformation_metrics_d1_1.json python 08_VALIDATION/scripts/rig_check.py
FOX_TESTS=rig_tests_d1_1 FOX_RENDER_DIR=renders_d1_1 python 08_VALIDATION/scripts/rig_render.py sheet
FOX_TESTS=rig_tests_d1_1 FOX_RENDER_DIR=renders_d1_1 python 08_VALIDATION/scripts/rig_render.py preview
python 08_VALIDATION/scripts/export_glb_d1_1.py     # 06_EXPORTS/glb/fox_v2_rig_test.glb + manifest
python 08_VALIDATION/scripts/make_rig_viewer.py     # 07_WEB_PREVIEW/rig_test.html
python 08_VALIDATION/scripts/browser_rig_test.py    # needs playwright + Chrome; writes 08_VALIDATION/runtime/
```

Neither the D1 prototype nor the master is modified by these scripts.

## Interactive animation prototype (Gate E1)

```bash
python 08_VALIDATION/scripts/anim_e1.py              # 04_ANIMATIONS/fox_anim_e1.blend + anim_spec_e1.json (reads fox_rig_d1_1.blend, never writes it)
python 08_VALIDATION/scripts/anim_check_e1.py        # 04_ANIMATIONS/anim_metrics_e1.json (penetration, roots, stretch, foot slide, loops)
python 08_VALIDATION/scripts/anim_render_e1.py qa    # 04_ANIMATIONS/renders_e1/fox_e1_keyframes.png
python 08_VALIDATION/scripts/anim_render_e1.py preview idle walk_side walk_34 run_side run_34 head_pet tail_touch
python 08_VALIDATION/scripts/export_glb_e1.py        # 06_EXPORTS/glb/fox_v2_anim_e1.glb + manifest
python 08_VALIDATION/scripts/make_anim_viewer_e1.py  # 07_WEB_PREVIEW/fox_interactive_e1.html
python 08_VALIDATION/scripts/browser_anim_test_e1.py # needs playwright + Chrome; real mouse input; writes 08_VALIDATION/runtime_e1/
```

View it: run `python -m http.server` in the project folder and open `/07_WEB_PREVIEW/fox_interactive_e1.html`.
The approved D1.1 rig is kept unchanged; its rollback copy is `03_RIG/checkpoints/gateD1_1_approved/`.

## Character motion polish (Gate E2)

```bash
python 08_VALIDATION/scripts/anim_e2.py              # 04_ANIMATIONS/fox_anim_e2.blend + anim_spec_e2.json (E1 files untouched)
python 08_VALIDATION/scripts/anim_check_e2.py        # 04_ANIMATIONS/anim_metrics_e2.json
python 08_VALIDATION/scripts/anim_render_e2.py qa    # renders_e2/fox_e2_keyframes.png
FOX_GATE=e2 python 08_VALIDATION/scripts/anim_render_e2.py preview idle walk_front walk_side walk_34 run_front run_side run_34 happy wave head_pet tail_touch
FOX_GATE=e1 FOX_OUT=04_ANIMATIONS/renders_compare/e1 python 08_VALIDATION/scripts/anim_render_e2.py preview walk_front run_front happy wave
python 08_VALIDATION/scripts/make_e1_e2_compare.py   # renders_compare/fox_e1_vs_e2_*.mp4
python 08_VALIDATION/scripts/export_glb_e2.py        # 06_EXPORTS/glb/fox_v2_anim_e2.glb + manifest
python 08_VALIDATION/scripts/make_anim_viewer_e2.py  # 07_WEB_PREVIEW/fox_interactive_e2.html
python 08_VALIDATION/scripts/browser_anim_test_e2.py # regression + presentation sizes (headless); GPU test: serve locally, open in a GPU browser, run runChecks()
```

Runtime idle variation: `04_ANIMATIONS/idle_variation_e2.json` (`?seed=N` for reproducible sequences).

## Companion sandbox & runtime foundation (Gate F)

```bash
cd 07_WEB_PREVIEW/companion_sandbox
npm install
npm run build        # copies + hash-checks fox_v2_anim_e2.glb, type-checks, builds dist/
npm run dev          # http://localhost:5173
# headless validation (serve dist on 127.0.0.1:4180 first):
python -m http.server 4180 --bind 127.0.0.1 --directory dist
python ../../08_VALIDATION/scripts/browser_companion_test_f.py
```

`dist/` is a static build (relative paths): any static server works; `file://` does not, because the GLB is fetched.
Runtime sources are in `src/mascot/` (framework-agnostic) and `src/components/` (React). See `09_DOCS/COMPANION_INTEGRATION_GUIDE.md`.

## Quest, reward & streak animation module (Gate G1)

```bash
python 08_VALIDATION/scripts/anim_g1.py            # → 04_ANIMATIONS/g1_quest_reward_streak/fox_anim_g1.blend + anim_spec_g1.json
python 08_VALIDATION/scripts/anim_check_g1.py      # → anim_metrics_g1.json (deformation, foot slide, rest / loop)
python 08_VALIDATION/scripts/anim_render_g1.py     # → renders/fox_g1_keyframes_{quest,rewards,streak}.png (Cycles)
python 08_VALIDATION/scripts/export_glb_g1.py      # → 06_EXPORTS/glb/modules/*.anim.glb + manifest + reference poses
python 08_VALIDATION/scripts/gltf_pose_fidelity_g1.py   # → glTF FK poses + 08_VALIDATION/runtime_g1/gltf_pose_fidelity_g1.json
cd 07_WEB_PREVIEW/companion_sandbox && npm run build && cd ../..   # copies the E2 GLB (hash-locked), the module, its spec and reference poses
python -m http.server 4180 --bind 127.0.0.1 --directory 07_WEB_PREVIEW/companion_sandbox/dist &
python 08_VALIDATION/scripts/browser_g1_test.py                       # → 08_VALIDATION/runtime_g1/g1_runtime_report.json
python 08_VALIDATION/scripts/browser_companion_regress_g1.py --mode fallback   # Gate F suite, module off (expectations unchanged)
python 08_VALIDATION/scripts/browser_companion_regress_g1.py --mode g1         # Gate F suite, module on (documented changes)
python 08_VALIDATION/scripts/capture_g1_previews.py [clip …]           # → previews/*.mp4 + renders/fox_g1_runtime_keyframes_*.png
```

The G1 scripts never write the approved E1 / E2 / D1.1 files. `anim_g1.py` overwrites only `fox_anim_g1.blend`.
The technical harness is `#/g1` in the sandbox (animation selector, streak tiers, event triggers, priority tests, effect toggles).

## Where to change things

* Measured proportions and anchor points → `01_DESIGN/proportions.json`
* Colours / roughness → `01_DESIGN/materials.json`
* Shape profiles per module → functions `build_head`, `build_ears`, … in `build_modules.py`
* Geometry helpers (loft, sweep, exact colour-boundary split, surface decals) → `foxlib.py`

Never edit the module `.blend` files by hand and then rebuild — the build
overwrites them. Either change the scripts/data, or stop using the build for
that module and record it here.

## Release export (not yet run — originally planned as "Gate F"; the brief later assigned Gate F to the companion sandbox)

Planned: `06_EXPORTS/glb/fox_v2_base.glb` via Blender's glTF exporter with
modifiers applied, +Y up, from `FOX_ROOT`.
