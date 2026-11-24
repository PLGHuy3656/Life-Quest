# FE-04A.1 — Work Hub Architecture (Task / Habit / Quest)

**Repository:** `D:\Development\LifeQuest_Repo`
**Branch:** `fix/FE` (uncommitted — visual approval checkpoint)
**Scope:** Central Work Hub routes only. Shared 3-island Header, `PinnedTaskRail`, `FoxCompanionRail`, `FoxSpeechBubble`, and Social-First `DashboardPage` remain unchanged.

---

## 1. Navigation & Route Architecture

- **Main Header:** Preserves a **single** Work Hub entry (`Công việc` → `/work`, `end: false` in [DesktopHeader.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/DesktopHeader.tsx)). No additional header islands were added, and the active state highlights across all three sub-routes.
- **Route Map ([router.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/app/router.tsx)):**
  - `/work` → `<Navigate to="/work/tasks" replace />` (backward-compatible redirect)
  - `/work/tasks` → [WorkPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.tsx) (**Task** — atomic actionable items + `?task=<id>` cross-route detail sheet)
  - `/work/habits` → [HabitsPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/HabitsPage.tsx) (**Habit** — isolated visual prototype, `PROTOTYPE • PENDING API`)
  - `/work/quests` → [QuestsPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/QuestsPage.tsx) (**Quest** — multi-step progress-oriented journeys backed by `Goals + Milestones`)
- **Internal Switcher:** [WorkHubSwitcher.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkHubSwitcher.tsx) provides a compact 3-tab `<NavLink>` bar (`Task · Nhiệm vụ` | `Habit · Thói quen` | `Quest · Hành trình`) directly inside the center column.
- **No Mini Calendar:** Intentionally excluded from Work Hub because `/calendar` already provides the dedicated Calendar experience.
- **Shared AppShell Continuity:** Navigating across `/work/tasks`, `/work/habits`, and `/work/quests` keeps `AppShell`, `PinnedTaskRail`, and `FoxCompanionRail` mounted with `1` single Fox WebGL canvas.

---

## 2. Backend Domain Terminology Mapping (Verified against `backend/prisma/schema.prisma`)

| Work Hub View | Backend Entity & API | Capability Status | Honest FE-04A.1 Implementation |
| --- | --- | --- | --- |
| **Task** (`/work/tasks`) | `Quest` model (`/api/v1/quests/*`) | **LIVE** (CRUD, pin/unpin, archive/restore); Completion & Evidence Upload **UNAVAILABLE** | Compact Task list, filters (`Tất cả`, `Hôm nay`, `Sắp tới`, `Quá hạn`, `Hoàn thành`, `Lưu trữ`), search, sort, pin sync, `?task=<id>` `TaskDetailSheet` with honest disabled completion & `PENDING API` evidence boundary. |
| **Habit** (`/work/habits`) | **No `Habit` model or route exists** in Prisma or `routes/index.js` | **UNAVAILABLE / PENDING** | Isolated visual prototype labeled `PROTOTYPE • PENDING API`: weekly T2–CN planned rhythm card, habit cards with disabled `Check-in` buttons, `Streak: PENDING` — zero fabricated check-in completions, streaks, or rewards. |
| **Quest** (`/work/quests`) | `Goal` + `Milestone` models (`/api/v1/goals/*`, `/api/v1/milestones/*`) | **LIVE** (Goal CRUD, pause/resume/complete/archive; Milestone CRUD, complete, reorder) | Progress-oriented Quest journey cards computing real milestone completion (`completed / total` %), status filters (`Tất cả`, `Đang thực hiện`, `Sắp tới`, `Hoàn thành`, `Tạm dừng / Hết hạn`), linked task count, and accessible Quest Detail Sheet with full milestone management. |
