# FE-05A — Journey Calendar Architecture

## 1. Product Goal & Design Alignment
The **Journey Calendar** (`/calendar`) gives LifeQuest users a unified, single-viewport Desktop calendar view that connects their daily Tasks, Habit schedules, Quests, and Epics without duplicating data models or breaking the approved FE-04 AppShell.

- **Visual Baseline:** Synchronized with the approved Dashboard, Task, Habit, and Quest pages (warm sand surface `#faf9f6`, clean white rounded cards, `#16324a` primary navy, `#f26b3a` fox orange, `#168c78` habit teal, `#d99b1e` quest amber, `#6f5ce0` moment indigo).
- **Mandatory Viewport-Fit Policy:** On Desktop (`>= 1024px`), the entire primary Calendar workspace fits within **one viewport (`100dvh`)** with **zero document-level vertical scrolling** (`scrollHeight === clientHeight`), **zero horizontal overflow**, and **100% visibility of all 4, 5, or 6 week rows**.

## 2. Preserved AppShell & Route Configuration
- **AppShell (`front-end/src/components/shell/AppShell.tsx` & `AppShell.module.css`):**
  - Preserves the Three-Island Desktop Header, collapsed-by-default `PinnedTaskRail`, compact `PlayerStatsRail`, `FoxCompanionRail` (1 WebGL canvas max), and `FoxSpeechBubble`.
  - Quest Detail (`/work/quests/:questId`) remains the **only** Fox-free page.
  - Adds route-aware `.contentCalendarFit` on `/calendar` (`>= 1024px`):
    - `flex: 0 0 calc(100dvh - 84px); height: calc(100dvh - 84px); max-height: calc(100dvh - 84px); overflow: hidden;`
    - `.desktopThreeRegion` switches to `align-items: stretch; overflow: hidden;` (while `.leftRailStack` keeps `align-self: flex-start;`), bounding `.centerRegion` cleanly to the viewport height.
- **Router (`front-end/src/app/router.tsx`):**
  - Temporarily removes `<ProtectedRoute>` from `/calendar` per user request for direct visual review without requiring login. `/profile` and `/settings` remain protected.

## 3. Information Architecture (Sections A–H)
Implemented in `front-end/src/features/calendar/CalendarPage.tsx` and `CalendarPage.module.css`:

| Section | Purpose | Implementation Notes |
| --- | --- | --- |
| **A. Compact Heading & Monthly Summary** | Page title (`Lịch hành trình`), data-source badge (`LIVE`/`MOCK`), monthly event counts (`Task`, `Habit (mẫu)`, `Quest`, `Moment: —`), and `Tháng / Tuần / Ngày` view switcher. | Single-row header; hides `.summaryStrip` at `<= 1140px` to preserve calendar space. |
| **B. Horizontal Journey / Epic / Quest Timeline Strip** | Quick horizontal strip of active Quests and Epics with due dates and verified task progress. | Horizontal scroll (`overflow-x: auto`), clicking any chip navigates directly to `/work/quests/:questId`. |
| **C. Calendar Navigation & H. Category Filter/Legend** | Previous/Next period, `Hôm nay` jump, and interactive category filter toggles (`Task`, `Habit`, `Quest`, `Moment`). | Also shows the `Chi tiết ngày` drawer trigger at `1024px–1359px`. |
| **D. Main Calendar Grid (Month / Week / Day)** | Primary visual focus. Monday-first real Gregorian calendar (`T2–CN`) with exact dynamic 4, 5, or 6 week rows (`grid-template-rows: repeat(weekRows, minmax(0, 1fr))`). | Month cells display Task/Quest micro-pills plus clean colored dots for Habits so cells stay scannable. |
| **E. Selected-Day Schedule** | Shows all filtered activities on the selected date with internal scrolling (`overflow-y: auto`) and direct click-through to Task/Habit/Quest detail. | Inline right column at `>= 1360px`; accessible `<Sheet>` modal drawer at `1024px–1359px`. |
| **F. Upcoming Deadlines** | Next upcoming/overdue Task & Quest deadlines sorted chronologically. | Bounded to `max-height: 36%` with independent internal scroll so both side cards stay visible inside 1 viewport. |

## 4. Pure Date & Event Derivation Engine (`calendarUtils.ts`)
- `getDynamicMonthCalendarGrid(year, month)` computes the exact Monday-first Gregorian matrix (28, 35, or 42 cells -> 4, 5, or 6 rows), accurately handling leap years (e.g., Feb 2024 = 29 days, 5 rows) and 6-week months (e.g., Nov 2026 = 6 rows).
- `deriveCalendarEventsForRange(...)` derives calendar events directly from existing verified queries (`useTasksQuery`, `useQuestsQuery`) and prototype Habit schedules (`isPreview: true`) without creating a duplicate calendar store.
- Separates Task `startAt` (scheduled start) vs `dueAt` (deadline) explicitly.
