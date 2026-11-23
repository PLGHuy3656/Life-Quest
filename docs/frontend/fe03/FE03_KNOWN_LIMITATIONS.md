# FE-03 Known Limitations & Dependencies

## 1. Backend Dependencies
1. **Wardrobe Persistence (`origin/feature/friends-and-social` unmerged):**
   - Backend `develop` (`f9db2e1`) does not yet include `/api/v1/mascot/state`, `/mascot/cosmetics`, or cosmetic unlock/purchase endpoints. Wardrobe equipping in FE-03 is explicitly **PREVIEW ONLY** and does not claim persistence or purchases.
2. **Voice ASR / AI Task Parsing Not Implemented:**
   - No speech-to-text or AI intent extraction service exists on Backend yet. `VoiceAssistantSheet` is explicitly labeled `DEMO / ASR UNAVAILABLE`; `TASK_CREATED` only fires after real `POST /api/v1/quests` persistence.
3. **XP / Streak Reactions:**
   - Real XP award and streak calculations still await Backend QuestExecution endpoints and `todayService.js` streak computation.

## 2. Testing & Runtime Environment Notes
- Automated Playwright E2E runs on **headless Chromium** (software/SwiftShader WebGL or `?nowebgl=1` fallback). Native desktop/mobile GPU frame-rate benchmarks are **not** claimed from headless Chromium runs.
- The documented Gate I `f_fallback` timing exception from `KNOWN_LIMITATIONS_GATE_I.md` remains preserved and unchanged in the upstream mascot baseline.
- `npm run assets` requires Git + Git LFS objects for `mascot-v2-gate-i` (or `FOX_V2_ASSETS_DIR` pointing to an extracted Gate I archive).
