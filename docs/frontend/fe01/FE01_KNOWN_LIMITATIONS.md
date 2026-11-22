# FE-01 Known Limitations & Dependencies

## 1. Backend Dependencies (Coordinated with Khá)
1. **CORS Middleware Missing (`backend/src/app.js`):**
   - Dev environment mitigates this via Vite proxy (`/api -> http://localhost:3000`). Production/staging cross-origin deployments require `cors` middleware on Express.
2. **Quest Execution Completion Not Yet Implemented on `develop`:**
   - `QuestExecution` exists in Prisma, but there are no HTTP endpoints to start, update progress, or complete a quest execution and award XP/coins. FE-01 explicitly marks this `UNAVAILABLE`.
3. **Streak Counts Hardcoded to `0` (`todayService.js`):**
   - `GET /api/v1/today` returns `streak.currentCount = 0` and `streak.longestCount = 0`.
4. **Social, Friends & Mascot Backend Endpoints Unmerged:**
   - `origin/feature/friends-and-social` (`f8f4184`) is not yet rebased/merged into `origin/develop` (`f9db2e1`). `Social và nhật ký hành trình` remains explicitly tagged `MOCK PREVIEW`.
5. **Password Reset Stubbed (`authService.js`):**
   - `forgot-password` and `reset-password` are `// TODO` placeholders on Backend and are blocked as `UNAVAILABLE` in `authApi.ts`.

## 2. Intentional FE-01 Scope Boundaries
- **No 3D Mascot WebGL Runtime:** `MascotPlaceholder` reserves exact Claude Canvas layout geometry; Fox V2 Gate I (`mascot-v2-gate-i`) integration is scheduled for **FE-03**.
- **No Full Auth Pages / Route Guards:** `authApi.ts` and `authStore.ts` are implemented and testable via the `ApiStatusSheet`, while dedicated Login/Register/Onboarding pages are scheduled for **FE-02**.
- **Secondary Routes (`/work`, `/calendar`, `/messages`, `/wardrobe`, `/settings`):** Implemented as clean route shells so navigation works without 404s; full module views follow in **FE-02–FE-04**.

## 3. Local Repository Working Tree Note
- Switching from `feature/tv4-mascot-fox-v2` to `feature/tv4-frontend` left ignored local build caches (`node_modules/`, `dist/`, `public/models/`) under `mascot/fox-v2/07_WEB_PREVIEW/` (untracked on `develop` because `mascot/` is not on `develop`). These files are untouched and must NOT be staged on `feature/tv4-frontend`.
