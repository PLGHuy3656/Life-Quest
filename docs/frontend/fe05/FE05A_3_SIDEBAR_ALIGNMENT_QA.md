# FE-05A.3 — AppShell Sidebar Alignment QA

## 1. Root Cause Identified
- **Symptom:** On `/calendar`, `leftRailStack` (`PinnedTaskRail` + `PlayerStatsRail`) sat at `y = 184px` (`+92px` lower than Dashboard, Task, and Quest Detail at `y = 92px`).
- **Root Cause:** `.leftRailStack` uses `position: sticky; top: 92px;` for scrolling pages. On `/calendar`, `.contentCalendarFit` sets `overflow: hidden` to enforce the one-viewport fit policy. In CSS, `position: sticky; top: 92px` inside an `overflow: hidden` scroll container offsets the sticky element **92px below the container's own top (`92px + 92px = 184px`)**.
- **Fix Applied (`AppShell.module.css`):** Set `.contentCalendarFit .leftRailStack { position: static; top: auto; align-self: flex-start; }` at the AppShell level (zero route-specific margin hacks, zero `translateY`, zero negative margins). Since `/calendar` has `0px` document vertical scroll, static positioning aligns `leftRailStack` cleanly at `y = 92px` while preserving collapse/expand and sticky behavior on all other routes.

## 2. Before / After Cross-Route DOM Bounding Box Measurements (`1440 × 900`)

| Route | `headerBottom` | `leftRailTop` (Before) | `leftRailTop` (After) | `centerTop` | Delta vs Dashboard | `leftRailLeft` | `statsTop` | WebGL Canvases |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Dashboard (`/`)** | `80 px` | `92 px` | `92 px` | `92 px` | `0 px` (baseline) | `120 px` | `312 px` | `1` |
| **Work Hub (`/work/tasks`)** | `80 px` | `92 px` | `92 px` | `92 px` | `0 px` | `120 px` | `312 px` | `1` |
| **Calendar (`/calendar`)** | `80 px` | ~~`184 px` (`+92px`)~~ | **`92 px`** | `92 px` | **`0 px`** | `120 px` | `312 px` | `0` (Fox-free) |
| **Quest Detail (`/work/quests/goal-1`)** | `80 px` | `92 px` | `92 px` | `92 px` | `0 px` | `120 px` | `312 px` | `0` (Fox-free) |

## 3. Navigation, Refresh & Automated E2E Verification
- Verified in Playwright E2E test [calendar.spec.ts](file:///D:/Development/LifeQuest_Repo/front-end/e2e/calendar.spec.ts) across `/` -> `/work/tasks` -> `/calendar` and after `page.reload()` (`Math.abs(leftRailTop - dashboardTop) <= 1`).
- Visual baseline comparison:
  - [Dashboard 1440×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_dashboard_1440x900.png)
  - [Calendar 1440×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a3_calendar_1440x900.png)
