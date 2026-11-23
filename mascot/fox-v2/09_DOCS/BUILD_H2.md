# Gate H2 — build

Run everything from `mascot/fox-v2/`. Blender 5.3 is used as the `bpy` module.
- **Read-only inputs:** the canonical rig, the approved animation blends, and every H1 file (H1 items are reused untouched).
- **Outputs:** new files only. The one exception is the root `README.md`, which was rewritten on request; the previous
  version is preserved as `09_DOCS/README_HISTORY_GATE_G1.md`.

| Step | Command | Output |
|---|---|---|
| New items (12) | `python3 08_VALIDATION/scripts/cosmetics_h2.py` (imports the H1 helpers from `cosmetics_h1.py`) | `05_COSMETICS/h2_outfits/fox_cosmetics_h2.blend`, `cosmetic_catalog_h2.json`, `06_EXPORTS/glb/cosmetics/<item>.glb` |
| Compatibility matrix (H1 + H2 items, all 50 clips) | `python3 08_VALIDATION/scripts/cosmetics_matrix_h2.py` (the H1 matrix module with the H2 item set) | `08_VALIDATION/cosmetics_h2/compatibility_matrix_h2.json` |
| Runtime reference | `python3 08_VALIDATION/scripts/cosmetics_reference_h2.py` | `06_EXPORTS/glb/cosmetics/cosmetic_reference_h2.json` |
| Sandbox | `cd 07_WEB_PREVIEW/companion_sandbox_h2 && npm ci && npm run build` | `dist/` (serve on 4250) |
| Regression builds | `dist` copies with `window.__foxModuleFilter = ['g1_quest_reward_streak']` (port 4251) and `['g1_quest_reward_streak','g2_daily_life']` (port 4252) | — |
| Outfit suite | `python3 08_VALIDATION/scripts/browser_h2_test.py` | `runtime_h2/h2_runtime_report.json`, `h2_contact_*.png`, `h2_clips_outfit_*.png` |
| Previews | `python3 08_VALIDATION/scripts/capture_h2_previews.py` | `runtime_h2/previews/h2_outfit_<name>.mp4` + strips |
| Regressions | `python3 08_VALIDATION/scripts/regress_h2.py` (E2, F × 2, G1.1, flame, G2.1, G3, H1; assertions unchanged) | `runtime_h2/regressions_h2.json`, `runtime_h2/regress_*` |
| Reports | `python3 08_VALIDATION/scripts/make_reports_h2.py` | `cosmetics_h2/cosmetic_compatibility_report_h2.md`, `08_VALIDATION/gate_h2_validation_report.md` |
| Manifest | `python3 08_VALIDATION/scripts/make_manifest_h2.py 09_DOCS/GATE_H1_SHA256SUMS.txt` | `09_DOCS/H2_ASSET_MANIFEST.md` |

Helpers:
- `08_VALIDATION/scripts/cosmetics_scene_h2.py`: loads the H1 + H2 cosmetic blends into an animation blend, in memory.
- `08_VALIDATION/scripts/probes_h1/cos_look.py`: render probe. Set `OUTFITS=mage;ninja` with the H2 scene module.
