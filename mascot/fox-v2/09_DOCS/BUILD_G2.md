# Gate G2 — reproducible build (daily life: study, sports, wake / alarm, sleep, cooldown)

Same requirements as `BUILD.md` (Blender 5.3 / `bpy` 5.3.0, Python 3.13, Node 20+, ffmpeg, Playwright + Chrome).
Gate G2 adds **versioned files only**. No E2 / F / G1 / G1.1 source, export, report or archive is modified, and no Git
operation is part of this gate.

```bash
# 1. animation (Blender)
python 08_VALIDATION/scripts/anim_g2.py               # → 04_ANIMATIONS/g2_daily_life/fox_anim_g2.blend + anim_spec_g2.json (registry, cues, prop anchors)
python 08_VALIDATION/scripts/anim_render_g2.py all    # → renders/fox_g2_blender_<category>.png (Cycles key frames, no props)
python 08_VALIDATION/scripts/anim_check_g2.py         # → anim_metrics_g2.json (deformation, ground, foot slide, start / end pose, loop seam)
python 08_VALIDATION/scripts/qa_envelope_g2.py        # → 08_VALIDATION/runtime_g2/deformation_envelope_g2.json (vs approved E2 + G1 + G1.1)
python 08_VALIDATION/scripts/export_glb_g2.py         # → 06_EXPORTS/glb/modules/fox_v2_g2_daily_life.anim.glb + manifest + reference poses
python 08_VALIDATION/scripts/gltf_pose_fidelity_g2.py # → fk poses + 08_VALIDATION/runtime_g2/gltf_pose_fidelity_g2.json

# 2. runtime (versioned sandbox copy; the F / G1 / G1.1 sandboxes are untouched)
cd 07_WEB_PREVIEW/companion_sandbox_g2 && npm ci && npm run build && cd ../..
python -m http.server 4191 --bind 127.0.0.1 --directory 07_WEB_PREVIEW/companion_sandbox_g2/dist &
# G1.1-module-only copy of the same build for the earlier-gate regressions (same files, one script tag added)
cp -r 07_WEB_PREVIEW/companion_sandbox_g2/dist /tmp/dist_g1set
sed -i "s|<head>|<head><script>window.__foxModuleFilter=['g1_quest_reward_streak']</script>|" /tmp/dist_g1set/index.html
python -m http.server 4192 --bind 127.0.0.1 --directory /tmp/dist_g1set &

# 3. browser validation, regressions, performance, previews (headless Chrome, SwiftShader)
python 08_VALIDATION/scripts/browser_g2_test.py        # → runtime_g2/g2_runtime_report.json (module, pose equivalence, 30+ harness tests, mouse, cleanup, dispose, modules=0)
python 08_VALIDATION/scripts/regress_g2.py             # → runtime_g2/regressions_g2.json + regress_*/ (E2, F ×2, G1.1, flame suites, unchanged assertions)
python 08_VALIDATION/scripts/perf_g2.py                # → runtime_g2/perf_g2.json (per scenario, normal + low-cost effects)
python 08_VALIDATION/scripts/capture_g2_previews.py    # → previews/fox_g2_<clip>.mp4 + renders/fox_g2_runtime_keyframes_<category>.png
```

## Where things live

| What | File |
|---|---|
| Clip acting (16 clips) | `08_VALIDATION/scripts/anim_g2.py` — one function per clip, beats in the docstrings; reference poses `SIT`, `LIE` |
| Ground contact | `ground_pass()` in `anim_g2.py` (contact / floor per frame, measured on the runtime cage) |
| Registry + cue timeline + prop anchors | `04_ANIMATIONS/g2_daily_life/anim_spec_g2.json` (copied into the sandbox at build time) |
| State contract (priorities, props, fx, interaction mode, thresholds, fallbacks) | `FOX_STATE_DEFS` / `DAILY_TUNING` in `…/companion_sandbox_g2/src/mascot/foxContract.ts` |
| State machine (transitions, suspension / resume, cooldown data, impatience, reactions) | `…/src/mascot/FoxDailyLife.ts` |
| Events (12, typed payloads, byState, fallbacks) | `…/src/mascot/FoxEventMap.ts` (Gate G2 block) — see `FOX_G2_EVENT_CONTRACT.md` |
| Props + G2 effects | `…/src/mascot/effects/fxLibraryG2.ts` (layout: `PROP_LAYOUT`) — routed by the existing `FoxEffectsManager.ts` (no new manager) |
| Harness | `#/g2` → `…/src/pages/G2LabPage.tsx`, tests `…/src/pages/g2Tests.ts` |
