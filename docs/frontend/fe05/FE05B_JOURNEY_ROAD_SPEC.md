# FE-05B — Interactive Journey Road Specification

## 1. Domain Hierarchy & Backend Mapping
| UI Concept | Backend Model | Role on Journey Road |
| --- | --- | --- |
| **Quest** | `Goal` | Multi-day/multi-month Journey Road (`gold` bar), destination flag on `dueDate`. |
| **Epic** | `Milestone` | Ordered checkpoints (`position` ascending) on the Quest Road: Completed (green `CheckCircle2`), Active (orange), Future (neutral). |
| **Task** | `Quest` | Linked Task counts on Quest/Epic progress; atomic multi-day Tasks (`startAt` + `dueAt` spanning `>= 2` local dates) render as orange start-to-finish roads with **zero fabricated Epics**. |

## 2. Route Rendering Algorithm (`front-end/src/features/calendar/calendarRoadUtils.ts`)
- `deriveCalendarJourneyRoads(...)`:
  - Maps active Goals into `CalendarJourneyRoad` (`kind: 'quest'`), strictly separating:
    - **Time Progress (`timeProgressPct`):** `elapsedDays / durationDays * 100` (clamped `0..100`).
    - **Work Progress (`workProgressPct`):** `verifiedCompletedTasks / eligibleTasks * 100` (`null` when 0 tasks — NEVER equated to time progress).
  - Maps multi-day atomic Tasks (`startYmd < endYmd`) into `kind: 'task'` roads (`checkpoints: []`). Tasks missing `startAt` do not invent an interval; items missing `dueAt` omit the destination flag.
- `computeWeekRoadSegments(roads, weekCells, maxLanes = 2)`:
  - Clips every road to each 7-day week row (`colStart: 1..7`, `colSpan: 1..7`).
  - Sets `continuesLeft` / `continuesRight` for week-row and month-boundary breaks, and `isEnd` to render the `Flag` destination marker on the exact end date.
  - Packs overlapping roads into at most `2` visible lanes per week row and returns `overflowRoads` for an accessible `+N lộ trình khác` button.
  - Lane container uses `pointer-events: none` (only route buttons accept clicks) so normal day-cell interactions are never blocked.

## 3. Journey Road Overlay (`JourneyRoadOverlay.tsx`)
- Accessible modal dialog (`role="dialog"`, `aria-modal="true"`, `Escape` dismissal, backdrop close, focus restoration).
- Opens in-place without leaving Calendar or modifying `selectedDate`.
- Displays Start/End/Remaining time, separated Time vs Work progress bars, Epic Checkpoints (with zero-Epic empty state), Next Actionable Task link, and CTA to full Quest or Task Detail.
