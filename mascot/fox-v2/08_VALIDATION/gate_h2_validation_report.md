# Gate H2 — validation report (cosmetic outfit library)

Runtime suite: **17/17** checks pass. Headless Chrome + SwiftShader: no GPU, so no performance claim is made.
Report: `08_VALIDATION/runtime_h2/h2_runtime_report.json`.

## Outfits

| Outfit | Items | New in H2 |
|---|---|---|
| Student | Student cap (HEAD), Student glasses (FACE), Simple jacket (BODY) | — (H1 items) |
| Sports | Sports headband (HEAD), Sports jersey (BODY), Sports sneakers (FEET) | sports_jersey, sports_sneakers |
| Explorer | Safari hat (HEAD), Explorer backpack (BACK), Explorer magnifier (HAND_RIGHT) | explorer_hat |
| Mage | Mage hat (HEAD), Mage capelet (BACK), Star wand (HAND_RIGHT) | mage_hat, mage_capelet, mage_wand |
| Ninja | Ninja headband (HEAD), Ninja gi (BODY), Ninja scroll (BACK) | ninja_headband, ninja_gi, ninja_scroll |
| Tết | Khăn đóng (Tết) (HEAD), Áo dài top (Tết) (BODY), Lì xì envelope (HAND_RIGHT) | tet_khan_dong, tet_ao_dai, tet_lixi |

## New items

| Item | Slot | Skin joints | Triangles | GLB bytes | Hides |
|---|---|---|---|---|---|
| Sports jersey (`sports_jersey`) | BODY | HIPS, NECK, SPINE | 2004 | 65100 | — |
| Sports sneakers (`sports_sneakers`) | FEET | FOOT_L, FOOT_R | 1088 | 40680 | — |
| Safari hat (`explorer_hat`) | HEAD | HEAD | 3248 | 109624 | FOX_Tuft |
| Mage hat (`mage_hat`) | HEAD | HEAD | 3972 | 128572 | FOX_Tuft |
| Mage capelet (`mage_capelet`) | BACK | HIPS, NECK, SPINE | 1156 | 42356 | FOX_Backpack |
| Star wand (`mage_wand`) | HAND_RIGHT | PAW_R | 276 | 18832 | — |
| Ninja headband (`ninja_headband`) | HEAD | HEAD | 704 | 29872 | — |
| Ninja gi (`ninja_gi`) | BODY | ARM_L, ARM_R, HIPS, NECK, PAW_L, PAW_R… | 3556 | 108744 | — |
| Ninja scroll (`ninja_scroll`) | BACK | SPINE | 3332 | 105712 | FOX_Backpack |
| Khăn đóng (Tết) (`tet_khan_dong`) | HEAD | HEAD | 3648 | 116272 | FOX_Tuft |
| Áo dài top (Tết) (`tet_ao_dai`) | BODY | ARM_L, ARM_R, HIPS, NECK, PAW_L, PAW_R… | 3664 | 111772 | — |
| Lì xì envelope (`tet_lixi`) | HAND_RIGHT | PAW_R | 52 | 11404 | — |

## Runtime checks

| | Check |
|---|---|
| PASS | Attachment (runtime): rigid item points fixed in their bone frame through all 151 poses (≤ 0.01 mm); head items share the exact FOX_Head transform |
| PASS | Attachment vs Blender: 53 tracker vertices with Fox surface ≤ 30 mm: ≤ 1.0 mm more deviation than the Fox surface under them |
| PASS | Held items (wand, lì xì): Blender deviation ≤ the approved Fox surface max in the same poses (18.2 mm) |
| PASS | Other item points without Fox surface within 30 mm: Blender deviation ≤ 6.0 mm |
| PASS | [harness] outfit library: 6 outfits (Student, Sports, Explorer, Mage, Ninja, Tết), every item in its declared slot, none replaces the scarf (NECK), all distinct |
| PASS | [harness] each outfit equips fully; exactly the replaced defaults are hidden (no double pack, tuft only under hats), the red scarf always stays |
| PASS | [harness] outfit switching: all 30 ordered pairs → only the new outfit's items and hides remain |
| PASS | [harness] 12 new library items: equip → bound to the Fox's own bones → unequip removes them |
| PASS | [harness] persistence: each outfit stays equipped, attached and visible through the 17 required clips (+ mirror); hand items only hidden by the hand-busy rule |
| PASS | [harness] level scaling: all 6 outfits at Lv1 / Lv30 match the exact scale ratio (≤ 0.1 mm) |
| PASS | [harness] cross-slot layering: the mage capelet layers over every BODY item (no exclusion needed), default pack hidden |
| PASS | [harness] hand busy: wand and lì xì hide while the pencil is held and come back |
| PASS | [harness] cleanup: 12 outfit changes → every item skeleton disposed, cache empty after purge, no approved mesh left hidden |
| PASS | Every outfit at Lv1 and Lv30 through the 17 required clips (+ mirror): no item leaves the fixed 3/4 frame further than the approved Fox itself does in that clip |
| PASS | Render counts per outfit measured (software renderer: counts only) |
| PASS | Renderer resources back to the default-look baseline after 12 outfit changes while rendering; item cache empty |
| PASS | no page errors / unexpected 404s (static server favicon only) |

## Render counts (software renderer, counts only)

| Look | Draw calls | Triangles | Geometries | Textures |
|---|---|---|---|---|
| default | 48 | 73842 | 53 | 34 |
| outfit_student | 55 | 80358 | 60 | 37 |
| outfit_sports | 52 | 77510 | 64 | 37 |
| outfit_explorer | 50 | 76374 | 67 | 37 |
| outfit_mage | 47 | 73398 | 71 | 37 |
| outfit_ninja | 47 | 77410 | 68 | 37 |
| outfit_tet | 52 | 79382 | 65 | 37 |

Lv1 / Lv30 framing: no item leaves the fixed 3/4 harness frame further than the approved Fox itself (the Fox's own ears leave that frame at the Lv30 jump apex); per-clip values in the JSON report.

**Compatibility:** SEVERE values left after the H1 rules: 0. See `cosmetics_h2/cosmetic_compatibility_report_h2.md`.

## Regressions (approved suites and the H1 suite, assertions unchanged)

| Suite | Result |
|---|---|
| e2 | 29 passed, 0 failed |
| f_fallback | 35/35 PASS |
| f_g1 | 35/35 PASS |
| g1_1 | 23/23 PASS |
| flame_g1_1 | pass |
| g2_1 | 41/41 PASS |
| g3 | 34/34 PASS |
| h1 | 28/28 checks passed |
