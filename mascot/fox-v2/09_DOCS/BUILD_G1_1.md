# Gate G1.1 — reproducible build (cinematic animation & VFX polish)

Same requirements as `BUILD.md` (Blender 5.3 / `bpy` 5.3.0, Python 3.13, Node 20+, ffmpeg, Playwright + Chrome for the browser checks).
Gate G1.1 adds **versioned files only**. No Gate F or G1 source, export or archive is modified.

```bash
# 1. animation (Blender)
python 08_VALIDATION/scripts/anim_g1_1.py              # → 04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend + anim_spec_g1_1.json
python 08_VALIDATION/scripts/anim_check_g1_1.py        # → anim_metrics_g1_1.json (deformation, foot slide, start / end pose, loop seam)
python 08_VALIDATION/scripts/qa_envelope_g1_1.py       # → 08_VALIDATION/runtime_g1_1/deformation_envelope_g1_1.json (vs approved E2 + G1)
python 08_VALIDATION/scripts/export_glb_g1_1.py        # → 06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim.glb + manifest + reference poses
python 08_VALIDATION/scripts/gltf_pose_fidelity_g1_1.py   # → fk poses + 08_VALIDATION/runtime_g1_1/gltf_pose_fidelity_g1_1.json

# 2. runtime (versioned sandbox copy; the Gate F/G1 sandbox is untouched)
cd 07_WEB_PREVIEW/companion_sandbox_g1_1 && npm ci && npm run build && cd ../..
python -m http.server 4190 --bind 127.0.0.1 --directory 07_WEB_PREVIEW/companion_sandbox_g1_1/dist &

# 3. browser validation + previews (headless Chrome, SwiftShader)
python 08_VALIDATION/scripts/browser_g1_1_test.py                         # → runtime_g1_1/g1_1_runtime_report.json
python 08_VALIDATION/scripts/browser_companion_regress_g1_1.py --mode fallback   # Gate F suite, module off
python 08_VALIDATION/scripts/browser_companion_regress_g1_1.py --mode g1         # Gate F suite, module on
python 08_VALIDATION/scripts/flame_attach_test_g1_1.py                    # → runtime_g1_1/flame_attachment_g1_1.json + previews/…flame_attachment_test.mp4
python 08_VALIDATION/scripts/capture_g1_1_previews.py [clip …]            # → previews/fox_g1_1_<clip>.mp4 (front | 3/4 [| side]) + renders/…runtime_keyframes_*.png
python 08_VALIDATION/scripts/make_g1_vs_g1_1_compare.py                   # → compare/fox_g1_vs_g1_1_<clip>.mp4 + _all.mp4
python 08_VALIDATION/scripts/make_keyframe_sheets_g1_1.py                 # → renders/fox_g1_1_runtime_keyframes_{quest,rewards,streak}.png (all nine clips)
# effect budget, G1 vs G1.1 (serve the approved G1 sandbox dist on 4180 as well)
python -m http.server 4180 --bind 127.0.0.1 --directory 07_WEB_PREVIEW/companion_sandbox/dist &
python 08_VALIDATION/scripts/fx_budget_g1_1.py                            # → runtime_g1_1/fx_budget_g1_1.json
```

## Where things live

| What | File |
|---|---|
| Clip acting (all nine clips) | `08_VALIDATION/scripts/anim_g1_1.py` (one function per clip, beats in the docstrings) |
| VFX timeline (data) | `cues` per clip in `04_ANIMATIONS/g1_1_cinematic_polish/anim_spec_g1_1.json` (copied into the sandbox at build time) |
| Streak flame (held, paw-attached) | `07_WEB_PREVIEW/companion_sandbox_g1_1/src/mascot/effects/StreakFlame.ts`; socket + palm offset: `FLAME_SOCKET` in `foxContract.ts` |
| New effects | `…/effects/fxLibraryG1_1.ts` (quest symbol, radial burst, clouds, strike, soot, XP stream, absorb pulse, energy ring, ribbons, climax, badge) |
| Cue routing / anchors | `…/effects/FoxEffectsManager.ts` |
| Hold pose of the flame paw | `HOLD` in `anim_g1_1.py` (`armL_up 74°, armL_x 40°, pawL_x −40°`) |

To use G1.1 instead of G1 in an app: take the G1.1 module GLB + `anim_spec_g1_1.json` and the effect sources from `companion_sandbox_g1_1/src/mascot/`. The module id, clip names, event registry and public API are unchanged.
