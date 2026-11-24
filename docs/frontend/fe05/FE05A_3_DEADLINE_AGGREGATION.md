# FE-05A.3 — Per-Day Task Deadline Aggregation Specification

## 1. Reusable Helper (`front-end/src/features/calendar/calendarUtils.ts`)
Implemented `aggregateDailyTaskDeadlines(tasks: Quest[], nowMs = Date.now()): Map<string, DailyTaskDeadlineSummary>`.

### Returned Fields per Local Date (`YYYY-MM-DD`)
- `totalDue`: Total unique atomic Tasks whose `dueAt` falls on this local date.
- `actionableDue`: Tasks due on this date that are not completed (`!completedAt && status !== 'COMPLETED'`).
- `completedDue`: Tasks due on this date with verified completion state (`Boolean(completedAt) || status === 'COMPLETED'`).
- `overdueDue`: Actionable tasks whose `dueAt < nowMs`.
- `dueSoonDue`: Actionable tasks not overdue that match `classifyTaskTimeState(...) === 'due_soon'`.

## 2. Strict Counting & Integrity Rules
| Rule | Enforcement |
| --- | --- |
| **Duplicate Task elimination** | Deduplicated via `seenIds: Set<string>` on `task.id`. |
| **Exclude Habit check-ins** | Only consumes `Quest[]` (atomic Task records); Habits are never passed or counted. |
| **Exclude Task `startAt`** | Only inspects `task.dueAt`; tasks with `startAt` and `dueAt: null` are shown as start events but never counted as deadlines. |
| **Exclude Quest / Epic deadlines** | `Goal` / `Milestone` records are excluded from atomic Task deadline counts. |
| **Local timezone boundaries** | Uses `new Date(iso)` local year/month/day (`formatLocalDate`), ensuring `23:30` local and `00:15` next day never cross buckets. |
| **Urgency-driven badge color** | Overdue (`#b72b2b` red), Due soon (`#b5471c` orange), Normal upcoming (`#314b63` neutral slate), All completed (`#15803d` green with `CheckCircle2`). |

## 3. Automated Test Coverage (`CalendarPage.test.tsx`)
Unit tests verify:
- Duplicate `task.id` elimination
- Local timezone boundary accuracy (`23:30` vs `00:15` next day)
- Completed vs pending status split (`completedDue`, `actionableDue`, `overdueDue`)
- `startAt` exclusion from `totalDue`
- Deterministic cell preview ordering via `sortCellPreviewEvents`: `Overdue -> Due -> Completed -> Quest/Start`.
