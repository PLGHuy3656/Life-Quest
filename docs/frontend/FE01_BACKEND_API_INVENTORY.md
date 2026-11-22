# FE-01 Backend API Inventory

- **Repository:** `D:\Development\LifeQuest_Repo`
- **Audited Base Commit (`origin/develop`):** `f9db2e1f6307918b58e67b1f7d7be97b5d3b64f6` (PR #21 `create_auth_user`)
- **Frontend Branch:** `feature/tv4-frontend` (branched from `f9db2e1`)
- **API Base Path:** `/api/v1` (Express server on port `3000` in `backend/src/server.js`)
- **Standard Success Envelope:** `{ "success": true, "data": <payload> }`
- **Standard Error Envelope (`backend/src/common/errors/errorHandler.js`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message"
    }
  }
  ```
- **Authentication Middleware (`backend/src/common/middleware/authenticate.js`):**
  - Header: `Authorization: Bearer <accessToken>`
  - Populates `req.user = { id, email, username, status }`
  - Auth error codes: `401 AUTHENTICATION_REQUIRED`, `401 TOKEN_EXPIRED`, `401 INVALID_TOKEN`
- **Validation Middleware (`backend/src/common/middleware/validate.js`):**
  - Uses Joi across `{ body, params, query }`; failures return `400 VALIDATION_ERROR`.

---

## 1. Auth Module (`/api/v1/auth`)

Source: `backend/src/modules/auth/{authRoute,authController,authService,authValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create user + profile + settings + gamification | Public | Body: `{ email, username (3..50), password (8..72) }` | `201`: `{ id, email, username, status, createdAt }` | `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`, `409 USERNAME_ALREADY_EXISTS` | Implemented | Ready (FE-02 Auth UI) |
| `POST` | `/api/v1/auth/login` | Authenticate & create refresh session | Public | Body: `{ email, password }`, optional header `x-device-id` | `200`: `{ accessToken, refreshToken, user: { id, email, username, status } }` | `401 INVALID_CREDENTIALS`, `403 ACCOUNT_BANNED` | Implemented | Ready (Typed adapter in FE-01) |
| `POST` | `/api/v1/auth/refresh` | Issue new access token from refresh token | Public | Body: `{ refreshToken }` | `200`: `{ accessToken }` | `401 TOKEN_EXPIRED`, `401 INVALID_TOKEN`, `401 SESSION_INVALID`, `403 ACCOUNT_BANNED` | Implemented | Ready (Client refresh hook) |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session | Bearer JWT | Body: `{ refreshToken }` | `200`: `{ message: "Logged out successfully" }` | `401 INVALID_TOKEN` | Implemented | Ready |
| `POST` | `/api/v1/auth/forgot-password` | Password reset request | Public | Body: `{ email }` | `200`: `{ message }` (no email sent) | `400 VALIDATION_ERROR` | **Placeholder (`TODO`)** | **UNAVAILABLE** — do not simulate success |
| `POST` | `/api/v1/auth/reset-password` | Password reset confirmation | Public | Body: `{ token, newPassword (8..72) }` | `200`: `{ message }` (no DB write) | `400 VALIDATION_ERROR` | **Placeholder (`TODO`)** | **UNAVAILABLE** — do not simulate success |

---

## 2. Users Module (`/api/v1/users`)

Source: `backend/src/modules/users/{usersRoute,usersController,usersService,usersValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/users/me` | Fetch current user + `profile` (`displayName`, `bio`, `title`) | Bearer JWT | None | `200`: `{ id, email, username, status, emailVerifiedAt, lastLoginAt, createdAt, updatedAt, profile }` | `401`, `404 USER_NOT_FOUND` | Implemented | **LIVE in FE-01** |
| `PATCH` | `/api/v1/users/me` | Update `displayName`, `bio`, `title` | Bearer JWT | Body (min 1): `{ displayName?, bio?, title? }` | `200`: `UserProfile` | `400 VALIDATION_ERROR`, `404 USER_NOT_FOUND` | Implemented | Typed in FE-01 |
| `GET` | `/api/v1/users/me/settings` | Fetch user settings (`timezone`, `language`, `privacyMode`, `notificationEnabled`) | Bearer JWT | None | `200`: `UserSettings` | `401`, `404 SETTINGS_NOT_FOUND` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/users/me/settings` | Update user settings | Bearer JWT | Body (min 1): `{ timezone?, language?, privacyMode?: 'PUBLIC'\|'FRIENDS'\|'PRIVATE', notificationEnabled? }` | `200`: `UserSettings` | `400 VALIDATION_ERROR`, `404 SETTINGS_NOT_FOUND` | Implemented | Typed in FE-01 |
| `GET` | `/api/v1/users/:userId` | Public profile of another user | Public | Params: `{ userId: uuid }` | `200`: Public user summary | `400 VALIDATION_ERROR`, `404 USER_NOT_FOUND` | Implemented | Ready (Social/FE-04) |

---

## 3. Today Module (`/api/v1/today`)

Source: `backend/src/modules/today/{todayRoute,todayController,todayService,todayValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Query | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/today` | Aggregated daily Dashboard payload | Bearer JWT | Query: `{ date?: 'YYYY-MM-DD' }` | `200`: `{ date, timezone, summary: { totalTasks, completedTasks, completionRatePercentage, totalFocusDurationSeconds }, executions: QuestExecution[], schedules: TodayScheduleItem[], streak: { currentCount, longestCount, isQualifiedToday, lastQualifiedDate }, gamification: { totalXp, level, coinBalance } }` | `400 VALIDATION_ERROR`, `401` | Implemented (`streak` counts currently hardcoded `0`) | **LIVE in FE-01** |

---

## 4. Goals Module (`/api/v1/goals`)

Source: `backend/src/modules/goals/{goalsRoute,goalsController,goalsService,goalsValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/goals` | List current user's goals | Bearer JWT | None | `200`: `Goal[]` | `401` | Implemented | **LIVE in FE-01** |
| `POST` | `/api/v1/goals` | Create a goal | Bearer JWT | Body: `{ title (3..100), description?, startDate (ISO), dueDate (ISO > startDate) }` | `201`: `Goal` | `400 VALIDATION_ERROR`, `401` | Implemented | Typed in FE-01 |
| `GET` | `/api/v1/goals/:goalId` | Get goal detail | Bearer JWT | Params: `{ goalId: uuid }` | `200`: `Goal` | `403`, `404` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/goals/:goalId` | Update goal fields | Bearer JWT | Params: `{ goalId }`, Body (min 1): `{ title?, description?, startDate?, dueDate? }` | `200`: `Goal` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/goals/:goalId/pause` | Transition goal to `PAUSED` | Bearer JWT | Params: `{ goalId }` | `200`: `Goal` | `403`, `404`, `409` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/goals/:goalId/resume` | Transition goal back to `ACTIVE` | Bearer JWT | Params: `{ goalId }` | `200`: `Goal` | `403`, `404`, `409` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/goals/:goalId/complete` | Mark goal `COMPLETED` | Bearer JWT | Params: `{ goalId }` | `200`: `Goal` | `403`, `404`, `409` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/goals/:goalId/archive` | Soft-archive goal | Bearer JWT | Params: `{ goalId }` | `200`: `Goal` | `403`, `404`, `409` | Implemented | Typed in FE-01 |

---

## 5. Milestones Module (`/api/v1/goals/:goalId/milestones` & `/api/v1/milestones`)

Source: `backend/src/modules/milestones/{milestonesRoute,milestonesController,milestonesService,milestonesValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/goals/:goalId/milestones` | List milestones for a goal | Bearer JWT | Params: `{ goalId: uuid }` | `200`: `Milestone[]` | `403`, `404` | Implemented | **LIVE in FE-01** |
| `POST` | `/api/v1/goals/:goalId/milestones` | Create milestone under goal | Bearer JWT | Params: `{ goalId }`, Body: `{ title (1..255), description? }` | `200` *(note: not 201)*: `Milestone` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/goals/:goalId/milestones/reorder` | Reorder milestones atomically | Bearer JWT | Params: `{ goalId }`, Body: `{ milestoneIds: uuid[] (unique) }` | `200`: `Milestone[]` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `GET` | `/api/v1/milestones/:milestoneId` | Get milestone detail | Bearer JWT | Params: `{ milestoneId: uuid }` | `200`: `Milestone` | `403`, `404` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/milestones/:milestoneId` | Update milestone | Bearer JWT | Params: `{ milestoneId }`, Body (min 1): `{ title?, description? }` | `200`: `Milestone` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `DELETE` | `/api/v1/milestones/:milestoneId` | Soft-delete milestone | Bearer JWT | Params: `{ milestoneId }` | `200`: `Milestone` | `403`, `404` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/milestones/:milestoneId/complete` | Mark milestone `COMPLETED` | Bearer JWT | Params: `{ milestoneId }` | `200`: `Milestone` | `403`, `404`, `409` | Implemented | Typed in FE-01 |

---

## 6. Quests Module (`/api/v1/quests`)

Source: `backend/src/modules/quests/{questsRoute,questsController,questsService,questsValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Query / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/quests` | List user quests with filters | Bearer JWT | Query: `{ status?: 'ACTIVE'\|'ARCHIVED', goalId?, milestoneId?, search? }` | `200`: `Quest[]` | `400`, `401` | Implemented | **LIVE in FE-01** |
| `POST` | `/api/v1/quests` | Create a quest | Bearer JWT | Body: `{ title (3..100), description?, goalId?, milestoneId?, type?, priority?, proofRequirement?, targetValue?, targetUnit?, estimatedDurationSeconds?, startAt?, dueAt? }` | `201`: `Quest` | `400 MILESTONE_REQUIRES_GOAL / MILESTONE_GOAL_MISMATCH / GOAL_CANNOT_CREATE_QUEST`, `403`, `404` | Implemented | **LIVE in FE-01** |
| `GET` | `/api/v1/quests/:questId` | Get quest by ID | Bearer JWT | Params: `{ questId: uuid }` | `200`: `Quest` | `403 QUEST_ACCESS_DENIED`, `404 QUEST_NOT_FOUND` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/quests/:questId` | Update active quest | Bearer JWT | Params: `{ questId }`, Body (min 1): quest fields | `200`: `Quest` | `400`, `403`, `404`, `409 QUEST_CANNOT_UPDATE` | Implemented | Typed in FE-01 |
| `DELETE` | `/api/v1/quests/:questId` | Soft-delete quest | Bearer JWT | Params: `{ questId }` | `200`: `Quest` | `403`, `404` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/quests/:questId/pin` | Pin quest to Pinned Board | Bearer JWT | Params: `{ questId }` | `200`: `Quest` (`isPinned: true`) | `403`, `404`, `409 QUEST_ALREADY_PINNED / QUEST_CANNOT_PIN` | Implemented | **LIVE in FE-01** |
| `DELETE` | `/api/v1/quests/:questId/pin` | Unpin quest | Bearer JWT | Params: `{ questId }` | `200`: `Quest` (`isPinned: false`) | `403`, `404`, `409 QUEST_NOT_PINNED` | Implemented | **LIVE in FE-01** |
| `POST` | `/api/v1/quests/:questId/archive` | Archive quest | Bearer JWT | Params: `{ questId }` | `200`: `Quest` | `403`, `404`, `409 QUEST_ALREADY_ARCHIVED` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/quests/:questId/restore` | Restore archived quest | Bearer JWT | Params: `{ questId }` | `200`: `Quest` | `403`, `404`, `409 QUEST_NOT_ARCHIVED` | Implemented | Typed in FE-01 |

---

## 7. Schedules Module (`/api/v1/quests/:questId/schedules` & `/api/v1/schedules`)

Source: `backend/src/modules/schedules/{schedulesRoute,schedulesController,schedulesService,schedulesValidation}.js`

| Method | Path | Purpose | Auth | Request Params / Query / Body | Response (`data`) | Key Errors | Status | Integration Readiness |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/quests/:questId/schedules` | List schedules for a quest | Bearer JWT | Params: `{ questId }`, Query: `{ isActive?: boolean }` | `200`: `QuestSchedule[]` | `403`, `404` | Implemented | Typed in FE-01 |
| `POST` | `/api/v1/quests/:questId/schedules` | Attach ONE_TIME or RECURRING schedule | Bearer JWT | Params: `{ questId }`, Body: `{ scheduleType, timezone, startAt, endAt?, recurrenceRule? }` | `201`: `QuestSchedule` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `PATCH` | `/api/v1/schedules/:scheduleId` | Update schedule | Bearer JWT | Params: `{ scheduleId }`, Body (min 1) | `200`: `QuestSchedule` | `400`, `403`, `404` | Implemented | Typed in FE-01 |
| `DELETE` | `/api/v1/schedules/:scheduleId` | Deactivate schedule (`isActive: false`) | Bearer JWT | Params: `{ scheduleId }` | `200`: `{ id, isActive, message }` | `403`, `404` | Implemented | Typed in FE-01 |

---

## 8. Unmerged Remote Backend Branch (`origin/feature/friends-and-social`, HEAD `f8f4184`)

**Not merged into `origin/develop` (`f9db2e1`) — NOT available on `feature/tv4-frontend` yet:**
- `GET /api/v1` (Health Check & Discovery)
- Friends module (`/friends`, `/friends/search`, `/friend-requests`, ...)
- Social module (`/feed`, `/posts`, `/pokes`, ...)
- Mascot backend module (`/mascot/models`, `/mascot/state`, `/mascot/cosmetics`, `/mascot/actions`)
- Note: `origin/feature/friends-and-social` diverged before PR #21 (`auth`, `users`, `schedules`, `today`), so it requires rebase/merge into `develop` by the Backend team before FE can integrate live social/mascot endpoints.
