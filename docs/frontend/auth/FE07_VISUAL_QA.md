# FE-07 — Authentication Visual QA & Test Report

## 1. Automated Quality Gates (`front-end/`)
| Gate | Command | Exit Code | Result |
| --- | --- | --- | --- |
| Typecheck | `npm run typecheck` | `0` | Passed |
| Lint | `npm run lint` | `0` | Passed (`0` errors, `0` warnings) |
| Gate I Checksums & Build | `npm run build` | `0` | Passed (`32/32` Gate I assets verified; `10.07s`) |
| Unit / Integration (Vitest) | `npm run test` | `0` | **22 files / 106 tests passed**, `0` failed, `0` skipped |
| E2E (Playwright) | `npm run test:e2e` | `0` | **33 tests passed**, `0` failed, `0` skipped (`21.4s`) |

*(Note: Live login/logout E2E flows use isolated Playwright route mocks because no live PostgreSQL/Express Backend server runs during `vite preview` CI tests.)*

## 2. Visual QA Screenshot Matrix (`docs/frontend/auth/screenshots/`)
| # | Scenario | Viewport | File | Audit Result |
| --- | --- | --- | --- | --- |
| 1 | Login Desktop | `1440x900` | `01_login_desktop_1440x900.png` | Pass — Balanced split layout, warm cream backdrop, crisp Fox panel & form |
| 2 | Login Mobile | `390x844` | `02_login_mobile_390x844.png` | Pass — Compact Fox header card, visible submit button, zero horizontal overflow |
| 3 | Register Desktop | `1440x900` | `03_register_desktop_1440x900.png` | Pass — Joi-aligned fields (`username 3–50`, `password 8–72`), password toggles |
| 4 | Register Mobile | `390x844` | `04_register_mobile_390x844.png` | Pass — Clean scrollable single column, zero overflow |
| 5 | Password Visible & Fox Privacy | `1440x900` | `05_password_visible_fox_privacy_1440x900.png` | Pass — Plaintext toggle works; Fox switches to `CHẾ ĐỘ RIÊNG TƯ` |
| 6 | Empty Field Validation | `1440x900` | `06_empty_validation_1440x900.png` | Pass — Accessible inline errors + icon + Fox error encouragement |
| 7 | Invalid Credentials (`401`) | `1440x900` | `07_invalid_credentials_1440x900.png` | Pass — Neutral error banner without exposing account existence |
| 8 | Loading State | `1440x900` | `08_loading_state_1440x900.png` | Pass — Disabled submit button (`Đang đăng nhập...`), prevents double submit |
| 9 | Network Error | `1440x900` | `09_network_error_1440x900.png` | Pass — Distinct network error banner (`WifiOff` icon) |
| 10 | Forgot Password (`PENDING`) | `1440x900` | `10_forgot_password_pending_1440x900.png` | Pass — Explicit `PENDING BACKEND` badge & honest boundary banner |
| 11 | Reset Password (`PENDING`) | `1440x900` | `11_reset_password_pending_1440x900.png` | Pass — Explicit `PENDING BACKEND` state, no fake tokens |
| 12 | Unauthenticated `/calendar` Redirect | `1440x900` | `12_unauthenticated_calendar_redirect_1440x900.png` | Pass — Redirects to `/login?redirect=%2Fcalendar` under strict guard |
| 13 | Authenticated Redirect to `/calendar` | `1440x900` | `13_authenticated_redirect_calendar_1440x900.png` | Pass — Restores `/calendar` cleanly after verified login |
| 14 | Logout to `/login` | `1440x900` | `14_logout_back_to_login_1440x900.png` | Pass — Clean return to `/login` with zero leaked caches |
| 15–18 | Viewport Matrix | `1024x900`, `1280x900`, `1920x1080`, `820x1180` | `15`–`18_*.png` | Pass — Zero horizontal overflow across all desktop & tablet breakpoints |
