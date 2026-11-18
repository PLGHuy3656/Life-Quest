# LifeQuest Fox V2 — Gate G1 · Runtime Validation Report

**Status: TECHNICAL PASS — VISUAL POLISH PENDING.** Accepted as a functional prototype (2026-11-18); visual polish is planned as G1.1 and has not started. G2, G3, cosmetics and the frontend were not started. No LifeQuest application screen was created or extended (the Dashboard / Companion / Lab pages are unchanged; `#/g1` is a technical harness).

| Suite | Result | Output |
|---|---|---|
| `browser_g1_test.py` (G1 module, effects, harness, fallbacks) | **23 / 23 PASS** | `runtime_g1/g1_runtime_report.json`, `g1_0*.png` |
| Gate F suite, module **off** (`--mode fallback`, F expectations unchanged) | **35 / 35 PASS** | `runtime_g1/f_regression_fallback/` |
| Gate F suite, module **on** (`--mode g1`, documented changes only) | **35 / 35 PASS** | `runtime_g1/f_regression_g1/` |
| Blender QA (`anim_check_g1.py`) | all clips inside the E2 envelope | `04_ANIMATIONS/g1_quest_reward_streak/anim_metrics_g1.json` |
| glTF fidelity (`gltf_pose_fidelity_g1.py`) | binding exact; format deviation ≤ 5.8 mm (E2: 3.8 mm) | `runtime_g1/gltf_pose_fidelity_g1.json` |

Renderer: headless Chrome + SwiftShader (no GPU). No FPS claims are made from these runs.

## 1. The module binds to the existing Fox (not assumed from the export)

- **Structure vs E2** (`export_glb_g1.py`): every module node exists in the E2 GLB, identical joint list, 0 rest-TRS differences, 0 morph-order mismatches. No body mesh, no materials.
- **Load-time validation** (`FoxModelLoader.bindModuleClips`): 891 / 891 tracks bound (135 morph-weight tracks), durations match the contract.
- **One Fox:** after loading, the page has one `FOX_Body` (three splits it per material), one bone set and the E2 triangle count (73,842). The base GLB is downloaded once; the module is a separate 1.0 MB request.
- **Binding exactness:** each module clip, evaluated by three.js on the E2 Fox at 54 sample frames, reproduces an independent numpy forward-kinematics evaluation of the module's own glTF data to **0.0002 mm**; facial morphs equal the Blender values to 4·10⁻⁵.
- **Fidelity to Blender:** ≤ 5.79 mm on leaf bones (ear tips, sockets) during squash, from glTF's lack of shear (`inherit_scale NONE` bones under a non-uniformly squashing HIPS). The approved E2 GLB shows 3.78 mm on its own clips. The first G1 export reached 13.5 mm on `quest_failed` / `quest_complete`; their squash was reduced and the module re-exported.

## 2. Playback, transitions and priorities (in-page harness, deterministic stepping)

- Every G1 one-shot plays, animates the face, spawns its effects, cleans them all up and returns to the correct base: `idle`, or `streak_active` while a streak is active.
- `LEVEL_UP` (50) is not interrupted by a head tap (20). `XP_GAINED` after `QUEST_COMPLETED` is queued and plays next.
- `LEVEL_UP` keeps the old level until the apex cue (0.917 s), then the scale changes mid-air (Lv20 → 30: 1.00 → 1.10).
- `streak_lost` interrupted after the strike: char overlay removed, streak ended, all its effects stopped.
- Effects disabled: no effect object spawns, but logic cues still apply (level change at the apex).
- Reduced motion: `STREAK_LOST` → gentle flame fade-out + sad face, no lightning / char / jolt; large-motion clips are substituted (contract §11).

## 3. Interaction during loops (real mouse)

With `streak_active` looping and the orange flame burning: hover over the head is detected by raycast, a click plays `head_pet` over the loop, the flame keeps burning, and the fox returns to `streak_active` afterwards. `streak_active` owns neither head nor face, so look-at and moods work as on `idle`.

## 4. Effects: separate, removable, clean

- **Fox materials untouched:** 47 materials compared before, during and after the char effect (same objects, colour, opacity, transparency).
- **GPU cleanup:** three full passes over all 8 one-shots + streak on/off leave the renderer at the same `geometries 55 / textures 35 / programs 11` after each pass, with 0 active effects and the char overlay off.
- **Level scaling:** the effect root follows the fox scale exactly (error 0) at Lv1 (0.80) and Lv30 (1.10). Every bone stays inside the canvas through every G1 clip; top margin 305.7 px at Lv1, 187.6 px at Lv30, fixed camera.
- **Tiers:** 3 days → orange, 7 → blue, 14 → purple, 30 → crimson (flame colours checked).

## 5. Fallbacks and regression

- `?modules=0`: 7 core clips; every G1 event runs its F-era reaction (e.g. `QUEST_COMPLETED` → `happy` + proud, `STREAK_LOST` → streak off + sad face). No `unavailable` play, no fabricated clip.
- **Bug found and fixed by the regression run:** with the module missing under reduced motion, `QUEST_COMPLETED` played `happy` (substituted) instead of the F face-only reaction, because the fallback steps were chosen after the reduced-motion rules. `stepsFor` now picks the fallback first and then applies reduced motion.
- **Gate F suite unchanged, module off: 35 / 35.**
- **Gate F suite, module on: 35 / 35** with these documented expectation changes (`browser_companion_regress_g1.py`):
  - `QUEST_COMPLETED` → `quest_complete` (3.29 s; the queued reaction is sampled after 3.4 s instead of 2.6 s);
  - `LEVEL_UP` → `level_up`;
  - the dashboard quest button shows `quest_complete` on every fox;
  - the face-only fallback probe uses `CHALLENGE_LOST` (STREAK_LOST is now native);
  - GLB download counters count the base GLB only.
  - In both modes the registry check validates the steps an event actually runs (its `fallbackSteps` when a module clip is absent).
- **Approved assets unchanged (SHA-256 prefix):**
  - `fox_master.blend` `16ce1a04`, `fox_rig_d1_1.blend` `87463907`, `fox_v2_rig_test.glb` `b7ba8c32`
  - E1: `fox_anim_e1.blend` `739b544d`, `fox_v2_anim_e1.glb` `eabde5b2`
  - E2: `fox_anim_e2.blend` `c4101988`, `fox_v2_anim_e2.glb` `e884d675`, `fox_interactive_e2.html` `3ec68b1e`

## 6. Previews

- `04_ANIMATIONS/g1_quest_reward_streak/previews/fox_g1_<clip>.mp4` (9 clips) and `fox_g1_all.mp4` (39 s). Runtime with effects, deterministic 1/24 s capture.
- Key frame sheets: `renders/fox_g1_runtime_keyframes_{quest,rewards,streak}.png` (three.js) and `renders/fox_g1_keyframes_{quest,rewards,streak}.png` (Blender Cycles).
