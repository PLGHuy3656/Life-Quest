# FE-W01 — Backend Capability Matrix (Wardrobe & Cosmetic Shop)

## 1. Audited Backend Modules (`backend/src/modules/`)
Active modules on current repository state:
`auth`, `goals`, `milestones`, `quests`, `schedules`, `today`, `users`.

There is **no** Shop, Cosmetic Catalog, User Inventory, Purchase, or Equipped Outfit module in the current Backend.

## 2. Capability Status Matrix
| Capability | Status | Authoritative Source | Frontend Behavior (FE-W01) |
| --- | --- | --- | --- |
| **Coin Balance & Player Level** | **LIVE** (when authenticated) | `GET /api/v1/today` (`gamification.coinBalance`, `gamification.level`) via `useTodayQuery()` | Displayed in `PlayerStatsRail` and contextually in Wardrobe/Shop header pill. Shows `—` when unauthenticated; never fabricated or mutated locally. |
| **3D Cosmetic Try-On (H1/H2)** | **LIVE (Local 3D Runtime)** | Gate I `COSMETIC_CATALOG` + `FoxCosmeticManager` | Real 3D preview on Fox V2 with slot replacement, multi-slot layering, camera controls, and reset. |
| **Cosmetic Price & Unlock Level** | **PENDING API** | None | Clearly labeled `Giá: Chờ Shop API` and `Mở khóa: Chờ API`. No fake Coin prices or fabricated Level gates. |
| **Purchase Cosmetic Mutation** | **PENDING API** | None | `Mua (Chờ API)` button is strictly disabled (`disabled`) with explanatory tooltip. Zero local Coin deductions. |
| **User Owned Inventory** | **PENDING API** | None | Only built-in Fox V2 defaults (`default_scarf`, `default_backpack`) are shown as `Đang mặc (Mặc định)`. No fake owned items generated. |
| **Persist Equipped Outfit** | **PENDING API** | None | Clearly separated `TRẠNG THÁI ĐANG MẶC (SERVER): Mặc định` vs `ĐANG XEM TRƯỚC (CỤC BỘ)`. Never claims outfit is saved to account. |
| **Fox Contextual Dialogue** | **LIVE (Frontend Engine)** | FOX-D03 `foxDialogueBus` + `wardrobeDialogues.ts` | Neutral fitting reactions only (`WARDROBE_OPENED`, `COSMETIC_PREVIEWED`, `COSMETIC_REMOVED`, `OUTFIT_RESET`). |

## 3. Future Integration Readiness
When Backend introduces Shop/Inventory/Equipment endpoints:
1. Hydrate `persistedCosmetics` in `CompanionProvider` from verified server equipment response.
2. Bind Shop prices, unlock levels, and owned states to authoritative catalog/inventory queries.
3. Enable Purchase & Equip mutations only after confirmed server responses, invalidating `['today']` (Coin balance) and inventory queries on success.
