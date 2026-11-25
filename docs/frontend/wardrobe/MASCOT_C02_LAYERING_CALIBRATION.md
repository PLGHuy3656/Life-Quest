# MASCOT-C02 — 6-Layer Outfit Calibration Specification

## 1. Conceptual Layering Order (Pure Geometry — Zero Render Hacks)
Implemented in [cosmeticCalibration.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmeticCalibration.ts) and [FoxCosmeticManager.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/FoxCosmeticManager.ts):

1. **Layer 1 — Base Fox Body:** `FOX_Body_1`, `FOX_Body_2`, `FOX_Arm_L/R`, `FOX_Head`, `FOX_Tail` (untouched).
2. **Layer 2 — Torso Clothing (`BODY`) & Footwear (`FEET`):** All 4 `BODY` garments (`simple_jacket`, `sports_jersey`, `ninja_gi`, `tet_ao_dai`) render as smooth, normal-inflated runtime shells (`+12mm` torso cloned from `FOX_Body_1` + `FOX_Body_2`, `+10mm` sleeves cloned from `FOX_Arm_L_1/R_1`) in [tailoredBodyShell.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/tailoredBodyShell.ts), bound to Fox's exact `skeleton` with per-fragment rest-pose tailoring (zero jagged quad cutouts, zero belly poke-through, zero depth/renderOrder hacks). `FEET` (`sports_sneakers`) remains floor-locked at `Y = 0`.
3. **Layer 3 — Neck / Scarf (`NECK`):** Built-in `FOX_Scarf_Roll`, `FOX_Scarf_Flap`, `FOX_Scarf_Emblem` dynamically elevated in `bindMatrix` space whenever a `BODY` garment or `mage_capelet` is equipped; original `bindMatrix` restored on unequip.
4. **Layer 4 — Back & Straps (`BACK`) + Held Props (`HAND_RIGHT`):**
   - When default `FOX_Backpack` is visible over a `BODY` garment: `FOX_Backpack` shifts backward (`z - 0.012m`) while `FOX_Backpack_Strap_L` (`x + 0.007m, z + 0.012m`) and `FOX_Backpack_Strap_R` (`x - 0.007m, z + 0.012m`) expand independently over the shoulders.
   - When a custom `BACK` cosmetic (`explorer_backpack`, `ninja_scroll`, `mage_capelet`) is worn over a `BODY` garment: `overBodyDelta` automatically adds extra radial clearance and re-binds cleanly without remounting the mesh.
5. **Layer 5 — Face (`FACE`):** `student_glasses` cleared forward (`+0.007m` Z) to stay crisp during facial morphs.
6. **Layer 6 — Headwear (`HEAD`):** Flush crown/forehead seating with zero floating gap in side profile.

## 2. Layer-Aware Default Accessory Transforms
| Target Mesh(es) | Trigger Condition | Transform Applied | Restoration |
| --- | --- | --- | --- |
| `FOX_Scarf_Roll`, `FOX_Scarf_Flap`, `FOX_Scarf_Emblem` | `BODY` equipped OR `mage_capelet` equipped | Pivot `[0, 0.37, 0.02]`, Offset `[0, +0.010, +0.014]`, Scale `[1.06, 1.03, 1.09]` | Exact cached `origBind` restored when neither is equipped |
| `FOX_Backpack` | `BODY` equipped AND `BACK` empty | Pos delta `[0, +0.004, -0.012]`, Scale `[1.03, 1.02, 1.03]` | Exact cached `pos`/`scale` restored |
| `FOX_Backpack_Strap_L` | `BODY` equipped AND `BACK` empty | Pos delta `[+0.007, +0.004, +0.012]`, Scale `[1.05, 1.02, 1.07]` | Exact cached `pos`/`scale` restored |
| `FOX_Backpack_Strap_R` | `BODY` equipped AND `BACK` empty | Pos delta `[-0.007, +0.004, +0.012]`, Scale `[1.05, 1.02, 1.07]` | Exact cached `pos`/`scale` restored |

## 3. Custom `BACK` Over-Body Deltas
| Item ID | Base Offset / Scale | Over-Body Delta (`hasBodyClothing: true`) |
| --- | --- | --- |
| `explorer_backpack` | `[0, +0.005, -0.008]` / `[1.03, 1.02, 1.03]` | `+[0, +0.004, -0.006]` / `×[1.04, 1.02, 1.05]` |
| `mage_capelet` | `[0, +0.008, -0.006]` / `[1.07, 1.04, 1.09]` | `+[0, +0.004, -0.004]` / `×[1.04, 1.02, 1.05]` |
| `ninja_scroll` | `[0, +0.006, -0.010]` / `[1.03, 1.02, 1.03]` | `+[0, +0.004, -0.006]` / `×[1.04, 1.02, 1.05]` |
