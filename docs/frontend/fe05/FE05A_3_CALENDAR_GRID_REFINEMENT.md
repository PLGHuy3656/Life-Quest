# FE-05A.3 — Calendar Grid Refinement Report

## 1. Summary of Refinements
Building on the Fox-free, single-viewport FE-05A.2 Calendar workspace, **FE-05A.3** upgrades Month cells from sparse dots into an information-rich, glanceable schedule without sacrificing one-viewport fit or introducing vertical scrolling inside the grid:

- **Per-Day Due Task Count Badges:** Every date with atomic Tasks due displays an urgency-coded `"N đến hạn"` badge (`Clock` icon for pending, green `CheckCircle2` when all due tasks on that day are verified completed).
- **Rich, Clickable Event Previews:** Each Month cell renders up to 2 ordered event chips (`Overdue` -> `Due` -> `Verified Completed` -> `Quest / StartAt`), clickable directly to `/work/tasks/:taskId` or `/work/quests/:questId`, plus a `+N` overflow badge when additional events exist.
- **Distinct Type Symbols:**
  - **Task:** Orange `CheckSquare` (red for overdue, neutral slate for upcoming future deadlines, green `CheckCircle2` + strikethrough for verified completed).
  - **Habit:** Teal Fox Paw (`PawPrint`) badge (`🐾 N`) in cells + dashed teal routine rows in Daily Agenda.
  - **Quest:** Gold `Compass` icon + gold milestone banner.
  - **Moment:** Indigo `Camera` icon (honest neutral empty strip while Backend Media API is `PENDING`).
- **Deduplicated Daily Agenda:** `Upcoming Deadlines` inside `CalendarDailyAgendaPanel` excludes deadlines already shown in the Selected-Day list so users never see redundant duplicates.
- **Accessible Keyboard & Screen-Reader Support:** Each cell uses `role="button"`, `tabIndex={0}`, `Enter`/`Space` selection, `:focus-visible` outlines, and full `aria-label` announcements including exact due Task counts and overdue/completed breakdowns.

## 2. Viewport-Fit & Cell Geometry Measurements (November 2026 — 6 Week Rows)

| Viewport | `scrollH / clientH` | `vOverflow` / `hOverflow` | WebGL Canvases | `leftRailTop` | `lastRowBottom` | Final Row Visible | Cell Size (`W × H`) | Due Badges Rendered |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1024 × 900** | `900 / 900` | `0 / 0` | `0` | `92 px` | `799 px <= 900` | **Yes** | `79 × 91 px` | `2` |
| **1280 × 900** | `900 / 900` | `0 / 0` | `0` | `92 px` | `871 px <= 900` | **Yes** | `103 × 103 px` | `2` |
| **1440 × 900** | `900 / 900` | `0 / 0` | `0` | `92 px` | `871 px <= 900` | **Yes** | `103 × 103 px` | `2` |
| **1920 × 1080** | `1080 / 1080` | `0 / 0` | `0` | `92 px` | `1051 px <= 1080` | **Yes** | `103 × 133 px` | `2` |

## 3. Verified Screenshots
- [Calendar 1440×900 (6-week month + Due Badges + Agenda)](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_1440x900.png)
- [Calendar 1280×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_1280x900.png)
- [Calendar 1024×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_1024x900.png)
- [Calendar 1920×1080](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_1920x1080.png)
- [Calendar Empty Selected Day](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_empty_day.png)
