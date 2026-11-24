# FE-04A.1 — Visual Comparison & QA Report

**Branch:** `fix/FE` (uncommitted — awaiting visual approval)

---

## 1. Design Parity: Claude Canvas vs FE-04A vs FE-04A.1

| Aspect | Claude Canvas Reference | FE-04A (Before) | FE-04A.1 (After) |
| --- | --- | --- | --- |
| Work Hub IA | Separate Task / Habit / Quest experiences | Single page with 2 tabs (`Nhiệm vụ` / `Mục tiêu`) | **3 dedicated routes** (`/work/tasks`, `/work/habits`, `/work/quests`) under 1 Header entry + compact switcher |
| Mini Calendar | Present in Work Hub | Removed (dedicated `/calendar` exists) | **Removed** (preserved decision) |
| Shared AppShell | Different sidebar/header | Approved 3-island Header + `PinnedTaskRail` + `FoxCompanionRail` | **100% preserved** across all 3 Work Hub routes (`1` Fox canvas) |
| Habit View | Weekly rhythm + habit cards | Missing | **Isolated visual prototype** (`PROTOTYPE • PENDING API`), T2–CN planned rhythm, disabled check-ins, zero fake streaks |
| Quest View | Progress-oriented Quest cards | Flat Goal/Milestone split cards | **Progress-oriented Quest journey cards** with real Milestone `%` bars + Quest Detail Sheet |
| Pinned → Detail | Clicking pinned item opens detail | Static non-clickable `<article>` | **Fixed:** Clicking pinned item from any route opens `/work/tasks?task=<id>` `TaskDetailSheet` |

---

## 2. Visual QA Screenshots (After FE-04A.1 Refinement)

- **Task (`1440×900`):** [fe04a1_task_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_task_1440x900.png)
- **Habit Prototype (`1440×900`):** [fe04a1_habit_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_habit_1440x900.png)
- **Quest Journeys (`1440×900`):** [fe04a1_quest_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_quest_1440x900.png)
- **Pinned Task → Detail Sheet (`1440×900`):** [fe04a1_pinned_detail_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_pinned_detail_1440x900.png)
- **Task (`1024×900`):** [fe04a1_task_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_task_1024x900.png)
- **Task (`1280×900`):** [fe04a1_task_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_task_1280x900.png)
- **Task (`1920×1080`):** [fe04a1_task_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a1_task_1920x1080.png)

**Before (FE-04A baseline for comparison):** [fe04a_work_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_1440x900.png)

---

## 3. Desktop Geometry & Verification Summary

- **Horizontal overflow:** `0px` across `1024×900`, `1280×900`, `1440×900`, `1920×1080` on Task, Habit, and Quest views.
- **Fox WebGL canvas count:** Strictly `1` across all Work Hub route transitions.
- **No title overlap or awkward truncation:** CTA button aligned inline with heading; Habit `Check-in` button & `LỊCH DỰ KIẾN` badge stay single-line (`white-space: nowrap`).
- **Remaining Backend-deferred limitations:**
  1. Task completion / XP awarding / streak updates (`Execution API` PENDING).
  2. Task proof image upload (`Media Upload API` PENDING).
  3. Live Habit CRUD, daily check-in, and streak persistence (`Habit API` PENDING).
  4. Restore `<ProtectedRoute>` on `/work/*` once visual review is complete and Backend auth testing is ready.
