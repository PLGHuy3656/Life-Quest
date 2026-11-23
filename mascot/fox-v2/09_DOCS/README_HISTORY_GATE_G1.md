<!-- Preserved copy of the root README as it stood at Gate G1 (replaced on 2026-11-21 by the Gate H1/H2 README). Historical record, not maintained. -->

# LifeQuest Fox V2 — Chibi 3D Master

Production root for the LifeQuest mascot 3D master.

**Status:** Gate A ✅ · Gate B ✅ · Gate C r4 ✅ conditionally accepted as modeling baseline · Gate D1 ✅ · Gate D1.1 ✅ · Gate E1 ✅ approved as functional interactive prototype · Gate E2 ✅ approved · Gate F ✅ approved as the mascot runtime foundation · **Gate G1 quest, reward & streak animation module: TECHNICAL PASS — VISUAL POLISH PENDING** (accepted as a functional prototype; visual polish planned as G1.1, not started) · Gate G2 / G3, Gate H cosmetics and the full LifeQuest frontend not started.

Latest: `08_VALIDATION/gate_g1_runtime_report.md` and `04_ANIMATIONS/g1_quest_reward_streak/animation_report_g1.md` (Gate G1, plus `09_DOCS/KNOWN_LIMITATIONS_GATE_G1.md`). Gate F: `08_VALIDATION/gate_f_runtime_report.md`, plus `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `09_DOCS/COMPANION_INTEGRATION_GUIDE.md` and `09_DOCS/KNOWN_LIMITATIONS_GATE_F.md`. E2: `04_ANIMATIONS/animation_report_e2.md`, `08_VALIDATION/runtime_regression_report_e2.md`. E1: `04_ANIMATIONS/animation_report_e1.md`, `08_VALIDATION/anim_glb_interaction_report_e1.md`. D1.1: `03_RIG/deformation_test_report_d1_1.md`, `08_VALIDATION/rig_glb_compatibility_report.md`; D1: `03_RIG/deformation_test_report.md`. Modeling: `GATE_C_R4_CHANGES.md`; earlier rounds: `GATE_C_R3_CHANGES.md`, `GATE_C_CORRECTIONS.md` (r2). The r1 model is frozen in `02_MODEL/checkpoints/gateC_r1/`; r2 in `gateC_r2/`; r3 in `gateC_r3/`; the current r4 state in `gateC_r4/`.

| Folder | Contents now |
|---|---|
| `00_REFERENCE/` | canonical `FOX_V2_BASELINE.png` (unchanged), supplementary turnarounds, `visual_spec.md` |
| `01_DESIGN/` | `character_master_spec.md`, `proportions.json`, `materials.json`, `turnaround/` (4 renders), `comparisons/` |
| `02_MODEL/` | `modules/*.blend` (8 modules), `fox_master.blend`, `checkpoints/gateC_r1/` (original Gate C), `checkpoints/gateC_r2/`, `checkpoints/gateC_r3/`, `checkpoints/gateC_r4/` (latest verified rollback) |
| `03_RIG/` | `fox_rig_d1_1.blend` (D1.1 approved, unchanged; rollback copy in `checkpoints/gateD1_1_approved/`), `face_morph_map.json`, `deformation_test_report_d1_1.md`, `deformation_metrics_d1_1.json`, `renders_d1_1/`; D1: `fox_rig_prototype.blend`, `skeleton_spec.json`, `attachment_points.json`, `deformation_test_report.md`, `deformation_metrics.json`, `rig_validation_results.json`, `renders/` (contact sheet, preview mp4/gif) |
| `04_ANIMATIONS/` | G1: `g1_quest_reward_streak/` (`fox_anim_g1.blend`, `anim_spec_g1.json`, `anim_metrics_g1.json`, `animation_report_g1.md`, `renders/` key frames Blender + runtime, `previews/` 9 mp4). E2: `fox_anim_e2.blend`, `anim_spec_e2.json`, `idle_variation_e2.json`, `anim_metrics_e2.json`, `animation_report_e2.md`, `renders_e2/`, `renders_compare/` (E1 \| E2). E1 (approved): `fox_anim_e1.blend` (7 clips), `anim_spec_e1.json`, `anim_metrics_e1.json`, `animation_report_e1.md`, `renders_e1/` (key frames + previews) |
| `05_SKINS/` | empty (not in E1) |
| `06_EXPORTS/glb/` | `modules/fox_v2_g1_quest_reward_streak.anim.glb` + manifest + reference / FK poses (G1 animation-only module), `fox_v2_anim_e2.glb` + manifest (E2), `fox_v2_anim_e1.glb` + manifest (E1 approved), `fox_v2_rig_test.glb` + manifest (D1.1) — not release exports |
| `07_WEB_PREVIEW/` | `companion_sandbox/` (Gate F runtime + G1 module and effects, technical harness `#/g1`, prebuilt `dist/`), `fox_interactive_e2.html` (E2 companion, `?size=small|medium|large`), `fox_interactive_e1.html` (E1 approved), `rig_test.html` (D1.1 viewer) |
| `08_VALIDATION/` | `scripts/`, `gate_g1_runtime_report.md`, `runtime_g1/` (G1 browser report, F regression in both modes, glTF fidelity), `runtime_regression_report_e2.md`, `runtime_e2/` (incl. `gpu_test_e2.json`), `anim_glb_interaction_report_e1.md`, `runtime_e1/`, `rig_glb_compatibility_report.md`, `runtime/` (browser reports + screenshots), `validation_report.md`, `validation_results.json`, `silhouette_metrics.json`, `masks/` |
| `09_DOCS/` | `BUILD.md`, `CLEANUP_LOG.md`, `FOX_RUNTIME_CONTRACT_V2.md`, `COMPANION_INTEGRATION_GUIDE.md`, `KNOWN_LIMITATIONS_GATE_F.md`, `KNOWN_LIMITATIONS_GATE_G1.md` |

Start with `01_DESIGN/comparisons/fox_reference_vs_model_r4.png` and
`08_VALIDATION/validation_report.md` §4 (open decisions).
