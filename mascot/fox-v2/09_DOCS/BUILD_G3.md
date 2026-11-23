# Gate G3 — build

Run all commands from `mascot/fox-v2/` (LifeQuest_Fox_V2). Blender 5.3 is used as the `bpy` Python module.

- **Read-only inputs:** the canonical rig `03_RIG/fox_rig_d1_1.blend`, the G2.1 pipeline `anim_g2_1.py` (imported, never modified), and the approved E2 / G1.1 / G2.1 files.
- **Outputs:** every G3 output is a new file.

| Step | Command | Output |
|---|---|---|
| Author + resolve | `python3 08_VALIDATION/scripts/anim_g3.py` (subset: `FOX_CLIPS=a,b`) | `04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend`, `anim_spec_g3.json` |
| Export | `python3 08_VALIDATION/scripts/export_glb_g3.py` (also measures the duo paw-tip contact points + airborne window into the spec) | `06_EXPORTS/glb/modules/fox_v2_g3_challenge_social.anim.glb` + manifest + reference poses |
| glTF fidelity | `python3 08_VALIDATION/scripts/gltf_pose_fidelity_g3.py` | `runtime_g3/gltf_pose_fidelity_g3.json`, `fox_v2_g3_gltf_fk_poses.json` |
| Deformation check | `FOX_SRC=04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend FOX_SPEC=…/anim_spec_g3.json FOX_OUT=…/anim_metrics_g3.json python3 08_VALIDATION/scripts/anim_check_g2_1.py`, then `qa_envelope_g3.py` | `anim_metrics_g3.json`, `runtime_g3/deformation_envelope_g3.json` |
| Sandbox | `cd 07_WEB_PREVIEW/companion_sandbox_g3 && npm ci && npm run assets && npx tsc -b && npx vite build` | `dist/` (serve on 4195) |
| Regression builds | `dist` copies with `window.__foxModuleFilter = ['g1_quest_reward_streak']` (port 4196) and `['g1_quest_reward_streak','g2_daily_life']` (port 4197) prefixed in `index.html` | — |
| Browser suite | `python3 08_VALIDATION/scripts/browser_g3_test.py` | `runtime_g3/g3_runtime_report.json` |
| Regressions | `python3 08_VALIDATION/scripts/regress_g3.py` (E2, F fallback, F + G1, G1.1, flame, G2.1 — assertions unchanged) | `runtime_g3/regressions_g3.json`, `runtime_g3/regress_*` |
| Previews / sheets | `capture_g3_previews.py`, `make_g3_combined.py` | `g3_challenge_social/previews/` (17 clips + `fox_g3_all_17_clips.mp4`), `renders/` key-frame sheets |
| Duo / group videos | `capture_g3_multi.py` | `g3_challenge_social/tests/` |
| Reports | `make_reports_g3.py` | `08_VALIDATION/deformation_report_g3.md`, `gate_g3_runtime_report.md` |

The probe used to measure the duo geometry is `08_VALIDATION/scripts/probes_g3/g3_probe.py`.
