# FE-02 Known Limitations & Backend Coordination Notes

## 1. Refresh-Token Persistence Security Trade-Off (Coordination with Khá)
- **Observation:** `backend/src/modules/auth/authController.js` returns `refreshToken` in the JSON body and expects `refreshToken` in the JSON body of `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout`. There are **0** cookie references in `backend/src`.
- **FE-02 Security Decision:** Both `accessToken` and `refreshToken` are stored **strictly in memory** (Zustand store, never written to `localStorage` or `sessionStorage`) to avoid XSS token exfiltration.
- **Limitation:** A full browser reload clears in-memory tokens and requires signing in again.
- **Recommended Backend Enhancement (Khá):** Issue `refreshToken` as an `HttpOnly; Secure; SameSite=Lax` cookie so the SPA can restore sessions across page reloads safely without exposing tokens to JS.

## 2. Backend Dependencies Carried Forward
1. **CORS Middleware Missing (`backend/src/app.js`):** Dev relies on Vite proxy (`/api -> http://localhost:3000`); production cross-origin deployments require `cors` middleware.
2. **Quest Execution Completion Missing on `develop`:** Calendar & Dashboard cannot complete scheduled quest occurrences yet (`UNAVAILABLE`).
3. **Streak Counts Hardcoded to `0` (`todayService.js`):** Real streak calculation awaits Backend implementation.
4. **Password Reset Stubbed (`authService.js`):** `forgot-password` / `reset-password` remain `UNAVAILABLE`.
5. **Social / Friends / Mascot Routes Unmerged:** `origin/feature/friends-and-social` awaits rebase & merge into `develop`.

## 3. Intentional FE-02 Scope Boundaries
- No Social/Messenger implementation (FE-04).
- No Three.js or Fox V2 3D runtime integration (FE-03).
- Pre-existing ignored `mascot/` build caches left from switching off `feature/tv4-mascot-fox-v2` remain untouched and unstaged.
