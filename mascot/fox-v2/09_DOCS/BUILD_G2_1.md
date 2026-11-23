# Gate G2.1 — build

Run all commands from `mascot/fox-v2/` (LifeQuest_Fox_V2). Blender 5.3 is used as the `bpy` Python module. G2 and G1.1 sources are
read-only inputs; every G2.1 output is new and versioned.

| Step | Command | Output |
|---|---|---|
| Author + resolve | `python3 08_VALIDATION/scripts/anim_g2_1.py` (to rebuild a subset only: `FOX_CLIPS=a,b`) | `04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend`, `anim_spec_g2_1.json` |
| Export | `python3 08_VALIDATION/scripts/export_glb_g2_1.py` | `06_EXPORTS/glb/modules/fox_v2_g2_1_daily_life.anim.glb` + manifest + reference poses |
| glTF fidelity | `python3 08_VALIDATION/scripts/gltf_pose_fidelity_g2_1.py` | `runtime_g2_1/gltf_pose_fidelity_g2_1.json` |
| Deformation check | `python3 08_VALIDATION/scripts/anim_check_g2_1.py`, then `qa_envelope_g2_1.py` | `anim_metrics_g2_1.json`, `deformation_envelope_g2_1.json` |
| Evidence | `closeup_g2_1.py`, `foot_trace_g2_1.py` | `g2_1_deformation_polish/closeups/` |
| Sandbox | `cd 07_WEB_PREVIEW/companion_sandbox_g2_1 && npm ci && npm run assets && npx tsc -b && npx vite build` | `dist/` (served on 4193) |
| Browser suite | `python3 08_VALIDATION/scripts/browser_g2_1_test.py` | `runtime_g2_1/g2_1_runtime_report.json` |
| Previews / compare | `capture_g2_1_previews.py`, `make_g2_vs_g2_1_compare.py` | `previews/`, `compare/` |
| Regressions | `python3 08_VALIDATION/scripts/regress_g2_1.py` (G1.1-only build on 4194 via `window.__foxModuleFilter`) | `runtime_g2_1/regressions_g2_1.json` |
| Reports | `make_root_cause_g2_1.py`, `make_reports_g2_1.py` | `08_VALIDATION/root_cause_g2_1.md`, `deformation_report_g2_1.md`, `gate_g2_1_runtime_report.md` |

The integration step (switching the main companion sandbox from the G2 module to the G2.1 module) is deliberately left for after
visual approval. Until then the G2.1 module lives only in `companion_sandbox_g2_1`.
