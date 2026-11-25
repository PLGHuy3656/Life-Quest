# MASCOT-C01 — Non-Destructive Runtime Attachment Calibration

## 1. Implementation Architecture
- **Calibration Table:** [cosmeticCalibration.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmeticCalibration.ts)
- **Runtime Integration:** [FoxCosmeticManager.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/FoxCosmeticManager.ts) (`m.bind(skeleton, calMatrix ? calMatrix.clone().multiply(t.bindMatrix) : t.bindMatrix.clone())`)
- **Camera Inspection Aid:** Added `Ngang` (`side`) camera preset alongside `Trước` (`front`) and `Sau` (`back`) in [FoxCanvas.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/FoxCanvas.tsx) and [WardrobeDressingRoom.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/wardrobe/WardrobeDressingRoom.tsx).
- **Zero Rendering Hacks:** No `depthTest: false`, no `renderOrder` forcing, no transparency tricks, and zero mutations to shared GLB geometries or Gate I files.

## 2. Mathematical Formulation
For each calibrated item with rest-pose pivot $\mathbf{p}$, translation offset $\mathbf{o}$, Euler rotation $\mathbf{r}$, and scale $\mathbf{s}$:

$$\mathbf{M}_{\text{cal}} = \mathbf{T}(\mathbf{p} + \mathbf{o}) \cdot \mathbf{R}(\mathbf{r}) \cdot \mathbf{S}(\mathbf{s}) \cdot \mathbf{T}(-\mathbf{p})$$

$$\mathbf{M}_{\text{bind}} = \mathbf{M}_{\text{cal}} \cdot \mathbf{M}_{\text{templateBind}}$$

Because $\mathbf{M}_{\text{bind}}$ applies in Fox rest-pose space prior to bone matrix multiplication ($\sum w_i \mathbf{B}_i \mathbf{B}_{i,\text{inv}}$), every cosmetic remains rigidly locked to its skeleton joints across `idle`, `walk`, `happy`/`TASK_COMPLETED`, `sleep`, `lookAt`, and `FoxLevelScale`.

## 3. Per-Item Calibration Values Applied
| Item ID | Slot | Pivot `[x, y, z]` | Offset `[x, y, z]` (m) | Rotation `[rx, ry, rz]` (°) | Scale `[sx, sy, sz]` |
| --- | --- | --- | --- | --- | --- |
| `student_cap` | `HEAD` | `[0, 0.76, 0.14]` | `[0, +0.008, +0.005]` | `[-1, 0, 0]` | `[1.03, 1.03, 1.03]` |
| `explorer_hat` | `HEAD` | `[0, 0.75, 0.14]` | `[0, +0.010, +0.005]` | `[-1, 0, 0]` | `[1.04, 1.04, 1.04]` |
| `mage_hat` | `HEAD` | `[0, 0.78, 0.10]` | `[0, +0.016, +0.004]` | `[-2, 0, 0]` | `[1.04, 1.04, 1.04]` |
| `tet_khan_dong` | `HEAD` | `[0, 0.68, 0.00]` | `[0, +0.015, +0.006]` | `[0, 0, 0]` | `[1.03, 1.04, 1.03]` |
| `sports_headband` | `HEAD` | `[0, 0.62, 0.00]` | `[0, +0.004, +0.004]` | `[0, 0, 0]` | `[1.02, 1.01, 1.02]` |
| `ninja_headband` | `HEAD` | `[0, 0.62, 0.00]` | `[0, +0.004, +0.004]` | `[0, 0, 0]` | `[1.02, 1.01, 1.02]` |
| `student_glasses` | `FACE` | `[0, 0.61, 0.22]` | `[0, +0.003, +0.007]` | `[0, 0, 0]` | `[1.02, 1.02, 1.02]` |
| `simple_jacket` | `BODY` | `[0, 0.25, 0.00]` | `[0, +0.004, +0.006]` | `[0, 0, 0]` | `[1.06, 1.03, 1.08]` |
| `sports_jersey` | `BODY` | `[0, 0.25, 0.00]` | `[0, +0.004, +0.006]` | `[0, 0, 0]` | `[1.05, 1.03, 1.08]` |
| `ninja_gi` | `BODY` | `[0, 0.25, 0.00]` | `[0, +0.004, +0.006]` | `[0, 0, 0]` | `[1.06, 1.03, 1.08]` |
| `tet_ao_dai` | `BODY` | `[0, 0.25, 0.00]` | `[0, +0.004, +0.006]` | `[0, 0, 0]` | `[1.06, 1.03, 1.08]` |
| `explorer_backpack` | `BACK` | `[0, 0.28, -0.12]` | `[0, +0.005, -0.008]` | `[0, 0, 0]` | `[1.03, 1.02, 1.03]` |
| `mage_capelet` | `BACK` | `[0, 0.29, -0.02]` | `[0, +0.008, -0.006]` | `[0, 0, 0]` | `[1.07, 1.04, 1.09]` |
| `ninja_scroll` | `BACK` | `[0, 0.29, -0.15]` | `[0, +0.006, -0.010]` | `[0, 0, 0]` | `[1.03, 1.02, 1.03]` |
| `explorer_magnifier` | `HAND_RIGHT` | `[-0.29, 0.21, 0.06]` | `[-0.006, +0.004, +0.006]` | `[0, 0, 0]` | `[1.02, 1.02, 1.02]` |
| `mage_wand` | `HAND_RIGHT` | `[-0.29, 0.20, 0.06]` | `[-0.006, +0.004, +0.006]` | `[0, 0, 0]` | `[1.03, 1.03, 1.03]` |
| `tet_lixi` | `HAND_RIGHT` | `[-0.29, 0.21, 0.06]` | `[-0.006, +0.004, +0.008]` | `[0, 0, 0]` | `[1.03, 1.03, 1.03]` |
| `sports_sneakers` | `FEET` | `[0, 0.00, 0.02]` | `[0, 0.000, +0.002]` | `[0, 0, 0]` | `[1.03, 1.05, 1.03]` |

## 4. Automated Unit Verification
Added [cosmeticCalibration.test.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmeticCalibration.test.ts) verifying:
- All 18 non-fixture Gate I items have non-singular calibration matrices (`det > 0.8`) and bounded scales (`0.95..1.15`).
- `sports_sneakers` stays strictly anchored at `Y = 0` so soles never sink below the floor.
- Pivot-centered transforms apply exact positional offsets without axis distortion.
