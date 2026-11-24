# FE-W01 — Fox V2 Wardrobe & Cosmetic Shop Architecture

## 1. Overview
FE-W01 upgrades `/wardrobe` and adds `/wardrobe/shop` into a Claude-inspired split **Fox V2 Dressing Room & Cosmetic Shop** built directly on top of the approved Gate I Fox V2 runtime (`FoxController`, `FoxCosmeticManager`, `COSMETIC_CATALOG`, `OUTFIT_LIBRARY`) without modifying any immutable Gate I SDK or GLB files.

## 2. Single-WebGL-Canvas AppShell Exception
- **Routes:** `<Route path="/wardrobe/*" element={<WardrobePage />} />` in [router.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/app/router.tsx) serves both `/wardrobe` (Wardrobe inventory) and `/wardrobe/shop` (Cosmetic Shop) inside one mounted page tree so switching between Wardrobe and Shop **never remounts WebGL**.
- **Companion Rail Exception:** In [AppShell.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/AppShell.tsx), `isWardrobeRoute` (`location.pathname === '/wardrobe' || location.pathname.startsWith('/wardrobe/')`) hides `FoxCompanionRail` on the right while preserving:
  - Three-Island `DesktopHeader` (reusing the existing `Tủ đồ Fox` navigation entry; no duplicate header icon)
  - Collapsed `PinnedTaskRail` + compact `PlayerStatsRail` (`leftRailTop = 92px`, `0px` alignment delta)
  - `FloatingMascotDock` (Voice Assistant)
  - Exactly **1** active WebGL `<canvas>` rendered inside [WardrobeDressingRoom.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/wardrobe/WardrobeDressingRoom.tsx)
- **Preserved Fox-Free & Standard Routes:** `/calendar` and `/work/quests/:questId` remain strictly Fox-free (`0` canvases). Returning from `/wardrobe` to `/`, `/work`, or `/messages` restores `FoxCompanionRail` cleanly with persisted `useUiStore` collapse state and Quick Create draft.

## 3. Preview State vs Persisted Equipment State
In [CompanionProvider.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/CompanionProvider.tsx), cosmetic state is strictly partitioned:
- `persistedCosmetics` (`EQUIPPED_STATE`): Confirmed server-persisted outfit. Currently `{}` (Fox V2 built-in default red scarf + default backpack) with `equipmentPersistenceStatus: 'PENDING_API'` until Backend merges Equipment/Inventory endpoints.
- `previewCosmetics` (`PREVIEW_STATE`): Temporary local-only try-on map keyed by `CosmeticSlot`. Equipping an item replaces only its own slot without disturbing unrelated slots.
- `equippedCosmetics`: Merged visual appearance (`{ ...persistedCosmetics, ...previewCosmetics }`) fed to `FoxCosmeticManager.setOutfit(...)` so Fox V2 reflects live try-on selections across the Dressing Room.
- `hasUnsavedPreview` & `restoreEquippedOutfit()`: Clearly surface unsaved preview badges (`Đang xem trước (N)`) and allow instant 1-click restoration to the confirmed default appearance.

## 4. 3D Dressing Room Controls & Fallback
- [FoxCanvas.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/FoxCanvas.tsx) adds an optional `cameraCommand` prop (`front`, `back`, `zoomIn`, `zoomOut`, `reset`) operating on the existing `OrbitControls` instance and hero framing (`0.68` distance multiplier for `orbit && presentation === 'full'`).
- Supports 360° drag rotation, front/back inspection (for backpacks, capelets, and scrolls), controlled zoom, reset camera, reduced motion (`lq-rm`), and graceful `<FoxFallback />` when WebGL is unavailable (`?nowebgl=1`).

## 5. Contextual Fox Dialogue (FOX-D03)
- Added neutral wardrobe events (`WARDROBE_OPENED`, `COSMETIC_PREVIEWED`, `COSMETIC_REMOVED`, `OUTFIT_RESET`) in [types.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/types.ts) and [wardrobeDialogues.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/wardrobeDialogues.ts), loaded via [catalogLoader.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/mascot/dialogue/catalogLoader.ts).
- `<FoxSpeechBubble>` renders overhead on the Wardrobe dressing room stage and strictly avoids implying that any purchase or server save occurred.
