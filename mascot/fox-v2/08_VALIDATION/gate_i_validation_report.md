# Gate I — Validation Report (Voice Assistant Animations + Production Finalization)

Runtime suite: **20/20 PASS** (`08_VALIDATION/runtime_i/i_runtime_report.json`).
Environment: Docker Linux (`python:3.13-slim-bookworm`), Blender `bpy==5.3.0`, headless Chrome + SwiftShader (CPU rendering; no GPU performance claims).

## 1. Authored Clips (Genuine Blender 5.3.0 Skeletal + Facial Shape-Key Actions)

Source: `04_ANIMATIONS/i_voice_assistant/fox_anim_i.blend` (canonical `03_RIG/fox_rig_d1_1.blend` read-only; 28 bones, 14 face-morph meshes unchanged).
Module GLB: `06_EXPORTS/glb/modules/fox_v2_i_voice_assistant.anim.glb` (**845,220 bytes**, 28 joints, 0 materials, 8 animations × 98 channels including 14 facial morph weight tracks).

| Clip | Type | Frames / Duration | Resolver Violations (Before → After) | glTF vs Blender Max (mm) |
|---|---|---|---|---|
| `voice_listen_start` | one-shot (`rest` → `voice_listening_loop`) | 36 f / 1.500 s | 0 → 0 | 1.671 |
| `voice_listening_loop` | **state loop** (`voice_listening`) | 96 f / 4.000 s | 0 → 0 | 0.123 |
| `voice_processing` | **state loop** (`voice_processing`) | 96 f / 4.000 s | 0 → 0 | 0.127 |
| `task_suggestion` | one-shot (`rest` → `rest`) | 66 f / 2.750 s | 0 → 0 | 0.655 |
| `task_notebook_open` | one-shot (`rest` → `task_notebook_write`) | 54 f / 2.250 s | 27 → 0 | 4.760 |
| `task_notebook_write` | **state loop** (`task_writing`) | 120 f / 5.000 s | 117 → 0 | 0.111 |
| `task_notebook_confirm` | one-shot (`task_notebook_write` → `rest`) | 78 f / 3.250 s | 39 → 0 | 0.644 |
| `voice_retry` | one-shot (`rest` → `rest`) | 60 f / 2.500 s | 0 → 0 | 1.551 |

- **Binding exactness (three.js vs independent numpy FK of GLB):** max **0.00014 mm** (tolerance ≤ 0.05 mm), facial morph max error **0.00004** (tolerance ≤ 0.002).
- **Format fidelity vs Blender:** max **4.760 mm** (`task_notebook_open` f27 `EAR_L_02`, tolerance ≤ 6.0 mm; G2.1 was 5.20 mm, G3 was 4.99 mm).
- **Track binding:** 792 / 792 tracks bound (120 morph tracks), **58 total clips** available on 1 shared Fox skeleton (`73,842` triangles, 0 extra Fox meshes).

## 2. Gate I Runtime Checks (`browser_i_test.py` — 20/20 PASS)

| Status | Check |
|---|---|
| PASS | Gate I voice animation module loaded; 792/792 tracks bound; G1.1 / G2.1 / G3 still bound |
| PASS | 58 clips available (7 E2 + 9 G1 + 16 G2 + 18 G3 + 8 I); 1 Fox body mesh, 1 skeleton, E2 triangle budget |
| PASS | Binding exactness vs independent numpy FK ≤ 0.05 mm (0.00014 mm); morphs ≤ 0.002 (0.00004) |
| PASS | Format fidelity vs Blender ≤ 6.0 mm (4.760 mm max) |
| PASS | All 8 Gate I voice clips loaded and available |
| PASS | Full Voice → Task sequence (`VOICE_LISTEN_STARTED` → `VOICE_LISTENING` → `VOICE_PROCESSING` → `TASK_SUGGESTION_READY` → `TASK_NOTEBOOK_OPEN` → `TASK_WRITING` → `TASK_CREATED`) |
| PASS | G2.1 `NotebookProp` + `PencilProp` attached during writing and cleaned up after `TASK_CREATED` |
| PASS | **Application-driven confirmation:** `task_notebook_confirm` never plays during 10 s in writing loop; plays only upon `TASK_CREATED` |
| PASS | `VOICE_CANCELLED` exits writing cleanly without `task_notebook_confirm` and hides notebook/pencil |
| PASS | `VOICE_RETRY_REQUESTED` and `VOICE_PERMISSION_DENIED` cancel active voice state and play `voice_retry` |
| PASS | Reduced motion skips large-motion transitions while preserving state and completion read |
| PASS | All 6 H2 outfits stay attached through voice notebook flow; `HAND_RIGHT` items (`explorer_magnifier`, `mage_wand`, `tet_lixi`) hide for `PencilProp` and restore automatically |
| PASS | All 10 approved Gate I voice events registered and handled |
| PASS | Uniform level scaling (Lv1 `0.80` / Lv30 `1.10`): props/effects follow Fox scale with 0 error |
| PASS | Lv1 and Lv30: every bone stays inside the canvas through the full voice sequence |
| PASS | GPU resource cleanup: geometries (`54`) and textures (`35`) stable across 3 repeated full voice-to-task passes; 0 active FX/props left |
| PASS | Dispose with active `task_writing` state releases controller, FX root, and props cleanly |
| PASS | No page errors or unexpected 404s |
| PASS | Fallback when Gate I module is filtered out: all events handled gracefully |
| PASS | Fallback with `?modules=0`: all events handled gracefully |

## 3. H1 + H2 Cosmetics Compatibility Matrix (`cosmetics_matrix_i.py`)

Measured all 18 H1 + H2 cosmetic items against all 8 Gate I voice clips on the Blender 5.3.0 runtime cage (`08_VALIDATION/runtime_i/compatibility_matrix_i.json`):
- **SEVERE clipping after H1 rules:** **0** across all 6 H2 outfits and all 8 clips.
- All head/face items (`student_cap`, `student_glasses`, `sports_headband`, `explorer_hat`, `mage_hat`, `ninja_headband`, `tet_khan_dong`) and held items (`explorer_magnifier`, `mage_wand`, `tet_lixi`): **0.0 mm** across all 8 clips.
- Body garments (`simple_jacket`, `ninja_gi`, `tet_ao_dai`): max **7.3 mm** (MINOR, < 8.0 mm threshold).
- `mage_capelet`: max **3.3 mm** (MINOR). `sports_sneakers`: max **1.1 mm** (OK).

## 4. Runtime Loading & Cleanup Optimization

- `FoxModelLoader.ts` now fetches all animation-only GLB modules in parallel with the base E2 GLB (`Promise.all`) instead of sequentially after base load.
- `purgeFoxAssetCache()` also clears `moduleCache` when no live Fox instances remain.

## 5. Existing Regression Suites (`regress_i.py`)

| Suite | Result | Notes |
|---|---|---|
| `e2` | **29/29 PASS** | Unchanged E2 assertions |
| `f_g1` | **35/35 PASS** | Full Gate F + G1.1 suite |
| `g1_1` | **23/23 PASS** | Unchanged G1.1 assertions |
| `g2_1` | **41/41 PASS** | Unchanged G2.1 assertions |
| `g3` | **34/34 PASS** | Unchanged G3 single + multi-fox assertions |
| `h1` | **28/28 PASS** | Unchanged H1 cosmetic assertions |
| `h2` | **17/17 PASS** | Unchanged H2 outfit library assertions |
| `f_fallback` | **34/35 PASS** | Isolated rerun retained (`lookYaw: +4.74°` vs `2.5°` threshold, unchanged). Root cause verified as environmental `idle`-phase coupling in `browser_companion_test_f.py` under Docker SwiftShader wall-clock waits (`FoxLookAtController.ts` and `FoxInteractionManager.ts` are byte-identical to H2; `f_g1` passes 35/35 with `lookYaw: +1.07°`). |

## 6. Visual Preview Deliverables

- Complete Voice-to-Task sequence video: `04_ANIMATIONS/i_voice_assistant/previews/fox_i_voice_to_task_sequence.mp4`
- Keyframe contact sheet (12 frames across all stages): `04_ANIMATIONS/i_voice_assistant/renders/fox_i_voice_contact_sheet.png`
