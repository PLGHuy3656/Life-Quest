# FE-05B — Time-Based Day View Specification

## 1. Pure Layout & Overlap Algorithm (`front-end/src/features/calendar/dayTimelineUtils.ts`)
Implemented `layoutDayTimelineEvents({ dayEvents, tasksById, defaultRangeStartMin = 360, defaultRangeEndMin = 1320 })`:
1. **All-day / Untimed (`allDayEvents`):** Events without a valid `HH:mm` clock time are placed in a compact `Cả ngày / Chưa có giờ` tray above the vertical axis.
2. **Deadlines (`deadlineMarkers`):** Rendered strictly as **point-in-time horizontal markers** (`Flag` + `HH:mm` + title + dashed red line) — NEVER fabricated as duration blocks.
3. **Timed Duration Blocks (`timedBlocks`):**
   - Positioned vertically using `startMin` (`top = ((startMin - rangeStartMin) / 60) * 56px`).
   - Height proportional to verified `estimatedDurationSeconds` (or `dueAt - startAt` when same-day), clamped to a minimum readable height of `42px`.
   - **Connected-component overlap packing:** Overlapping `[startMin, endMin)` intervals are clustered and assigned `columnIndex` & `columnCount` so they render **side-by-side** (`left = colIndex/colCount * 100%`, `width = 100/colCount %`), never hidden behind each other.

## 2. Viewport & Interaction Behavior (`CalendarDayTimeline.tsx`)
- Default visible range is **06:00 – 22:00** (24-hour Vietnamese time), with a toggle to **00:00 – 24:00** (and auto-expansion when earlier/later events exist).
- Current-time orange/red indicator line when viewing Today.
- Internally scrollable `.scrollArea` (`overflow-y: auto; flex: 1; min-height: 0;`) keeps the outer Desktop Calendar strictly within **1 viewport (`vOverflow: 0`)**.
- Supports clicking any block/marker to open Task/Quest Detail or `JourneyRoadOverlay` for multi-day items, plus direct Photo Lightbox access.
