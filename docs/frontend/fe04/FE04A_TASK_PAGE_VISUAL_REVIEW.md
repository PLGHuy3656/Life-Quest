# FE-04A — Task Page Visual Review (Desktop QA)

**Branch:** `fix/FE` (uncommitted — awaiting visual approval per FE-04A Git boundary)
**Scope:** Central `/work` route visual foundation only. Shared `AppShell` (`DesktopHeader`, `PinnedTaskRail`, `FoxCompanionRail`, `FoxSpeechBubble`) and Social-First `DashboardPage` remain unchanged.

---

## 1. Visual Design Highlights

- **Palette & Typography:** Warm `#F5F3EE` canvas, `#FFFFFF` rounded cards (`16px–18px`), `#16324A` navy headings, `#F26B3A` orange accent, `#168C78` teal secondary, `#F6C85F` reward yellow, `Plus Jakarta Sans`.
- **Task-First Above the Fold:** Replaced tall KPI cards with a single compact summary strip (`Hôm nay`, `Quá hạn`, `Đang ghim: X/3`, `Tổng đang mở`) and a single-row 6-pill filter bar (`Tất cả`, `Hôm nay`, `Sắp tới`, `Quá hạn`, `Hoàn thành`, `Lưu trữ`) + 1-row search/goal/sort bar. All 4 sample task cards render cleanly above the fold across every tested desktop viewport.
- **Honest Capability Boundaries:**
  - Task completion button uses a clearly disabled dashed check ring with tooltip & `PENDING` explanation in `TaskDetailSheet` (no fake completion or fake XP/coin awarding).
  - Evidence area displays verified `proofRequirement` (`Không cần` / `Tùy chọn` / `Bắt buộc`) alongside a `PENDING API` boundary box without unverified file upload.
- **Non-Destructive Task Detail Sheet:** Opening a task renders an accessible `Sheet` modal/drawer (`Escape` dismissible, focusable) without permanently narrowing the center column.
- **Preserved Secondary Tab:** `Mục tiêu` tab retains all verified Goal and Milestone CRUD, lifecycle, and reorder actions.

---

## 2. Measured Desktop Geometry (4 Viewports)

| Viewport | Horizontal Overflow | Shared Fox Canvas Count | Pinned Rail Right → Center Left (Gap) | Center Width | Center Right → Fox Left (Gap) | Task List Top (`px`) | Cards Above Fold |
| --- | ---: | ---: | --- | ---: | --- | ---: | ---: |
| `1024×900` | `0px` | `1` | `68px → 84px` (`16px`) | `592px` | `676px → 692px` (`16px`) | `425px` | `4 / 4` |
| `1280×900` | `0px` | `1` | `276px → 292px` (`16px`) | `584px` | `876px → 892px` (`16px`) | `381px` | `4 / 4` |
| `1440×900` | `0px` | `1` | `356px → 372px` (`16px`) | `584px` | `956px → 972px` (`16px`) | `381px` | `4 / 4` |
| `1920×1080` | `0px` | `1` | `596px → 612px` (`16px`) | `584px` | `1196px → 1212px` (`16px`) | `381px` | `4 / 4` |

---

## 3. Visual QA Screenshots

- **1024×900 (Pinned Rail auto-collapsed):** [fe04a_work_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_1024x900.png)
- **1280×900 (Full 3-region Desktop):** [fe04a_work_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_1280x900.png)
- **1440×900 (Primary Desktop Baseline):** [fe04a_work_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_1440x900.png)
- **1920×1080 (Wide Desktop):** [fe04a_work_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_1920x1080.png)
- **Task Detail Sheet (`1440×900`):** [fe04a_work_detail_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a_work_detail_1440x900.png)

---

## 4. Visual Polish Applied During QA

1. Tightened `.filterPill` padding (`4px 9px`, `12px` font) so all 6 filter pills (`Tất cả` → `Lưu trữ`) sit on one single row without wrapping `Lưu trữ` as an orphan pill (`listTop` improved by `39px`).
2. Shortened sort `<option>` labels (`Hạn gần nhất`, `Ưu tiên cao`, `Mới cập nhật`, `Tên A–Z`) so dropdown text never clips at `1280×900` or `1440×900`.

---

## 5. Known Limitations & Recommended FE-04B Tasks

- **Limitations (Backend-bound):** Task completion / XP awarding / streak updates and task proof image upload are currently **UNAVAILABLE** in Backend (`backend/src/routes/index.js`); UI surfaces honest disabled/`PENDING` states.
- **Recommended FE-04B Tasks:**
  1. Connect real task completion & focus/execution tracking once Backend merges `/executions` or `/quests/:id/complete`, emitting `TASK_COMPLETED` to Fox dialogue.
  2. Connect proof media upload (reusing `FE-03.5J` preview & lightbox primitives) once Backend exposes an evidence upload endpoint.
  3. Surface linked `QuestSchedule` badges and quick-schedule jump links in `TaskDetailSheet`.
  4. Perform dedicated Tablet & Mobile responsive polish for `/work` after Desktop visual approval.
