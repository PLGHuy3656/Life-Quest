# LifeQuest Fox V2 — Gate G1.1 · Runtime regression report

**Status: technical PASS — visual approval pending.** Renderer for every automated check: headless Chrome + SwiftShader (CPU, no GPU). No Git operation was performed in this gate.

Build under test: `07_WEB_PREVIEW/companion_sandbox_g1_1/dist`, a versioned copy of the G1 sandbox. It loads the approved E2 Fox GLB (hash-locked `e884d675…`) plus the **G1.1 module** `fox_v2_g1_1_quest_reward_streak.anim.glb`.

## 1. Architecture (reuse, no rewrite)

* **Reused unchanged:** `FoxController` public API, module loading / validation (`FoxModelLoader`), priorities / queue / interruption (`FoxAnimationManager`), event registry, reduced-motion substitutions, render binding and lifecycle.
* **Changed in the G1.1 copy only:**
  * `foxContract.ts`: clip durations; module path; new `FLAME_SOCKET`.
  * `FoxController.ts`: one line, which spec JSON is imported.
  * `effects/StreakFlame.ts`: held flame.
  * `effects/fxLibraryG1_1.ts`: new effects.
  * `effects/FoxEffectsManager.ts`: new cue ids and anchors (`tail`, `quest_symbol`, `badge`).
  * Small optional parameters in `fxCore.ts` (`sizeFn`), `fxLibrary.ts` (lightning origin) and `CharOverlay.ts` (strength).
  * `copy-assets.mjs` / `package.json`: G1.1 names.
  * `pages/g1Tests.ts`: the two timing expectations below.
* **Data-driven VFX timeline:** every effect is a `cue` in `anim_spec_g1_1.json`. Changing the acting timing is a data change.

## 2. Results

| Suite | Result |
|---|---|
| `browser_g1_1_test.py` (module binding, pose fidelity, in-page harness, Lv1 / Lv30, real-mouse petting over the streak loop, GPU-resource cleanup, `?modules=0` fallback) | **23 / 23 PASS** → `runtime_g1_1/g1_1_runtime_report.json` |
| Gate F suite, module **on** (`browser_companion_regress_g1_1.py --mode g1`) | **35 / 35 PASS** → `runtime_g1_1/f_regression_g1/` |
| Gate F suite, module **off** (`--mode fallback`) | Final build, last run: **35 / 35 PASS**. Two intermediate runs gave 34 / 35, on the look-at return check only. That check races real time against simulated time; in an A/B run the approved G1 build fails it too (§5). → `runtime_g1_1/f_regression_fallback/` |
| Flame attachment (`flame_attach_test_g1_1.py`) | **PASS** (5 / 5 checks, 1,080 frames, Lv1 + Lv30) → `runtime_g1_1/flame_attachment_g1_1.json` + video |
| Deformation envelope (`qa_envelope_g1_1.py`) | **9 / 9 PASS** → `runtime_g1_1/deformation_envelope_g1_1.json` |
| glTF fidelity (`gltf_pose_fidelity_g1_1.py`) | max 4.51 mm vs Blender (G1 5.79 mm, E2 3.78 mm); binding exactness 0.00014 mm |

Selected checks from the browser suite:
* the module binds 891 / 891 tracks; 16 clips (7 core + 9 G1); no second Fox mesh; E2 triangle budget (73,842)
* every G1 one-shot plays, animates the face, spawns and cleans its effects, and returns to idle, or to `streak_active` with the streak on
* priorities: LEVEL_UP (50) is not interrupted by a tap (20); QUEST_COMPLETED then XP_GAINED → `receive_xp` waits in the queue
* LEVEL_UP holds the new level until the apex cue (G1.1 f41 ≈ 1.67 s), then grows the fox; with effects disabled the level still applies
* interrupted `streak_lost` → soot removed ≤ 0.4 s, streak ended, lightning stopped
* the soot never modifies the Fox materials (47 materials compared during and after)
* tiers by days: 3 orange · 7 blue · 14 purple · 30 crimson
* reduced motion: STREAK_LOST → the flame fades out gently + a sad face, with no lightning / soot / jolt
* Lv1 and Lv30: the effect root follows the fox scale exactly; every bone stays inside the canvas
* real mouse: hover + click on the head during `streak_active` → head_pet, the flame keeps burning, back to `streak_active`
* repeated full passes: geometries 56 / textures 35 / programs 12 stay flat; no page errors

### Expectations changed for G1.1 (timing only, documented)

| Where | G1 | G1.1 | Why |
|---|---|---|---|
| harness + browser test: LEVEL_UP apex | 0.917 s (f23) | 1.667 s (f41) | longer charge, held breath, spin on the way up |
| harness: interrupted `streak_lost` | sampled at 0.8 s, soot > 0.5 | sampled at 1.75 s, soot > 0.15 | strike at f37 = 1.5 s; lighter soot (strength 0.32) |
| Gate F suite (g1 mode): queued FRIEND_CHEER after QUEST_COMPLETED | sampled after 3.4 s | after 3.6 s | `quest_complete` is 3.46 s (G1: 3.29 s) |

## 3. Level scaling

The flame and every effect live under `FOX_FX_ROOT`, which carries the level scale. The clips never scale the fox: `level.apply` is a runtime cue at the apex. Flame placement is identical at Lv1 and Lv30 in Fox space (94.84–97.47 mm vs 94.84–97.45 mm from the paw joint).

## 4. Effect budget (`runtime_g1_1/fx_budget_g1_1.json`, maxima per clip, headless)

Extra draw calls / triangles above the same instance's base frame (base = 48 calls, 73,842 triangles):

| Clip | G1 calls | G1.1 calls | G1 extra tris | G1.1 extra tris | G1 active fx | G1.1 active fx | G1.1 active fx 2 s after |
|---|---|---|---|---|---|---|---|
| `quest_start` | +6 | +6 | 70 | 6 | 3 | 3 | 0 |
| `quest_complete` | +5 | +6 | 4 | 60 | 4 | 4 | 0 |
| `quest_failed` | +7 | +3 | 1760 | 1008 | 2 | 2 | 0 |
| `receive_xp` | +3 | +5 | 4 | 8 | 3 | 3 | 0 |
| `level_up` | +6 | +9 | 90 | 360 | 4 | 4 | 0 |
| `achievement_unlock` | +7 | +4 | 262 | 10 | 3 | 2 | 0 |
| `streak_active` (flame) | +1 | +0* | 0 | 0 | 0 | 0 | 0 |
| `streak_lost` | +25 | +28 | 44,450 | 46,210 | 3 | 4 | 0 |
| `streak_cheer` | +5 | +3 | 4 | 4 | 2 | 2 | 0 |

\* The base frame already includes the lit flame (3 draw calls in G1.1).

`streak_lost` is dominated by the soot overlay (one overlay per fur mesh, as in G1). The storm cloud is a single `InstancedMesh`; the first G1.1 version used one mesh per puff, which added 6 draw calls.

## 5. Open points

* **GPU measurement:** not done in this gate. The automated runs use SwiftShader. KNOWN_LIMITATIONS_GATE_G1_1 #5.
* **Look-at return check (module off): a race in the test, not a G1.1 regression.** On the final build, "pointer leaves → gentle return" reads `lookYaw` 2.62° against a 2.5° limit. The test waits for the 120 ms hover exit in **real** time (`performance.now`) but advances **simulated** time right after the mouse leaves, so the sampled value depends on step speed and CPU load.
  A/B evidence in `runtime_g1_1/f_regression_fallback/lookat_timing_ab.json`:
  * unchanged suite: approved G1 2.30° (pass), G1.1 2.62° (fail);
  * the same suite with a 300 ms real-time wait before stepping: approved G1 **2.62° (fail)**, G1.1 **2.30° (pass)**.

  `FoxLookAtController.ts` and `FoxInteractionManager.ts` are byte-identical in G1 and G1.1. With the module on, this check gives 0.06°. Recommendation for a later gate: make the hover-exit timer use simulated time in the test hook, or sample after the real-time exit.

## 6. Immutability

Gate F / G1 sources, exports, previews, scripts and archives (`LifeQuest_Fox_V2_GateF.zip`, `LifeQuest_Fox_V2_GateG1.zip`) are unchanged. The workspace was verified against the SHA-256 manifest taken at the start of G1.1 (515 files): 0 changed, 0 removed. All G1.1 output is new, versioned files.
