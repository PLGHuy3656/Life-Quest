# Fox V2 — asset portability report (independent test before Gate H1 approval)

**Criterion:** another developer can open, inspect, edit and run Fox V2 without Claude.

**Verdict: met for Blender, GLB and the web runtime.** It was tested on a fresh extraction, on two machines, with
factory settings, an empty npm cache, and the network shut off during the runtime test. Two items are open (§5): native
Windows Blender / browser runs, and a stale root README.

The evidence is behaviour, not file creation:
- files were opened, played, edited, saved and reopened;
- GLBs were decoded by two engines that share no code with the project, and compared with the Blender poses;
- the runtime was built from source and played offline.

## 1. Test setup

| | Machine A | Machine B |
|---|---|---|
| Where | isolated build container (Ubuntu) | the user's Windows device `lenovo-fox`: sandboxed Ubuntu 22.04 shell, Windows folder mounted |
| Package | `LifeQuest_Fox_V2_GateH1.zip` (sha256 `39881de3…3d98a`) extracted into **empty folders** (Blender, runtime, viewer) | the Windows workspace after sync, verified **1,603 / 1,603** files against `GATE_H1_SHA256SUMS.txt`; runtime built from a fresh extraction of the zip on that machine |
| Blender | bpy 5.3.0, empty `HOME`, factory settings | bpy 5.3.0 freshly installed into an empty venv from the PyPI wheel, empty `HOME`, factory settings |
| Node / npm | 22.23 / 10.9 | 22.23 / 10.9 |
| Browser | headless Chrome (SwiftShader) | none: Chrome download blocked by the machine's network allowlist |

## 2. Blender — `BLENDER_OPEN_TEST.md`

| Check | Result |
|---|---|
| Opens in factory Blender (master model, rig, 4 animation files, cosmetics) | 7 / 7, both machines |
| Meshes / materials / 28 bones / 42 shape keys / actions / attachments present | yes (counts identical on both machines) |
| External files, absolute / cloud paths, linked libraries | **0** in every file (node-colour materials, no images) |
| Add-on / script dependencies (drivers, PYTHON constraints, registered scripts, Rigify props) | **none** |
| Every action plays (9 frames each; bones / mesh / shape keys move) | all 76 actions (across the 7 files) |
| Manual edit: bone keyframe + shape-key key → save → reopen → same values | pass in all 6 rigged files |
| Packing | nothing to pack: no external resource exists, so no source file was re-saved |

## 3. GLB — `GLB_COMPATIBILITY_REPORT.md`

| Check | Result |
|---|---|
| Khronos glTF-Validator, 12 current GLBs | **0 errors** (warnings: `NODE_SKINNED_MESH_NON_ROOT`, the standard Blender layout) |
| Babylon.js 9.37.1: model, 28-joint skeleton, 28 morph targets, 7 clips | loads and plays |
| Modules bound by node name in Babylon (documented procedure) | G1.1 756 + 252 morph, G2.1 1,344 + 448, G3 1,512 + 504 tracks; **0 unbound** |
| Blender glTF importer: base + module actions on the base armature + cosmetics | loads, plays, joint names match |
| Babylon vs Blender importer | agree to **0.001 mm** |
| Decoded poses vs Blender source | modules ≤ 5.20 mm (= their gate reports); base clips ≤ 4.17 mm except **tail_touch 8.69 mm at one ear tip** (pre-existing glTF shear limit of the approved E2 GLB, see §5) |
| Cosmetics in Babylon | same joint order as the Fox → shared skeleton, rendered posed |

## 4. Runtime

| Check | Machine A | Machine B |
|---|---|---|
| `npm ci` from `package-lock.json`, empty cache | 89 packages | 89 packages (8 s) |
| `npm run build` (asset copy + `tsc -b` + `vite build`) | ✓ | ✓ (15 s) |
| Build reproducible | dist tree hash `009534d5…`, identical to the shipped `dist/` | **identical** |
| Served dist over HTTP | ✓ | 47 / 47 files, 200 and byte-identical |
| Offline smoke test (`portability_runtime_smoke.py`): every host except 127.0.0.1 unresolvable, other requests aborted | **7 / 7** | — (no browser) |
| ↳ modules bound | G1 891/891, G2 1,584/1,584, G3 1,782/1,782 tracks | |
| ↳ core + G1–G3 clips via the public API | 12 / 12 play | |
| ↳ VFX during effect clips | 7 / 6 / 4 objects (level_up / quest_complete / challenge_win) | |
| ↳ daily states (study / sleep / sports), cosmetics (7 slots), Lv1 / Lv30 | pass | |
| ↳ requests leaving 127.0.0.1 | **0** | |
| Full H1 suite on the fresh build | **28 / 28** | — |
| Claude / Anthropic references in source or bundles | 0. The only URLs in the bundles are XML namespaces and library error-message links | 0 |

## 5. Limitations and external dependencies

1. **Native Windows was not run.**
   - Machine B is the user's Windows PC, but its shell is a Linux sandbox. No Blender install was found on the Windows
     side, and that sandbox could not download a browser (network allowlist). So the Windows-native Blender GUI open
     and a Windows browser run of the mascot were **not** done.
   - To close this, a developer on Windows runs the two commands in `THIRD_PARTY_HANDOFF_GUIDE.md` §4.5 and §7. Each
     takes a few minutes.
2. **The root `README.md` is stale** (it stops at Gate G1). It was not edited, because approved files are only changed
   with approval. `THIRD_PARTY_HANDOFF_GUIDE.md` is the current entry point. Recommendation: replace the README's status
   and folder table, or point it to the guide.
3. **Blender 5.3+ is required.** The files use slotted actions (4.4+) and were saved by 5.3. Older versions were not
   tested.
4. **Clips are spread over 4 animation files.** There is no single blend with all 50 clips. Actions append between files
   because the rig is identical.
5. **glTF shear in the approved E2 GLB.** `tail_touch` frame 15 deviates 8.69 mm from Blender at the left ear tip, in
   every decoder (three.js runtime, Babylon, Blender importer). The earlier E2 figure (3.78 mm) used fewer sample
   frames. This is a format limit, already documented for G1.1–H1 (non-uniform squash under bones that do not inherit
   scale). It is not caused by portability.
6. **Build-time network.** `npm ci` needs the npm registry once (or an offline npm cache / vendored `node_modules`). The
   built mascot then needs no network at all.
7. **Test tooling** needs Python + Playwright + Chrome, and is optional. The validation scripts also contain the export
   pipeline, which runs with `blender -b --python` or the `bpy` module.
8. **No GPU tests.** Rendering used SwiftShader. This says nothing about GPU performance.
9. **Untested engines:** Unity, Unreal, Godot, macOS.

## 6. Files

- **Reports:** `BLENDER_OPEN_TEST.md`, `GLB_COMPATIBILITY_REPORT.md`, `THIRD_PARTY_HANDOFF_GUIDE.md` (this folder)
- **Machine A evidence:** `08_VALIDATION/portability/container_run/`
  - `blender_open_container.json`
  - `gltf_validator.json`
  - `gltf_reimport_blender.json`
  - `babylon_report.json` + `babylon_contact_sheet.png`
  - `runtime_offline_smoke.json` + `offline_smoke.png`
  - `h1_runtime_report_fresh_build.json`
- **Machine B evidence:** `08_VALIDATION/portability/second_machine/`
  - Blender per-file JSONs
  - `gltf_reimport_device.json`
  - `gltf_validator_device.json`
  - `e2_ref_device.json`
  - `environment.txt`
- **Scripts:**
  - `08_VALIDATION/scripts/portability_blender_check.py`
  - `portability_gltf_reimport.py`
  - `portability_e2_reference.py`
  - `portability_runtime_smoke.py`
  - viewer: `08_VALIDATION/portability/viewer/` (Babylon page + runner, validator runner, `package.json` / lock, E2 reference poses)

No approved file was modified. The test added only new files.
