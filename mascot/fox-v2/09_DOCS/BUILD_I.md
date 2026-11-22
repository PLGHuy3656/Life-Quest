# Gate I — Build (Voice Assistant Animations + Production Finalization)

Run all Blender & Playwright commands from `LifeQuest_Fox_V2/` using the Docker image (`python:3.13-slim-bookworm` + `bpy==5.3.0` + `playwright` + Chromium + `ffmpeg`) mounting only `LifeQuest_Fox_V2:/workspace`.

- **Read-only inputs:** `03_RIG/fox_rig_d1_1.blend`, `08_VALIDATION/scripts/anim_g2_1.py`, all E2 / G1.1 / G2.1 / G3 / H1 / H2 approved assets and sandboxes.
- **Outputs:** new versioned Gate I files only.

| Step | Command | Output |
|---|---|---|
| Author + resolve (8 clips) | `python 08_VALIDATION/scripts/anim_i.py` | `04_ANIMATIONS/i_voice_assistant/fox_anim_i.blend`, `anim_spec_i.json` |
| Export animation-only GLB | `python 08_VALIDATION/scripts/export_glb_i.py` | `06_EXPORTS/glb/modules/fox_v2_i_voice_assistant.anim.glb` + manifest + reference poses |
| glTF pose fidelity | `python 08_VALIDATION/scripts/gltf_pose_fidelity_i.py` | `06_EXPORTS/glb/modules/fox_v2_i_gltf_fk_poses.json`, `08_VALIDATION/runtime_i/gltf_pose_fidelity_i.json` |
| Cosmetics × Voice matrix | `python 08_VALIDATION/scripts/cosmetics_matrix_i.py` | `08_VALIDATION/runtime_i/compatibility_matrix_i.json` |
| Build Gate I runtime SDK | `cd 07_WEB_PREVIEW/companion_sandbox_i && npm ci && npm run build` | `dist/` (served on 4260) |
| Gate I browser suite | `python 08_VALIDATION/scripts/browser_i_test.py` | `08_VALIDATION/runtime_i/i_runtime_report.json` + screenshots |
| Preview video + contact sheet | `python 08_VALIDATION/scripts/capture_i_previews.py` | `04_ANIMATIONS/i_voice_assistant/previews/fox_i_voice_to_task_sequence.mp4`, `renders/fox_i_voice_contact_sheet.png` |
| Regressions (E2..H2) | `python 08_VALIDATION/scripts/regress_i.py` | `08_VALIDATION/runtime_i/regressions_i.json` |
| Manifest & SHA-256 | `python 08_VALIDATION/scripts/make_manifest_i.py` | `09_DOCS/I_ASSET_MANIFEST.md`, `09_DOCS/GATE_I_SHA256SUMS.txt` |
