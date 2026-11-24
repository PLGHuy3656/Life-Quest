# FE-W01 — Visual QA & Verification Report

## 1. Automated Quality Gates
| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | **PASS** (0 errors) |
| Lint | `npm run lint` (`--max-warnings 0`) | **PASS** (0 warnings) |
| Unit Tests | `npm run test` (`vitest run`) | **PASS** (`18/18` files, `85/85` tests) |
| Production Build | `npm run build` (`32/32` Gate I SHA256 + `vite build`) | **PASS** |
| E2E Tests | `npm run test:e2e` (`playwright test`) | **PASS** (`22/22` tests) |

## 2. Viewport & Single-WebGL-Canvas Verification
| Scenario / Viewport | Canvases | Active Mascots | FoxCompanionRail | Horizontal Overflow | Left Rail Top |
| --- | ---: | ---: | ---: | ---: | ---: |
| Wardrobe Default `1024×900` | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Default `1280×900` | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Default `1440×900` | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Default `1920×1080` | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Hat (`mage_hat`) | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Scarf (`Khăn`) | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Wardrobe Backpack Back View | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Multi-Slot Explorer Preset | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Cosmetic Shop All (`1440×900`) | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| Cosmetic Shop Filter (`Mũ`) | `1` | `1` | `0` (hidden) | `0px` | `92px` |
| WebGL Fallback (`?nowebgl=1`) | `0` | `0` | `0` (hidden) | `0px` | `92px` |
| Wardrobe → Dashboard (`/`) | `1` | `1` | `1` (restored) | `0px` | `92px` |

## 3. Visual QA Findings & Resolution
- **Initial Capture Finding:** During the first Visual QA screenshot pass, the 3D Fox canvas inside `WardrobeDressingRoom` collapsed vertically because `.canvasStage` used flex `min-height` without an explicit height and default `full` framing was pulled far back.
- **Resolution:** Set an explicit `height: 450px` on `.canvasStage` with absolute inset canvas positioning and applied hero dressing-room camera framing (`0.68` distance multiplier) for `orbit && presentation === 'full'` in [FoxCanvas.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/FoxCanvas.tsx). Re-captured all 12 screenshots and verified Fox V2 is large, centered, crisp, and properly aligned across all cosmetics.

## 4. Captured Screenshots
- [fe_w01_wardrobe_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_1024x900.png)
- [fe_w01_wardrobe_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_1280x900.png)
- [fe_w01_wardrobe_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_1440x900.png)
- [fe_w01_wardrobe_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_1920x1080.png)
- [fe_w01_wardrobe_hat.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_hat.png)
- [fe_w01_wardrobe_scarf.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_scarf.png)
- [fe_w01_wardrobe_backpack_back.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_backpack_back.png)
- [fe_w01_wardrobe_multi_slots.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_multi_slots.png)
- [fe_w01_shop_all_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_shop_all_1440x900.png)
- [fe_w01_shop_hats_filter.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_shop_hats_filter.png)
- [fe_w01_webgl_fallback.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_webgl_fallback.png)
- [fe_w01_wardrobe_to_dashboard.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/wardrobe/screenshots/fe_w01_wardrobe_to_dashboard.png)

## 5. Known Limitations
- Purchase mutations, cosmetic prices, unlock level thresholds, owned inventory, and server-persisted outfit equipment remain `PENDING API` until Backend merges Shop/Inventory endpoints.
- Gate I H1/H2 contains no replacement `NECK` GLB assets, so the `Khăn` category displays Fox V2's built-in default red scarf honestly without fabricating placeholder GLBs.
