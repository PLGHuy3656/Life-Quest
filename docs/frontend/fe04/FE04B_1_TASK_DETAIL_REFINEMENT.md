# FE-04B.1 — Task Detail UX Refinement Report

**Repository:** `D:\Development\LifeQuest_Repo`
**Branch:** `fix/FE` (uncommitted — visual approval checkpoint)
**Scope:** Central `/work/tasks/:taskId` route refinement only. Shared `AppShell`, `DesktopHeader`, collapsed-by-default `PinnedTaskRail`, `PlayerStatsRail`, `FoxCompanionRail`, `DashboardPage`, `HabitsPage`, and `QuestsPage` remain untouched.

---

## 1. Information Hierarchy Refinement

Replaced the noisy top badge cluster with a calm, scannable 6-section hierarchy in [TaskDetailPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/TaskDetailPage.tsx):

1. **Task Overview (Above the Fold):**
   - Breadcrumb (`← Nhiệm vụ / Chi tiết`)
   - Single restrained timing status indicator (`detail-timing-status`, strong color ONLY for `overdue` / `due_soon` / `starting_soon`)
   - **Fox-Paw Pin Stamp** (no `"Đã ghim"` text badge; syncs live with `PinnedTaskRail`)
   - Compact **Edit** (`Sửa`) + **Overflow Menu (`⋮`)** grouping `Lưu trữ` / `Khôi phục` and `Xóa nhiệm vụ` (with inline destructive delete confirmation)
   - Dominant inline-editable **Task Title** (`21px` bold navy)
   - Prominent **Start & Deadline Timing Strip** (`detail-timing-strip`) immediately below the title (`Bắt đầu`, `Hạn hoàn thành`, and remaining/overdue duration)
   - Honest disabled completion button (`Chờ Backend Execution API — không giả lập hoàn thành hay cộng XP.`)
2. **Description** (inline inside overview card — zero excessive nested cards)
3. **Focus Session V1** ([FocusSessionCard.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/FocusSessionCard.tsx))
4. **Adaptive Local Evidence Preview** ([TaskEvidenceSection.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/TaskEvidenceSection.tsx))
5. **Relationships & Metadata** (`<dl>` neutral text/icons: Linked Goal/Quest, Milestone, Category, Priority, Estimated Duration, read-only Expected XP/Coin)
6. **Activity Information** (`createdAt` & `updatedAt` timestamps only — zero fabricated history timeline)

---

## 2. 6-State Deadline Classification ([taskUtils.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/taskUtils.ts))

`classifyDetailTimingState(quest, nowMs)` strictly separates `startAt` from `dueAt` and never classifies a completed task as overdue:
- `completed` (`completedAt != null`)
- `overdue` (`dueAt < now`)
- `due_soon` (`0 <= dueAt - now <= 2h`)
- `in_progress` (`startAt <= now < dueAt`)
- `starting_soon` (`0 <= startAt - now <= 2h`)
- `not_started` (future `startAt`/`dueAt`) / `unscheduled` (both null)

---

## 3. Domain Boundaries & API Support Matrix

- **Strictly excluded from Task Detail:** No Checklist, no Subtasks, no Quest Milestone progress bar, no Habit check-ins.
- **LIVE APIs:** `GET /quests/:id`, `PATCH /quests/:id`, `POST/DELETE /quests/:id/pin`, `POST /quests/:id/archive|restore`, `DELETE /quests/:id`, `GET /goals`, `GET /goals/:id/milestones`.
- **PENDING / UNAVAILABLE APIs:** Quest completion & XP/coin/streak awarding (`Execution API`), Evidence media upload (`Media Upload API`), Focus session server persistence, Activity log timeline.
