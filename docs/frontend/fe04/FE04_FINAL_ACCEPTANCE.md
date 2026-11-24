# FE-04 — Final Acceptance & Desktop Baseline Report

**Status:** OFFICIALLY APPROVED BY USER (Desktop Baseline Locked)
**Branch:** `fix/FE` → `origin/fix/FE`
**Date:** 2026-11-24

---

## 1. Explicit User Visual Approval & Scope

The user has visually reviewed and officially approved the complete **FE-04 Work Hub** Desktop implementation across `1024×900`, `1280×900`, `1440×900`, and `1920×1080`:

- **Shared AppShell & Rails:** Three-island Desktop Header (deduplicated), default-collapsed `PinnedTaskRail` with fox-paw toggle, compact `PlayerStatsRail` (Streak/Coin/Level from LIVE `GET /api/v1/today` or `—`), `FoxCompanionRail` with upward-opening `Task / Habit / Quest` Quick Create, cozy study-room prop hover dialogues (`scene.json`), and **Fox-free full-width exception exclusively on Quest Detail (`/work/quests/:questId`)**.
- **Task Page & Task Detail (`/work/tasks`, `/work/tasks/:taskId`, `/work/tasks/:taskId/focus`):**
  - Action-first deadline-aware Task list, Fox-paw pin stamps, sticky glass filter/search dock rendering results directly in center area.
  - Refined Task Detail with prominent Start/Deadline timing strip above fold, compact `Tập trung` clock button launching full-screen dark Focus Mode (`/work/tasks/:taskId/focus`) with Fox V2 `study_focus` animation + drift-free Zustand timer, and adaptive local Evidence Preview with `Nộp minh chứng` & `Đăng lên Social` honest `PENDING API` actions.
- **Habit Page & Floating Habit Detail Modal (`/work/habits`):**
  - Minimal single-row Habit cards with weekly dots (`T2–CN`), Fox-paw streak (`PawPrint`), synced `FoxPawPinButton` + chevron, sticky glass `Nhịp thói quen trong tuần` dock (`T2 23/11`–`CN 29/11`), and centered floating `HabitDetailModal` with 4-week calendar showing both weekday & date (`PROTOTYPE • PENDING API`).
- **Quest List & Quest Detail (`/work/quests`, `/work/quests/:questId`):**
  - Grand scenic vector-illustrated Quest cards (`QuestCoverArt`) with Task-derived progress bars and sticky glass search/filter dock.
  - Full-width Fox-free Quest Detail implementing **Quest → Epic → Task**: Compact Quest Overview → 2-column Hero (`QuestCheckpointMap` interactive SVG Epic map + `QuestNextActionPanel` above fold) → **Tasks Grouped by Epic** (deduplicated, Epic progress from verified completed Tasks, `+ Thêm Epic` & `+ Thêm Task` preselecting `goalId` + `milestoneId`) → `QuestMomentsGallery` (local preview + lightbox) → Collaborative Members & Invitations (`COLLAB PREVIEW • PENDING API`) → Discussion & Activity boundary → Read-only Rewards & Timestamps.

---

## 2. Work Hub Route Inventory

| Route | View | AppShell Mode | Backend Backing |
| --- | --- | --- | --- |
| `/work` | Redirect → `/work/tasks` | Shared 3-Region | — |
| `/work/tasks` | Action-first Task List | Shared 3-Region + Fox | **LIVE** (`GET/POST/PATCH/DELETE /quests`, `pin/unpin`, `archive/restore`) |
| `/work/tasks/:taskId` | Full Task Detail | Shared 3-Region + Fox | **LIVE** (`GET /quests/:id`) + Local Evidence (`PENDING Upload API`) |
| `/work/tasks/:taskId/focus` | Immersive Dark Focus Mode | Standalone (1 Fox WebGL) | Local Zustand Timer (no fake XP/completion) |
| `/work/habits` | Habit List + Floating Modal | Shared 3-Region + Fox | **PROTOTYPE • PENDING API** |
| `/work/quests` | Illustrated Quest List | Shared 3-Region + Fox | **LIVE** (`GET/POST /goals`) + Collab Preview Fixtures |
| `/work/quests/:questId` | Full Quest Detail (`Quest → Epic → Task`) | **Fox-Free Full-Width** | **LIVE** (`Goal` → `Milestone` → `Quest`) + Collab/Media `PENDING` |

---

## 3. Authoritative `Quest → Epic → Task` Backend Mapping (`schema.prisma`)

- **UI Quest** → `Goal` (`GET/POST/PATCH /goals`, `pause/resume/complete/archive`)
- **UI Epic** → `Milestone` under `Goal` (`GET/POST /goals/:id/milestones`, `PATCH/DELETE`, `complete`, `reorder`)
- **UI Task** → `Quest` (`goalId` + `milestoneId`)
- **Pending Backend Capabilities:** Habit CRUD/Check-in/Streak API, Task Execution Completion/XP Award API, Media Upload API, Social Publish & Quest Discussion API, Friendship & Collaborative Quest (`QuestMember`, `QuestInvitation`, `Quest.assigneeId`), and Goal Delete/Restore endpoints.

---

## 4. Final Quality Gates (All Verified PASS)

- `npm run typecheck` — **PASS** (`0` errors)
- `npm run lint` — **PASS** (`0` errors, `0` warnings)
- `npm run build` — **PASS** (`32` Gate I assets verified)
- `npm run test` — **PASS** (`17/17` test files, `73/73` tests)
- `npm run test:e2e` — **PASS** (`16/16` Playwright tests — zero Dashboard / Fox / AppShell / Work Hub regressions)
