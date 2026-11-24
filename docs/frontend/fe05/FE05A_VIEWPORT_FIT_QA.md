# FE-05A — Viewport-Fit QA Report

## Test Environment
- **Route:** `http://localhost:5173/calendar`
- **Default Stress-Test Month:** **November 2026** (starts on Sunday -> Monday-first offset `6` -> **6 full week rows / 42 cells**, the hardest vertical viewport-fit case).
- **Capture Script:** Automated Playwright headless Chromium run measuring `window.innerHeight`, `document.documentElement.scrollHeight`, `clientHeight`, `scrollWidth`, `canvas` count, and exact `getBoundingClientRect()` of the final week row (`data-testid="calendar-day-cell"`).

## Measured Desktop Viewport-Fit Matrix

| Viewport | View Mode | `scrollH / clientH` | `vOverflow` | `hOverflow` | WebGL Canvases | Week Rows | Grid Top / Bottom (px) | Final Row Visible | Cell Size (`W × H` px) | Side Panel Mode | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1024 × 900** | Month (6w) | `900 / 900` | `0` | `0` | `1` | `6` | `328` → `801` | **Yes (`801 <= 900`)** | `76 × 74` | `<Sheet>` Drawer (`Chi tiết ngày`) | **PASS** |
| **1280 × 900** | Month (6w) | `900 / 900` | `0` | `0` | `1` | `6` | `289` → `873` | **Yes (`873 <= 900`)** | `101 × 92` | `<Sheet>` Drawer (`Chi tiết ngày`) | **PASS** |
| **1440 × 900** | Month (6w) | `900 / 900` | `0` | `0` | `1` | `6` | `318` → `873` | **Yes (`873 <= 900`)** | `65 × 87` | Inline Right Column (`244px`) | **PASS** |
| **1920 × 1080** | Month (6w) | `1080 / 1080` | `0` | `0` | `1` | `6` | `318` → `1053` | **Yes (`1053 <= 1080`)** | `65 × 117` | Inline Right Column (`244px`) | **PASS** |

## Root-Cause Fix Verified During QA
- **Issue caught during first capture:** At `1440 × 900`, the 6th week row was initially pushed to `984px` (`lastRowVisible: false`) because `.content` used `flex: 1` (`flex-basis: 0%`), causing `height: 100%` on nested containers to resolve indefinitely against `.sidePanel`'s intrinsic height.
- **Fix applied:**
  1. Set `flex: 0 0 calc(100dvh - 84px)` on `.contentCalendarFit` and `align-items: stretch; overflow: hidden;` on `.contentCalendarFit .desktopThreeRegion` in `AppShell.module.css`.
  2. Set `grid-template-rows: minmax(0, 1fr); overflow: hidden;` on `.mainGrid` and bounded `.sideCardUpcoming` to `max-height: 36%` with internal `overflow-y: auto` in `CalendarPage.module.css`.
- **Re-capture verification:** Confirmed `lastRowBottom: 873 <= 900` (`lastRowVisible: true`) and `vOverflow: 0` across all 4 viewports.

## Verified Evidence Screenshots
- [fe05a_month_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1024x900.png)
- [fe05a_month_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1280x900.png)
- [fe05a_month_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1440x900.png)
- [fe05a_month_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_month_1920x1080.png)
- [fe05a_week_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_week_1440x900.png)
- [fe05a_day_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_day_1440x900.png)
- [fe05a_day_drawer_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe05/screenshots/fe05a_day_drawer_1024x900.png)
