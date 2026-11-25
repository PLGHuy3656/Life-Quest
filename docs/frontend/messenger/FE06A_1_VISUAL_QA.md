# FE-06A.1 — Global Floating Chat Visual QA & Test Report

## 1. Automated Quality Gates (`front-end/`)
| Gate | Command | Exit Code | Result |
| --- | --- | --- | --- |
| Typecheck | `npm run typecheck` | `0` | Passed |
| Lint | `npm run lint` | `0` | Passed (`0` errors, `0` warnings) |
| Gate I Checksums & Build | `npm run build` | `0` | Passed (`32/32` Gate I assets verified; built in `8.50s`) |
| Unit / Integration (Vitest) | `npm run test` | `0` | **21 files / 101 passed**, 0 failed, 0 skipped |
| E2E (Playwright) | `npm run test:e2e` | `0` | **31 passed**, 0 failed, 0 skipped |

## 2. Visual QA Screenshot Matrix (`docs/frontend/messenger/screenshots/fe06a1/`)
| # | Scenario | Viewport | File | Visual Audit Result |
| --- | --- | --- | --- | --- |
| 1 | Dashboard with bubble & unread badge | `1440x900` | `01_dashboard_bubble_1440x900.png` | Pass — Warm neutral dock on bottom-left; unread badges (`2`, `1`) legible; Fox rail unobstructed |
| 2 | Dashboard with expanded floating chat | `1440x900` | `02_dashboard_expanded_1440x900.png` | Pass — `364px` window clear of Fox face, speech bubble, and header; internal timeline scroll; sticky composer |
| 3 | Work Hub with floating chat | `1440x900` | `03_work_hub_expanded_1440x900.png` | Pass — Expanded chat persists across route navigation |
| 4 | Calendar with bubble | `1440x900` | `04_calendar_bubble_1440x900.png` | Pass — Dock sits cleanly in workspace without blocking calendar grid or header |
| 5 | Wardrobe with bubble | `1440x900` | `05_wardrobe_bubble_1440x900.png` | Pass — Single WebGL canvas preserved; dock clear of dressing room controls |
| 6 | Messenger coexistence | `1440x900` | `06_messenger_coexistence_1440x900.png` | Pass — Expanded window collapses into compact dock; no duplicate chat window; header controls aligned |
| 7 | Multiple bubbles (`+1` overflow) | `1280x900` | `07_multiple_bubbles_overflow_1280x900.png` | Pass — Max 3 visible bubbles + accessible overflow menu |
| 8 | Drag & right-edge snap | `1280x900` | `08_drag_edge_snap_right_1280x900.png` | Pass — Snaps cleanly to right edge; Fox face & speech bubble remain unobstructed |
| 9 | Disabled state persisted after reload | `1280x900` | `09_disabled_persisted_reload_1280x900.png` | Pass — Host fully unmounted after reload |
| 10 | Re-enabled via Messenger popover | `1280x900` | `10_reenabled_messenger_popover_1280x900.png` | Pass — Settings popover toggles bubbles back on cleanly |
| 11 | Desktop compact (`1024x900`) | `1024x900` | `11_desktop_1024x900.png` | Pass — Zero horizontal overflow |
| 12 | Desktop wide (`1920x1080`) | `1920x1080` | `12_desktop_1920x1080.png` | Pass — Balanced spacing, zero overflow |
| 13 | Tablet (`820x1180`) | `820x1180` | `13_tablet_820x1180.png` | Pass — Raised `bottom: 86px` so expanded window sits cleanly above Tablet Pill Nav |
| 14 | Mobile (`390x844`) | `390x844` | `14_mobile_390x844.png` | Pass — Full-width responsive bottom sheet with backdrop, safe-area padding, zero horizontal overflow |

## 3. Visual QA Issue Caught & Fixed During Inspection
- **Tablet pill nav overlap (caught on first `13_tablet_820x1180.png` capture):** At `820x1180`, `FloatingChatWindow` at `bottom: 18px` overlapped the left side of the Tablet Floating Pill Navigation. Fixed in `FloatingChat.module.css` (`bottom: 86px !important` under `@media (max-width: 1023px)`), rebuilt, and re-verified on refreshed screenshot.
