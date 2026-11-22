# FE-02 API Integration Matrix

- **Audited Backend Base (`origin/develop`):** `f9db2e1f6307918b58e67b1f7d7be97b5d3b64f6`
- **All FE-02 workflows below are strictly LIVE (no silent mock fallback).**

| Feature / Page | Backend Endpoint | Typed Client Method | Status |
|---|---|---|---|
| Login (`/login`) | `POST /api/v1/auth/login` | `authApi.login` | **LIVE** |
| Register (`/register`) | `POST /api/v1/auth/register` | `authApi.register` | **LIVE** |
| Single-Flight Token Refresh | `POST /api/v1/auth/refresh` | `httpClient.performSingleFlightRefresh` | **LIVE** |
| Logout (`AppShell` / `/settings`) | `POST /api/v1/auth/logout` | `authApi.logout` | **LIVE** |
| Forgot / Reset Password | `POST /api/v1/auth/{forgot,reset}-password` | `authApi.forgotPassword` | **UNAVAILABLE** (Backend TODO stub) |
| Work Hub — Goals | `GET/POST /api/v1/goals`, `GET/PATCH /api/v1/goals/:id`, `POST /api/v1/goals/:id/{pause,resume,complete,archive}` | `goalsApi.*` | **LIVE** |
| Work Hub — Milestones | `GET/POST /api/v1/goals/:id/milestones`, `PATCH /api/v1/goals/:id/milestones/reorder`, `PATCH/DELETE /api/v1/milestones/:id`, `POST /api/v1/milestones/:id/complete` | `milestonesApi.*` | **LIVE** |
| Work Hub — Quests | `GET/POST /api/v1/quests`, `PATCH/DELETE /api/v1/quests/:id`, `POST/DELETE /api/v1/quests/:id/pin`, `POST /api/v1/quests/:id/{archive,restore}` | `questsApi.*` | **LIVE** |
| Calendar — Daily View | `GET /api/v1/today?date=YYYY-MM-DD` | `todayApi.getToday` | **LIVE** |
| Calendar — Quest Schedules | `GET/POST /api/v1/quests/:id/schedules`, `PATCH/DELETE /api/v1/schedules/:id` | `schedulesApi.*` | **LIVE** |
| Calendar — Occurrence Completion | *(Not implemented on `develop`)* | — | **UNAVAILABLE** (labeled `Chờ Execution API`) |
| Profile (`/settings`) | `GET/PATCH /api/v1/users/me` | `usersApi.getMe`, `usersApi.updateMe` | **LIVE** |
| User Settings (`/settings`) | `GET/PATCH /api/v1/users/me/settings` | `usersApi.getMySettings`, `usersApi.updateMySettings` | **LIVE** |
