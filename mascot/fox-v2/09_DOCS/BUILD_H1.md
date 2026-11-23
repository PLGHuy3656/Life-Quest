# Gate H1 — build

Run all commands from `mascot/fox-v2/` (LifeQuest_Fox_V2). Blender 5.3 is used as the `bpy` Python module.

- **Read-only inputs:**
  - the canonical rig `03_RIG/fox_rig_d1_1.blend`;
  - the approved animation blends (E2, G1.1, G2.1, G3), opened for measurement and never saved;
  - every approved E2 / F / G1.1 / G2.1 / G3 file.
- **Outputs:** every H1 output is a new file.

| Step | Command | Output |
|---|---|---|
| Cosmetic assets | `python3 08_VALIDATION/scripts/cosmetics_h1.py` | `05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend`, `cosmetic_catalog_h1.json`, `06_EXPORTS/glb/cosmetics/<item>.glb` (8) |
| Compatibility matrix | `python3 08_VALIDATION/scripts/cosmetics_matrix_h1.py` (`FOX_H1_QUICK=1`: required clips only) | `08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.json` |
| Runtime reference | `python3 08_VALIDATION/scripts/cosmetics_reference_h1.py` (reads the matrix for the worst frames) | `06_EXPORTS/glb/cosmetics/cosmetic_reference_h1.json` |
| Sandbox | `cd 07_WEB_PREVIEW/companion_sandbox_h1 && npm ci && npm run assets && npx tsc -b && npx vite build` | `dist/` (serve on 4198) |
| Regression builds | `dist` copies with `window.__foxModuleFilter = ['g1_quest_reward_streak']` (port 4199) and `['g1_quest_reward_streak','g2_daily_life']` (port 4200) prefixed in `index.html` | — |
| Browser suite | `python3 08_VALIDATION/scripts/browser_h1_test.py` | `runtime_h1/h1_runtime_report.json`, contact sheets `h1_contact_*.png`, `h1_clips_*.png` |
| Previews | `python3 08_VALIDATION/scripts/capture_h1_previews.py` (the outfit videos were made with `FOX_H1_OUTFITS=student,sports,explorer FOX_H1_MAX_S=3.5`) | `runtime_h1/previews/h1_<outfit>.mp4` + strips |
| Regressions | `python3 08_VALIDATION/scripts/regress_h1.py` (E2, F fallback, F + G1, G1.1, flame, G2.1, G3; assertions unchanged) | `runtime_h1/regressions_h1.json`, `runtime_h1/regress_*` |
| Reports | `python3 08_VALIDATION/scripts/make_reports_h1.py` | `cosmetics_h1/compatibility_matrix_h1.md`, `08_VALIDATION/gate_h1_validation_report.md` |
| Manifest | `python3 08_VALIDATION/scripts/make_manifest_h1.py <G3 SHA list>` | `09_DOCS/H1_ASSET_MANIFEST.md` |

Shared helper: `08_VALIDATION/scripts/cosmetics_scene_h1.py`. It appends the cosmetics into an animation blend in memory and
provides the mirrored left-paw test fixture used by the matrix.
