# FE-05A.2 — Calendar Header Cleanup & Daily Agenda Restoration Report

## 1. Executive Summary
**FE-05A.2** refines the LifeQuest Journey Calendar (`/calendar`) to align closely with Claude's Journey Calendar layout while preserving the approved LifeQuest shared AppShell:
1. **Removed redundant large Calendar page header block** (`"Lịch hành trình"` + `MOCK PREVIEW` banner), recovering `~44px` of vertical height directly into the calendar grid and daily agenda.
2. **Made `/calendar` a Fox-free route** (alongside the previously approved Quest Detail exception `/work/quests/:questId`), hiding `FoxCompanionRail` and `FloatingMascotDock` (`0` WebGL canvases on Calendar) while keeping the Three-Island Desktop Header, collapsed `PinnedTaskRail`, and compact `PlayerStatsRail`.
3. **Restored Claude-style Selected-Day Agenda Panel (`CalendarDailyAgendaPanel`)** on the right side (~30% width) of the Calendar workspace with chronological sorting, compact neutral Moment empty state, integrated Upcoming Deadlines, and compact Monthly Summary footer.
4. **Refined the horizontal Journey Strip** with a sleeker single-row height, hidden native scrollbar, and accessible Left/Right scroll buttons.

## 2. Before / After Visual Comparison

| State | Before (FE-05A — with Fox & Header) | After (FE-05A.2 — Fox-free, No Redundant Header, Claude Agenda) |
| --- | --- | --- |
| **1440 × 900 (6-week month)** | [fe05a_month_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1440x900.png) (`cell: 65 × 87 px`) | [fe05a2_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_1440x900.png) (`cell: 103 × 99 px`, **+58% wider cells**) |
| **1280 × 900** | [fe05a_month_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1280x900.png) (drawer-only) | [fe05a2_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_1280x900.png) (full 69%/30% split, `cell: 103 × 99 px`) |
| **1920 × 1080** | [fe05a_month_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1920x1080.png) (`cell: 65 × 117 px`) | [fe05a2_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_1920x1080.png) (`cell: 103 × 129 px`) |
| **1024 × 900** | [fe05a_month_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1024x900.png) | [fe05a2_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_1024x900.png) & [Drawer Overlay](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_drawer_1024x900.png) |
| **Empty Selected Day** | — | [fe05a2_empty_day_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_empty_day_1440x900.png) |
| **Expanded PinnedTaskRail** | — | [fe05a2_pinned_expanded_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a2_pinned_expanded_1440x900.png) |

## 3. Layout Geometry (Workspace Container-Query Driven)
- **Container Query Root:** `.workspace` uses `container-type: inline-size; container-name: calendar-workspace;` so layout switches respond to **actual center workspace width** (accounting for collapsed vs expanded `PinnedTaskRail`), not just viewport width.
- **Inline Split (`>= 920px` center workspace width):** `grid-template-columns: minmax(0, 7fr) minmax(290px, 3fr)` -> **68–69% Calendar Grid**, **30–31% `CalendarDailyAgendaPanel`**, `12px` gutter, single-surface white cards (no double-nested white cards).
- **Drawer Mode (`< 920px` center workspace width):** Main calendar grid expands to `100%` width; selecting a day or clicking `Chi tiết ngày` opens `CalendarDailyAgendaPanel` inside an accessible `<Sheet>` overlay.

## 4. Measured Viewport-Fit Matrix (November 2026 — 6 Week Rows)

| Viewport / State | `scrollH / clientH` | `vOverflow` / `hOverflow` | WebGL Canvases | `data-fox-hidden` | Workspace Width | Calendar / Agenda Ratio | Final Row Bottom (px) | Final Row Visible | Cell Size (`W × H`) | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1024 × 900** (Collapsed Rail) | `900 / 900` | `0 / 0` | `0` | `1` | `924 px` | `67% / 31%` | `799 <= 900` | **Yes** | `79 × 81 px` | **PASS** |
| **1280 × 900** (Collapsed Rail) | `900 / 900` | `0 / 0` | `0` | `1` | `1132 px` | `69% / 30%` | `871 <= 900` | **Yes** | `103 × 99 px` | **PASS** |
| **1440 × 900** (Collapsed Rail) | `900 / 900` | `0 / 0` | `0` | `1` | `1132 px` | `69% / 30%` | `871 <= 900` | **Yes** | `103 × 99 px` | **PASS** |
| **1920 × 1080** (Collapsed Rail) | `1080 / 1080` | `0 / 0` | `0` | `1` | `1132 px` | `69% / 30%` | `1051 <= 1080` | **Yes** | `103 × 129 px` | **PASS** |
| **1440 × 900** (Expanded PinnedRail) | `900 / 900` | `0 / 0` | `0` | `1` | `948 px` | `68% / 31%` | `871 <= 900` | **Yes** | `83 × 93 px` | **PASS** |

## 5. Source of Daily Events & Backend / Moment Limitations
- **Tasks (`VERIFIED`):** Derived from `useWorkQuestsQuery` (`GET /tasks`, fallback fixtures when unauthenticated). Explicitly distinguishes `startAt` (`Bắt đầu`) vs `dueAt` (`Hạn chót` / `Quá hạn`), sorted chronologically in `CalendarDailyAgendaPanel` and clickable to `/work/tasks/:taskId`.
- **Quests & Epics (`VERIFIED`):** Derived from `useWorkGoalsQuery` (`GET /goals`) and milestones; displayed in both the horizontal Journey Strip and on target due dates, clickable to `/work/quests/:questId`.
- **Habits (`PROTOTYPE / PREVIEW`):** Derived from `PROTOTYPE_HABITS` (`isPreview: true`), explicitly labeled `(Mẫu lịch · Chờ Habit API)` without fabricating check-in completion history.
- **Moments (`PENDING Backend Media API`):** `CalendarDailyAgendaPanel` supports `featuredMoment?: { imageUrl: string; caption?: string } | null`, rendering a real `16:9` photo card when verified media data exists. Because Backend Media / Quest Moments upload endpoints are not yet available, `featuredMoment` is passed as `null` and renders a **compact neutral 1-line empty strip** (`Chưa có ảnh khoảnh khắc — chờ Backend Media API.`) with zero fabricated artwork.

## 6. Known Visual Gaps & Future Follow-ups
- **Real Moment Photo Preview:** Once Backend Media / Quest Moments API is merged, pass the verified selected-day photo into `featuredMoment` on `CalendarDailyAgendaPanel` — the layout slot and styling are already built and ready.
- **Re-enabling Auth Guard on `/calendar`:** `<ProtectedRoute>` remains temporarily disabled on `/calendar` per user request for direct visual review; restore it prior to production release if required.
