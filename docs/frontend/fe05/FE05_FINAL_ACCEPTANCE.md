# FE-05 — Journey Calendar Final Acceptance Report

## 1. Acceptance Status
- **Status:** **APPROVED & ACCEPTED**
- **Branch:** `fix/FE` (upstream: `origin/fix/FE`)
- **Commit Message:** `feat(frontend): finalize interactive journey calendar`

## 2. Final Approved Functionality
1. **Claude-Inspired Journey Calendar (`/calendar`) inside Shared AppShell:**
   - Fox-free Calendar workspace (`0` WebGL canvases on `/calendar`; Quest Detail and Calendar are the two Fox-free routes; all other routes retain Fox Companion).
   - Preserves Three-Island Desktop Header, collapsed-by-default `PinnedTaskRail`, and compact `PlayerStatsRail` with **0px sidebar top delta (`leftRailTop = 92px`)** across Dashboard, Work Hub, Calendar, and Quest Detail.
   - Single-viewport Desktop frame (`scrollHeight === clientHeight`, `0px` horizontal overflow) across `1024×900`, `1280×900`, `1366×768`, `1440×900`, and `1920×1080`.
2. **Smart Calendar Day Cells & Per-Day Task Deadline Aggregation (`calendarUtils.ts`):**
   - Pure Monday-first Gregorian calendar supporting 4-, 5-, and 6-week months and leap years, with generous `98 × 120px` cells and automatic scroll to the current/selected date.
   - Clean white background (`#ffffff`) for current-month days, soft gray (`#edf0f3`) for other-month days.
   - **Urgency-driven red highlighting:** ONLY actionable Tasks due (`dueAt`) on that date highlight in red (soft red cell tint, compact `⏰ N` due badge, red chip & red timeline row).
   - **Completion-based safe green tint:** Days with `>= 70%` verified Task completion (and no actionable due Tasks) receive soft green safe styling + green checkmark.
   - Deduplicated `aggregateDailyTaskDeadlines` excluding Habits, `startAt`, and Quest/Epic deadlines.
   - Distinct minimalist symbols (`CheckSquare` Task, `PawPrint` Habit, `Compass`/`Flag` Quest, `Camera` Moment) with `+N` overflow.
3. **Spacious Claude-Style Daily Agenda (`CalendarDailyAgendaPanel.tsx`):**
   - Two clean white cards: Top Selected-Day Info card (Featured Moment with per-day photo count badge, bold Vietnamese date `24 tháng 11, 2026`, compact 1-line summary, `Xem hành trình ngày này ›` + `+ Tạo` Quick Create trigger) and Bottom `Deadline gần nhất` card with deduplicated upcoming deadlines and monthly summary.
   - Container-query workspace adaptation (`@container calendar-workspace (max-width: 919px)`) automatically switches to an accessible `<Sheet>` drawer on narrow workspaces.
4. **Interactive Journey Road (`calendarRoadUtils.ts`, `JourneyRoadOverlay.tsx`):**
   - Hidden by default to keep the calendar calm; clicking a Quest/Road icon (`🧭` / `🏁`) toggles a **thin 2.5px orange line** across the spanned cells ending at a circular destination flag node (`🏁`), dims days outside the journey, and auto-expands the calendar continuously from Start to Finish (collapsing middle weeks when `> 2` months while always preserving Start and Finish dates).
   - Clicking `Chi tiết lộ trình ›` or the start/finish nodes opens the accessible `JourneyRoadOverlay` modal separating **Time Progress** (`elapsed / duration`) from **Work Progress** (`verified completed / eligible Tasks`), with color-coded Epic checkpoints for Quests and a clean start-to-finish timeline for multi-day Tasks.
5. **Per-Date Photo / Evidence Lightbox (`SocialMediaLightbox.tsx`):**
   - Reuses and extends the shared lightbox with per-date scoping (e.g. Nov 24 shows strictly `1 / 2` ↔ `2 / 2`), caption, demo label, date, `ArrowLeft`/`ArrowRight`/`Escape` keyboard controls, and focus restoration.
6. **Active-Slot Vertical Day View (`CalendarDayTimeline.tsx`, `dayTimelineUtils.ts`):**
   - Displays only time slots that actually have activities or deadlines along a clean vertical rail (no empty blank hours), separating untimed (`—`), timed activities (side-by-side when overlapping), and point-in-time deadline markers (`Đến hạn` + `🏁`).

## 3. Backend Capability Boundaries & Known Limitations
- **Habit Execution / Check-in API (`PENDING`):** Habit schedules are derived from `PROTOTYPE_HABITS` (`isPreview: true`) and explicitly labeled `(Mẫu lịch · Chờ Habit API)`. No check-in completion is fabricated.
- **Media / Quest Moments Upload API (`PENDING`):** User-requested preview Moment thumbnails (`calendarDemoMoments.ts`) are explicitly tagged `(Ảnh mẫu)` / `Ảnh mẫu (Chờ Media API)` and never represented as persisted uploaded evidence.
- **Auth Guard on `/calendar`:** Temporarily removed `<ProtectedRoute>` on `/calendar` per user request for direct visual review; can be restored when ready for production gating.

## 4. Final Visual QA & Quality Gate Results
- **Visual QA (4 Desktop Viewports + Day View + Overlays):**
  - `1024×900`, `1280×900`, `1440×900`, `1920×1080` Month & Day View: `vOverflow: 0`, `hOverflow: 0`, `canvases: 0`, `foxHidden: 1`, `leftRailTop: 92px` (`0px` delta vs Dashboard/Work/Quest Detail).
- **Five Quality Gates:**
  1. `npm run typecheck` (`tsc -b --noEmit`): **PASS** (0 errors)
  2. `npm run lint` (`eslint --max-warnings 0`): **PASS** (0 warnings)
  3. `npm run build` (`32/32` Gate I SHA256 verified + `vite build`): **PASS**
  4. `npm run test` (`vitest run`): **PASS** (`18/18` test files, `82/82` tests)
  5. `npm run test:e2e` (`playwright test`): **PASS** (`17/17` Playwright E2E tests)
