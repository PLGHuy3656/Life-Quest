# FE-05A — Calendar Event Source Matrix

All Calendar events are derived from existing verified LifeQuest data contracts or clearly labeled preview/pending placeholders. **No duplicate calendar database or fabricated Backend persistence was created.**

| Category | UI Color Token | Underlying Source | Contract Status | Field Mapping | Navigation Target |
| --- | --- | --- | --- | --- | --- |
| **Task (Deadline)** | `#f26b3a` (Overdue: `#d64545`) | `useTasksQuery()` (`GET /tasks`, fallback mock when unauthenticated) | **VERIFIED** | `task.dueAt` -> `dateKey`, `timeLabel`, overdue check (`!completed && dueAt < now`) | `/work/tasks/:taskId` |
| **Task (Start)** | `#f26b3a` | `useTasksQuery()` | **VERIFIED** | `task.startAt` -> separate start marker if `startAt` is on a different date than `dueAt` (avoids duplicating same-day tasks) | `/work/tasks/:taskId` |
| **Quest (Goal)** | `#d99b1e` | `useQuestsQuery()` (`GET /goals`, fallback mock when unauthenticated) | **VERIFIED** | `goal.targetDate` -> Quest deadline marker + Journey Timeline Strip chip with verified `completed/total` Task counts | `/work/quests/:questId` |
| **Epic (Milestone)** | `#d9511f` (Journey Strip) | `goal.milestones` inside `useQuestsQuery()` | **VERIFIED (Read)** | Displayed in the horizontal Journey Timeline Strip (`Epic #N`) with verified milestone task counts | `/work/quests/:questId` |
| **Habit (Schedule)** | `#168c78` | `PROTOTYPE_HABITS` (`front-end/src/features/work/habitMock.ts`) | **PROTOTYPE / PREVIEW (`isPreview: true`)** | Recurring weekday schedule (`daily`, `weekdays`, `4x/week`) mapped to dots on Month cells and explicitly labeled `(Mẫu lịch · Chờ Habit API)` in Day/Side panel; monthly summary counts unique habits (`4 Habit (mẫu)`) | `/work/habits/:habitId` |
| **Moment (Photo Memory)** | `#6f5ce0` | Backend Media / Quest Moments API | **PENDING** | No fabricated photos or fake counts. Monthly summary shows `Moment: —`, and Selected-Day panel displays an honest placeholder noting Backend Media API is pending. | N/A (Pending) |

## Integrity & Anti-Fabrication Guarantees
- **Zero fake check-in history:** Habit dots represent recurring schedule days only, never fabricated streak or completion logs.
- **Zero fake Moments:** No mock photo thumbnails or fake Moment counts are rendered.
- **No Backend modifications:** Zero changes to `backend/`, Prisma schema, or pending Social/Media endpoints.
