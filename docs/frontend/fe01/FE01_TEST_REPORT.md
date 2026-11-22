# FE-01 Validation & Test Report

- **Branch:** `feature/tv4-frontend` (base `origin/develop` @ `f9db2e1`)
- **Node.js / npm:** `v24.21.0` / `11.19.0`

## Validation Summary

| Check | Command | Result | Details |
|---|---|---|---|
| TypeScript Typecheck | `npm run typecheck` (`tsc -b --noEmit`) | **PASS** | 0 errors (`tsconfig.app.json` + `tsconfig.node.json`) |
| ESLint | `npm run lint` (`--max-warnings 0`) | **PASS** | 0 errors, 0 warnings |
| Production Build | `npm run build` (`tsc -b && vite build`) | **PASS** | 1,681 modules, `dist/assets/index-*.js` (262.70 kB / 82.56 kB gzip), built in 5.87s |
| Unit & Component Tests | `npm run test` (`vitest run`) | **PASS** | **2/2 files, 11/11 tests passed** (6.09s) |
| Playwright E2E Viewports | `npm run test:e2e` (`playwright test`) | **PASS** | **4/4 tests passed** (6.1s, verifies production build shows `AUTHENTICATION_REQUIRED` with zero silent mock fallback) |

## Detailed Test Coverage

### Vitest (`11/11 PASS`)
1. `src/services/api/httpClient.test.ts` (6/6):
   - Unauthenticated request rejects with `401 AUTHENTICATION_REQUIRED`.
   - Authenticated request injects `Authorization: Bearer <token>` and unwraps `{ success: true, data }`.
   - Live Backend `500` error parses `{ success: false, error: { code, message } }` into `ApiClientError` and **never silently falls back to mock**.
   - Unauthenticated hybrid read explicitly returns `source: 'MOCK'` in dev.
   - `resolveDataMode` enforces `'live'` in production builds (`isProd === true`) regardless of `VITE_DATA_MODE`.
   - Unimplemented features (`completeQuestExecution`, `authApi.forgotPassword`) explicitly reject with `501 FEATURE_UNAVAILABLE`.
2. `src/features/dashboard/DashboardPage.test.tsx` (5/5):
   - Renders recovered Claude Canvas sections (`Bảng ghim`, `Nhiệm vụ hôm nay`, `Mục tiêu & Cột mốc`, `Social và nhật ký hành trình`, `MascotPlaceholder`) with neutral fallback `Bạn` (no hardcoded personal name).
   - `PinnedBoard` enforces max 3 cards even when 4+ quests are marked `isPinned: true`.
   - Reduced-motion toggle adds/removes `html.lq-rm`.
   - Quick-create `Sheet` renders `role="dialog"` + `aria-modal="true"` and closes on `Escape`.
   - Clicking "Hoàn thành" surfaces explicit `UNAVAILABLE` notice without faking success.

### Playwright E2E (`4/4 PASS`)
- **Desktop (`1440×900`):** Left sidebar (`Điều hướng chính`) visible, zero horizontal overflow.
- **Tablet (`820×1180`):** Floating pill (`Điều hướng máy tính bảng`) visible, zero horizontal overflow.
- **Mobile (`390×844`):** 5-slot bottom nav (`Điều hướng di động`) visible, zero horizontal overflow.
- **Interaction & A11y:** Reduced-motion toggle updates `<html class="lq-rm">`; Quick-create Sheet opens and closes cleanly on `Escape`.

### Live Backend Integration Note
- No live PostgreSQL database / Backend server was started during automated FE-01 tests, so live API calls were verified via typed contract tests and mocked HTTP responses without modifying any real database records.
