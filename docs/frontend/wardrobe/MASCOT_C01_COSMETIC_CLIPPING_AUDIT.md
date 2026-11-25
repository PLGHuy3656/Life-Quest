# MASCOT-C01 — Fox V2 Cosmetic Clipping & Attachment Audit

## 1. Pipeline & Asset Inventory
Audited the production Gate I Fox V2 cosmetic pipeline:
- **Runtime:** [FoxCosmeticManager.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/FoxCosmeticManager.ts), [cosmeticContract.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmeticContract.ts), [FoxController.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/FoxController.ts)
- **Manifests:** [cosmetic_catalog_h1.json](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmetic_catalog_h1.json), [cosmetic_catalog_h2.json](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmetic_catalog_h2.json)
- **Production GLBs:** 18 non-fixture GLBs + 2 technical fixtures (`slot_test_sneakers`, `slot_test_tail_ribbon`). All 32 Gate I assets remain byte-for-byte immutable (`GATE_I_FINAL_SHA256SUMS.txt` verified 32/32).

## 2. Complete 18-Item Diagnostic Matrix (Before Calibration)
| Item ID | GLB File | Slot | Anchor Bone(s) | Observed Issue (Front / Side / Rear / Anim) | Confirmed Root Cause |
| --- | --- | --- | --- | --- | --- |
| `student_cap` | `cosmetics/student_cap.glb` | `HEAD` | `HEAD` (`ATT_HAT`) | Brim sits tight/slightly embedded into forehead contour | Low rest-pose Y/Z clearance on crown |
| `explorer_hat` | `cosmetics/explorer_hat.glb` | `HEAD` | `HEAD` (`ATT_HAT`) | Golden star badge on brim sinks into orange forehead | Low rest-pose Y/Z clearance (`minY 0.7048`) |
| `mage_hat` | `cosmetics/mage_hat.glb` | `HEAD` | `HEAD` (`ATT_HAT`) | Gold rim sits slightly embedded into top of head | Low rest-pose Y clearance |
| `tet_khan_dong` | `cosmetics/tet_khan_dong.glb` | `HEAD` | `HEAD` (`ATT_HAT`) | Crown sits low against forehead contour | Low rest-pose Y/Z clearance |
| `sports_headband` | `cosmetics/sports_headband.glb` | `HEAD` | `HEAD` | Minor tight fit risk during head-nod clips | Minimal radial clearance (`7.5 mm`) |
| `ninja_headband` | `cosmetics/ninja_headband.glb` | `HEAD` | `HEAD` | Minor tight fit risk during head-nod clips | Minimal radial clearance |
| `student_glasses` | `cosmetics/student_glasses.glb` | `FACE` | `HEAD` (`ATT_GLASSES`) | Clean in idle; frame sits close to cheek morphs in happy pose | Small Z clearance |
| `simple_jacket` | `cosmetics/simple_jacket.glb` | `BODY` | `SPINE`, `ARM_L/R`, `HIPS` | **Severe:** (1) Sleeve/shoulder fur bleed-through (`maxX 0.2565 < FOX_Arm 0.2618`); (2) Jagged open-belly & strap cutout on chest | (1) Runtime-fixable radial clearance; (2) **Asset-level GLB topology** (baked face deletions in Blender) |
| `sports_jersey` | `cosmetics/sports_jersey.glb` | `BODY` | `SPINE`, `HIPS`, `NECK` | **Severe:** Chest edge bleed (`maxZ 0.1451 < FOX_Body_2 0.1456`) + baked open-belly/strap cutout | (1) Runtime-fixable radial clearance; (2) **Asset-level GLB topology** |
| `ninja_gi` | `cosmetics/ninja_gi.glb` | `BODY` | `SPINE`, `ARM_L/R`, `HIPS` | **Severe:** Orange arm/shoulder bleed-through + baked open-belly/strap cutout | (1) Runtime-fixable radial clearance; (2) **Asset-level GLB topology** |
| `tet_ao_dai` | `cosmetics/tet_ao_dai.glb` | `BODY` | `SPINE`, `ARM_L/R`, `HIPS` | **Severe:** Sleeve/chest edge bleed + baked open-belly/strap cutout | (1) Runtime-fixable radial clearance; (2) **Asset-level GLB topology** |
| `explorer_backpack` | `cosmetics/explorer_backpack.glb` | `BACK` | `SPINE` (`ATT_BACKPACK`) | Clean placement; tight backplane clearance during breathing | Minor Z clearance improvement |
| `mage_capelet` | `cosmetics/mage_capelet.glb` | `BACK` | `SPINE`, `NECK`, `HIPS` | **Moderate:** Front shoulder straps sit sunken into `FOX_Body_1` (`maxZ 0.1202 < 0.1382`) | Radial clearance + **Asset-level GLB topology** (short shoulder tabs) |
| `ninja_scroll` | `cosmetics/ninja_scroll.glb` | `BACK` | `SPINE` (`ATT_BACKPACK`) | Clean rear placement; tight back clearance | Minor Z clearance improvement |
| `explorer_magnifier` | `cosmetics/explorer_magnifier.glb` | `HAND_RIGHT` | `PAW_R` (`ATT_HAND_R`) | Clean grip; auto-hides on `HAND_BUSY_CLIPS` | Minor paw clearance |
| `mage_wand` | `cosmetics/mage_wand.glb` | `HAND_RIGHT` | `PAW_R` (`ATT_HAND_R`) | Clean grip; auto-hides on `HAND_BUSY_CLIPS` | Minor paw clearance |
| `tet_lixi` | `cosmetics/tet_lixi.glb` | `HAND_RIGHT` | `PAW_R` (`ATT_HAND_R`) | Clean grip; auto-hides on `HAND_BUSY_CLIPS` | Minor paw clearance |
| `sports_sneakers` | `cosmetics/sports_sneakers.glb` | `FEET` | `FOOT_L`, `FOOT_R` | Clean ground contact; tight toe/cuff clearance (`4 mm`) | Floor-anchored (`Y=0`) radial clearance |

## 3. Deep 3D Transform Root Cause
1. **Carrier Mesh Overlap (Geometry Measurements):**
   - `FOX_Body_1` bounds: `X [-0.19, 0.19]`, `Z [-0.14, 0.1382]`; `FOX_Body_2` (cream belly patch): `Z [0.1241, 0.1456]`; `FOX_Arm_L_1/R_1`: `X [±0.2618]`.
   - All 4 `BODY` garments have `maxZ = 0.1451` (inside `FOX_Body_2` `0.1456`) and `maxX = 0.2565` (inside `FOX_Arm_L_1` `0.2618`), causing sleeve and chest bleed-through.
2. **Why Root Object3D Offsets Do Not Work on `SkinnedMesh` (`AttachedBindMode`):**
   - In Three.js `SkinnedMesh` with `bindMode === 'attached'`, `bindMatrixInverse = inverse(mesh.matrixWorld)` cancels `root.position`/`root.scale` in the vertex shader (`modelViewMatrix * bindMatrixInverse === viewMatrix`).
   - Therefore, geometric runtime calibration MUST be composed into `mesh.bindMatrix` in rest-pose Fox space **before** bone skinning (`M_bind = M_cal * template.bindMatrix`), which simultaneously guarantees exact bone tracking across all animations and uniform `FoxLevelScale` scaling (`Lv1`–`Lv30`) without double-transform bugs.

## 4. Documented Unresolved Asset-Level Blockers (Do Not Hide)
- **4 `BODY` garments (`simple_jacket`, `sports_jersey`, `ninja_gi`, `tet_ao_dai`)** and **`mage_capelet`:** Even after radial bind-space expansion eliminates sleeve/torso bleed-through, the jagged staircase cutout over the center belly and backpack straps is **baked face-deletion topology inside the immutable Gate I `.glb` meshes** (no triangles exist across the center belly/strap paths). Filling or smoothing those chest cutouts requires a future Blender Gate H3 asset rework — per Gate I immutability rules, the production GLBs were NOT altered.
