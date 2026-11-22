# LifeQuest Fox V2 — Cleanup Log

Cleanup is limited to `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2\` and to obsolete
Fox V2 archive packages directly inside `LifeQuest_Assets\Mascot\`. The rules
(allowed categories, protected files, checkpoint retention, safety procedure)
come from the user's workspace file-management permission of 2026-11-16.

## Retention policy in force

| Keep | Current item |
|---|---|
| Current working model | `02_MODEL/fox_master.blend` + `02_MODEL/modules/` (Gate C r2) |
| Most recent verified checkpoint | `02_MODEL/checkpoints/gateC_r2/` |
| Latest approved production checkpoint | none yet: Gate C is not approved |
| Original Gate C model (kept at the user's explicit request) | `02_MODEL/checkpoints/gateC_r1/` |

---

## 2026-11-16 · Cleanup #1

### Pre-checks
| Step | Result |
|---|---|
| Paths resolved with `realpath`, all inside the authorized `Mascot` folder | ✅ |
| Symlinks / junctions in the workspace | none |
| `.blend1` / `.blend2` / `_tmp*` / `*.tmp` files | none |
| References to the packages in scenes, scripts or docs | none |
| Master + 8 modules open in Blender 5.3 | ✅ |
| Technical validation | ✅ 35/35 |
| Device files byte-identical to the build (68-file SHA-256 manifest `187557de…`) | ✅ |
| Both packages pass `gzip -t` (40 and 68 files) | ✅ |
| Newer verified backup exists for each package | ✅ see below |

### Backup created before deletion
`02_MODEL/checkpoints/gateC_r2/` (27 files, plus `CHECKPOINT.md`): master, 8 modules, renders, data
and build scripts copied from the current working state. Master, modules and
scripts were verified byte-identical with SHA-256 / `cmp`.

### Deleted
| Path | Size | Category | Why it was safe |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\_LifeQuest_Fox_V2_gateABC_package.tar.gz` | 14,293,921 B | obsolete Fox V2 package | Gate A–C r1 delivery package. Its model (`fox_master.blend` SHA-256 `d5e49a3b…`) is identical to `checkpoints/gateC_r1/`; its docs and scripts are superseded by the current files |
| `LifeQuest_Assets\Mascot\_LifeQuest_Fox_V2_gateC_r2_package.tar.gz` | 19,123,447 B | obsolete Fox V2 package | Gate C r2 delivery package. Its content equals the current working files (manifest-verified) and is now kept in the verified `checkpoints/gateC_r2/` |

Total freed: about 33.4 MB. Nothing inside `LifeQuest_Fox_V2\` was deleted.

### Deliberately kept
| Path | Reason |
|---|---|
| `02_MODEL/checkpoints/gateC_r1/` | The user explicitly asked to keep the original Gate C model as a backup. It is older than r2, so it may be removed later, but only on request or after an approved checkpoint exists |
| `08_VALIDATION/masks/*.png` | Reproducible, but `make_comparison.py` reads them as input |
| `03_RIG/` … `07_WEB_PREVIEW/` (empty) | Required production directory structure from the brief |

### Post-cleanup checks
Workspace manifest re-checked: the 68 working files are unchanged (README
updated only to list the new checkpoint). New files: 28 in `checkpoints/gateC_r2/`
(including `CHECKPOINT.md`) and this log. Validation re-run: 35/35 pass.

---

## 2026-11-16 · Cleanup #2 (Gate C r3 sync)

Retention update: current working model = Gate C r3; most recent verified
checkpoint = `02_MODEL/checkpoints/gateC_r3/`. `gateC_r1` and `gateC_r2` are
kept by explicit user instruction (do not delete yet).

| Path | Size | Category | Why it was safe |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\_r3_part1_checkpoint.tar.gz` | 4,901,110 B | temporary transfer archive | Used only to copy the r3 checkpoint to this computer. Extracted, and the workspace was verified identical to the build (126 files, manifest `69a12d87…`) before deletion |
| `LifeQuest_Assets\Mascot\_r3_part2_working.tar.gz` | 14,544,069 B | temporary transfer archive | Same as above, for the r3 working files |

Protected `00_REFERENCE/` images were not overwritten: the extract was refused write access to them, and they are unchanged by hash. Nothing inside `LifeQuest_Fox_V2\` was deleted. Validation of the r3 state: 35/35 pass.

---

## Packages register

| Package | Created | Content | Status |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateC_r3.zip` (28,952,396 B) | 2026-11-16, at the user's request | Full `LifeQuest_Fox_V2\` folder at Gate C r3: 126 files including checkpoints r1–r3. CRC test passed; every entry byte-identical to the workspace | **Gate C r3 review package, not an approved release.** Do not delete without the user's approval. Once a newer verified package or an approved release exists, it becomes an "obsolete Fox V2 package" under the cleanup rules |

Note: RAR was requested ("raz"), but no RAR encoder is available on this computer or in the build workspace (RAR creation needs proprietary WinRAR), so ZIP was used. WinRAR and 7-Zip can open the ZIP.

---

## 2026-11-16 · Cleanup #3 (Gate C r4)

Retention: current working model = Gate C r4; most recent verified checkpoint =
`02_MODEL/checkpoints/gateC_r4/`. `gateC_r1`, `gateC_r2` and `gateC_r3` are kept
until final approval (user instruction).

| Path | Category | Why it was safe |
|---|---|---|
| `01_DESIGN/comparisons/fox_reference_vs_model.png` | reproducible intermediate image (r3 output) | Byte-identical (`cmp`) to `02_MODEL/checkpoints/gateC_r3/renders/fox_reference_vs_model.png`; superseded by `fox_reference_vs_model_r4.png`; live docs re-pointed to the r4 name, historical change logs point to the checkpoint copy |
| `01_DESIGN/comparisons/fox_face_controls_test.png` | reproducible intermediate image (r3 output) | Byte-identical to `checkpoints/gateC_r3/renders/fox_face_controls_test.png`; superseded by `fox_face_controls_r4.png` |

Log repair: the previous write of this log (packages register) did not reach
this computer, although the transfer reported success. This version restores
it, and the transfer is now verified by hash after writing.

### Archive management (Gate C r4)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateC_r4.zip`
* Size: 35,454,185 B. SHA-256 `ba6af3b832135bc013323331358197ee41d7720aff52cb5a0a9bdd1c9a271ad4`.
* Contents: the complete `LifeQuest_Fox_V2\` project, 157 files: canonical reference, Blender master, 8 modular sources, scripts, renders, validation, documentation, and checkpoints `gateC_r1` … `gateC_r4`.
* Verification before any deletion:
  * CRC test passed.
  * Fully extracted to a temporary folder: 157 of 157 files, identical file list.
  * SHA-256 compared for every file: 0 mismatches. Master `16ce1a04…` and all 8 module hashes match the workspace.
  * The temporary extract folder was removed afterwards.
* The copy of this log inside the zip predates this "Archive management" entry. Every other file in the zip is identical to the workspace.

**Deleted after the r4 archive was verified:**
| Path | Size | Category | Reason |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateC_r3.zip` | 28,952,396 B | obsolete Fox V2 delivery archive | Superseded by the verified r4 archive. Its model is preserved in `checkpoints/gateC_r3/`, which is also inside the r4 zip. Deleted on the user's explicit Gate C r4 instruction |
| `LifeQuest_Assets\Mascot\_r4_partA_working.tar.gz` | 15,343,385 B | temporary transfer archive | Used to copy the r4 files to this computer. Hash-verified against the source, extracted, workspace verified identical (157 files, manifest `6256c7e5…`) |
| `LifeQuest_Assets\Mascot\_r4_partB_checkpoint.tar.gz` | 5,696,835 B | temporary transfer archive | Same as above, for `checkpoints/gateC_r4/` |

No `.rar` archives existed. Protected files untouched: `00_REFERENCE/`, current master, modules, scripts, reports and all four checkpoints.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateC_r4.zip` | **Latest valid archive**: Gate C r4 review package, not an approved release. Must not be deleted until a newer archive has been verified |
| `LifeQuest_Fox_V2_GateC_r3.zip` | deleted 2026-11-16 (superseded, see above) |

---

## 2026-11-16 · Gate D1 (rig prototype)

Retention: modeling source unchanged (`02_MODEL/fox_master.blend` = `checkpoints/gateC_r4`, SHA-256 `16ce1a04…`).
All four modeling checkpoints are kept. New rig artifacts live in `03_RIG/`.

Workspace housekeeping (files never delivered):
* `03_RIG/renders/_frames/` (124 preview frames) and `03_RIG/renders/_tmp.png` are render intermediates. `rig_render.py` removes them automatically once the mp4/gif are encoded. They are reproducible and were never synced.
* A first contact-sheet render with EEVEE was stopped at about 45 s per frame (software GL) and its partial temp output discarded. Renders now use Cycles.

### Archive management (Gate D1)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateD1.zip`
* Size: 40,832,989 B. SHA-256 `5d042669515a86995c0cdd7f5e8f40b0d4f225ec521a68f6de0c69644d9779be`.
* Contents: the complete project, 171 files: reference, untouched master, 8 modules, rig prototype + specs + report + renders, scripts, validation, docs, and checkpoints `gateC_r1` … `gateC_r4`.
* Verification before any deletion:
  * CRC test passed.
  * Fully extracted to a temporary folder: 171 of 171 files, identical list.
  * SHA-256 compared for every file: 0 mismatches. Master `16ce1a04…`, all 8 modules and the rig `c3760866…` were checked explicitly.
  * The temporary extract folder was removed.
* The copy of this log inside the zip predates this "Archive management (Gate D1)" entry.

**Deleted after verification:**
| Path | Size | Category | Reason |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateC_r4.zip` | 35,454,185 B | obsolete Fox V2 delivery archive | Superseded by the verified D1 archive, which contains the full r4 model and `checkpoints/gateC_r4/` byte-identically |
| `LifeQuest_Assets\Mascot\_d1_sync.tar.gz` | 20,718,912 B | temporary transfer archive | Hash-verified (`bc1a50a0…`) and extracted; workspace verified identical to the build (171 files, manifest `782f6063…`) |

No `.rar` archives existed. Protected items untouched: `00_REFERENCE/`, `02_MODEL/fox_master.blend`, `02_MODEL/modules/`, `08_VALIDATION/scripts/`, reports, all checkpoints.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateD1.zip` | deleted 2026-11-16 (superseded by GateD1_1) |
| `LifeQuest_Fox_V2_GateC_r4.zip` | deleted 2026-11-16 (superseded by GateD1) |

## 2026-11-16 — Gate D1.1 (rig correction + GLB compatibility)

Workspace housekeeping (cloud build side, never delivered):
* `03_RIG/fox_rig_d1_1.blend1`: automatic Blender backup created when `rig_tests_d1_1.py` re-saved the file. It is reproducible from the scripts. Removed after confirming `fox_rig_d1_1.blend` opens and its hash is `87463907…`.
* `__pycache__/`: removed.
* Render intermediates (`renders_d1_1/_frames/`, `_tmp.png`) are removed automatically by `rig_render.py`.

Device sync: before the sync the device workspace was confirmed unchanged since D1 (171 files). A temporary transfer archive `fox_d1_1_sync.tar.gz` (12,715,216 B, SHA-256 `7aae36c3…`) carried the 38 new and 7 changed files. Its hash was verified on the device and it was extracted. Result: 209 files; the non-checkpoint manifest `887f072e…` is identical to the build. `02_MODEL/fox_master.blend` is unchanged (`16ce1a04…` = `checkpoints/gateC_r4`).

### Archive management (Gate D1.1)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateD1_1.zip`
* Size: 53,537,328 B. SHA-256 `359f062b60a676b30cb71fb173a9239fedc710fbd12dc174ee964b08dbd112df`.
* Contents: the complete project, 209 files: reference, untouched master, 8 modules, D1 rig (`c3760866…`), D1.1 rig (`87463907…`), test GLB (`b7ba8c32…`), viewer `rig_test.html` (`5cda2fd4…`), runtime reports and screenshots, scripts, docs, and checkpoints `gateC_r1` … `gateC_r4`.
* Verification before any deletion:
  * `unzip -t` reported no errors.
  * Fully extracted to a temporary folder: 209 of 209 files.
  * SHA-256 compared for every file: identical (`diff` empty).
  * The temporary folder was removed.
* The copy of this log inside the zip predates this "Archive management (Gate D1.1)" entry.

**Deleted after verification** (realpath checked inside `LifeQuest_Assets\Mascot\`, not a symlink):
| Path | Size | Category | Reason |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateD1.zip` | 40,832,989 B | obsolete Fox V2 delivery archive (SHA-256 `5d042669…` matched the register before deletion) | Superseded by the verified D1.1 archive, which contains every D1 file byte-identically (D1 rig, renders, report, checkpoints) |
| `LifeQuest_Assets\Mascot\fox_d1_1_sync.tar.gz` | 12,715,216 B | temporary transfer archive | Extracted and verified |

Protected items untouched: `00_REFERENCE/`, `01_DESIGN/` specifications (only the status line updated), `02_MODEL/fox_master.blend`, `02_MODEL/modules/`, `08_VALIDATION/scripts/` (D1 scripts kept, D1.1 scripts added), reports, all checkpoints `gateC_r1`–`r4`, and the D1 rig `fox_rig_prototype.blend`.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateD1_1.zip` | superseded as latest — see the Gate E1 register below |
| `LifeQuest_Fox_V2_GateD1.zip` | deleted 2026-11-16 (superseded by GateD1_1) |
| `LifeQuest_Fox_V2_GateC_r4.zip` | deleted 2026-11-16 (superseded by GateD1) |

## 2026-11-17 — Gate E1 (interactive animation prototype)

Approved inputs kept unchanged and verified by hash: `02_MODEL/fox_master.blend` `16ce1a04…`, `03_RIG/fox_rig_d1_1.blend` `87463907…`, `06_EXPORTS/glb/fox_v2_rig_test.glb` `b7ba8c32…`.
New rollback checkpoint of the approved D1.1 rig: `03_RIG/checkpoints/gateD1_1_approved/` (rig, face_morph_map, skeleton_spec, attachment_points, D1.1 GLB + `SHA256SUMS`).

Workspace housekeeping (cloud build side, never delivered):
* `04_ANIMATIONS/fox_anim_e1.blend1`: automatic Blender backup, reproducible with `anim_e1.py`. Removed.
* `__pycache__/`: removed.
* Preview frame folders `04_ANIMATIONS/renders_e1/_frames_*` and `_tmp_*.png`: render intermediates, removed automatically by `anim_render_e1.py` after encoding (an aborted first pass was discarded and re-rendered).
* Debug scripts under `/tmp` (outside the project): not part of the deliverable.

### Archive management (Gate E1)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateE1.zip`
* Size: 75,679,352 B. SHA-256 `5b32869602677166f214c765861bfb7707a6689ee07713edddd6a5fb07239c05`.
* Contents: the complete project, 264 files:
  * E1 animation source `fox_anim_e1.blend` `739b544d…`
  * GLB `fox_v2_anim_e1.glb` `eabde5b2…`
  * viewer `fox_interactive_e1.html` `1cf7c065…`
  * renders and previews, E1 scripts, reports and the browser runtime report
  * approved D1.1 sources (rig `87463907…`, D1.1 GLB `b7ba8c32…`) plus the `gateD1_1_approved` checkpoint
  * master `16ce1a04…`, modules, and checkpoints `gateC_r1`…`r4`
* How it was built: `zip` could not replace its temporary file inside the connected folder, because deletion was not yet allowed in this session. The archive was therefore built in the device session's scratch folder and copied in. The copy is byte-identical (same SHA-256).
* Verification:
  * `unzip -t` reported no errors.
  * Fully extracted to a temporary folder: 264 of 264 files.
  * SHA-256 compared for every file: identical (`diff` empty).
  * The temporary folder was removed.
* The copy of this log inside the zip predates this "Archive management (Gate E1)" entry.

**Deleted after verification** (realpath inside `LifeQuest_Assets\Mascot\`, not a symlink, deletion permission granted this session):
| Path | Size | Category | Reason |
|---|---|---|---|
| `LifeQuest_Assets\Mascot\zi3Qn3aR` | 75,679,352 B | temporary file from the zip tool | Left behind by the failed in-place zip run (its content equals the verified archive) |
| `LifeQuest_Assets\Mascot\fox_e1_sync.tar.gz` | 22,150,713 B | temporary transfer archive (SHA-256 `48161a68…`) | Extracted. The workspace was verified identical to the build: 264 files, manifest `1236a183…` |
| `LifeQuest_Assets\Mascot\_e1_local_manifest.txt` | 17,315 B | temporary sync manifest | Used only to compute the sync delta |

**Not deleted:** `LifeQuest_Fox_V2_GateD1_1.zip`. Gate D1.1 was approved for prototype development, so this archive is the **approved package** (protected under the workspace rules). No other obsolete Fox V2 archives existed, so no delivery archive was deleted in E1.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateE1.zip` | **Latest valid archive**: Gate E1 interactive animation prototype, waiting for visual approval |
| `LifeQuest_Fox_V2_GateD1_1.zip` | **Approved** Gate D1.1 package (rig + GLB baseline). Keep (protected) |
| `LifeQuest_Fox_V2_GateD1.zip` | deleted 2026-11-16 (superseded by GateD1_1) |
| `LifeQuest_Fox_V2_GateC_r4.zip` | deleted 2026-11-16 (superseded by GateD1) |

---

## Gate E2: character motion polish (2026-11-17)

### Preserved (verified unchanged by SHA-256)
* Gate E1 (approved functional prototype): `fox_anim_e1.blend` `739b544d…`, `fox_v2_anim_e1.glb` `eabde5b2…`, `fox_interactive_e1.html` `1cf7c065…`, the E1 scripts, the E1 reports and `renders_e1/`
* D1.1: rig `87463907…`, GLB `b7ba8c32…`, checkpoint `03_RIG/checkpoints/gateD1_1_approved/`
* master `16ce1a04…`, modules, and checkpoints `gateC_r1`…`r4`
* The sync to the device changed only E2 files plus three docs (`README.md`, `09_DOCS/BUILD.md`, `01_DESIGN/character_master_spec.md`): 88 files in total. No E1 file was touched.

### New in E2
* `04_ANIMATIONS/fox_anim_e2.blend`
* `04_ANIMATIONS/anim_spec_e2.json`
* `04_ANIMATIONS/idle_variation_e2.json`
* `04_ANIMATIONS/anim_metrics_e2.json`
* `04_ANIMATIONS/animation_report_e2.md`
* `04_ANIMATIONS/renders_e2/`
* `04_ANIMATIONS/renders_compare/` (the E1 vs E2 videos plus the E1 preview views re-rendered for comparison under `renders_compare/e1/`)
* `06_EXPORTS/glb/fox_v2_anim_e2.glb` `e884d675…` and its manifest
* `07_WEB_PREVIEW/fox_interactive_e2.html` `3ec68b1e…`
* `08_VALIDATION/scripts/*_e2.py` and `make_e1_e2_compare.py`
* `08_VALIDATION/runtime_e2/`
* `08_VALIDATION/runtime_regression_report_e2.md`

### Deleted in the workspace (reproducible intermediates, in the build container)
* `04_ANIMATIONS/fox_anim_e2.blend1`: automatic Blender backup, reproducible with `anim_e2.py`
* `__pycache__/`
* Render frame folders and temporary images in `renders_e2/` and `renders_compare/`: removed automatically after encoding
* An earlier tail_touch preview: overwritten by the re-render after re-timing

### Temporary on the user's machine
* The local Python server (`127.0.0.1:8765`, used only for the GPU test in the desktop app's built-in browser) was stopped after the test.

### Archive management (Gate E2)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateE2.zip`
* Size: 108,545,131 B. SHA-256 `614834f34a8757f093699ad86716e8d668bb90132cac41c92ec0e9768ac943f6`.
* Contents: the complete project, 351 files:
  * E2 source `fox_anim_e2.blend` `c4101988…`
  * GLB `fox_v2_anim_e2.glb` `e884d675…`
  * viewer `fox_interactive_e2.html` `3ec68b1e…`
  * the E1 vs E2 comparisons, E2 reports and runtime validation
  * all of approved E1 (`739b544d…` / `eabde5b2…` / `1cf7c065…`)
  * D1.1 (rig `87463907…`, GLB `b7ba8c32…`) plus the `gateD1_1_approved` checkpoint
  * master `16ce1a04…`, and checkpoints `gateC_r1`…`r4`
* How it was built: in the device session's scratch folder, then copied in. The copy is byte-identical.
* Verification:
  * `unzip -t` reported no errors.
  * Fully extracted to a temporary folder: 351 of 351 files.
  * SHA-256 compared for every file against the workspace: identical (`diff` empty).
  * `SHA256SUMS` of the `gateD1_1_approved` checkpoint inside the zip: OK.
  * The temporary folder was removed.
* Sync incident: `device_commit_files` once delivered an outdated `CLEANUP_LOG.md` (hash `b27894bc…` instead of `7c0c5f8d…`). It was detected by hash before the archive was finalised, corrected, and the zip was rebuilt. The final zip contains the correct log.
* The copy of this log inside the zip predates this "Archive management (Gate E2)" entry.

**Deleted after verification** (realpath inside `LifeQuest_Assets\Mascot\`, not a symlink, deletion permission granted this session):
| Path | Size | Category | Reason |
|---|---|---|---|
| `Mascot\e2_sync.part00`–`part03` | 9,437,184 ×3 + 3,586,048 B | temporary transfer archive (4 parts; whole tar SHA-256 `e00beefa…`) | Extracted. The workspace was verified identical to the build (351/351) |
| `Mascot\e2_local_manifest.txt` | 39,956 B | temporary sync manifest | Used only for the delta and the verification |
| `Mascot\e2_delta.txt` | 4,218 B | list of files that differ (88) | Used only for the sync |

**Not deleted:**
* `LifeQuest_Fox_V2_GateE1.zip`: Gate E1 was approved as a functional prototype, so this is the **approved package** and the rollback for E2.
* `LifeQuest_Fox_V2_GateD1_1.zip`: approved rig + GLB baseline package.

Both are protected. There were no obsolete Fox V2 archives, so no delivery archive was deleted in E2.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateE2.zip` | **Latest valid archive**: Gate E2 motion polish, waiting for approval |
| `LifeQuest_Fox_V2_GateE1.zip` | **Approved** Gate E1 package (functional interactive prototype). Keep (protected, rollback) |
| `LifeQuest_Fox_V2_GateD1_1.zip` | **Approved** Gate D1.1 package (rig + GLB baseline). Keep (protected) |
| `LifeQuest_Fox_V2_GateD1.zip` | deleted 2026-11-16 (superseded by GateD1_1) |
| `LifeQuest_Fox_V2_GateC_r4.zip` | deleted 2026-11-16 (superseded by GateD1) |

---

## Gate F: companion sandbox & runtime foundation (2026-11-17)

### Preserved (verified unchanged by SHA-256 before packaging)
* E2 (approved): `fox_anim_e2.blend` `c4101988…`, `fox_v2_anim_e2.glb` `e884d675…`, `fox_interactive_e2.html` `3ec68b1e…`, the E2 scripts, the E2 reports, `renders_e2/` and `renders_compare/`
* E1: `fox_anim_e1.blend` `739b544d…`, `fox_v2_anim_e1.glb` `eabde5b2…`, `fox_interactive_e1.html` `1cf7c065…`
* D1.1: rig `87463907…`, GLB `b7ba8c32…`, checkpoint `gateD1_1_approved` (SHA256SUMS OK)
* master `16ce1a04…`, modules, and checkpoints `gateC_r1`…`r4`

### New in Gate F
* `07_WEB_PREVIEW/companion_sandbox/`:
  * `src/` (`mascot/` runtime modules, `components/`, `pages/`, `App.tsx`)
  * `package.json` + `package-lock.json`
  * `README.md`
  * `scripts/copy-assets.mjs`
  * `public/` (contains a hash-checked copy of the E2 GLB + the fallback poster)
  * `dist/`: a prebuilt static sandbox that runs without npm
* `08_VALIDATION/gate_f_runtime_report.md`, `08_VALIDATION/runtime_f/` (JSON reports + screenshots), `08_VALIDATION/scripts/browser_companion_test_f.py`
* `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `09_DOCS/COMPANION_INTEGRATION_GUIDE.md`, `09_DOCS/KNOWN_LIMITATIONS_GATE_F.md`
* Updated: `README.md`, `09_DOCS/BUILD.md`. The old "Export (Gate F)" heading was renamed "Release export", because the brief assigned Gate F to the sandbox.

### Not delivered / removed (reproducible)
* `companion_sandbox/node_modules/` (88 npm packages, recreated with `npm install` from `package-lock.json`): excluded from the sync and the archive
* `companion_sandbox/tsconfig.tsbuildinfo` (TypeScript build cache): removed
* Temporary test servers: `127.0.0.1:4180` (build container) and `127.0.0.1:8766` (Python on the user's machine, GPU test), both stopped

### Archive management (Gate F)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateF.zip`
* Size: 115,713,846 B. SHA-256 `563a3c38cc7b53d3fe6349493d8fc268149cb025b259c2374fd513b06e43996b`.
* Contents: the complete project, 436 files:
  * the Gate F sandbox (sources + prebuilt `dist/`; no `node_modules/`), the runtime docs and the validation results
  * all of approved E2 (`c4101988…` / `e884d675…` / `3ec68b1e…`) and E1
  * D1.1 + the `gateD1_1_approved` checkpoint
  * master `16ce1a04…`, and checkpoints `gateC_r1`…`r4`
* How it was built: in the device session's scratch folder, then copied in. The copy is byte-identical.
* Verification:
  * `unzip -t` reported no errors.
  * Fully extracted to a temporary folder: 436 of 436 files.
  * SHA-256 of every file is identical to the workspace AND to the build-container manifest (`diff` empty).
  * `gateD1_1_approved/SHA256SUMS` OK.
  * The temporary folder was removed.
* The copy of this log inside the zip predates this "Archive management (Gate F)" entry.

**Deleted after verification** (realpath inside `LifeQuest_Assets\Mascot\` or the workspace, not a symlink, deletion permission granted this session):
| Path | Size | Category | Reason |
|---|---|---|---|
| `Mascot\f_sync.part00` | 6,748,160 B | temporary transfer archive (SHA-256 `aabb27ac…`) | Extracted; the workspace was verified identical to the build (436/436) |
| `Mascot\gf_dist.tar` | 4,249,600 B | temporary transfer archive of `dist/` for the GPU test (`5d76f054…`) | Superseded by the full sync above |
| `Mascot\f_local_manifest.txt` | 51,348 B | temporary sync manifest | Used only for the delta and the verification |
| `Mascot\f_delta.txt` | 3,056 B | list of files that differ (57) | Used only for the sync |
| `LifeQuest_Fox_V2\07_WEB_PREVIEW\companion_sandbox\dist\assets\index-Yojes76D.js` | (stale build chunk) | outdated build output | Left over from the first GPU-test build; not referenced by `dist/index.html`; reproducible with `npm run build` |

**Not deleted:**
* `LifeQuest_Fox_V2_GateE2.zip`: Gate E2 approved package and the most recent approved rollback.
* `LifeQuest_Fox_V2_GateE1.zip`, `LifeQuest_Fox_V2_GateD1_1.zip`: approved packages, protected.

Their full contents are also contained in GateE2.zip and GateF.zip, so they could be removed to save ≈ 129 MB, but only with explicit approval. No obsolete (unapproved, superseded) delivery archive existed, so none was deleted in Gate F.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateF.zip` | **Latest valid archive**: Gate F companion sandbox & runtime foundation, waiting for approval |
| `LifeQuest_Fox_V2_GateE2.zip` | **Approved** Gate E2 package (motion polish). Keep (protected, latest approved rollback) |
| `LifeQuest_Fox_V2_GateE1.zip` | **Approved** Gate E1 package. Keep (protected) |
| `LifeQuest_Fox_V2_GateD1_1.zip` | **Approved** Gate D1.1 package (rig + GLB baseline). Keep (protected) |
| `LifeQuest_Fox_V2_GateD1.zip` | deleted 2026-11-16 (superseded by GateD1_1) |
| `LifeQuest_Fox_V2_GateC_r4.zip` | deleted 2026-11-16 (superseded by GateD1) |

## 2026-11-18 — Gate G1 (quest, reward & streak animation module)

All paths were resolved inside `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2\` (or the build container's copy of it); no symlinks were followed. Nothing protected was touched: `00_REFERENCE/`, `01_DESIGN/`, `fox_master.blend` `16ce1a04…`, `02_MODEL/modules/`, `fox_rig_d1_1.blend` `87463907…`, the `gateD1_1_approved` and `gateC_r1…r4` checkpoints, E1 / E2 blends, GLBs and viewers (`c4101988…`, `e884d675…`, `3ec68b1e…`, `739b544d…`, `eabde5b2…`), the existing validation scripts and reports (only new G1 scripts were added; `browser_companion_test_f.py` is unchanged and is re-run through `browser_companion_regress_g1.py`).

**Removed (reproducible intermediates only):**
| Path | Category | Reason |
|---|---|---|
| `04_ANIMATIONS\g1_quest_reward_streak\fox_anim_g1.blend1` | Blender backup | `fox_anim_g1.blend` is regenerated by `anim_g1.py` and is in the G1 package |
| `08_VALIDATION\scripts\__pycache__\` | Python bytecode cache | Regenerated on every run |
| `07_WEB_PREVIEW\companion_sandbox\tsconfig.tsbuildinfo` | TypeScript build cache | Regenerated by `npm run build` |
| `07_WEB_PREVIEW\companion_sandbox\dist\assets\index-BKhE1rDo.js`, `index-BWX-FxzR.css`, `r3f-7JWJrbR_.js`, `react-DzDM3iCX.js`, `three-DDT284Jz.js` (device) | stale Gate F build chunks | Replaced by the G1 build; not referenced by `dist/index.html`; reproducible with `npm run build` (Gate F's build is inside `LifeQuest_Fox_V2_GateF.zip`) |
| Temporary preview frames, `_tmp_*.png` render tiles | render intermediates | Deleted by the capture / render scripts themselves |

**Overwritten (G1-owned files only):** `fox_anim_g1.blend`, `anim_metrics_g1.json`, the G1 module GLB + manifest + reference poses, the G1 previews and sheets — all regenerated after the squash reduction on `quest_complete` / `quest_failed` (glTF fidelity, see `animation_report_g1.md` §4).

**Device sync:** delta of 103 files sent as a tar in three 9 MB parts (`_g1_transfer\part_00…02`, SHA-256 of the joined tar `1076d011…`), extracted, then every file compared with the build-container manifest: 515 / 515 identical, 0 extra after the stale chunks were removed.

**Observation (not an action of this gate):** at the start of the G1 device sync, `LifeQuest_Assets\Mascot\` contained only `LifeQuest_Fox_V2_GateF.zip` (`563a3c38…`, verified intact). `LifeQuest_Fox_V2_GateE2.zip`, `GateE1.zip` and `GateD1_1.zip`, listed as kept in the Gate F register, were no longer present, and no entry in this log records their removal. Their full contents (E2, E1, D1.1, checkpoints) are inside `GateF.zip` and inside the workspace.

### Archive management (Gate G1)

**Created:** `LifeQuest_Assets\Mascot\LifeQuest_Fox_V2_GateG1.zip`
* Size: 131,796,445 B. SHA-256 `6f929bb7af939079bed19600975f36e22563ca02a92d80f313975f44aa82134e`.
* Contents: the complete project, 515 files (no `node_modules/`): the G1 module (blend, spec, metrics, report, renders, previews, GLB module + manifest + reference / FK poses), the sandbox with the G1 runtime and harness (sources + prebuilt `dist/`), the G1 scripts and validation results, the updated docs, plus all approved Gate F, E2, E1, D1.1 material, the master and the checkpoints `gateC_r1…r4` and `gateD1_1_approved`.
* Built in the device session's scratch folder, then copied in (byte-identical, same SHA-256).
* Verification: `unzip -t` no errors; fully extracted to a temporary folder: 515 / 515 files, SHA-256 of every file identical to the build-container manifest and to the device workspace (`diff` empty); `gateD1_1_approved/SHA256SUMS` OK; temporary folder removed.
* The copy of this log inside the zip predates this "Archive management (Gate G1)" entry.

**Deleted after verification:** only the temporary transfer files `Mascot\_g1_transfer\part_00…02` (26,818,560 B joined, `1076d011…`), `ws_manifest.txt` (sync manifest) and the then-empty `_g1_transfer\` folder.

**Not deleted:** `LifeQuest_Fox_V2_GateF.zip` (`563a3c38…`) — the approved Gate F package and now the only approved rollback archive on disk (see the observation above). No obsolete archive exists, so none was removed.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateG1.zip` | **Latest valid archive**: Gate G1 quest / reward / streak module, waiting for visual approval |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package (runtime foundation). Keep (protected, latest approved rollback; contains E2 / E1 / D1.1) |
| `LifeQuest_Fox_V2_GateE2.zip`, `GateE1.zip`, `GateD1_1.zip` | not present on disk at the start of G1 (removal not recorded here); contents preserved in `GateF.zip` and `GateG1.zip` |
| `LifeQuest_Fox_V2_GateD1.zip`, `GateC_r4.zip` | deleted 2026-11-16 (superseded) |

## Gate G1.1 — cinematic animation & VFX polish: Windows sync (2026-11-19)

**Source:** `LifeQuest_Fox_V2_GateG1_1.zip` (156,686,811 B, SHA-256 `d8660d3f5c87292a4b1cea2885deb55ed085a995dbb3448807eb1214795c33ba`), built and verified in the build container on 2026-11-18. The verification ran again before the sync: `unzip -t` reported no errors, the archive was fully extracted, and 683 / 683 files matched `09_DOCS/GATE_G1_1_SHA256SUMS.txt`.

**Workspace before the sync:** 515 files, identical to the Gate G1 state (manifest SHA-256 `75bb6e14…`, the same manifest taken at the start of G1.1).

**Synchronized:** only the new G1.1 versioned files, **169 files**:
* the 168 files new in the manifest + `09_DOCS/GATE_G1_1_SHA256SUMS.txt`
* per folder:
  * `04_ANIMATIONS/g1_1_cinematic_polish/`: 28
  * `06_EXPORTS/glb/modules/fox_v2_g1_1_*`: 4
  * `07_WEB_PREVIEW/companion_sandbox_g1_1/`: 82 (sources + prebuilt `dist/`, no `node_modules/`)
  * `08_VALIDATION/scripts/` (G1.1 scripts): 13
  * `08_VALIDATION/runtime_g1_1/`: 37
  * `08_VALIDATION/gate_g1_1_runtime_report.md`, `vfx_qa_report_g1_1.md`
  * `09_DOCS/BUILD_G1_1.md`, `KNOWN_LIMITATIONS_GATE_G1_1.md`, `GATE_G1_1_SHA256SUMS.txt`
* Method:
  * one transfer tar (`Mascot\_g1_1_sync.tar`, 32,215,040 B, `25af1e14…`, checked on the device)
  * extracted with `tar -xk`: never overwrites an existing file; no file existed at any target path

**Verification on Windows:**
* `sha256sum -c 09_DOCS/GATE_G1_1_SHA256SUMS.txt`: **683 / 683 OK**
* the 515 Gate G1 files re-checked against the pre-sync manifest: **515 / 515 unchanged**, so Gate F, G1, master, rig, E1 / E2 / D1.1 and the checkpoints are preserved
* workspace now: 684 files (683 + the SUMS file)

**Archive added:** `Mascot\LifeQuest_Fox_V2_GateG1_1.zip`. The SHA-256 on the device is identical (`d8660d3f…`), and `unzip -t` reports no errors.

**Deleted after verification:** only the temporary transfer file `Mascot\_g1_1_sync.tar`.

**Not touched:**
* `LifeQuest_Fox_V2_GateF.zip` (`563a3c38…`) and `LifeQuest_Fox_V2_GateG1.zip` (`6f929bb7…`): both re-verified intact
* Git clones / worktrees: none are inside this workspace, and no Git operation was performed (CP-G1.1 is Antigravity's phase)

**Note:** this entry changes `CLEANUP_LOG.md`, so this one file no longer matches its line in `GATE_G1_1_SHA256SUMS.txt`. Every other file does.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateG1_1.zip` | **Latest valid archive**: Gate G1.1 cinematic animation & VFX polish — approved for checkpoint CP-G1.1 |
| `LifeQuest_Fox_V2_GateG1.zip` | Gate G1 (technical pass), checkpoint CP-G1 `5d22112a…`. Keep |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package. Keep (protected; contains E2 / E1 / D1.1) |

## 2026-11-19 — Gate G2 production (daily life)

**Workspace:** Gate G2 was produced in a working copy of the G1.1 workspace (684 files, manifest `507c2e05…`). Every one of
those 684 files was re-verified byte-identical before packaging (except this log, which receives this entry).

**Removed (temporary files created during G2 authoring only):** Cycles temp frames (`04_ANIMATIONS/g2_daily_life/renders/_tmp_*.png`),
intermediate check sheets (`fox_g2_blender_{mix,check,check2,wa,cd}.png`), `08_VALIDATION/scripts/__pycache__/`,
`07_WEB_PREVIEW/companion_sandbox_g2/tsconfig.tsbuildinfo`. No approved file was deleted or modified.

**Added:** versioned G2 files only (see `09_DOCS/GATE_G2_SHA256SUMS.txt` and `BUILD_G2.md`). No Git operation was performed.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateG2.zip` | **Gate G2 daily life — produced, awaiting visual approval** (not a checkpoint yet) |
| `LifeQuest_Fox_V2_GateG1_1.zip` | Gate G1.1 — approved for checkpoint CP-G1.1. Keep |
| `LifeQuest_Fox_V2_GateG1.zip` | Gate G1, checkpoint CP-G1 `5d22112a…`. Keep |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package. Keep (protected) |

## 2026-11-19 — Gate G2.1 deformation correction (container workspace, before packaging)

Standing permission: controlled cleanup inside the LifeQuest_Fox_V2 workspace. Before packaging, all 893 Gate G2 baseline files
(`GATE_G2_BASELINE_SHA256.txt`, which covers the original G2 and G1.1 sources) were re-verified byte-identical. G2.1 adds new, versioned files only.

**Removed (temporary files created during G2.1 authoring only):** `04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend1`
(Blender autosave backup), `07_WEB_PREVIEW/companion_sandbox_g2_1/tsconfig.tsbuildinfo`, `__pycache__/`, and the intermediate flame-test
frame folder. No approved file was deleted or modified.

**Added:** G2.1 files only (`09_DOCS/GATE_G2_1_SHA256SUMS.txt`, `BUILD_G2_1.md`). Probe scripts were copied to
`08_VALIDATION/scripts/probes_g2_1/` so the root-cause evidence can be reproduced. No Git operation was performed.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateG2_1.zip` | **Gate G2.1 deformation correction — produced, awaiting visual approval** |
| `LifeQuest_Fox_V2_GateG2.zip` | Gate G2 — functional prototype (accepted as functional only; superseded for deformation by G2.1). Keep |
| `LifeQuest_Fox_V2_GateG1_1.zip` | Gate G1.1 — approved for checkpoint CP-G1.1. Keep |
| `LifeQuest_Fox_V2_GateG1.zip` | Gate G1, checkpoint CP-G1 `5d22112a…`. Keep |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package. Keep (protected) |

## 2026-11-19 — Gate G3 challenge / duo-group / private social (container workspace, before packaging)

Standing permission: controlled cleanup inside the LifeQuest_Fox_V2 workspace.
- **Baseline check.** Before packaging, the 1,142 files of the verified G2.1 baseline (`GATE_G2_1_SHA256SUMS.txt`, the source of CP-G2) were re-verified byte-identical. G3 adds new files only. No approved E2 / F / G1.1 / G2.1 file was modified.
- **Removed (temporary files created during G3 authoring):** `__pycache__/`, `companion_sandbox_g3/tsconfig.tsbuildinfo`, capture frame folders (`_f_*`), the `_regress_g3_*.py` runner copies, and a stray `_anim_metrics_partial.json` that a partial anim_check run had written into `04_ANIMATIONS/g2_1_deformation_polish/` (not part of the baseline).
- **Moved out of the workspace (not deleted):** 59 files of an unfinished G2.1 acceptance pass (`g2_1_deformation_polish/acceptance/`, `runtime_g2_1/acceptance/`, `capture_acceptance_g2_1.py`, `exception_closeup_g2_1.py`, `occlusion_proof_g2_1.py`). They came from the interrupted acceptance request, were never synced or approved, and are not part of CP-G2 or G3. They are kept outside the workspace in the container.
- **Added:** G3 files only (`09_DOCS/G3_ASSET_MANIFEST.md`, `GATE_G3_SHA256SUMS.txt`, `BUILD_G3.md`). No Git operation was performed.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateG3.zip` | **Gate G3 challenge / duo-group / private social — produced, awaiting visual approval** |
| `LifeQuest_Fox_V2_GateG2_1.zip` | Gate G2.1 — source of checkpoint CP-G2. Keep |
| `LifeQuest_Fox_V2_GateG2.zip` | Gate G2 functional prototype (superseded by G2.1). Keep |
| `LifeQuest_Fox_V2_GateG1_1.zip` | Gate G1.1 — CP-G1.1. Keep |
| `LifeQuest_Fox_V2_GateG1.zip` | Gate G1, CP-G1. Keep |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package. Keep (protected) |

## 2026-11-20 — Gate H1 modular cosmetics and equipment (container workspace, before packaging)

Standing permission: controlled cleanup inside the LifeQuest_Fox_V2 workspace.
- **Baseline check.** Before packaging, the 1,365 files of the verified G3 package (`GATE_G3_SHA256SUMS.txt`) were re-verified byte-identical. H1 adds new files only. No approved E2 / F / G1.1 / G2.1 / G3 file was modified. The canonical rig and the animation blends were opened read-only and never saved.
- **Removed (temporary files created during H1 authoring):** `08_VALIDATION/scripts/__pycache__/`, `companion_sandbox_h1/tsconfig.tsbuildinfo`, the Blender backup `05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend1`, preview frame folders (`runtime_h1/previews/_frames_*`), and the `_regress_h1_*.py` runner copies (deleted by the runner).
- **Added:** H1 files only (`09_DOCS/H1_ASSET_MANIFEST.md`, `GATE_H1_SHA256SUMS.txt`, `BUILD_H1.md`, `FOX_H1_COSMETIC_CONTRACT.md`, `KNOWN_LIMITATIONS_GATE_H1.md`). The render probe used for the cosmetic review was copied to `08_VALIDATION/scripts/probes_h1/`. No Git operation was performed.

### Packages register (current)
| Package | Status |
|---|---|
| `LifeQuest_Fox_V2_GateH1.zip` | **Gate H1 modular cosmetics — produced, awaiting approval** |
| `LifeQuest_Fox_V2_GateG3.zip` | Gate G3 — accepted as the animation prototype. Keep |
| `LifeQuest_Fox_V2_GateG2_1.zip` | Gate G2.1 — source of checkpoint CP-G2. Keep |
| `LifeQuest_Fox_V2_GateG2.zip` | Gate G2 functional prototype (superseded by G2.1). Keep |
| `LifeQuest_Fox_V2_GateG1_1.zip` | Gate G1.1 — CP-G1.1. Keep |
| `LifeQuest_Fox_V2_GateG1.zip` | Gate G1, CP-G1. Keep |
| `LifeQuest_Fox_V2_GateF.zip` | **Approved** Gate F package. Keep (protected) |

## 2026-11-21 — Independent asset portability test (before Gate H1 approval)

- **Gate H1 sync.** Completed to the Windows workspace: 238 new files plus the appended CLEANUP_LOG. All 1,603 files were verified against `GATE_H1_SHA256SUMS.txt`. `LifeQuest_Fox_V2_GateH1.zip` is in the Mascot folder (sha256 `39881de3…3d98a`).
- **Added (new files only):**
  - `09_DOCS/ASSET_PORTABILITY_REPORT.md`, `BLENDER_OPEN_TEST.md`, `GLB_COMPATIBILITY_REPORT.md`, `THIRD_PARTY_HANDOFF_GUIDE.md`, `PORTABILITY_SHA256SUMS.txt`;
  - `08_VALIDATION/scripts/portability_*.py` (4);
  - `08_VALIDATION/portability/` (viewer tooling, machine A / machine B evidence).
- **Not changed.** No approved file was modified. No source `.blend` was re-saved: nothing needed packing, and the edit tests ran on temporary copies that were deleted. No Git operation was performed.
- **Temporary, outside the workspace.** Fresh extractions, npm caches and the second-machine venv were created outside the workspace and are not part of the package.

## 2026-11-21 — Gate H2 cosmetic outfit library + README update (container workspace, before packaging)

- **README.** The root `README.md` was rewritten on request to show the state through H1 / H2. The previous version is preserved as `09_DOCS/README_HISTORY_GATE_G1.md`. This is the only file from the H1 package that changed.
- **Added (new files only):**
  - `05_COSMETICS/h2_outfits/` (blend + catalogue);
  - 12 item GLBs + `cosmetic_reference_h2.json` in `06_EXPORTS/glb/cosmetics/`;
  - `07_WEB_PREVIEW/companion_sandbox_h2/` (copy of the H1 sandbox plus the outfit library; the H1 sandbox is untouched);
  - `08_VALIDATION/cosmetics_h2/` and `08_VALIDATION/runtime_h2/`;
  - the `cosmetics_*_h2.py`, `browser_h2_test.py`, `capture_h2_previews.py`, `regress_h2.py`, `make_reports_h2.py` and `make_manifest_h2.py` scripts, and `probes_h2/`;
  - in `09_DOCS/`: `FOX_H2_OUTFIT_LIBRARY.md`, `BUILD_H2.md`, `KNOWN_LIMITATIONS_GATE_H2.md`, `H2_ASSET_MANIFEST.md`, `GATE_H2_SHA256SUMS.txt`.
- **Removed (temporary files created during H2 authoring):** the Blender backup `fox_cosmetics_h2.blend1`, preview frame folders, `_regress_h2_*.py` runner copies (deleted by the runner), and `__pycache__`.
- **Not changed.** No approved E2 / F / G1.1 / G2.1 / G3 / H1 source was modified. The rig and the animation blends were opened read-only. No Git operation was performed.
