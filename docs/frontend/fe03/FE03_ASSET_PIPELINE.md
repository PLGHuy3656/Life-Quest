# FE-03 Asset Delivery Pipeline

## 1. Source of Truth
- **Git Tag:** `mascot-v2-gate-i` (`812160dff9fd37d786bc7e07fb3873d116c077fb`)
- **Sync Script:** `front-end/scripts/sync-mascot-assets.mjs` (`npm run assets`, automatically invoked by `predev` and `prebuild`)
- **Verification File:** `mascot-v2-gate-i:mascot/fox-v2/09_DOCS/GATE_I_FINAL_SHA256SUMS.txt`
- **Generated Output (gitignored):** `front-end/public/models/**`, `front-end/public/fox_poster.png`, `front-end/public/models/assets.lock.json`

## 2. Source-to-Runtime Asset Mapping (32 Approved Files)

| Category | Source (`mascot-v2-gate-i:mascot/fox-v2/...`) | Runtime Target (`front-end/...`) | Count |
|---|---|---|---|
| Base Character Rig & E2 Animations | `06_EXPORTS/glb/fox_v2_anim_e2.glb` (lock `e884d675eee0fb45`) | `public/models/fox_v2_anim_e2.glb` | 1 |
| Animation-Only Modules | `06_EXPORTS/glb/modules/fox_v2_{g1_1,g2_1,g3,i}_*.anim.glb` | `public/models/modules/*.anim.glb` | 4 |
| Reference Pose Manifests | `06_EXPORTS/glb/modules/fox_v2_{g1_1,g2_1,g3,i}_reference_poses.json` | `public/models/modules/*_reference_poses.json` | 4 |
| H1 Cosmetic GLBs | `06_EXPORTS/glb/cosmetics/{8 H1 items}.glb` | `public/models/cosmetics/*.glb` | 8 |
| H2 Cosmetic GLBs | `06_EXPORTS/glb/cosmetics/{12 H2 items}.glb` | `public/models/cosmetics/*.glb` | 12 |
| Cosmetic Reference Manifests | `06_EXPORTS/glb/cosmetics/cosmetic_reference_{h1,h2}.json` | `public/models/cosmetics/cosmetic_reference_{h1,h2}.json` | 2 |
| Static WebGL Fallback Poster | `07_WEB_PREVIEW/companion_sandbox_i/public/fox_poster.png` | `public/fox_poster.png` | 1 |
| **Total** | | | **32** |

## 3. Excluded from Frontend Public Assets
- All `.blend` Blender source files (`02_MODEL/`, `03_RIG/`, `04_ANIMATIONS/`, `05_COSMETICS/`).
- Preview `.mp4` videos and validation renders.
- No binary `.glb` or `.png` files are duplicated in Git on `feature/tv4-frontend`.
