# FE-04A.3 — Compact Side Rails & Player Stats Report

**Repository:** `D:\Development\LifeQuest_Repo`
**Branch:** `fix/FE` (uncommitted — visual approval checkpoint)
**Scope:** Shared Desktop `AppShell` left rail & `DesktopHeader` deduplication only. Backend, Social contracts, and Mascot Gate I SDK/GLBs untouched.

---

## 1. Default Collapsed PinnedTaskRail Behavior

- Updated [uiStore.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/stores/uiStore.ts) so `pinnedRailCollapsed` defaults to **`true` (collapsed)** for all new users and fresh UI state across all Desktop viewports (`1024px–1920px`).
- User's explicit expand/collapse choice is persisted in `localStorage` (`lq_pinned_rail_collapsed`), preserved across route transitions, and never auto-expands on navigation or React re-renders.
- Both expanded and collapsed pinned items preserve `data-testid="rail-pinned-snippet"` and click navigation directly to `/work/tasks/:taskId`.

---

## 2. PlayerStatsRail & Data-Source Integrity Audit

Created [PlayerStatsRail.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/PlayerStatsRail.tsx) and [PlayerStatsRail.module.css](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/PlayerStatsRail.module.css), mounted directly below `PinnedTaskRail` inside a unified sticky `.leftRailStack` in [AppShell.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/AppShell.tsx):

| Stat | Verified Backend Source | Authenticated (`LIVE`) Display | Unauthenticated / Unavailable Display | Tooltip |
| --- | --- | --- | --- | --- |
| **Streak** | `GET /api/v1/today` → `streak.currentCount` / `longestCount` | Numeric count (e.g. `7`) | Neutral `—` | `Chuỗi ngày` |
| **Coin** | `GET /api/v1/today` → `gamification.coinBalance` | Numeric balance (e.g. `480`) | Neutral `—` | `Xu hiện có` |
| **Level** | `GET /api/v1/today` → `gamification.level` & `totalXp` | `L{level}` (e.g. `L5`) | Neutral `—` | `Cấp độ hiện tại` |

- Zero hardcoded demo stats: unauthenticated/preview sessions strictly show `—` and prompt login in tooltips.
- Width matches collapsed `PinnedTaskRail` (`52px`), stacked with `10px` vertical spacing, and remains accessible below `PinnedTaskRail` when expanded (`pinnedBottom: 492px`, `statsTop: 502px`, `0px` overlap).

---

## 3. Header Deduplication Result

- Removed duplicated `header-streak-pill`, `header-coin-pill`, and dropdown `Level` / `XP` display from [DesktopHeader.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/components/shell/DesktopHeader.tsx).
- Preserved the approved 3-island Header: Logo, Main Navigation, Search, Reduced Motion toggle, Notifications, and Account/Login controls with balanced spacing and zero duplicated stats (`headerDupes === 0`).

---

## 4. Accessibility Notes

- Each stat item in `PlayerStatsRail` is a keyboard-focusable `<button type="button">` with descriptive `aria-label`, `:focus-visible` orange ring (`#F26B3A`), `aria-describedby` linked to `role="tooltip"` on hover, focus, or click.
- Single Fox WebGL canvas (`canvases === 1`) preserved across all routes.

---

## 5. Visual QA Screenshots (Before vs After)

- **Before (FE-04A.2 expanded left rail):** [fe04a2_task_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a2_task_1440x900.png)
- **After — Dashboard (Default Collapsed + PlayerStatsRail `1440×900`):** [fe04a3_dashboard_collapsed_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_dashboard_collapsed_1440x900.png)
- **After — Task (Default Collapsed `1440×900`):** [fe04a3_task_collapsed_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_task_collapsed_1440x900.png)
- **After — Task (Expanded Pinned Rail + Stats Below `1440×900`):** [fe04a3_task_expanded_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_task_expanded_1440x900.png)
- **After — PlayerStatsRail Tooltip (`1440×900`):** [fe04a3_stats_tooltip_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_stats_tooltip_1440x900.png)
- **After — Habit & Quest (`1440×900`):** [Habit](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_habit_collapsed_1440x900.png) · [Quest](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_quest_collapsed_1440x900.png)
- **Additional Viewports (`0px` overflow, `1` canvas):** [1024×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_task_1024x900.png) · [1280×900](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_task_1280x900.png) · [1920×1080](file:///D:/Development/LifeQuest_Repo/docs/frontend/fe04/screenshots/fe04a3_task_1920x1080.png)

---

## 6. Known Limitations

- Streak, Coin, and Level are read-only from `GET /api/v1/today`; live increments await Backend Execution / Gamification mutation endpoints.
