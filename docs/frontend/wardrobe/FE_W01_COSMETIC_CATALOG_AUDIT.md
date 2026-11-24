# FE-W01 — Gate I Fox V2 Cosmetic Catalog Audit

## 1. Source of Truth
All wardrobe and shop items are derived exclusively from the verified Gate I manifests:
- [cosmetic_catalog_h1.json](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmetic_catalog_h1.json)
- [cosmetic_catalog_h2.json](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmetic_catalog_h2.json)
- [cosmeticContract.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/mascot/cosmetics/cosmeticContract.ts)
- Frontend catalog adapter: [wardrobeCatalog.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/wardrobe/wardrobeCatalog.ts)

No GLB file names were invented and zero production GLB/SDK files were modified (`32/32` Gate I SHA256 checksums verified by `npm run assets`).

## 2. Category Mapping (Claude Reference → Real Gate I Slots)
| UI Category | Gate I Slot(s) | Real Non-Fixture GLBs | Built-In Fox Default |
| --- | --- | ---: | --- |
| **Tất cả** (`ALL`) | `HEAD`, `NECK`, `BACK`, `BODY`, `FACE`, `HAND_RIGHT`, `FEET` | 18 | Red Scarf (`NECK`), Backpack (`BACK`) |
| **Mũ** (`HAT`) | `HEAD` | 6 | — |
| **Khăn** (`SCARF`) | `NECK` | 0 | `default_scarf` (`FOX_Scarf_*`) shown honestly |
| **Balo** (`BACKPACK`) | `BACK` | 3 | `default_backpack` (`FOX_Backpack`) hidden when replaced |
| **Trang phục** (`OUTFIT`) | `BODY` | 4 | — |
| **Phụ kiện** (`ACCESSORY`) | `FACE`, `HAND_RIGHT`, `FEET` | 5 | — |

Technical slot-test fixtures (`slot_test_sneakers`, `slot_test_tail_ribbon`) remain excluded from the user-facing catalog.

## 3. Verified Non-Fixture Catalog Inventory (18 GLBs)
| Item ID | Vietnamese Name | Slot | Socket | GLB File | Theme | Price / Unlock |
| --- | --- | --- | --- | --- | --- | --- |
| `student_cap` | Mũ lưỡi trai Học sinh | `HEAD` | `ATT_HAT` | `models/cosmetics/student_cap.glb` | Học sinh | Pending Shop API |
| `sports_headband` | Băng đô Thể thao | `HEAD` | `HEAD` | `models/cosmetics/sports_headband.glb` | Thể thao | Pending Shop API |
| `explorer_hat` | Mũ Safari Thám hiểm | `HEAD` | `ATT_HAT` | `models/cosmetics/explorer_hat.glb` | Thám hiểm | Pending Shop API |
| `mage_hat` | Mũ Chóp Pháp sư | `HEAD` | `ATT_HAT` | `models/cosmetics/mage_hat.glb` | Pháp sư | Pending Shop API |
| `ninja_headband` | Băng trán Ninja | `HEAD` | `HEAD` | `models/cosmetics/ninja_headband.glb` | Ninja | Pending Shop API |
| `tet_khan_dong` | Khăn đóng Tết | `HEAD` | `ATT_HAT` | `models/cosmetics/tet_khan_dong.glb` | Tết | Pending Shop API |
| `explorer_backpack` | Balo Thám hiểm | `BACK` | `ATT_BACKPACK` | `models/cosmetics/explorer_backpack.glb` | Thám hiểm | Pending Shop API |
| `mage_capelet` | Áo choàng Pháp sư | `BACK` | Skinned | `models/cosmetics/mage_capelet.glb` | Pháp sư | Pending Shop API |
| `ninja_scroll` | Cuộn Bí kíp Ninja | `BACK` | `ATT_BACKPACK` | `models/cosmetics/ninja_scroll.glb` | Ninja | Pending Shop API |
| `simple_jacket` | Áo khoác Xanh ngọc | `BODY` | Skinned | `models/cosmetics/simple_jacket.glb` | Học sinh | Pending Shop API |
| `sports_jersey` | Áo đấu Thể thao | `BODY` | Skinned | `models/cosmetics/sports_jersey.glb` | Thể thao | Pending Shop API |
| `ninja_gi` | Võ phục Ninja | `BODY` | Skinned | `models/cosmetics/ninja_gi.glb` | Ninja | Pending Shop API |
| `tet_ao_dai` | Áo dài Tết | `BODY` | Skinned | `models/cosmetics/tet_ao_dai.glb` | Tết | Pending Shop API |
| `student_glasses` | Kính mắt Học sinh | `FACE` | `ATT_GLASSES` | `models/cosmetics/student_glasses.glb` | Học sinh | Pending Shop API |
| `explorer_magnifier` | Kính lúp Thám hiểm | `HAND_RIGHT` | `ATT_HAND_R` | `models/cosmetics/explorer_magnifier.glb` | Thám hiểm | Pending Shop API |
| `mage_wand` | Đũa phép Ngôi sao | `HAND_RIGHT` | `ATT_HAND_R` | `models/cosmetics/mage_wand.glb` | Pháp sư | Pending Shop API |
| `tet_lixi` | Bao Lì xì Tết | `HAND_RIGHT` | `ATT_HAND_R` | `models/cosmetics/tet_lixi.glb` | Tết | Pending Shop API |
| `sports_sneakers` | Giày Thể thao | `FEET` | Skinned | `models/cosmetics/sports_sneakers.glb` | Thể thao | Pending Shop API |

## 4. Product Preview Thumbnails
Each card uses [CosmeticPreviewThumb.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/wardrobe/CosmeticPreviewThumb.tsx), a bespoke SVG product thumbnail matching the exact silhouette and color palette of the underlying Gate I GLB rather than repeating a full Fox illustration on every card.
