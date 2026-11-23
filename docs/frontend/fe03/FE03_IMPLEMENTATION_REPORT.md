# FE-03 Fox V2 Mascot Integration — Implementation Report

## 1. Baseline & Source Synchronization
- **Branch:** `feature/tv4-frontend` (FE-02 commit `e150df069897edccab9c14d35830aeb4698990fd`)
- **Approved Mascot Source:** Git tag `mascot-v2-gate-i` (`812160dff9fd37d786bc7e07fb3873d116c077fb`)
- **SDK Reuse:** Synced all 34 verbatim Gate I runtime files (`src/mascot/**`) directly from `mascot-v2-gate-i` without rewriting the animation, cosmetic, or VFX engine.
- **3D Dependencies:** Installed exact Gate I compatible versions (`@react-three/fiber@8.17.14`, `three@0.170.0`, `@types/three@0.170.0`) on React `18.3.1` + Vite `5.4.21`.

## 2. Reproducible Asset Pipeline (Phase 1)
- Implemented `front-end/scripts/sync-mascot-assets.mjs` (`npm run assets`, wired to `predev` and `prebuild`).
- Extracts all **32** approved runtime assets (base E2 GLB, 4 animation-only module GLBs, 20 H1/H2 cosmetic GLBs, 6 reference JSON manifests, and `fox_poster.png`) directly from `git tag mascot-v2-gate-i` via `git show` + `git lfs smudge`.
- Verifies **32/32** SHA-256 checksums against `09_DOCS/GATE_I_FINAL_SHA256SUMS.txt` and writes `public/models/assets.lock.json`.
- `public/models/` and `public/fox_poster.png` are gitignored so zero duplicate binaries enter Git history.

## 3. React Integration Layer (Phase 2)
- `src/features/mascot/CompanionProvider.tsx`: App-level companion state, `FoxController` registry, preview cosmetics state, Gate I voice phase state, and automatic sync with `useUiStore(s => s.reducedMotion)` (`html.lq-rm`).
- `src/features/mascot/FoxCompanionView.tsx`: Lazy-loaded `React.lazy` + `Suspense` boundary splitting Three.js / R3F out of the main app bundle.
- `src/features/mascot/FoxCanvas.tsx`: Single active WebGL renderer per route, `webglcontextlost` / `webglcontextrestored` handling, `FoxController.dispose()` + `FoxRenderBinding.release()` cleanup, and `CanvasErrorBoundary` isolating mascot failures from the Dashboard.
- `src/features/mascot/FoxFallback.tsx`: Accessible fallback (`webgl`, `context-lost`, `load`) with static `fox_poster.png` and retry button.
- `src/features/mascot/MascotEventAdapter.tsx`: Bridges real local-time greeting and authoritative `level` from LIVE `GET /api/v1/today`.
- `src/features/mascot/FloatingMascotDock.tsx`: Non-blocking Voice Assistant dock launcher.

## 4. Dashboard, Wardrobe & Voice Assistant (Phases 3–5)
- **Dashboard (`HeroSection.tsx`):** Replaced `MascotPlaceholder` with `<FoxCompanionView presentation="card" />`, preserving Claude Canvas layout and responsiveness.
- **Wardrobe (`/wardrobe`, `WardrobePage.tsx`):** Browses approved H1/H2 cosmetic catalog (`COSMETIC_CATALOG`), slot filtering, 6 H2 outfit presets (`OUTFIT_LIBRARY`), interactive 3D preview (`orbit`), Reset to base, and explicit `PREVIEW ONLY` labeling.
- **Voice Assistant (`VoiceAssistantSheet.tsx`):** Implements Gate I voice state machine (`FOX_I_VOICE_EVENT_CONTRACT.md`), explicit `DEMO / ASR UNAVAILABLE` notice, explicit mic permission handling (`VOICE_PERMISSION_DENIED`), and strict `TASK_CREATED` gate firing ONLY after real `POST /api/v1/quests` success.
