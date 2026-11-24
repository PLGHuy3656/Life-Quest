# FE-04A — Task Page / Work Hub Audit

**Repository:** `D:\Development\LifeQuest_Repo`
**Branch:** `fix/FE` (HEAD: `c3a57a91fa477dff15cf225cc3a62ad6042df27c`, upstream `origin/fix/FE`)
**Scope:** Central `/work` route content only. Shared `AppShell` (`DesktopHeader`, `PinnedTaskRail`, `FoxCompanionRail`, `FoxSpeechBubble`) and Social-First `DashboardPage` remain untouched.

---

## 1. Existing `/work` Route & Component Audit

| Area | Current State | Findings & Gaps |
| --- | --- | --- |
| Route protection | [router.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/app/router.tsx) wraps `/work` in `<ProtectedRoute>`. | Must stay protected; `dashboard.spec.ts` asserts unauthenticated `/work` redirects to `/login`. |
| Default tab | [WorkPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.tsx) defaults to `tab = 'goals'`, hiding Tasks behind a second tab. | Violates Task-First goal: users navigating to `/work` expect their Task list immediately above the fold. Default view should be **Nhiệm vụ (Tasks)**, with **Mục tiêu & Cột mốc** as a clean secondary tab. |
| Visual hierarchy | Generic gray cards, raw uppercase `ACTIVE` / `SIMPLE` enum labels, no priority/deadline badges, no compact summary strip. | Feels like a developer CRUD admin screen rather than LifeQuest's warm editorial/game companion aesthetic (`#F5F3EE`, `#16324A`, `#F26B3A`, `#168C78`, `#F6C85F`, `Plus Jakarta Sans`). |
| Filters & sorting | Only raw `status` (`ACTIVE`/`ARCHIVED`), `goalId`, `milestoneId`, and plain search `<input>`. | Missing Today / Upcoming / Overdue / Completed / Archived filter pills and sorting (`dueAt`, `priority`, `updatedAt`, `title`). |
| Task creation & editing | `Quest` Sheet supports `title`, `description`, `type`, `goalId`. | Missing verified Backend fields already accepted by `POST /quests` & `PATCH /quests/:id`: `priority`, `dueAt`, `milestoneId`, `proofRequirement`, `estimatedDurationSeconds`. |
| Task details | No detail view — all info crammed into flat list rows. | Needs a compact, accessible detail `Sheet` (drawer/modal) showing full title, description, due date/time, priority, status, related Goal & Milestone, proof requirement / evidence boundary, and verified actions without permanently shrinking the center column. |
| Shared `PinnedTaskRail` sync | `useQuestMutations()` in [useWorkData.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/hooks/useWorkData.ts) invalidates `['work', 'quests']`, `['dashboard', 'quests']`, `['dashboard', 'today']`. | Pin/unpin already propagates to `PinnedTaskRail` via React Query cache invalidation. We should also bridge `PIN_UPDATED` and `TASK_CREATED` into `foxDialogueBus` (and `useCreateQuestMutation` already publishes `TASK_CREATED`). |
| Task completion & evidence | Not present in `WorkPage.tsx`. | Verified **UNAVAILABLE** in Backend (`questsRoute.js` has no complete or evidence upload endpoint). Must render honest disabled/PENDING UI boundaries — never fake completion, XP, or uploads. |

---

## 2. Shared AppShell Constraints (Center Column Geometry)

Inside the approved 3-region Desktop `AppShell`:
- **LEFT:** `PinnedTaskRail` (`212px` expanded, `56px` collapsed, auto-hidden at `0` pinned tasks; collapsed by default at `1024px`).
- **RIGHT:** `FoxCompanionRail` (`336px` expanded, `56px` collapsed).
- **CENTER:** Flexible center column (`~560px–820px` depending on viewport `1024px..1920px`).

Design implications for FE-04A:
1. Keep the Task Page single-column and scannable in the center column — never split into two narrow side-by-side columns inside the Tasks view.
2. Keep the header, compact summary strip, and filter/search toolbar tight so at least **3–4 task cards are visible above the fold** at `900px` height (`1024×900`, `1280×900`, `1440×900`).
3. Use the existing accessible `Sheet` modal/drawer for **Task Details** and **Create/Edit Task** so opening details never crushes the center column width.

---

## 3. Proposed FE-04A Component Architecture

- [WorkPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.tsx) — Main Work Hub container: compact Task-first header + segmented switch (`Nhiệm vụ` | `Mục tiêu & Cột mốc`), compact summary strip, filter pills (`Tất cả`, `Hôm nay`, `Sắp tới`, `Quá hạn`, `Hoàn thành`, `Lưu trữ`), search + sort + Goal/Milestone filter bar, rich LifeQuest task list, and preserved Goals & Milestones management tab.
- [TaskDetailSheet.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/TaskDetailSheet.tsx) — Accessible detail drawer/modal displaying title, description, due date & time, priority badge, status, linked Goal & Milestone, XP/Coin preview, Evidence boundary (`proofRequirement` + honest PENDING upload notice), and verified actions (`Sửa`, `Ghim/Bỏ ghim`, `Lưu trữ/Khôi phục`, `Xóa`, plus disabled `Hoàn thành` with PENDING explanation).
- [taskUtils.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/taskUtils.ts) — Pure helpers for Vietnamese priority labels, deadline urgency classification (`overdue`, `today`, `upcoming`, `none`), client-side bucket filtering, sorting, and date formatting.
- [WorkPage.module.css](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/WorkPage.module.css) — Warm cream/navy/orange/teal LifeQuest styling (`#F5F3EE`, `#16324A`, `#F26B3A`, `#168C78`, `#F6C85F`), rounded cards, subtle shadows, focus-visible rings, and zero horizontal overflow across `1024px–1920px`.
