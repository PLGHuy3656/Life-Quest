# FE-01 Backend Gap Analysis & Coordination Notes

- **Audited Base:** `origin/develop` @ `f9db2e1f6307918b58e67b1f7d7be97b5d3b64f6`
- **Frontend Target:** Claude Canvas Dashboard (`Main.dc.html` + `App.dc.html`)

---

## 1. Summary of Backend Readiness

| Category | Count / Modules | FE-01 Handling |
|---|---|---|
| **Implemented & Usable (`LIVE`)** | `auth` (register/login/refresh/logout), `users` (me, settings), `today`, `goals`, `milestones`, `quests` (CRUD + pin/unpin/archive/restore), `schedules` | Typed API client + LIVE repositories wired to `/api/v1` |
| **Partially Implemented** | `GET /api/v1/today` (`streak.currentCount` & `streak.longestCount` hardcoded `0`); `POST /quests/:id/pin` (no server-side max-3 cap) | Consumed LIVE; UI enforces 3-pin display cap and notes streak limitation |
| **Placeholder / Stubbed (`UNAVAILABLE`)** | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` | Marked `UNAVAILABLE` — never simulated as successful |
| **Unmerged Remote Feature Branch** | `origin/feature/friends-and-social` (`friends`, `social`, `mascot` modules + `/api/v1` discovery) | Social preview & Mascot placeholder remain `MOCK` / placeholder in FE-01 until merged into `develop` |
| **Missing (Needed by Full Dashboard)** | Quest Executions (start/progress/complete/abandon), XP/Coin reward ledger, Streak calculation, Notifications, Challenges, Voice-to-Task AI parser | Marked `MOCK` (read-only preview) or `UNAVAILABLE` (mutations) |

---

## 2. Specific Gaps & Contract Inconsistencies to Coordinate with Khá

### High Priority (Blocks Live Browser Integration or Core Dashboard Loops)
1. **Missing CORS Middleware (`backend/src/app.js`):**
   - `app.js` only registers `express.json()`, `/api/v1`, and `errorHandler`. There is no `cors` middleware.
   - **Impact:** Browser requests from `http://localhost:5173` directly to `http://localhost:3000` will fail CORS preflight.
   - **FE-01 Mitigation:** Configured Vite dev proxy (`/api -> http://localhost:3000`) and `VITE_API_BASE_URL` (default `/api/v1` in dev).
   - **Ask for Khá:** Add `cors({ origin: process.env.CORS_ORIGINS, credentials: true })` to `backend/src/app.js`.

2. **Missing Quest Execution & Completion Endpoints:**
   - `QuestExecution` exists in `prisma/schema.prisma` and `GET /api/v1/today` reads it, but there are **no endpoints** to create/start/complete/skip/abandon an execution or award `xpReward`/`coinReward` into `UserGamification`.
   - **Impact:** Users cannot check off a quest on the Dashboard and see live XP/progress updates yet.
   - **FE-01 Handling:** Completion actions are explicitly marked `UNAVAILABLE` in Live mode (never faked as a successful backend write).

3. **Streak Calculation Hardcoded to `0` (`backend/src/modules/today/todayService.js:92-97`):**
   - `streak.currentCount` and `streak.longestCount` are always `0`.
   - **Ask for Khá:** Compute real streak from `QuestExecution` history (or dedicated `UserStreak` table).

4. **Merge `feature/friends-and-social` into `develop`:**
   - `origin/feature/friends-and-social` (`f8f4184`) contains `friends`, `social`, and `mascot` endpoints, plus `GET /api/v1` health check, but diverged before PR #21 (`auth`/`users`/`today`/`schedules`).
   - **Ask for Khá / Team:** Rebase `feature/friends-and-social` onto `develop`, apply `authenticate` middleware consistently, and merge so FE-03/FE-04 can consume live Social & Mascot APIs.

### Medium Priority (API Polish & Consistency)
5. **Pin Board Cap Enforcement (`questsService.pinQuest`):**
   - Claude Canvas `Bảng ghim` is designed for at most **3** pinned quests. Backend currently permits unlimited `isPinned: true` quests.
   - **Ask for Khá:** Confirm whether backend should enforce max 3 pinned quests (returning `409 PIN_LIMIT_REACHED`) or leave ordering/capping to the client.
6. **HTTP Status Code on Milestone Creation (`milestonesController.js:39`):**
   - `POST /api/v1/goals/:goalId/milestones` returns `200 OK` instead of `201 Created` (unlike `POST /goals`, `POST /quests`, `POST /schedules`).
7. **Prisma Relation Naming Typo (`prisma/schema.prisma:117`):**
   - `Goal` model defines relation `use User @relation(...)` instead of `user`. Internal to Prisma, no immediate JSON impact, but worth cleaning up before adding `include: { user: true }`.
8. **Password Reset Endpoints (`authService.js:210-221`):**
   - `forgot-password` and `reset-password` currently return `200 OK` without sending mail or updating hashes. Recommend returning `501 NOT_IMPLEMENTED` until wired to an email provider.
9. **Health Check Endpoint on `develop`:**
   - `GET /api/v1` discovery/health route exists on `feature/friends-and-social` but not yet on `develop`. Adding `GET /api/v1/health` on `develop` will simplify FE environment diagnostics.
