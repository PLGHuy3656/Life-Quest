# FE-01 API Integration Matrix

- **Base Commit (`origin/develop`):** `f9db2e1f6307918b58e67b1f7d7be97b5d3b64f6`
- **Frontend Branch:** `feature/tv4-frontend`
- **API Base Config:** `VITE_API_BASE_URL` (default `/api/v1`, Vite dev proxy to `http://localhost:3000`)

---

## Frontend Component → Backend Endpoint → Data Contract → Status

| Frontend Component / Hook | Backend Endpoint | Typed Contract (`src/types/domain.ts`) | Integration Mode (FE-01) | Notes |
|---|---|---|---|---|
| `HeroSection` / `useUserMeQuery` | `GET /api/v1/users/me` | `UserMe` (`profile.displayName`, `username`, `profile.title`) | **LIVE** (when authenticated) / **MOCK** (hybrid unauth preview) | Neutral fallback `'Bạn'` replaces hardcoded personal name. |
| `HeroSection` / `useTodayQuery` | `GET /api/v1/today` | `TodayData` (`summary`, `gamification`, `streak`, `schedules`, `executions`) | **LIVE** (when authenticated) / **MOCK** (hybrid unauth preview) | `streak.currentCount` is currently hardcoded `0` in `todayService.js`. |
| `PinnedBoard` / `useQuestsQuery` | `GET /api/v1/quests?status=ACTIVE` | `Quest[]` (`isPinned === true`, capped at 3 cards) | **LIVE** (when authenticated) / **MOCK** (hybrid unauth preview) | UI enforces 3-card cap matching Claude Canvas `Bảng ghim`. |
| `ManagePinsSheet` / `usePinQuestMutation` | `POST /api/v1/quests/:questId/pin`, `DELETE /api/v1/quests/:questId/pin` | `Quest` | **LIVE ONLY** | Never simulated when unauthenticated; requires real Bearer token. |
| `TodayFeed` / `useQuestsQuery` + `useTodayQuery` | `GET /api/v1/quests`, `GET /api/v1/today` | `Quest[]`, `TodayScheduleItem[]` | **LIVE** (when authenticated) / **MOCK** (hybrid unauth preview) | Displays scheduled times and XP rewards. |
| `TodayFeed` → "Hoàn thành" button | *(None on `develop`)* | `dashboardRepository.completeQuestExecution()` | **UNAVAILABLE** (`501 FEATURE_UNAVAILABLE`) | Backend `develop` has no QuestExecution completion endpoint yet; never faked. |
| `QuickCreateSheet` / `useCreateQuestMutation` | `POST /api/v1/quests` | `CreateQuestInput` → `Quest` | **LIVE ONLY** | Validates title `>= 3` chars (matches Joi); rejects with `401 AUTHENTICATION_REQUIRED` if unauthenticated. |
| `GoalsProgressPanel` / `useGoalsWithMilestonesQuery` | `GET /api/v1/goals`, `GET /api/v1/goals/:goalId/milestones` | `Goal[]`, `Milestone[]` | **LIVE** (when authenticated) / **MOCK** (hybrid unauth preview) | Computes milestone completion ratio directly from real `Milestone.status === 'COMPLETED'`. |
| `ApiStatusSheet` → Live Sign-In | `POST /api/v1/auth/login` | `LoginResponse` (`accessToken`, `refreshToken`, `user`) | **LIVE ONLY** | Allows testing live Backend connection with real user credentials; zero hardcoded tokens. |
| `authApi.forgotPassword` / `resetPassword` | `POST /api/v1/auth/forgot-password`, `/reset-password` | Stubbed `// TODO` on Backend | **UNAVAILABLE** (`501 FEATURE_UNAVAILABLE`) | Blocked on FE until Backend implements real email/token reset flow. |
| `SocialPreviewPanel` / `useSocialPreviewQuery` | *(Pending `origin/feature/friends-and-social`)* | `SocialPreviewItem[]` | **MOCK PREVIEW** | Explicitly badged `MOCK PREVIEW`; awaits merge of `feature/friends-and-social` into `develop`. |
| `DashboardSheets` → Notifications | *(None on `develop`)* | — | **UNAVAILABLE** | Explicitly states Backend Notifications module is not yet implemented. |
| `MascotPlaceholder` | *(FE-03 Gate I WebGL Runtime)* | — | **PLACEHOLDER** | Preserves Claude Canvas geometry without loading WebGL in FE-01. |
